export default async (req) => {
  try {
    const payload = await req.json().catch(() => ({}));
    const nextRun = payload && payload.next_run ? String(payload.next_run) : null;
    console.log('process-email-jobs invoked', { nextRun });

    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceKey) {
      return new Response(JSON.stringify({ error: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const jobs = await supabaseRestSelect(
      supabaseUrl,
      serviceKey,
      'email_jobs?select=id,type,reservation_id,to_email,status,tries,created_at&status=eq.pending&order=created_at.asc&limit=25'
    );

    const list = Array.isArray(jobs) ? jobs : [];
    console.log('process-email-jobs fetched pending jobs', {
      count: list.length,
      supabaseUrl: String(supabaseUrl || '').replace(/\?.*$/, ''),
    });
    if (list.length === 0) {
      return new Response(JSON.stringify({ ok: true, processed: 0 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let processed = 0;
    for (const job of list) {
      const jobId = String(job?.id || '').trim();
      if (!jobId) continue;

      const claimed = await tryClaimJob(supabaseUrl, serviceKey, job);
      if (!claimed) continue;

      try {
        const reservationId = String(job?.reservation_id || '').trim();
        if (!reservationId) throw new Error('Missing reservation_id');

        const resRows = await supabaseRestSelect(
          supabaseUrl,
          serviceKey,
          `reservations?select=id,nombre,email,telefono,fecha,hora_entrada,personas,mesa,comentarios,estado,mesa_foto_url,created_at,lang&limit=1&id=eq.${encodeURIComponent(reservationId)}`
        );
        const reservation = Array.isArray(resRows) ? resRows[0] : null;
        if (!reservation) throw new Error('Reservation not found');

        const toEmail = String(job?.to_email || reservation.email || '').trim();
        if (!toEmail) throw new Error('Missing to_email');

        const emailPayload = await buildReservationEmailFromTemplates(supabaseUrl, serviceKey, job?.type, reservation);
        await sendZeptoMail({ to: [{ address: toEmail, name: reservation.nombre || toEmail }], subject: emailPayload.subject, htmlbody: emailPayload.html });

        await supabaseRestPatch(supabaseUrl, serviceKey, `email_jobs?id=eq.${encodeURIComponent(jobId)}`, {
          status: 'sent',
          sent_at: new Date().toISOString(),
          last_error: null,
        });

        processed += 1;
      } catch (e) {
        const msg = e?.message ? String(e.message) : String(e);
        console.error('Job failed', { jobId, error: msg });

        const tries = Number(job?.tries || 0) + 1;
        const nextStatus = tries >= 5 ? 'failed' : 'pending';
        await supabaseRestPatch(supabaseUrl, serviceKey, `email_jobs?id=eq.${encodeURIComponent(jobId)}`, {
          status: nextStatus,
          tries,
          last_error: msg,
        }).catch(() => null);
      }
    }

    console.log('process-email-jobs finished', { processed });
    return new Response(JSON.stringify({ ok: true, processed }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    const msg = e?.message ? String(e.message) : String(e);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

async function supabaseRestSelect(supabaseUrl, serviceKey, pathWithQuery) {
  const resp = await fetch(`${supabaseUrl}/rest/v1/${pathWithQuery}`, {
    method: 'GET',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
    },
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

async function getTemplate(supabaseUrl, serviceKey, key, lang) {
  const rows = await supabaseRestSelect(
    supabaseUrl,
    serviceKey,
    `email_templates?select=key,lang,enabled,subject_template,html_template&limit=1&key=eq.${encodeURIComponent(key)}&lang=eq.${encodeURIComponent(lang)}`
  );
  const t = Array.isArray(rows) ? rows[0] : null;
  if (!t || t.enabled === false) return null;
  return t;
}

function normalizeLang(lang) {
  const l = String(lang || '').trim().toLowerCase();
  if (l === 'pl' || l === 'en' || l === 'es') return l;
  return 'pl';
}

function templateKeyFromJobType(type, reservation) {
  const kind = String(type || '').toLowerCase();
  const estado = String(reservation?.estado || '').toLowerCase();

  if (kind === 'reservation_pending' || estado === 'pendiente') return 'reservation_pending';
  if (kind === 'reservation_confirmed' || estado === 'confirmada') return 'reservation_confirmed';
  if (kind === 'reservation_cancelled' || estado === 'cancelada') return 'reservation_cancelled';
  if (kind === 'reservation_reactivated') return 'reservation_reactivated';
  return 'reservation_pending';
}

function safeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatDateShort(dateStr) {
  try {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch (e) {
    return String(dateStr || '');
  }
}

function renderTemplateString(raw, vars) {
  let out = String(raw || '');
  for (const [k, v] of Object.entries(vars || {})) {
    const re = new RegExp(`\\{\\{\\s*${k}\\s*\\}\\}`, 'g');
    out = out.replace(re, String(v ?? ''));
  }
  return out;
}

async function buildReservationEmailFromTemplates(supabaseUrl, serviceKey, type, reservation) {
  const key = templateKeyFromJobType(type, reservation);
  const preferred = normalizeLang(reservation?.lang);
  const fallbackChain = preferred === 'pl' ? ['pl', 'en', 'es'] : (preferred === 'en' ? ['en', 'pl', 'es'] : ['es', 'pl', 'en']);

  let tpl = null;
  for (const lang of fallbackChain) {
    tpl = await getTemplate(supabaseUrl, serviceKey, key, lang);
    if (tpl) break;
  }

  const photoUrl = String(reservation?.mesa_foto_url || '').trim();
  const showPhoto = /^https?:\/\//i.test(photoUrl);
  const mesaFotoBlock = showPhoto
    ? `<div style="margin-top:16px"><div style="font-weight:700;margin-bottom:8px">📷 Foto de mesa</div><a href="${photoUrl}">${photoUrl}</a><div style="margin-top:8px"><img src="${photoUrl}" alt="Foto de mesa" style="max-width:520px;width:100%;height:auto;border-radius:12px;border:1px solid #f3f4f6" /></div></div>`
    : '';

  const vars = {
    nombre: safeHtml(reservation?.nombre || ''),
    email: safeHtml(reservation?.email || ''),
    telefono: safeHtml(reservation?.telefono || ''),
    fecha: safeHtml(reservation?.fecha ? formatDateShort(reservation.fecha) : ''),
    hora: safeHtml(reservation?.hora_entrada || ''),
    personas: safeHtml(reservation?.personas ?? ''),
    mesa: safeHtml(reservation?.mesa || 'Sin asignar'),
    comentarios: safeHtml(reservation?.comentarios || ''),
    mesa_foto_url: safeHtml(photoUrl),
    mesa_foto_block: mesaFotoBlock,
  };

  if (tpl) {
    return {
      subject: renderTemplateString(tpl.subject_template, vars),
      html: renderTemplateString(tpl.html_template, vars),
    };
  }

  return buildReservationEmail(type, reservation);
}

async function supabaseRestPatch(supabaseUrl, serviceKey, pathWithQuery, body) {
  const resp = await fetch(`${supabaseUrl}/rest/v1/${pathWithQuery}`, {
    method: 'PATCH',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(body || {}),
  });

  if (!resp.ok) {
    const txt = await resp.text().catch(() => '');
    throw new Error(`Supabase REST patch error: ${resp.status} ${txt}`);
  }

  return true;
}

async function tryClaimJob(supabaseUrl, serviceKey, job) {
  const jobId = String(job?.id || '').trim();
  if (!jobId) return false;

  // Best-effort claim to avoid duplicate processing.
  const tries = Number(job?.tries || 0) + 1;

  const resp = await fetch(`${supabaseUrl}/rest/v1/email_jobs?id=eq.${encodeURIComponent(jobId)}&status=eq.pending`, {
    method: 'PATCH',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify({ status: 'processing', tries }),
  });

  if (!resp.ok) {
    return false;
  }

  const rows = await resp.json().catch(() => null);
  return Array.isArray(rows) && rows.length > 0;
}

function buildReservationEmail(type, reservation) {
  const kind = String(type || '').toLowerCase();
  const estado = String(reservation?.estado || '').toLowerCase();

  let title = 'Reserva actualizada - Macondo';
  if (kind === 'reservation_pending' || estado === 'pendiente') title = '📩 Reserva recibida - Macondo';
  if (kind === 'reservation_confirmed' || estado === 'confirmada') title = '✅ Reserva confirmada - Macondo';
  if (kind === 'reservation_cancelled' || estado === 'cancelada') title = '❌ Reserva cancelada - Macondo';
  if (kind === 'reservation_reactivated') title = '🔄 Reserva reactivada - Macondo';

  const photoUrl = String(reservation?.mesa_foto_url || '').trim();
  const showPhoto = /^https?:\/\//i.test(photoUrl);

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#1f2937">
      <h2 style="color:#92400e;margin:0 0 12px 0">${safeHtml(title)}</h2>
      <p style="margin:0 0 16px 0">Hola <strong>${safeHtml(reservation?.nombre || '')}</strong>,</p>
      <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse">
        <tr><td style="padding:8px 0;border-bottom:1px solid #f3f4f6"><strong>Fecha</strong></td><td style="padding:8px 0;border-bottom:1px solid #f3f4f6">${safeHtml(reservation?.fecha ? formatDateShort(reservation.fecha) : '')}</td></tr>
        <tr><td style="padding:8px 0;border-bottom:1px solid #f3f4f6"><strong>Hora</strong></td><td style="padding:8px 0;border-bottom:1px solid #f3f4f6">${safeHtml(reservation?.hora_entrada || '')}</td></tr>
        <tr><td style="padding:8px 0;border-bottom:1px solid #f3f4f6"><strong>Personas</strong></td><td style="padding:8px 0;border-bottom:1px solid #f3f4f6">${safeHtml(reservation?.personas || '')}</td></tr>
        <tr><td style="padding:8px 0;border-bottom:1px solid #f3f4f6"><strong>Mesa</strong></td><td style="padding:8px 0;border-bottom:1px solid #f3f4f6">${safeHtml(reservation?.mesa || 'Sin asignar')}</td></tr>
        ${reservation?.comentarios ? `<tr><td style="padding:8px 0;border-bottom:1px solid #f3f4f6"><strong>Comentarios</strong></td><td style="padding:8px 0;border-bottom:1px solid #f3f4f6">${safeHtml(reservation.comentarios)}</td></tr>` : ''}
      </table>
      ${showPhoto ? `
        <div style="margin-top:16px">
          <div style="font-weight:700;margin-bottom:8px">📷 Foto de mesa</div>
          <a href="${photoUrl}">${photoUrl}</a>
          <div style="margin-top:8px"><img src="${photoUrl}" alt="Foto de mesa" style="max-width:520px;width:100%;height:auto;border-radius:12px;border:1px solid #f3f4f6" /></div>
        </div>
      ` : ''}
      <p style="margin:16px 0 0 0">Gracias,<br><strong>Macondo Bar Latino</strong></p>
    </div>
  `;

  return { subject: title, html };
}

async function sendZeptoMail({ to, subject, htmlbody }) {
  const rawToken = process.env.ZEPTOMAIL_TOKEN;
  if (!rawToken) throw new Error('Missing ZEPTOMAIL_TOKEN env var');

  const token = String(rawToken).trim().replace(/^zoho-enczapikey\s+/i, '').trim();

  const fromAddressRaw = process.env.ZEPTOMAIL_FROM_ADDRESS;
  const fromAddress = (String(fromAddressRaw || '')
    .split(/[,;\s]+/)
    .map(s => s.trim())
    .filter(Boolean)[0]) || 'events@macondo.pl';
  const fromName = process.env.ZEPTOMAIL_FROM_NAME || 'Macondo Bar Latino';

  const host = process.env.ZEPTOMAIL_API_HOST || 'api.zeptomail.eu';
  const url = `https://${host}/v1.1/email`;

  const payload = {
    from: { address: fromAddress, name: fromName },
    to: (Array.isArray(to) ? to : []).map(r => ({ email_address: { address: r.address, name: r.name || r.address } })),
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
    throw new Error(`ZeptoMail error: ${resp.status} ${details}`);
  }

  return parsed || { ok: true };
}
