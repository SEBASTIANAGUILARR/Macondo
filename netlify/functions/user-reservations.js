function json(statusCode, body, extraHeaders = {}) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
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

async function supabaseRestSelect(pathWithQuery) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars');
  }

  const resp = await fetch(`${supabaseUrl}/rest/v1/${pathWithQuery}`, {
    method: 'GET',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
    },
  });

  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`Supabase REST error: ${resp.status} ${txt}`);
  }

  return await resp.json();
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return json(200, { ok: true });
  }

  if (event.httpMethod !== 'GET') {
    return json(405, { error: 'Method not allowed' });
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const anonKey = process.env.SUPABASE_ANON_KEY;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl) {
      return json(500, { error: 'Missing SUPABASE_URL in Netlify environment variables' });
    }
    if (!anonKey) {
      return json(500, { error: 'Missing SUPABASE_ANON_KEY in Netlify environment variables' });
    }
    if (!serviceKey) {
      return json(500, { error: 'Missing SUPABASE_SERVICE_ROLE_KEY in Netlify environment variables' });
    }

    const auth = event.headers.authorization || event.headers.Authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice('Bearer '.length) : null;

    if (!token) {
      return json(401, { error: 'Missing Authorization Bearer token' });
    }

    const user = await verifySupabaseSession(token);
    if (!user || !user.email) {
      return json(401, { error: 'Invalid session. Please login again.' });
    }

    const email = String(user.email).trim();
    const normalizeEmail = (v) =>
      String(v || '')
        .trim()
        .toLowerCase()
        .replace(/[\s\u200B-\u200D\uFEFF]/g, '');

    const emailNorm = normalizeEmail(email);
    const rows = await supabaseRestSelect(
      `reservations?select=id,nombre,email,telefono,fecha,hora_entrada,personas,estado,mesa,mesa_foto_url,comentarios,created_at&order=created_at.desc&limit=1000`
    );

    const filtered = Array.isArray(rows)
      ? rows.filter(r => normalizeEmail(r?.email) === emailNorm)
      : [];

    return json(200, {
      ok: true,
      email,
      reservations: filtered,
      debug: {
        emailNorm,
        rowsFetched: Array.isArray(rows) ? rows.length : 0,
        rowsMatched: filtered.length,
      }
    });
  } catch (e) {
    return json(500, { error: `user-reservations failed: ${e.message || String(e)}` });
  }
};
