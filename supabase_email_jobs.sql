-- Ejecuta este SQL en Supabase (SQL Editor) para habilitar emails 24/7 sin depender del PC.

-- 1) Extensión para UUID
create extension if not exists pgcrypto;

-- 2) Cola de emails
create table if not exists public.email_jobs (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  reservation_id uuid not null,
  to_email text not null,
  status text not null default 'pending', -- pending | processing | sent | failed
  tries integer not null default 0,
  last_error text null,
  created_at timestamptz not null default now(),
  sent_at timestamptz null
);

create index if not exists email_jobs_status_created_at_idx
  on public.email_jobs (status, created_at);

create index if not exists email_jobs_reservation_idx
  on public.email_jobs (reservation_id);

-- 3) Trigger: encola jobs cuando cambia el estado de la reserva
create or replace function public.enqueue_reservation_email_job()
returns trigger
language plpgsql
as $$
declare
  v_type text;
  v_to_email text;
  v_exists boolean;
begin
  v_to_email := lower(trim(coalesce(new.email, '')));
  if v_to_email = '' then
    return new;
  end if;

  v_type := null;

  if tg_op = 'INSERT' then
    if lower(coalesce(new.estado, '')) = 'confirmada' then
      v_type := 'reservation_confirmed';
    elsif lower(coalesce(new.estado, '')) = 'cancelada' then
      v_type := 'reservation_cancelled';
    end if;
  elsif tg_op = 'UPDATE' then
    if lower(coalesce(new.estado, '')) = lower(coalesce(old.estado, '')) then
      return new;
    end if;

    if lower(coalesce(new.estado, '')) = 'confirmada' then
      v_type := 'reservation_confirmed';
    elsif lower(coalesce(new.estado, '')) = 'cancelada' then
      v_type := 'reservation_cancelled';
    elsif lower(coalesce(new.estado, '')) = 'pendiente' and lower(coalesce(old.estado, '')) = 'cancelada' then
      v_type := 'reservation_reactivated';
    end if;
  end if;

  if v_type is null then
    return new;
  end if;

  -- Evitar duplicados: si ya hay un job pendiente/procesando del mismo tipo en los últimos 10 minutos
  select exists(
    select 1
    from public.email_jobs j
    where j.reservation_id = new.id
      and j.type = v_type
      and j.status in ('pending', 'processing')
      and j.created_at >= now() - interval '10 minutes'
  ) into v_exists;

  if v_exists then
    return new;
  end if;

  insert into public.email_jobs (type, reservation_id, to_email)
  values (v_type, new.id, v_to_email);

  return new;
end;
$$;

drop trigger if exists trg_enqueue_reservation_email_job on public.reservations;
create trigger trg_enqueue_reservation_email_job
after insert or update of estado on public.reservations
for each row
execute function public.enqueue_reservation_email_job();
