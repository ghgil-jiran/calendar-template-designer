-- Run only this migration, not all pending migrations from the legacy repository.
-- Creates one V2-only table. Does not read or modify legacy template data.
begin;

create table public.calendar_v2_migration_drafts (
  id uuid primary key,
  revision integer not null check (revision > 0),
  candidate jsonb not null,
  constraint calendar_v2_candidate_object check (jsonb_typeof(candidate) = 'object'),
  constraint calendar_v2_candidate_format check ((candidate->>'format') is not distinct from 'acdl-v2-migration-candidate'),
  constraint calendar_v2_candidate_version check ((candidate->'candidateVersion') is not distinct from '1'::jsonb),
  constraint calendar_v2_candidate_state check ((candidate->>'state') is not distinct from 'review-required'),
  constraint calendar_v2_candidate_blocked check (
    (candidate->'publishable') is not distinct from 'false'::jsonb
    and (candidate->'executable') is not distinct from 'false'::jsonb
  ),
  constraint calendar_v2_candidate_snapshot check (
    coalesce(jsonb_typeof(candidate->'legacySnapshot') = 'object', false)
    and coalesce(jsonb_typeof(candidate->'plan') = 'object', false)
    and coalesce(candidate#>>'{source,sha256}' ~ '^[a-f0-9]{64}$', false)
    and coalesce(length(candidate#>>'{source,templateId}') > 0, false)
    and coalesce(length(candidate#>>'{source,versionId}') > 0, false)
  )
);

alter table public.calendar_v2_migration_drafts enable row level security;
revoke all on table public.calendar_v2_migration_drafts from public, anon, authenticated, service_role;
grant select, insert, update on table public.calendar_v2_migration_drafts to service_role;
-- No browser/user policies. Server authentication must precede service-role use.

create function public.calendar_v2_guard_migration_draft()
returns trigger language plpgsql set search_path = pg_catalog as $$
begin
  if TG_OP = 'INSERT' then
    if new.revision <> 1 then
      raise exception 'V2 draft must start at revision 1' using errcode = '23514';
    end if;
  else
    if new.id is distinct from old.id
      or new.revision <> old.revision + 1 then
      raise exception 'V2 draft revision must advance by one' using errcode = '23514';
    end if;
    if new.candidate->'source' is distinct from old.candidate->'source'
      or new.candidate->'legacySnapshot' is distinct from old.candidate->'legacySnapshot' then
      raise exception 'V2 source snapshot is immutable; create another draft' using errcode = '23514';
    end if;
  end if;
  return new;
end;
$$;
revoke all on function public.calendar_v2_guard_migration_draft() from public, anon, authenticated;
grant execute on function public.calendar_v2_guard_migration_draft() to service_role;

create trigger calendar_v2_migration_draft_guard
before insert or update on public.calendar_v2_migration_drafts
for each row execute function public.calendar_v2_guard_migration_draft();

comment on table public.calendar_v2_migration_drafts is 'V2 review-only migration candidates; not executable templates or print jobs';
commit;
