create table if not exists public.calendar_designer_designs (
  set_id text primary key,
  design jsonb not null,
  updated_at timestamptz not null default now(),
  check (length(set_id) between 1 and 200),
  check (jsonb_typeof(design) = 'object' and design ? 'set_id' and design->>'set_id' = set_id)
);

alter table public.calendar_designer_designs enable row level security;
revoke all on public.calendar_designer_designs from public, anon, authenticated;
grant select, insert, update on public.calendar_designer_designs to service_role;
