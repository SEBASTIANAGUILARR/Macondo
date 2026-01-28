const { json, supabaseRest, verifyStaffToken } = require('./_cover-shared');

function getStaffTokenFromHeaders(headers) {
  const auth = headers.authorization || headers.Authorization || '';
  if (!auth.toLowerCase().startsWith('staff ')) return null;
  return auth.slice('Staff '.length).trim();
}

function ymd(date) {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return json(200, { ok: true });
  if (event.httpMethod !== 'GET') return json(405, { error: 'Method not allowed' });

  try {
    const token = getStaffTokenFromHeaders(event.headers || {});
    if (!token) return json(401, { error: 'Missing Staff token' });

    const payload = verifyStaffToken(token);
    if (!payload) return json(401, { error: 'Invalid token' });

    const today = ymd(new Date());
    const rows = await supabaseRest(`cover_tickets?select=id,person_name,person_email,person_phone,used_at,status,created_at&event_date=eq.${today}&order=created_at.desc&limit=200`);

    return json(200, { ok: true, tickets: rows || [] });
  } catch (e) {
    return json(500, { error: e.message || String(e) });
  }
};
