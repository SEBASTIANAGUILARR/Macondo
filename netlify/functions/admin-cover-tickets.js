const { json, verifySupabaseSession, supabaseRest, isAdminEmail } = require('./_cover-shared');

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

      return json(400, { error: 'Unknown action' });
    }

    return json(405, { error: 'Method not allowed' });
  } catch (e) {
    return json(500, { error: e.message || String(e) });
  }
};
