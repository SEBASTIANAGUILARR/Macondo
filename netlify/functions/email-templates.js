function json(statusCode, body, extraHeaders = {}) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
      ...extraHeaders,
    },
    body: JSON.stringify(body),
  };
}

async function verifySupabaseSession(accessToken) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY env vars');
  }

  const resp = await fetch(`${supabaseUrl}/auth/v1/user`, {
    method: 'GET',
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!resp.ok) return null;
  return await resp.json();
}

function isAllowedAdmin(user) {
  const allowed = (process.env.ADMIN_EMAILS || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
  if (allowed.length === 0) return true;
  const email = (user?.email || '').toLowerCase();
  return allowed.includes(email);
}

async function supabaseRest(method, pathWithQuery, body) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars');
  }

  const headers = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    'Content-Type': 'application/json',
  };
  if (method !== 'GET') {
    headers.Prefer = 'resolution=merge-duplicates,return=representation';
  }

  const resp = await fetch(`${supabaseUrl}/rest/v1/${pathWithQuery}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!resp.ok) {
    const txt = await resp.text().catch(() => '');
    throw new Error(`Supabase REST error: ${resp.status} ${txt}`);
  }

  if (method === 'GET') return await resp.json().catch(() => null);
  return await resp.json().catch(() => null);
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return json(200, { ok: true });
  }

  try {
    const auth = event.headers.authorization || event.headers.Authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice('Bearer '.length) : null;

    if (!token) return json(401, { error: 'Missing Authorization Bearer token' });

    const user = await verifySupabaseSession(token);
    if (!user) return json(401, { error: 'Invalid session' });
    if (!isAllowedAdmin(user)) return json(403, { error: 'Not allowed' });

    if (event.httpMethod === 'GET') {
      const qs = event.queryStringParameters || {};
      const key = String(qs.key || '').trim();
      const lang = String(qs.lang || '').trim();

      if (key && lang) {
        const rows = await supabaseRest('GET', `email_templates?select=key,lang,enabled,subject_template,html_template,updated_at&key=eq.${encodeURIComponent(key)}&lang=eq.${encodeURIComponent(lang)}&limit=1`);
        return json(200, { ok: true, template: Array.isArray(rows) ? rows[0] : null });
      }

      const rows = await supabaseRest('GET', 'email_templates?select=key,lang,enabled,subject_template,html_template,updated_at&order=key.asc,lang.asc');
      return json(200, { ok: true, templates: rows || [] });
    }

    if (event.httpMethod === 'PUT') {
      const body = JSON.parse(event.body || '{}');
      const key = String(body.key || '').trim();
      const lang = String(body.lang || '').trim();
      const enabled = body.enabled === false ? false : true;
      const subject_template = String(body.subject_template || '').trim();
      const html_template = String(body.html_template || '').trim();

      if (!key || !lang || !subject_template || !html_template) {
        return json(400, { error: 'Missing key/lang/subject_template/html_template' });
      }

      const payload = {
        key,
        lang,
        enabled,
        subject_template,
        html_template,
        updated_at: new Date().toISOString(),
      };

      const rows = await supabaseRest('POST', 'email_templates?on_conflict=key,lang', [payload]);
      return json(200, { ok: true, template: Array.isArray(rows) ? rows[0] : null });
    }

    return json(405, { error: 'Method not allowed' });
  } catch (err) {
    return json(500, { error: err.message || String(err) });
  }
};
