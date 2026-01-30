const { json, supabaseRest, verifyStaffToken } = require('./_cover-shared');

function getStaffTokenFromHeaders(headers) {
  const auth = headers.authorization || headers.Authorization || '';
  if (!auth.toLowerCase().startsWith('staff ')) return null;
  return auth.slice('Staff '.length).trim();
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return json(200, { ok: true });
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });

  try {
    const token = getStaffTokenFromHeaders(event.headers || {});
    if (!token) return json(401, { error: 'Missing Staff token' });

    const staff = verifyStaffToken(token);
    if (!staff?.username) return json(401, { error: 'Invalid token' });

    const body = JSON.parse(event.body || '{}');
    const qr = String(body.token || '').trim();
    if (!qr) return json(400, { error: 'Missing token' });

    const rows = await supabaseRest(`cover_tickets?select=id,used_at,used_by,status,event_date&qr_token=eq.${encodeURIComponent(qr)}&limit=1`);
    const ticket = rows && rows[0];
    if (!ticket) return json(404, { error: 'Ticket no existe' });

    if (ticket.status !== 'paid' && ticket.status !== 'manual') {
      return json(400, { error: 'Ticket no está activo' });
    }

    const graceMs = 5 * 60 * 1000;
    if (ticket.used_at) {
      const usedAtMs = Date.parse(ticket.used_at);
      const nowMs = Date.now();
      if (Number.isFinite(usedAtMs) && nowMs - usedAtMs <= graceMs) {
        return json(200, { ok: true, grace: true, used_at: ticket.used_at, used_by: ticket.used_by || null });
      }
      return json(409, { error: 'Ticket ya fue usado' });
    }

    // Atomic-ish update: only update if used_at IS NULL
    const now = new Date().toISOString();
    const updated = await supabaseRest(`cover_tickets?id=eq.${ticket.id}&used_at=is.null`, {
      method: 'PATCH',
      prefer: 'return=representation',
      body: { used_at: now, used_by: staff.username },
    });

    if (!Array.isArray(updated) || updated.length === 0) {
      return json(409, { error: 'Ticket ya fue usado' });
    }

    return json(200, { ok: true, grace: false, used_at: now, used_by: staff.username });
  } catch (e) {
    return json(500, { error: e.message || String(e) });
  }
};
