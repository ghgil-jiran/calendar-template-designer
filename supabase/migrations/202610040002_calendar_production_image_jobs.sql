-- New only: version-bound image preparation; never a final print approval.
create table if not exists public.calendar_production_image_jobs (
 id uuid primary key,
 request_id uuid not null references public.calendar_production_requests(id),
 revision_id uuid not null references public.calendar_production_revisions(id),
 document_hash text not null check(length(document_hash)=64),
 content_hash text not null check(length(content_hash)=64),
 inspection jsonb not null,
 status text not null default 'queued' check(status in ('queued','processing','prepared','failed')),
 progress jsonb, result jsonb, error text,
 worker_token uuid, lease_until timestamptz,
 created_by uuid not null references auth.users(id),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create unique index if not exists calendar_production_image_jobs_active on public.calendar_production_image_jobs(revision_id,content_hash) where status in ('queued','processing');
alter table public.calendar_production_image_jobs enable row level security;
revoke all on public.calendar_production_image_jobs from public,anon,authenticated;
grant select on public.calendar_production_image_jobs to service_role;
create or replace function public.enqueue_calendar_production_image_job(p_id uuid,p_request_id uuid,p_revision_id uuid,p_document_hash text,p_content_hash text,p_inspection jsonb,p_created_by uuid)
returns setof public.calendar_production_image_jobs language plpgsql security definer set search_path=public as $$
declare r public.calendar_production_revisions; j public.calendar_production_image_jobs;
begin
 select * into r from public.calendar_production_revisions where id=p_revision_id and request_id=p_request_id for update;
 if r.id is null or r.document_hash<>p_document_hash then raise exception 'Revision identity mismatch'; end if;
 select * into j from public.calendar_production_image_jobs where id=p_id;
 if j.id is not null then
  if j.request_id<>p_request_id or j.revision_id<>p_revision_id or j.inspection<>p_inspection then raise exception 'Job identity conflict'; end if;
  return next j; return;
 end if;
 select * into j from public.calendar_production_image_jobs where revision_id=p_revision_id and content_hash=p_content_hash and status in ('queued','processing');
 if j.id is not null then return next j; return; end if;
 return query insert into public.calendar_production_image_jobs(id,request_id,revision_id,document_hash,content_hash,inspection,created_by) values(p_id,p_request_id,p_revision_id,p_document_hash,p_content_hash,p_inspection,p_created_by) returning *;
end $$;
create or replace function public.claim_calendar_production_image_job(p_id uuid)
returns setof public.calendar_production_image_jobs language sql security definer set search_path=public as $$
 update public.calendar_production_image_jobs set status='processing',worker_token=gen_random_uuid(),lease_until=now()+interval '10 minutes',updated_at=now(),error=null
 where id=p_id and (status='queued' or status='processing' and lease_until<now()) returning *;
$$;
create or replace function public.update_calendar_production_image_job(p_id uuid,p_token uuid,p_status text,p_progress jsonb,p_result jsonb,p_error text)
returns setof public.calendar_production_image_jobs language plpgsql security definer set search_path=public as $$
begin
 if p_status not in ('processing','prepared','failed') then raise exception 'Invalid worker state'; end if;
 if p_status='prepared' and (p_result->>'schemaVersion' is distinct from 'production-cmyk-images.v1' or p_result->>'finalApproved' is distinct from 'false') then raise exception 'Invalid preparation result'; end if;
 return query update public.calendar_production_image_jobs set status=p_status,progress=p_progress,result=p_result,error=p_error,updated_at=now(),lease_until=case when p_status='processing' then now()+interval '10 minutes' else null end
 where id=p_id and worker_token=p_token and status='processing' and lease_until>now()
 and (p_status<>'prepared' or (p_result->>'revisionId'=revision_id::text and p_result->>'contentHash'=content_hash and p_result->>'documentHash'=document_hash));
end $$;
revoke all on function public.enqueue_calendar_production_image_job(uuid,uuid,uuid,text,text,jsonb,uuid),public.claim_calendar_production_image_job(uuid),public.update_calendar_production_image_job(uuid,uuid,text,jsonb,jsonb,text) from public,anon,authenticated;
grant execute on function public.enqueue_calendar_production_image_job(uuid,uuid,uuid,text,text,jsonb,uuid),public.claim_calendar_production_image_job(uuid),public.update_calendar_production_image_job(uuid,uuid,text,jsonb,jsonb,text) to service_role;
