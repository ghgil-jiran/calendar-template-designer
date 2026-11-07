-- Shared by the user service and Template Editor. Run once in their shared Supabase project.
create table if not exists public.calendar_production_requests (
  id uuid primary key,
  receipt_number bigint generated always as identity unique,
  owner_id uuid not null references auth.users(id),
  source_document_id uuid not null,
  school_name text not null,
  contact jsonb not null,
  snapshot jsonb not null,
  snapshot_hash text not null check (length(snapshot_hash) = 64),
  status text not null default 'received' check (status in ('received','reviewing','changes','approved','sent')),
  created_at timestamptz not null default now()
);
create index if not exists calendar_production_requests_created_idx on public.calendar_production_requests(created_at desc);
alter table public.calendar_production_requests enable row level security;
revoke all on public.calendar_production_requests from public, anon, authenticated;
grant select, insert, update on public.calendar_production_requests to service_role;
grant usage, select on sequence public.calendar_production_requests_receipt_number_seq to service_role;

create or replace function public.preserve_calendar_production_snapshot() returns trigger
language plpgsql set search_path = public as $$
begin
  if new.snapshot is distinct from old.snapshot or new.snapshot_hash is distinct from old.snapshot_hash
    or new.contact is distinct from old.contact or new.owner_id is distinct from old.owner_id
    or new.source_document_id is distinct from old.source_document_id or new.school_name is distinct from old.school_name
    or new.id is distinct from old.id or new.receipt_number is distinct from old.receipt_number or new.created_at is distinct from old.created_at then
    raise exception 'Production receipt snapshot is immutable';
  end if;
  return new;
end $$;
drop trigger if exists preserve_calendar_production_snapshot on public.calendar_production_requests;
create trigger preserve_calendar_production_snapshot before update on public.calendar_production_requests
for each row execute function public.preserve_calendar_production_snapshot();

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('calendar-production-assets','calendar-production-assets',false,26214400,array['image/jpeg','image/png','image/webp','image/gif','image/svg+xml'])
on conflict(id) do nothing;
drop policy if exists "production original insert" on storage.objects;
create policy "production original insert" on storage.objects for insert to authenticated
with check (bucket_id = 'calendar-production-assets' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "production original read" on storage.objects;
create policy "production original read" on storage.objects for select to authenticated
using (bucket_id = 'calendar-production-assets' and (storage.foldername(name))[1] = auth.uid()::text);
-- No user UPDATE or DELETE policy: receipt originals are append-only.
