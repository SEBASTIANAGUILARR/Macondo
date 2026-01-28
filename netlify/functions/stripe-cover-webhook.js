const Stripe = require('stripe');
const {
  json,
  supabaseRest,
  randomToken,
  getBaseUrl,
} = require('./_cover-shared');

async function sendZeptoMail({ to, subject, htmlbody }) {
  const rawToken = process.env.ZEPTOMAIL_TOKEN;
  if (!rawToken) throw new Error('Missing ZEPTOMAIL_TOKEN env var');

  const token = String(rawToken)
    .trim()
    .replace(/^zoho-enczapikey\s+/i, '')
    .trim();

  const fromAddress = process.env.ZEPTOMAIL_FROM_ADDRESS || 'cover@macondo.pl';
  const fromName = process.env.ZEPTOMAIL_FROM_NAME || 'Macondo Bar Latino';

  const host = process.env.ZEPTOMAIL_API_HOST || 'api.zeptomail.eu';
  const url = `https://${host}/v1.1/email`;

  const payload = {
    from: { address: fromAddress, name: fromName },
    to: to.map(r => ({ email_address: { address: r.address, name: r.name || r.address } })),
    subject,
    htmlbody,
    track_opens: true,
    track_clicks: true,
  };

  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Zoho-enczapikey ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!resp.ok) {
    const txt = await resp.text().catch(() => '');
    throw new Error(`ZeptoMail error: ${resp.status} ${txt}`);
  }
  return true;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function upsertClient({ nombre, email, telefono, newsletter, incReservas = 0, incPedidos = 0 }) {
  const existing = await supabaseRest(`clients?select=id,total_reservas,total_pedidos,newsletter&email=eq.${encodeURIComponent(email)}&limit=1`);
  const row = existing && existing[0];

  if (!row) {
    await supabaseRest('clients', {
      method: 'POST',
      prefer: 'return=minimal',
      body: [{
        nombre,
        email,
        telefono: telefono || null,
        newsletter: !!newsletter,
        total_reservas: incReservas,
        total_pedidos: incPedidos,
        created_at: new Date().toISOString(),
      }],
    });
    return;
  }

  const nextReservas = (row.total_reservas || 0) + incReservas;
  const nextPedidos = (row.total_pedidos || 0) + incPedidos;
  const nextNewsletter = row.newsletter || !!newsletter;

  await supabaseRest(`clients?id=eq.${row.id}`, {
    method: 'PATCH',
    prefer: 'return=minimal',
    body: {
      nombre,
      telefono: telefono || null,
      newsletter: nextNewsletter,
      total_reservas: nextReservas,
      total_pedidos: nextPedidos,
    },
  });
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });

  try {
    const stripeSecret = process.env.STRIPE_SECRET_KEY;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!stripeSecret || !webhookSecret) {
      return json(500, { error: 'Missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET' });
    }

    const stripe = Stripe(stripeSecret);

    const sig = event.headers['stripe-signature'] || event.headers['Stripe-Signature'];
    if (!sig) return json(400, { error: 'Missing stripe-signature header' });

    const rawBody = event.isBase64Encoded
      ? Buffer.from(event.body || '', 'base64')
      : Buffer.from(event.body || '', 'utf8');

    const evt = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);

    if (evt.type !== 'checkout.session.completed') {
      return json(200, { ok: true });
    }

    const session = evt.data.object;
    const intentId = session?.metadata?.cover_intent_id;
    if (!intentId) return json(200, { ok: true });

    // Idempotencia: si ya procesado, no repetir
    const intents = await supabaseRest(`cover_intents?select=id,intent_id,status,people,buyer_name,buyer_email,buyer_phone,consent_marketing,dj_name,price_pln&intent_id=eq.${encodeURIComponent(intentId)}&limit=1`);
    const intent = intents && intents[0];
    if (!intent) return json(200, { ok: true });
    if (intent.status === 'fulfilled') return json(200, { ok: true });

    const people = Array.isArray(intent.people) ? intent.people : [];
    const baseUrl = getBaseUrl();

    // Crear tickets
    const ticketsToInsert = people.map(p => ({
      buyer_name: intent.buyer_name,
      buyer_email: intent.buyer_email,
      buyer_phone: intent.buyer_phone || null,
      person_name: String(p.name || '').trim(),
      person_email: String(p.email || '').trim(),
      person_phone: String(p.phone || '').trim(),
      dj_name: intent.dj_name,
      price_pln: intent.price_pln,
      status: 'paid',
      event_date: new Date().toISOString().slice(0, 10),
      qr_token: randomToken(18),
      created_at: new Date().toISOString(),
    }));

    const inserted = await supabaseRest('cover_tickets', {
      method: 'POST',
      prefer: 'return=representation',
      body: ticketsToInsert,
    });

    // Upsert clients (por persona)
    for (const t of inserted || []) {
      try {
        await upsertClient({
          nombre: t.person_name,
          email: t.person_email,
          telefono: t.person_phone,
          newsletter: !!intent.consent_marketing,
          incReservas: 0,
          incPedidos: 0,
        });
      } catch (e) {
        // best-effort
      }
    }

    // Enviar emails
    for (const t of inserted || []) {
      const link = `${baseUrl}/ticket.html?token=${encodeURIComponent(t.qr_token)}`;
      const subject = `🎟️ Cover Macondo - ${escapeHtml(intent.dj_name)}`;
      const htmlbody = `
        <div style="font-family:Arial,sans-serif;line-height:1.5">
          <h2 style="color:#92400e;margin:0 0 10px">Ticket Cover - Macondo</h2>
          <p>Hola <b>${escapeHtml(t.person_name)}</b>,</p>
          <p>Tu pago fue confirmado. Este es tu ticket para el cover del sótano.</p>
          <p><b>DJ:</b> ${escapeHtml(intent.dj_name)}<br><b>Precio:</b> ${escapeHtml(String(intent.price_pln))} PLN</p>
          <p>Abre este enlace para mostrar tu QR:</p>
          <p><a href="${link}">${link}</a></p>
          <p style="margin-top:16px;color:#6b7280;font-size:12px">El QR es válido una sola vez.</p>
        </div>
      `;

      await sendZeptoMail({
        to: [{ address: t.person_email, name: t.person_name }],
        subject,
        htmlbody,
      });
    }

    // Marcar intent como fulfilled
    await supabaseRest(`cover_intents?id=eq.${intent.id}`, {
      method: 'PATCH',
      prefer: 'return=minimal',
      body: { status: 'fulfilled', fulfilled_at: new Date().toISOString(), stripe_session_id: session.id },
    });

    return json(200, { ok: true });
  } catch (e) {
    // Stripe requiere 2xx para no reintentar? en error devolver 400/500
    return json(400, { error: e.message || String(e) });
  }
};
