-- Ejecuta este SQL en Supabase (SQL Editor) para habilitar plantillas editables multi-idioma
-- y que las reservas guarden el idioma (lang).

-- 1) Columna lang en reservations
alter table if exists public.reservations
  add column if not exists lang text;

-- Backfill best-effort
update public.reservations
set lang = coalesce(nullif(trim(lang), ''), 'pl')
where lang is null or trim(lang) = '';

-- 2) Tabla de plantillas
create table if not exists public.email_templates (
  key text not null,
  lang text not null,
  enabled boolean not null default true,
  subject_template text not null,
  html_template text not null,
  updated_at timestamptz not null default now(),
  primary key (key, lang)
);

create index if not exists email_templates_key_idx on public.email_templates (key);

-- 3) Plantillas por defecto (PL prioridad)
-- Nota: placeholders disponibles: {{nombre}}, {{email}}, {{telefono}}, {{fecha}}, {{hora}}, {{personas}}, {{mesa}}, {{comentarios}}, {{mesa_foto_url}}
insert into public.email_templates (key, lang, enabled, subject_template, html_template, updated_at)
values
  (
    'reservation_pending','pl',true,
    '📩 Otrzymaliśmy Twoją rezerwację - Macondo',
    '<div style="font-family:Arial,sans-serif;line-height:1.5;color:#1f2937">
      <h2 style="color:#92400e;margin:0 0 12px 0">📩 Otrzymaliśmy Twoją rezerwację</h2>
      <p style="margin:0 0 12px 0">Cześć <strong>{{nombre}}</strong>, dziękujemy! Otrzymaliśmy Twoją rezerwację w <strong>Macondo</strong>. Wkrótce ją potwierdzimy.</p>
      <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse">
        <tr><td style="padding:8px 0;border-bottom:1px solid #f3f4f6"><strong>Data</strong></td><td style="padding:8px 0;border-bottom:1px solid #f3f4f6">{{fecha}}</td></tr>
        <tr><td style="padding:8px 0;border-bottom:1px solid #f3f4f6"><strong>Godzina</strong></td><td style="padding:8px 0;border-bottom:1px solid #f3f4f6">{{hora}}</td></tr>
        <tr><td style="padding:8px 0;border-bottom:1px solid #f3f4f6"><strong>Liczba osób</strong></td><td style="padding:8px 0;border-bottom:1px solid #f3f4f6">{{personas}}</td></tr>
      </table>
      <p style="margin:16px 0 0 0">Pozdrawiamy,<br><strong>Macondo Bar Latino</strong></p>
    </div>',
    now()
  ),
  (
    'reservation_confirmed','pl',true,
    '✅ Rezerwacja potwierdzona - Macondo',
    '<div style="font-family:Arial,sans-serif;line-height:1.5;color:#1f2937">
      <h2 style="color:#92400e;margin:0 0 12px 0">✅ Twoja rezerwacja została potwierdzona</h2>
      <p style="margin:0 0 12px 0">Cześć <strong>{{nombre}}</strong>, potwierdzamy Twoją rezerwację w <strong>Macondo</strong>.</p>
      <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse">
        <tr><td style="padding:8px 0;border-bottom:1px solid #f3f4f6"><strong>Data</strong></td><td style="padding:8px 0;border-bottom:1px solid #f3f4f6">{{fecha}}</td></tr>
        <tr><td style="padding:8px 0;border-bottom:1px solid #f3f4f6"><strong>Godzina</strong></td><td style="padding:8px 0;border-bottom:1px solid #f3f4f6">{{hora}}</td></tr>
        <tr><td style="padding:8px 0;border-bottom:1px solid #f3f4f6"><strong>Liczba osób</strong></td><td style="padding:8px 0;border-bottom:1px solid #f3f4f6">{{personas}}</td></tr>
        <tr><td style="padding:8px 0;border-bottom:1px solid #f3f4f6"><strong>Stolik</strong></td><td style="padding:8px 0;border-bottom:1px solid #f3f4f6">{{mesa}}</td></tr>
      </table>
      {{mesa_foto_block}}
      <p style="margin:16px 0 0 0">Do zobaczenia!<br><strong>Macondo Bar Latino</strong></p>
    </div>',
    now()
  ),
  (
    'reservation_cancelled','pl',true,
    '❌ Rezerwacja anulowana - Macondo',
    '<div style="font-family:Arial,sans-serif;line-height:1.5;color:#1f2937">
      <h2 style="color:#b91c1c;margin:0 0 12px 0">❌ Twoja rezerwacja została anulowana</h2>
      <p style="margin:0 0 12px 0">Cześć <strong>{{nombre}}</strong>, informujemy, że Twoja rezerwacja w <strong>Macondo</strong> została anulowana.</p>
      <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse">
        <tr><td style="padding:8px 0;border-bottom:1px solid #f3f4f6"><strong>Data</strong></td><td style="padding:8px 0;border-bottom:1px solid #f3f4f6">{{fecha}}</td></tr>
        <tr><td style="padding:8px 0;border-bottom:1px solid #f3f4f6"><strong>Godzina</strong></td><td style="padding:8px 0;border-bottom:1px solid #f3f4f6">{{hora}}</td></tr>
        <tr><td style="padding:8px 0;border-bottom:1px solid #f3f4f6"><strong>Liczba osób</strong></td><td style="padding:8px 0;border-bottom:1px solid #f3f4f6">{{personas}}</td></tr>
      </table>
      <p style="margin:16px 0 0 0">Pozdrawiamy,<br><strong>Macondo Bar Latino</strong></p>
    </div>',
    now()
  ),
  (
    'reservation_reactivated','pl',true,
    '🔄 Rezerwacja reaktywowana - Macondo',
    '<div style="font-family:Arial,sans-serif;line-height:1.5;color:#1f2937">
      <h2 style="color:#92400e;margin:0 0 12px 0">🔄 Twoja rezerwacja została reaktywowana</h2>
      <p style="margin:0 0 12px 0">Cześć <strong>{{nombre}}</strong>, Twoja rezerwacja została ponownie aktywowana. Prosimy zignorować wcześniejsze anulowanie.</p>
      <p style="margin:0 0 12px 0">Status rezerwacji: <strong>oczekująca</strong>. Damy znać, gdy zostanie potwierdzona.</p>
      <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse">
        <tr><td style="padding:8px 0;border-bottom:1px solid #f3f4f6"><strong>Data</strong></td><td style="padding:8px 0;border-bottom:1px solid #f3f4f6">{{fecha}}</td></tr>
        <tr><td style="padding:8px 0;border-bottom:1px solid #f3f4f6"><strong>Godzina</strong></td><td style="padding:8px 0;border-bottom:1px solid #f3f4f6">{{hora}}</td></tr>
        <tr><td style="padding:8px 0;border-bottom:1px solid #f3f4f6"><strong>Liczba osób</strong></td><td style="padding:8px 0;border-bottom:1px solid #f3f4f6">{{personas}}</td></tr>
      </table>
      <p style="margin:16px 0 0 0">Pozdrawiamy,<br><strong>Macondo Bar Latino</strong></p>
    </div>',
    now()
  )
on conflict (key, lang) do nothing;

-- 4) Idiomas fallback (EN/ES) mínimos (solo si quieres tenerlos desde el inicio)
insert into public.email_templates (key, lang, enabled, subject_template, html_template, updated_at)
values
  ('reservation_pending','en',true,'📩 We received your reservation - Macondo','<div style="font-family:Arial,sans-serif;line-height:1.5;color:#1f2937"><h2 style="color:#92400e;margin:0 0 12px 0">📩 We received your reservation</h2><p style="margin:0 0 12px 0">Hi <strong>{{nombre}}</strong>, thank you! We received your reservation at <strong>Macondo</strong>. We will confirm it soon.</p><table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse"><tr><td style="padding:8px 0;border-bottom:1px solid #f3f4f6"><strong>Date</strong></td><td style="padding:8px 0;border-bottom:1px solid #f3f4f6">{{fecha}}</td></tr><tr><td style="padding:8px 0;border-bottom:1px solid #f3f4f6"><strong>Time</strong></td><td style="padding:8px 0;border-bottom:1px solid #f3f4f6">{{hora}}</td></tr><tr><td style="padding:8px 0;border-bottom:1px solid #f3f4f6"><strong>Guests</strong></td><td style="padding:8px 0;border-bottom:1px solid #f3f4f6">{{personas}}</td></tr></table><p style="margin:16px 0 0 0">Thanks,<br><strong>Macondo Bar Latino</strong></p></div>',now()),
  ('reservation_pending','es',true,'📩 Hemos recibido tu reserva - Macondo','<div style="font-family:Arial,sans-serif;line-height:1.5;color:#1f2937"><h2 style="color:#92400e;margin:0 0 12px 0">📩 Hemos recibido tu reserva</h2><p style="margin:0 0 12px 0">Hola <strong>{{nombre}}</strong>, ¡gracias! Hemos recibido tu reserva en <strong>Macondo</strong>. Te la confirmaremos pronto.</p><table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse"><tr><td style="padding:8px 0;border-bottom:1px solid #f3f4f6"><strong>Fecha</strong></td><td style="padding:8px 0;border-bottom:1px solid #f3f4f6">{{fecha}}</td></tr><tr><td style="padding:8px 0;border-bottom:1px solid #f3f4f6"><strong>Hora</strong></td><td style="padding:8px 0;border-bottom:1px solid #f3f4f6">{{hora}}</td></tr><tr><td style="padding:8px 0;border-bottom:1px solid #f3f4f6"><strong>Personas</strong></td><td style="padding:8px 0;border-bottom:1px solid #f3f4f6">{{personas}}</td></tr></table><p style="margin:16px 0 0 0">Gracias,<br><strong>Macondo Bar Latino</strong></p></div>',now())
on conflict (key, lang) do nothing;
