const { json, supabaseRest } = require('./_cover-shared');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return json(200, { ok: true });
  if (event.httpMethod !== 'GET') return json(405, { error: 'Method not allowed' });

  try {
    const rows = await supabaseRest('cover_config?select=dj_name,price_pln,active&order=updated_at.desc&limit=1');
    const cfg = (rows && rows[0]) || { dj_name: 'Dj Micke', price_pln: 30, active: true };
    return json(200, { ok: true, config: cfg });
  } catch (e) {
    return json(500, { error: e.message || String(e) });
  }
};
