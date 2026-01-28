const { json, verifySupabaseSession, supabaseRest, isAdminEmail } = require('./_cover-shared');

async function fetchAll(pathBase, pageSize = 1000, maxRows = 20000) {
  let out = [];
  let offset = 0;

  while (out.length < maxRows) {
    const path = `${pathBase}&limit=${pageSize}&offset=${offset}`;
    const rows = await supabaseRest(path);
    if (!Array.isArray(rows) || rows.length === 0) break;
    out = out.concat(rows);
    if (rows.length < pageSize) break;
    offset += pageSize;
  }

  return out;
}

function ymd(d) {
  const dt = new Date(d);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const day = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return json(200, { ok: true });
  if (event.httpMethod !== 'GET') return json(405, { error: 'Method not allowed' });

  try {
    const auth = event.headers.authorization || event.headers.Authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice('Bearer '.length) : null;
    if (!token) return json(401, { error: 'Missing Authorization Bearer token' });

    const user = await verifySupabaseSession(token);
    if (!user) return json(401, { error: 'Invalid session' });

    const email = String(user?.email || '').toLowerCase();
    const allowed = await isAdminEmail(email);
    if (!allowed) return json(403, { error: 'Not allowed' });

    const qs = event.queryStringParameters || {};
    const days = Math.max(1, Math.min(365, Number(qs.days) || 30));
    const top = Math.max(5, Math.min(200, Number(qs.top) || 30));

    const since = new Date();
    since.setDate(since.getDate() - days);

    // Covers (últimos N días)
    const coverRows = await fetchAll(
      `cover_tickets?select=event_date,price_pln,person_email,person_name,person_phone,created_at,status&created_at=gte.${encodeURIComponent(since.toISOString())}`,
      1000,
      50000
    );

    const byDay = new Map();
    const byEmail = new Map();

    for (const r of coverRows) {
      const day = r.event_date || ymd(r.created_at || new Date());
      const price = Number(r.price_pln || 0);
      const key = String(day);
      const cur = byDay.get(key) || { date: key, sold: 0, revenue_pln: 0 };
      cur.sold += 1;
      cur.revenue_pln += price;
      byDay.set(key, cur);

      const em = String(r.person_email || '').toLowerCase();
      if (em) {
        const c = byEmail.get(em) || {
          email: em,
          name: r.person_name || '',
          phone: r.person_phone || '',
          covers: 0,
          last_cover_at: null,
        };
        c.covers += 1;
        const ts = r.created_at ? new Date(r.created_at).toISOString() : null;
        if (!c.last_cover_at || (ts && ts > c.last_cover_at)) c.last_cover_at = ts;
        if (!c.name && r.person_name) c.name = r.person_name;
        if (!c.phone && r.person_phone) c.phone = r.person_phone;
        byEmail.set(em, c);
      }
    }

    const daily = Array.from(byDay.values()).sort((a, b) => a.date.localeCompare(b.date));
    const customers = Array.from(byEmail.values())
      .sort((a, b) => b.covers - a.covers)
      .slice(0, top);

    // Reservas: para top N emails, contar en tabla reservations
    // (best-effort: 1 query por email; top es pequeño)
    for (const c of customers) {
      try {
        const res = await supabaseRest(
          `reservations?select=id&email=eq.${encodeURIComponent(c.email)}&limit=1`,
          { method: 'GET' }
        );
        // Para contar sin traer todo, hacemos otra llamada con Prefer: count=exact
        // PostgREST devuelve Content-Range en headers, pero nuestro helper no lo expone.
        // Fallback: traemos hasta 5000 y contamos.
        const allRes = await fetchAll(
          `reservations?select=id&email=eq.${encodeURIComponent(c.email)}`,
          1000,
          5000
        );
        c.reservations = allRes.length;
      } catch (e) {
        c.reservations = null;
      }
    }

    return json(200, {
      ok: true,
      range_days: days,
      daily,
      customers,
    });
  } catch (e) {
    return json(500, { error: e.message || String(e) });
  }
};
