const {
  json,
  supabaseRest,
  randomToken,
  getBaseUrl,
} = require('./_cover-shared');

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
  const details = contentType.includes('application/json')
    ? JSON.stringify(await resp.json().catch(() => ({})))
    : await resp.text().catch(() => '');

  if (!resp.ok) throw new Error(`ZeptoMail error: ${resp.status} ${details}`);
  return true;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function ymd(date) {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return json(200, { ok: true });
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });

  try {
    const body = JSON.parse(event.body || '{}');
    const buyer_name = String(body.buyer_name || '').trim();
    const buyer_email = String(body.buyer_email || '').trim();
    const buyer_phone = String(body.buyer_phone || '').trim();
    const people = Array.isArray(body.people) ? body.people : [];

    if (!buyer_name || !buyer_email) return json(400, { error: 'Missing buyer_name/buyer_email' });
    if (people.length === 0) return json(400, { error: 'Missing people' });

    // Config actual
    const cfgRows = await supabaseRest('cover_config?select=dj_name,price_pln,active&order=updated_at.desc&limit=1');
    const cfg = (cfgRows && cfgRows[0]) || { dj_name: 'Dj Micke', price_pln: 30, active: true };
    if (!cfg.active) return json(400, { error: 'Cover no disponible' });

    const event_date = ymd(new Date()); // por defecto: hoy (puedes cambiarlo a "finde" luego)

    const rowsToInsert = people.map(p => {
      const person_name = String(p.name || '').trim();
      const person_email = String(p.email || '').trim();
      const person_phone = String(p.phone || '').trim();
      if (!person_name || !person_email || !person_phone) {
        throw new Error('Cada persona debe incluir name, email y phone');
      }
      return {
        buyer_name,
        buyer_email,
        buyer_phone: buyer_phone || null,
        person_name,
        person_email,
        person_phone,
        dj_name: cfg.dj_name,
        price_pln: cfg.price_pln,
        status: 'manual',
        event_date,
        qr_token: randomToken(18),
        created_at: new Date().toISOString(),
      };
    });

    const inserted = await supabaseRest('cover_tickets', {
      method: 'POST',
      prefer: 'return=representation',
      body: rowsToInsert,
    });

    const baseUrl = getBaseUrl();

    // Enviar email por ticket
    for (const t of inserted || []) {
      const link = `${baseUrl}/ticket.html?token=${encodeURIComponent(t.qr_token)}`;
      const subject = `🎟️ Cover Macondo - ${cfg.dj_name}`;
      const htmlbody = `
        <div style="font-family:Arial,sans-serif;line-height:1.5">
          <h2 style="color:#92400e;margin:0 0 10px">Ticket Cover - Macondo</h2>
          <p>Hola <b>${escapeHtml(t.person_name)}</b>,</p>
          <p>Este es tu ticket para el cover del sótano.</p>
          <p><b>DJ:</b> ${escapeHtml(cfg.dj_name)}<br><b>Precio:</b> ${escapeHtml(String(cfg.price_pln))} PLN</p>
          <p>Abre este enlace para mostrar tu QR:</p>
          <p><a href="${link}">${link}</a></p>
          <p style="margin-top:16px;color:#6b7280;font-size:12px">El QR es válido una sola vez.</p>
        </div>
      `;

      await sendZeptoMail({
        to: [{ address: t.person_email, name: t.person_name }],
        subject,
        htmlbody,
      });
    }

    return json(200, { ok: true, count: (inserted || []).length });
  } catch (e) {
    return json(500, { error: e.message || String(e) });
  }
};
