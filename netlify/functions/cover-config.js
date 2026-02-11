const { json, supabaseRest } = require('./_cover-shared');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return json(200, { ok: true });
  if (event.httpMethod !== 'GET') return json(405, { error: 'Method not allowed' });

  try {
    let rows = null;
    try {
      rows = await supabaseRest('cover_config?select=dj_name,price_pln,active,mode,private_title,private_description&order=updated_at.desc&limit=1');
    } catch (e) {
      // Backward compat: older schema without mode/private_* columns
      rows = await supabaseRest('cover_config?select=dj_name,price_pln,active&order=updated_at.desc&limit=1');
    }

    const row0 = rows && rows[0];
    const cfg = row0 || {
      dj_name: 'Dj Micke',
      price_pln: 30,
      active: true,
      mode: 'dj',
      private_title: '',
      private_description: '',
    };

    if (!('mode' in cfg)) cfg.mode = 'dj';
    if (!('private_title' in cfg)) cfg.private_title = '';
    if (!('private_description' in cfg)) cfg.private_description = '';

    return json(200, { ok: true, config: cfg });
  } catch (e) {
    return json(500, { error: e.message || String(e) });
  }
};
