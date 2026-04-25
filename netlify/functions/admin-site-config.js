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

    // Read current config so we always write a complete row
    let current = {};
    try {
      const rows = await supabaseRest('site_config?select=reservations_enabled,menu_enabled,events_enabled,orders_enabled,covers_enabled&order=updated_at.desc&limit=1');
      if (Array.isArray(rows) && rows[0]) current = rows[0];
    } catch (_) {}

    const DEFAULTS = {
      reservations_enabled: true,
      menu_enabled: true,
      events_enabled: true,
      orders_enabled: true,
      covers_enabled: true,
    };

    const merged = { ...DEFAULTS };
    for (const k of ALLOWED_KEYS) {
      if (current[k] != null) merged[k] = !!current[k];
    }
    Object.assign(merged, patch);

    await supabaseRest('site_config', {
      method: 'POST',
      prefer: 'return=minimal',
      body: [{
        ...merged,
        updated_at: new Date().toISOString(),
      }],
    });

    return json(200, { ok: true, updated: updatedKeys });
  } catch (e) {
    return json(500, { error: e.message || String(e) });
  }
};
