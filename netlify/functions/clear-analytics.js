function json(statusCode, body, extraHeaders = {}) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

  if (!resp.ok) {
    return null;
  }

  return await resp.json();
}

async function supabaseRestDelete(pathWithQuery) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars');
  }

  const resp = await fetch(`${supabaseUrl}/rest/v1/${pathWithQuery}`, {
    method: 'DELETE',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
  });

  if (!resp.ok) {
    const txt = await resp.text().catch(() => '');
    throw new Error(`Supabase delete error: ${resp.status} ${txt}`);
  }

  return true;
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return json(200, { ok: true });
  }

  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method not allowed' });
  }

  try {
    const auth = event.headers.authorization || event.headers.Authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice('Bearer '.length) : null;

    if (!token) {
      return json(401, { error: 'Missing Authorization Bearer token' });
    }

    const user = await verifySupabaseSession(token);
    if (!user) {
      return json(401, { error: 'Invalid session' });
    }

    const email = String(user?.email || '').toLowerCase();
    const owner = 'sebastian.aguilargutierrez@gmail.com';
    if (email !== owner) {
      return json(403, { error: 'Not allowed' });
    }

    await supabaseRestDelete('analytics?created_at=gte.1970-01-01T00:00:00.000Z');

    return json(200, { ok: true });
  } catch (e) {
    return json(500, { error: e.message || String(e) });
  }
};
