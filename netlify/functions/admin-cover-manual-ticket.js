const { json, verifySupabaseSession, supabaseRest, isAdminEmail, randomToken, getBaseUrl } = require('./_cover-shared');

function ymd(date) {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return json(200, { ok: true });
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });

  try {
    const auth = event.headers.authorization || event.headers.Authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice('Bearer '.length) : null;
    if (!token) return json(401, { error: 'Missing Authorization Bearer token' });

    const user = await verifySupabaseSession(token);
    if (!user) return json(401, { error: 'Invalid session' });

    const email = String(user?.email || '').toLowerCase();
    const allowed = await isAdminEmail(email);
    if (!allowed) return json(403, { error: 'Not allowed' });

    const body = JSON.parse(event.body || '{}');
    const person_name = String(body.person_name || '').trim();
    const person_email = String(body.person_email || '').trim().toLowerCase();
    const person_phone = String(body.person_phone || '').trim();
    const event_date = String(body.event_date || '').trim() || ymd(new Date());
    const quantity = Math.max(1, Math.min(50, Number(body.quantity || 1) || 1));
    const activeNow = body.active === undefined ? true : !!body.active;

    if (!person_name) return json(400, { error: 'Missing person_name' });
    if (!person_email) return json(400, { error: 'Missing person_email' });

    const cfgRows = await supabaseRest('cover_config?select=dj_name,price_pln,active&order=updated_at.desc&limit=1');
    const cfg = (cfgRows && cfgRows[0]) || { dj_name: 'Dj Micke', price_pln: 30, active: true };

    const rowsToInsert = Array.from({ length: quantity }).map(() => ({
      buyer_name: person_name,
      buyer_email: person_email,
      buyer_phone: person_phone || null,
      person_name,
      person_email,
      person_phone: person_phone || null,
      dj_name: cfg.dj_name,
      price_pln: 0,
      status: activeNow ? 'manual' : 'manual_pending',
      event_date,
      qr_token: randomToken(18),
      created_at: new Date().toISOString(),
    }));

    const inserted = await supabaseRest('cover_tickets', {
      method: 'POST',
      prefer: 'return=representation',
      body: rowsToInsert,
    });

    const baseUrl = getBaseUrl();
    const tickets = (inserted || []).map(t => ({
      id: t.id,
      person_name: t.person_name,
      person_email: t.person_email,
      person_phone: t.person_phone,
      dj_name: t.dj_name,
      event_date: t.event_date,
      qr_token: t.qr_token,
      ticket_url: `${baseUrl}/ticket.html?token=${encodeURIComponent(t.qr_token)}`,
    }));

    return json(200, { ok: true, tickets });
  } catch (e) {
    return json(500, { error: e.message || String(e) });
  }
};
