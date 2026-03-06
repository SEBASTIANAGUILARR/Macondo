const { json, verifySupabaseSession, supabaseRest, isAdminEmail } = require('./_cover-shared');

const ALLOWED_KEYS = [
  'reservations_enabled',
  'menu_enabled',
  'events_enabled',
  'orders_enabled',
  'covers_enabled',
];

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return json(200, { ok: true });

  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method not allowed' });
  }

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
    const patch = {};

    for (const k of ALLOWED_KEYS) {
      if (body[k] !== undefined) {
        patch[k] = !!body[k];
      }
    }

    const updatedKeys = Object.keys(patch);
    if (updatedKeys.length === 0) {
      return json(400, { error: 'No valid keys provided' });
    }

    // Append-only config rows (same pattern as cover_config)
    await supabaseRest('site_config', {
      method: 'POST',
      prefer: 'return=minimal',
      body: [{
        ...patch,
        updated_at: new Date().toISOString(),
      }],
    });

    return json(200, { ok: true, updated: updatedKeys });
  } catch (e) {
    return json(500, { error: e.message || String(e) });
  }
};
