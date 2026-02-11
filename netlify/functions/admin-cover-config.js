const { json, verifySupabaseSession, supabaseRest, isAdminEmail } = require('./_cover-shared');

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
    const modeRaw = String(body.mode || 'dj').trim().toLowerCase();
    const mode = modeRaw === 'private_event' ? 'private_event' : 'dj';

    const dj_name = String(body.dj_name || '').trim();
    const price_pln = Number(body.price_pln);
    const active = body.active === undefined ? true : !!body.active;

    const private_title = String(body.private_title || '').trim();
    const private_description = String(body.private_description || '').trim();

    if (mode === 'dj') {
      if (!dj_name) return json(400, { error: 'Missing dj_name' });
      if (!Number.isFinite(price_pln) || price_pln <= 0) return json(400, { error: 'Invalid price_pln' });
    } else {
      if (!private_title) return json(400, { error: 'Missing private_title' });
    }

    await supabaseRest('cover_config', {
      method: 'POST',
      prefer: 'return=minimal',
      body: [{
        mode,
        dj_name: dj_name || null,
        price_pln: Number.isFinite(price_pln) ? price_pln : null,
        active,
        private_title: private_title || null,
        private_description: private_description || null,
        updated_at: new Date().toISOString(),
      }],
    });

    return json(200, { ok: true });
  } catch (e) {
    return json(500, { error: e.message || String(e) });
  }
};
