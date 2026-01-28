const crypto = require('crypto');

function json(statusCode, body, extraHeaders = {}) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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

async function supabaseRest(pathWithQuery, { method = 'GET', body = null, prefer = null } = {}) {
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
  if (prefer) headers.Prefer = prefer;

  const resp = await fetch(`${supabaseUrl}/rest/v1/${pathWithQuery}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!resp.ok) {
    const txt = await resp.text().catch(() => '');
    throw new Error(`Supabase REST error: ${resp.status} ${txt}`);
  }

  const contentType = resp.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return await resp.json().catch(() => null);
  }
  return await resp.text().catch(() => null);
}

function sha256Hex(s) {
  return crypto.createHash('sha256').update(String(s)).digest('hex');
}

function randomToken(bytes = 24) {
  return crypto.randomBytes(bytes).toString('hex');
}

function makeStaffToken(payload) {
  const secret = process.env.STAFF_TOKEN_SECRET;
  if (!secret) throw new Error('Missing STAFF_TOKEN_SECRET env var');

  const expSeconds = Math.floor(Date.now() / 1000) + 12 * 60 * 60; // 12h
  const full = { ...payload, exp: expSeconds };
  const b64 = Buffer.from(JSON.stringify(full), 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(b64).digest('base64url');
  return `${b64}.${sig}`;
}

function verifyStaffToken(token) {
  const secret = process.env.STAFF_TOKEN_SECRET;
  if (!secret) throw new Error('Missing STAFF_TOKEN_SECRET env var');

  const parts = String(token || '').split('.');
  if (parts.length !== 2) return null;
  const [b64, sig] = parts;
  const expected = crypto.createHmac('sha256', secret).update(b64).digest('base64url');
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;

  const payload = JSON.parse(Buffer.from(b64, 'base64url').toString('utf8'));
  if (!payload?.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
  return payload;
}

async function isAdminEmail(email) {
  const e = String(email || '').trim().toLowerCase();
  if (!e) return false;

  // check admins table
  const rows = await supabaseRest(`admins?select=email&email=eq.${encodeURIComponent(e)}&limit=1`);
  return Array.isArray(rows) && rows.length > 0;
}

function getBaseUrl() {
  return (
    process.env.URL ||
    process.env.DEPLOY_PRIME_URL ||
    process.env.SITE_URL ||
    ''
  ).replace(/\/$/, '');
}

module.exports = {
  json,
  verifySupabaseSession,
  supabaseRest,
  sha256Hex,
  randomToken,
  makeStaffToken,
  verifyStaffToken,
  isAdminEmail,
  getBaseUrl,
};
