begin;

alter table public.sessions
  add column if not exists is_open boolean not null default true;

-- Room and duration are nullable so existing sessions do not need backfilling.
alter table public.sessions
  add column if not exists room text;

alter table public.sessions
  add column if not exists duration_min integer;

commit;
