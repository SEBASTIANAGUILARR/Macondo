const { json, verifySupabaseSession, supabaseRest, isAdminEmail } = require('./_cover-shared');

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

function clampInt(v, min, max, def) {
  const n = Number(v);
  if (!Number.isFinite(n)) return def;
  return Math.max(min, Math.min(max, Math.trunc(n)));
}

function inferActiveStatusFromRow(row) {
  const st = String(row?.status || '').toLowerCase();
  const price = Number(row?.price_pln);
  const isPaid = Number.isFinite(price) && price > 0;
  if (st === 'manual_pending') return 'manual';
  if (st === 'manual') return 'manual';
  if (st === 'paid') return 'paid';
  if (st === 'disabled') return isPaid ? 'paid' : 'manual';
  return isPaid ? 'paid' : 'manual';
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
      const qs = event.queryStringParameters || {};
      const limit = clampInt(qs.limit, 1, 500, 200);
      const status = String(qs.status || '').trim().toLowerCase();
      const q = String(qs.q || '').trim();

      let path = 'cover_tickets?select=id,person_name,person_email,person_phone,buyer_name,buyer_email,buyer_phone,dj_name,price_pln,event_date,qr_token,status,used_at,used_by,created_at&order=created_at.desc&limit=' + limit;
      if (status) {
        if (status === 'used') {
          path += '&used_at=not.is.null';
        } else {
          path += `&status=eq.${encodeURIComponent(status)}`;
        }
      }

      let rows = await supabaseRest(path);
      rows = Array.isArray(rows) ? rows : [];

      if (q) {
        const needle = q.toLowerCase();
        rows = rows.filter(r => {
          return (
            String(r?.person_email || '').toLowerCase().includes(needle) ||
            String(r?.buyer_email || '').toLowerCase().includes(needle) ||
            String(r?.person_name || '').toLowerCase().includes(needle) ||
            String(r?.buyer_name || '').toLowerCase().includes(needle) ||
            String(r?.status || '').toLowerCase().includes(needle) ||
            String(r?.qr_token || '').toLowerCase().includes(needle)
          );
        });
      }

      return json(200, { ok: true, tickets: rows });
    }

    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const action = String(body.action || '').trim();

      if (action === 'set_active') {
        const id = body.id;
        const active = !!body.active;

        if (!id) return json(400, { error: 'Missing id' });

        const existing = await supabaseRest(`cover_tickets?select=id,status,price_pln,used_at&limit=1&id=eq.${encodeURIComponent(String(id))}`);
        const row = Array.isArray(existing) ? existing[0] : null;
        if (!row) return json(404, { error: 'Ticket not found' });

        if (row.used_at && active) {
          return json(409, { error: 'Ticket ya fue usado. No se puede reactivar.' });
        }

        const nextStatus = active ? inferActiveStatusFromRow(row) : 'disabled';

        const updated = await supabaseRest(`cover_tickets?id=eq.${encodeURIComponent(String(id))}`, {
          method: 'PATCH',
          prefer: 'return=representation',
          body: { status: nextStatus },
        });

        return json(200, { ok: true, ticket: Array.isArray(updated) ? updated[0] : null });
      }

      if (action === 'reset_used') {
        const id = body.id;
        if (!id) return json(400, { error: 'Missing id' });

        const existing = await supabaseRest(`cover_tickets?select=id,status,price_pln,used_at,used_by&limit=1&id=eq.${encodeURIComponent(String(id))}`);
        const row = Array.isArray(existing) ? existing[0] : null;
        if (!row) return json(404, { error: 'Ticket not found' });

        const nextStatus = inferActiveStatusFromRow(row);
        const updated = await supabaseRest(`cover_tickets?id=eq.${encodeURIComponent(String(id))}`, {
          method: 'PATCH',
          prefer: 'return=representation',
          body: { used_at: null, used_by: null, status: nextStatus },
        });

        return json(200, { ok: true, ticket: Array.isArray(updated) ? updated[0] : null });
      }

      if (action === 'delete_ticket') {
        const id = body.id;
        if (!id) return json(400, { error: 'Missing id' });

        await supabaseRest(`cover_tickets?id=eq.${encodeURIComponent(String(id))}`, {
          method: 'DELETE',
        });

        return json(200, { ok: true });
      }

      if (action === 'accept_private') {
        const id = body.id;
        if (!id) return json(400, { error: 'Missing id' });

        const existing = await supabaseRest(`cover_tickets?select=id,person_name,person_email,qr_token,status,dj_name,event_date,used_at&limit=1&id=eq.${encodeURIComponent(String(id))}`);
        const row = Array.isArray(existing) ? existing[0] : null;
        if (!row) return json(404, { error: 'Ticket not found' });

        const st = String(row.status || '').toLowerCase();
        if (st !== 'private_pending') return json(409, { error: 'Ticket no está pendiente' });
        if (row.used_at) return json(409, { error: 'Ticket ya fue usado' });

        const updatedArr = await supabaseRest(`cover_tickets?id=eq.${encodeURIComponent(String(id))}`, {
          method: 'PATCH',
          prefer: 'return=representation',
          body: { status: 'manual', price_pln: 0 },
        });
        const updated = Array.isArray(updatedArr) ? updatedArr[0] : null;

        const baseUrl = process.env.URL || process.env.DEPLOY_PRIME_URL || process.env.SITE_URL || '';
        const link = `${String(baseUrl).replace(/\/$/, '')}/ticket.html?token=${encodeURIComponent(String(row.qr_token || '').trim())}`;

        const eventTitle = String(row.dj_name || 'Evento privado');
        const subject = `✅ Invitación aprobada - ${escapeHtml(eventTitle)}`;
        const htmlbody = `
          <div style="font-family:Arial,sans-serif;line-height:1.5">
            <h2 style="color:#92400e;margin:0 0 10px">Invitación aprobada</h2>
            <p>Hola <b>${escapeHtml(row.person_name || '')}</b>,</p>
            <p>Tu invitación para <b>${escapeHtml(eventTitle)}</b> ha sido aprobada.</p>
            <p>Abre este enlace para mostrar tu QR:</p>
            <p><a href="${link}">${link}</a></p>
            <p style="margin-top:16px;color:#6b7280;font-size:12px">El QR es válido una sola vez.</p>
          </div>
        `;

        await sendZeptoMail({
          to: [{ address: String(row.person_email || '').trim(), name: String(row.person_name || '').trim() }],
          subject,
          htmlbody,
        });

        return json(200, { ok: true, ticket: updated });
      }

      return json(400, { error: 'Unknown action' });
    }

    return json(405, { error: 'Method not allowed' });
  } catch (e) {
    return json(500, { error: e.message || String(e) });
  }
};
