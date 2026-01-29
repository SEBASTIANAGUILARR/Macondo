const { json, verifySupabaseSession, isAdminEmail } = require('./_cover-shared');

async function adminAuthRequest(path, { method = 'GET', body = null } = {}) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars');
  }

  const resp = await fetch(`${supabaseUrl}${path}`, {
    method,
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!resp.ok) {
    const txt = await resp.text().catch(() => '');
    throw new Error(`Supabase Auth admin error: ${resp.status} ${txt}`);
  }

  const ct = resp.headers.get('content-type') || '';
  if (ct.includes('application/json')) return await resp.json().catch(() => null);
  return await resp.text().catch(() => null);
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
      const page = Number(new URLSearchParams(event.queryStringParameters || {}).get('page') || 1);
      const perPage = Number(new URLSearchParams(event.queryStringParameters || {}).get('perPage') || 50);
      const q = String(new URLSearchParams(event.queryStringParameters || {}).get('q') || '').trim().toLowerCase();

      const url = new URL('/auth/v1/admin/users', 'https://placeholder');
      url.searchParams.set('page', String(page));
      url.searchParams.set('per_page', String(perPage));

      const data = await adminAuthRequest(url.pathname + url.search);
      let users = Array.isArray(data?.users) ? data.users : [];

      if (q) {
        users = users.filter(u => {
          const em = String(u?.email || '').toLowerCase();
          const nm = String(u?.user_metadata?.name || '').toLowerCase();
          return em.includes(q) || nm.includes(q);
        });
      }

      const slim = users.map(u => ({
        id: u.id,
        email: u.email,
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at,
        confirmed_at: u.confirmed_at,
        email_confirmed_at: u.email_confirmed_at,
        banned_until: u.banned_until,
        user_metadata: u.user_metadata || {},
      }));

      return json(200, { ok: true, users: slim });
    }

    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const action = String(body.action || '').trim();
      const userId = String(body.userId || '').trim();
      if (!action || !userId) return json(400, { error: 'Missing action/userId' });

      if (action === 'ban') {
        const banHours = Number(body.banHours || 24 * 365 * 10); // default 10 años
        const payload = { ban_duration: `${banHours}h` };
        await adminAuthRequest(`/auth/v1/admin/users/${encodeURIComponent(userId)}`, { method: 'PUT', body: payload });
        return json(200, { ok: true });
      }

      if (action === 'unban') {
        const payload = { ban_duration: 'none' };
        await adminAuthRequest(`/auth/v1/admin/users/${encodeURIComponent(userId)}`, { method: 'PUT', body: payload });
        return json(200, { ok: true });
      }

      if (action === 'delete') {
        await adminAuthRequest(`/auth/v1/admin/users/${encodeURIComponent(userId)}`, { method: 'DELETE' });
        return json(200, { ok: true });
      }

      return json(400, { error: 'Invalid action' });
    }

    return json(405, { error: 'Method not allowed' });
  } catch (e) {
    return json(500, { error: e.message || String(e) });
  }
};
