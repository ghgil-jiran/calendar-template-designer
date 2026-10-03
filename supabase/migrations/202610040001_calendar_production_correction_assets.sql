-- Run after 202610030002. New admin originals are separate from immutable user receipts.
create table if not exists public.calendar_production_correction_assets (
 id uuid primary key,
 request_id uuid not null references public.calendar_production_requests(id),
 path text not null unique,
 name text not null check(length(name) between 1 and 200),
 mime_type text not null check(mime_type in ('image/jpeg','image/png','image/webp')),
 byte_size integer not null check(byte_size between 1 and 26214400),
 status text not null default 'pending' check(status in ('pending','ready')),
 width integer, height integer, content_hash text,
 created_by uuid not null references auth.users(id),
 created_at timestamptz not null default now(),
 check(path=request_id::text||'/'||id::text),
 check(status='pending' or (width>0 and height>0 and length(content_hash)=64 and width is not null and height is not null and content_hash is not null))
);
alter table public.calendar_production_correction_assets enable row level security;
revoke all on public.calendar_production_correction_assets from public,anon,authenticated;
grant select,insert,update on public.calendar_production_correction_assets to service_role;
create or replace function public.preserve_calendar_correction_asset() returns trigger language plpgsql set search_path=public as $$
begin
 if old.status='ready' or new.id is distinct from old.id or new.request_id is distinct from old.request_id or new.path is distinct from old.path or new.name is distinct from old.name or new.mime_type is distinct from old.mime_type or new.byte_size is distinct from old.byte_size or new.created_by is distinct from old.created_by or new.created_at is distinct from old.created_at then
  raise exception 'Correction original is immutable';
 end if;
 return new;
end $$;
drop trigger if exists preserve_calendar_correction_asset on public.calendar_production_correction_assets;
create trigger preserve_calendar_correction_asset before update on public.calendar_production_correction_assets for each row execute function public.preserve_calendar_correction_asset();
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('calendar-correction-assets','calendar-correction-assets',false,26214400,array['image/jpeg','image/png','image/webp']) on conflict(id) do nothing;
-- No anonymous/authenticated write policies. Server issues one-file upload URLs without overwrite.
