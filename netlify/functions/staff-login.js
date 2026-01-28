const { json, supabaseRest, sha256Hex, makeStaffToken } = require('./_cover-shared');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return json(200, { ok: true });
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });

  try {
    const body = JSON.parse(event.body || '{}');
    const username = String(body.username || '').trim().toLowerCase();
    const pin = String(body.pin || '').trim();

    if (!username || !pin) return json(400, { error: 'Missing username/pin' });

    const rows = await supabaseRest(`staff_users?select=username,pin_hash,active&username=eq.${encodeURIComponent(username)}&limit=1`);
    const staff = rows && rows[0];
    if (!staff || staff.active === false) return json(401, { error: 'Invalid credentials' });

    const salt = String(process.env.STAFF_PIN_SALT || '');
    const expected = String(staff.pin_hash || '');
    const actual = sha256Hex(`${salt}:${username}:${pin}`);

    if (expected !== actual) return json(401, { error: 'Invalid credentials' });

    const token = makeStaffToken({ username });
    return json(200, { ok: true, token });
  } catch (e) {
    return json(500, { error: e.message || String(e) });
  }
};
