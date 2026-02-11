const Stripe = require('stripe');
const {
  json,
  supabaseRest,
  randomToken,
  getBaseUrl,
} = require('./_cover-shared');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return json(200, { ok: true });
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });

  try {
    const stripeSecret = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecret) return json(500, { error: 'Missing STRIPE_SECRET_KEY env var' });

    const body = JSON.parse(event.body || '{}');
    const buyer_name = String(body.buyer_name || '').trim();
    const buyer_email = String(body.buyer_email || '').trim();
    const buyer_phone = String(body.buyer_phone || '').trim() || null;
    const consentConfirm = !!body.consentConfirm;
    const consentMarketing = !!body.consentMarketing;
    const people = Array.isArray(body.people) ? body.people : [];

    if (!buyer_name || !buyer_email) return json(400, { error: 'Missing buyer_name/buyer_email' });
    if (!consentConfirm) return json(400, { error: 'Missing consentConfirm' });
    if (people.length === 0) return json(400, { error: 'Missing people' });

    for (const p of people) {
      const n = String(p.name || '').trim();
      const e = String(p.email || '').trim();
      const ph = String(p.phone || '').trim();
      if (!n || !e || !ph) return json(400, { error: 'Each person must include name, email and phone' });
    }

    // Config actual
    const cfgRows = await supabaseRest('cover_config?select=dj_name,price_pln,active,mode&order=updated_at.desc&limit=1');
    const cfg = (cfgRows && cfgRows[0]) || { dj_name: 'Dj Micke', price_pln: 30, active: true, mode: 'dj' };
    if (cfg.active === false) return json(400, { error: 'Cover no disponible' });
    if (String(cfg.mode || 'dj').toLowerCase() === 'private_event') {
      return json(400, { error: 'Pago no disponible para evento privado' });
    }

    const quantity = people.length;
    const unitAmount = Math.round(Number(cfg.price_pln || 0) * 100);
    if (!Number.isFinite(unitAmount) || unitAmount <= 0) return json(400, { error: 'Invalid price' });

    // Guardar intent (evitar meter JSON grande en metadata)
    const intentId = randomToken(18);
    await supabaseRest('cover_intents', {
      method: 'POST',
      prefer: 'return=minimal',
      body: [{
        intent_id: intentId,
        buyer_name,
        buyer_email,
        buyer_phone,
        people,
        consent_confirm: true,
        consent_marketing: consentMarketing,
        dj_name: cfg.dj_name,
        price_pln: cfg.price_pln,
        status: 'pending',
        created_at: new Date().toISOString(),
      }]
    });

    const stripe = Stripe(stripeSecret);
    const baseUrl = getBaseUrl();

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card', 'blik', 'p24'],
      customer_email: buyer_email,
      line_items: [{
        price_data: {
          currency: 'pln',
          product_data: {
            name: `Cover Sótano - ${cfg.dj_name}`,
            description: 'Macondo Bar Latino',
          },
          unit_amount: unitAmount,
        },
        quantity,
      }],
      success_url: `${baseUrl}/events.html?cover_success=1`,
      cancel_url: `${baseUrl}/events.html?cover_cancel=1`,
      metadata: {
        cover_intent_id: intentId,
        type: 'cover',
      },
    });

    return json(200, { ok: true, url: session.url });
  } catch (e) {
    return json(500, { error: e.message || String(e) });
  }
};
