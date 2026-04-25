const { json, supabaseRest } = require('./_cover-shared');

const DEFAULTS = {
  reservations_enabled: true,
  menu_enabled: true,
  events_enabled: true,
  orders_enabled: true,
  covers_enabled: true,
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return json(200, { ok: true });
  if (event.httpMethod !== 'GET') return json(405, { error: 'Method not allowed' });

  try {
    let rows = null;
    try {
      rows = await supabaseRest('site_config?select=reservations_enabled,menu_enabled,events_enabled,orders_enabled,covers_enabled,updated_at&order=updated_at.desc&limit=1');
    } catch (e) {
      return json(200, { ok: true, config: { ...DEFAULTS } });
    }

    const row0 = Array.isArray(rows) ? rows[0] : null;
    const clean = {};
    if (row0) {
      for (const [k, v] of Object.entries(row0)) {
        if (v != null) clean[k] = v;
      }
    }
    const cfg = { ...DEFAULTS, ...clean };

    return json(200, { ok: true, config: cfg });
  } catch (e) {
    return json(500, { error: e.message || String(e) });
  }
};
