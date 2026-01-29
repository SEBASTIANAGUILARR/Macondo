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

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function textToHtml(text) {
  const safe = escapeHtml(text || '');
  return `<div style="font-family:Arial,sans-serif;line-height:1.5">${safe.replace(/\n/g, '<br>')}</div>`;
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

function isAllowedAdmin(user) {
  const allowed = (process.env.ADMIN_EMAILS || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
  if (allowed.length === 0) return true; // si no configuras ADMIN_EMAILS, permite cualquier sesión válida
  const email = (user?.email || '').toLowerCase();
  return allowed.includes(email);
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

async function supabaseRestInsert(table, rows) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars');
  }

  const resp = await fetch(`${supabaseUrl}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(rows),
  });

  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`Supabase insert error: ${resp.status} ${txt}`);
  }

  return true;
}

async function sendZeptoMail({ to, subject, htmlbody }) {
  const rawToken = process.env.ZEPTOMAIL_TOKEN;
  if (!rawToken) throw new Error('Missing ZEPTOMAIL_TOKEN env var');

  const token = String(rawToken)
    .trim()
    .replace(/^zoho-enczapikey\s+/i, '')
    .trim();

  const fromAddress = process.env.ZEPTOMAIL_FROM_ADDRESS || 'events@macondo.pl';
  const fromName = process.env.ZEPTOMAIL_FROM_NAME || 'Macondo Bar Latino';

  const host = process.env.ZEPTOMAIL_API_HOST || 'api.zeptomail.eu';
  const url = `https://${host}/v1.1/email`;

  const payload = {
    from: { address: fromAddress, name: fromName },
    to: to.map(r => ({ email_address: { address: r.address, name: r.name || r.address } })),
    subject,
    htmlbody,
    track_opens: true,
    track_clicks: true,
  };

  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Zoho-enczapikey ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const contentType = resp.headers.get('content-type') || '';
  let parsed = null;
  let text = null;

  if (contentType.includes('application/json')) {
    parsed = await resp.json().catch(() => null);
  } else {
    text = await resp.text().catch(() => null);
  }

  if (!resp.ok) {
    const details = parsed ? JSON.stringify(parsed) : (text || '');
    console.error('ZeptoMail request failed', {
      status: resp.status,
      details,
      fromAddress,
      toCount: to.length,
      subject,
      host,
    });
    throw new Error(`ZeptoMail error: ${resp.status} ${details}`);
  }

  return parsed || { ok: true };
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

    if (!isAllowedAdmin(user)) {
      return json(403, { error: 'Not allowed' });
    }

    const body = JSON.parse(event.body || '{}');
    const mode = body.mode;
    const subject = String(body.subject || '').trim();
    const content = String(body.content || '').trim();
    const customHtml = typeof body.html === 'string' ? body.html.trim() : '';

    if (!mode || !subject || (!content && !customHtml)) {
      return json(400, { error: 'Missing mode/subject/content (or html)' });
    }

    const htmlbody = customHtml || textToHtml(content);

    if (mode === 'test') {
      const testEmail = String(body.testEmail || '').trim();
      if (!testEmail) return json(400, { error: 'Missing testEmail' });

      await sendZeptoMail({
        to: [{ address: testEmail, name: 'Test' }],
        subject: `[PRUEBA] ${subject}`,
        htmlbody,
      });

      return json(200, { ok: true, sent: 1, mode: 'test' });
    }

    if (mode === 'single') {
      const toEmail = String(body.toEmail || '').trim();
      if (!toEmail) return json(400, { error: 'Missing toEmail' });

      const toName = String(body.toName || '').trim() || toEmail;

      await sendZeptoMail({
        to: [{ address: toEmail, name: toName }],
        subject,
        htmlbody,
      });

      return json(200, { ok: true, sent: 1, mode: 'single' });
    }

    if (mode === 'campaign') {
      // Obtener destinatarios desde Supabase: solo newsletter=true
      const recipients = await supabaseRestSelect('clients?select=nombre,email,newsletter&newsletter=eq.true');

      const to = (recipients || [])
        .filter(r => r.email)
        .map(r => ({ address: r.email, name: r.nombre || r.email }));

      if (to.length === 0) {
        return json(200, { ok: true, sent: 0, message: 'No subscribed clients' });
      }

      // Enviar en chunks para evitar timeouts
      const chunkSize = 40;
      let sent = 0;
      let failures = 0;

      for (let i = 0; i < to.length; i += chunkSize) {
        const chunk = to.slice(i, i + chunkSize);
        try {
          await sendZeptoMail({ to: chunk, subject, htmlbody });
          sent += chunk.length;
        } catch (e) {
          failures += chunk.length;
        }
      }

      // Registrar campaña
      const campaignType = String(body.campaignType || '').trim() || null;
      await supabaseRestInsert('email_campaigns', [{
        subject,
        content,
        campaign_type: campaignType,
        recipients_count: to.length,
        status: failures === 0 ? 'sent' : 'partial',
        sent_at: new Date().toISOString(),
      }]);

      return json(200, { ok: true, mode: 'campaign', totalRecipients: to.length, sent, failures });
    }

    return json(400, { error: 'Invalid mode' });

  } catch (err) {
    return json(500, { error: err.message || String(err) });
  }
};
