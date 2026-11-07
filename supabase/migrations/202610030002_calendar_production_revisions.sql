-- New migration: preserves receipt originals and adds append-only correction versions.
create table if not exists public.calendar_production_revisions (
 id uuid primary key,
 request_id uuid not null references public.calendar_production_requests(id),
 revision_number integer not null check(revision_number > 0),
 base_revision_id uuid references public.calendar_production_revisions(id),
 document jsonb not null,
 document_hash text not null check(length(document_hash)=64),
 note text not null check(length(note) between 1 and 2000),
 created_by uuid not null references auth.users(id),
 created_at timestamptz not null default now(),
 unique(request_id,revision_number)
);
alter table public.calendar_production_revisions enable row level security;
revoke all on public.calendar_production_revisions from public,anon,authenticated;
grant select,insert on public.calendar_production_revisions to service_role;
create or replace function public.save_calendar_production_revision(p_id uuid,p_request_id uuid,p_base_revision_id uuid,p_document jsonb,p_document_hash text,p_note text,p_created_by uuid)
returns setof public.calendar_production_revisions language plpgsql set search_path=public as $$
declare current_status text; latest public.calendar_production_revisions;
begin
 select status into current_status from public.calendar_production_requests where id=p_request_id for update;
 if current_status is null or current_status not in ('reviewing','changes') then raise exception 'Receipt is not under review'; end if;
 if exists(select 1 from public.calendar_production_revisions where id=p_id and request_id=p_request_id) then
  return query select * from public.calendar_production_revisions where id=p_id and request_id=p_request_id; return;
 end if;
 select * into latest from public.calendar_production_revisions where request_id=p_request_id order by revision_number desc limit 1;
 if latest.id is distinct from p_base_revision_id then raise exception 'Correction revision conflict: reload latest version'; end if;
 return query insert into public.calendar_production_revisions(id,request_id,revision_number,base_revision_id,document,document_hash,note,created_by)
 values(p_id,p_request_id,coalesce(latest.revision_number,0)+1,p_base_revision_id,p_document,p_document_hash,p_note,p_created_by) returning *;
end $$;
revoke all on function public.save_calendar_production_revision(uuid,uuid,uuid,jsonb,text,text,uuid) from public,anon,authenticated;
grant execute on function public.save_calendar_production_revision(uuid,uuid,uuid,jsonb,text,text,uuid) to service_role;
-- Each new revision needs its own print verification; no print approval is copied here.
