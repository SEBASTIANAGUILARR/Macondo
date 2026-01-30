const { json, verifySupabaseSession, supabaseRest } = require('./_cover-shared');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return json(200, { ok: true });
  if (event.httpMethod !== 'GET') return json(405, { error: 'Method not allowed' });

  try {
    const auth = event.headers.authorization || event.headers.Authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice('Bearer '.length) : null;
    if (!token) return json(401, { error: 'Missing Authorization Bearer token' });

    const user = await verifySupabaseSession(token);
    if (!user?.email) return json(401, { error: 'Invalid session' });

    const email = String(user.email).trim().toLowerCase();

    const rows = await supabaseRest(
      `cover_tickets?select=id,person_name,person_email,buyer_email,dj_name,price_pln,event_date,qr_token,status,created_at,used_at&or=(person_email.eq.${encodeURIComponent(email)},buyer_email.eq.${encodeURIComponent(email)})&order=created_at.desc&limit=200`
    );

    const tickets = (Array.isArray(rows) ? rows : []).filter(t => {
      const st = String(t?.status || '').toLowerCase();
      return st === 'paid' || st === 'manual' || st === 'manual_pending';
    });

    return json(200, { ok: true, tickets });
  } catch (e) {
    return json(500, { error: e.message || String(e) });
  }
};
