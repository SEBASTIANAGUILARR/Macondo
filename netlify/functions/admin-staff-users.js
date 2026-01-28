const {
  json,
  verifySupabaseSession,
  supabaseRest,
  isAdminEmail,
  sha256Hex,
} = require('./_cover-shared');

function normalizeUsername(u) {
  return String(u || '').trim().toLowerCase().replace(/\s+/g, '');
}

function makePinHash(username, pin) {
  const salt = String(process.env.STAFF_PIN_SALT || '');
  return sha256Hex(`${salt}:${username}:${pin}`);
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return json(200, { ok: true });

  try {
    const auth = event.headers.authorization || event.headers.Authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice('Bearer '.length) : null;
    if (!token) return json(401, { error: 'Missing Authorization Bearer token' });

    const user = await verifySupabaseSession(token);
    if (!user) return json(401, { error: 'Invalid session' });

    const email = String(user?.email || '').toLowerCase();
    const allowed = await isAdminEmail(email);
    if (!allowed) return json(403, { error: 'Not allowed' });

    if (event.httpMethod === 'GET') {
      const rows = await supabaseRest('staff_users?select=id,username,active,created_at&order=created_at.desc&limit=200');
      return json(200, { ok: true, staff: rows || [] });
    }

    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const action = String(body.action || '').trim();

      if (action === 'create') {
        const username = normalizeUsername(body.username);
        const pin = String(body.pin || '').trim();
        if (!username || !pin) return json(400, { error: 'Missing username/pin' });

        await supabaseRest('staff_users', {
          method: 'POST',
          prefer: 'return=minimal',
          body: [{
            username,
            pin_hash: makePinHash(username, pin),
            active: true,
            created_at: new Date().toISOString(),
          }],
        });

        return json(200, { ok: true });
      }

      if (action === 'reset_pin') {
        const username = normalizeUsername(body.username);
        const pin = String(body.pin || '').trim();
        if (!username || !pin) return json(400, { error: 'Missing username/pin' });

        await supabaseRest(`staff_users?username=eq.${encodeURIComponent(username)}`, {
          method: 'PATCH',
          prefer: 'return=minimal',
          body: { pin_hash: makePinHash(username, pin) },
        });

        return json(200, { ok: true });
      }

      if (action === 'delete') {
        const username = normalizeUsername(body.username);
        if (!username) return json(400, { error: 'Missing username' });

        await supabaseRest(`staff_users?username=eq.${encodeURIComponent(username)}`, {
          method: 'DELETE',
          prefer: 'return=minimal',
        });

        return json(200, { ok: true });
      }

      if (action === 'set_active') {
        const username = normalizeUsername(body.username);
        const active = !!body.active;
        if (!username) return json(400, { error: 'Missing username' });

        await supabaseRest(`staff_users?username=eq.${encodeURIComponent(username)}`, {
          method: 'PATCH',
          prefer: 'return=minimal',
          body: { active },
        });

        return json(200, { ok: true });
      }

      return json(400, { error: 'Invalid action' });
    }

    return json(405, { error: 'Method not allowed' });
  } catch (e) {
    return json(500, { error: e.message || String(e) });
  }
};
