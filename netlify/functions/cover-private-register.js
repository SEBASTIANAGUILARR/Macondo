const { json, supabaseRest, randomToken, getBaseUrl } = require('./_cover-shared');

async function sendZeptoMail({ to, subject, htmlbody }) {
  const rawToken = process.env.ZEPTOMAIL_TOKEN;
  if (!rawToken) throw new Error('Missing ZEPTOMAIL_TOKEN env var');

  const token = String(rawToken)
    .trim()
    .replace(/^zoho-enczapikey\s+/i, '')
    .trim();

  const fromAddress = process.env.ZEPTOMAIL_FROM_ADDRESS_COVER || 'cover@macondo.pl';
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

  if (!resp.ok) {
    const txt = await resp.text().catch(() => '');
    throw new Error(`ZeptoMail error: ${resp.status} ${txt}`);
  }
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

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return json(200, { ok: true });
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });

  try {
    const body = JSON.parse(event.body || '{}');
    const buyer_name = String(body.buyer_name || '').trim();
    const buyer_email = String(body.buyer_email || '').trim();
    const buyer_phone = String(body.buyer_phone || '').trim() || null;
    const consentConfirm = !!body.consentConfirm;
    const consentMarketing = !!body.consentMarketing;
    const people = Array.isArray(body.people) ? body.people : [];

    if (!buyer_name || !buyer_email) return json(400, { error: 'Missing buyer_name/buyer_email' });
    if (!consentConfirm) return json(400, { error: 'Missing consentConfirm' });
    if (people.length === 0) return json(400, { error: 'Missing people' });

    for (const p of people) {
      const n = String(p.name || '').trim();
      const e = String(p.email || '').trim();
      const ph = String(p.phone || '').trim();
      if (!n || !e || !ph) return json(400, { error: 'Each person must include name, email and phone' });
    }

    let cfgRows = null;
    try {
      cfgRows = await supabaseRest('cover_config?select=mode,private_title,private_description,active&order=updated_at.desc&limit=1');
    } catch (e) {
      // Older schema: no private event mode.
      return json(400, { error: 'Private event registration is not enabled' });
    }
    const cfg = (cfgRows && cfgRows[0]) || { mode: 'dj', private_title: '', private_description: '', active: true };

    const mode = String(cfg.mode || 'dj').trim().toLowerCase();
    if (mode !== 'private_event') return json(400, { error: 'Private event registration is not enabled' });
    if (cfg.active === false) return json(400, { error: 'Registro no disponible' });

    const eventTitle = String(cfg.private_title || '').trim() || 'Evento privado';

    const ticketsToInsert = people.map(p => ({
      buyer_name,
      buyer_email,
      buyer_phone,
      person_name: String(p.name || '').trim(),
      person_email: String(p.email || '').trim().toLowerCase(),
      person_phone: String(p.phone || '').trim(),
      dj_name: eventTitle,
      price_pln: 0,
      status: 'private_pending',
      event_date: new Date().toISOString().slice(0, 10),
      qr_token: randomToken(18),
      created_at: new Date().toISOString(),
    }));

    const inserted = await supabaseRest('cover_tickets', {
      method: 'POST',
      prefer: 'return=representation',
      body: ticketsToInsert,
    });

    for (const t of inserted || []) {
      const subject = `📩 Solicitud recibida - ${escapeHtml(eventTitle)}`;
      const htmlbody = `
        <div style="font-family:Arial,sans-serif;line-height:1.5">
          <h2 style="color:#92400e;margin:0 0 10px">Solicitud de invitación</h2>
          <p>Hola <b>${escapeHtml(t.person_name)}</b>,</p>
          <p>Hemos recibido tu solicitud para <b>${escapeHtml(eventTitle)}</b>.</p>
          <p>Tu invitación debe ser aceptada manualmente. Te enviaremos un email con tu QR cuando sea aprobada.</p>
          <p style="margin-top:16px;color:#6b7280;font-size:12px">Macondo Bar Latino</p>
        </div>
      `;

      await sendZeptoMail({
        to: [{ address: t.person_email, name: t.person_name }],
        subject,
        htmlbody,
      });
    }

    const baseUrl = getBaseUrl();
    const tickets = (inserted || []).map(t => ({
      id: t.id,
      status: t.status,
      person_email: t.person_email,
      person_name: t.person_name,
      event_title: eventTitle,
      ticket_url: `${baseUrl}/ticket.html?token=${encodeURIComponent(t.qr_token)}`,
    }));

    return json(200, { ok: true, tickets });
  } catch (e) {
    return json(500, { error: e.message || String(e) });
  }
};
