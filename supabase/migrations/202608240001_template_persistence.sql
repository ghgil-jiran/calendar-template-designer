create extension if not exists pgcrypto;

create table if not exists public.template_projects (
  id uuid primary key default gen_random_uuid(),
  stable_key text not null unique,
  name text not null,
  description text not null default '',
  edition integer not null check (edition between 2000 and 2200),
  state text not null default 'draft' check (state in ('draft', 'ready', 'published', 'archived')),
  is_standard boolean not null default false,
  product_type text not null,
  template_key text not null,
  latest_version_id uuid,
  latest_version_number integer not null default 0 check (latest_version_number >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create table if not exists public.template_versions (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.template_projects(id),
  version_number integer not null check (version_number > 0),
  save_kind text not null check (save_kind in ('manual', 'restore', 'publish')),
  state text not null check (state in ('draft', 'ready', 'published', 'archived')),
  save_note text,
  source_version_id uuid references public.template_versions(id),
  schema_version text not null,
  project_data jsonb not null check (jsonb_typeof(project_data) = 'object'),
  created_at timestamptz not null default now(),
  unique (template_id, version_number)
);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'template_projects_latest_version_fk'
  ) then
    alter table public.template_projects
      add constraint template_projects_latest_version_fk
      foreign key (latest_version_id) references public.template_versions(id);
  end if;
end;
$$;

create table if not exists public.template_drafts (
  template_id uuid primary key references public.template_projects(id) on delete cascade,
  schema_version text not null,
  project_data jsonb not null check (jsonb_typeof(project_data) = 'object'),
  updated_at timestamptz not null default now()
);

create table if not exists public.template_assets (
  id uuid primary key default gen_random_uuid(),
  content_hash text not null unique,
  storage_bucket text not null default 'template-assets',
  storage_path text not null unique,
  mime_type text not null,
  byte_size bigint not null check (byte_size >= 0),
  width_px integer check (width_px is null or width_px > 0),
  height_px integer check (height_px is null or height_px > 0),
  created_at timestamptz not null default now()
);

create table if not exists public.template_version_assets (
  version_id uuid not null references public.template_versions(id) on delete cascade,
  asset_id uuid not null references public.template_assets(id),
  primary key (version_id, asset_id)
);

create index if not exists template_projects_library_idx
  on public.template_projects (archived_at, updated_at desc);
create index if not exists template_versions_history_idx
  on public.template_versions (template_id, version_number desc);

create or replace function public.save_template_version(
  p_template_id uuid,
  p_stable_key text,
  p_name text,
  p_description text,
  p_edition integer,
  p_state text,
  p_product_type text,
  p_template_key text,
  p_save_kind text,
  p_save_note text,
  p_source_version_id uuid,
  p_schema_version text,
  p_project_data jsonb
) returns public.template_versions
language plpgsql
as $$
declare
  v_template public.template_projects;
  v_version public.template_versions;
  v_next_version integer;
begin
  if p_template_id is null then
    insert into public.template_projects (
      stable_key, name, description, edition, state, product_type, template_key
    ) values (
      p_stable_key, p_name, coalesce(p_description, ''), p_edition, p_state, p_product_type, p_template_key
    ) returning * into v_template;
  else
    select * into v_template
      from public.template_projects
      where id = p_template_id
      for update;
    if not found then raise exception 'template_not_found'; end if;
  end if;

  v_next_version := v_template.latest_version_number + 1;
  insert into public.template_versions (
    template_id, version_number, save_kind, state, save_note,
    source_version_id, schema_version, project_data
  ) values (
    v_template.id, v_next_version, p_save_kind, p_state, nullif(trim(p_save_note), ''),
    p_source_version_id, p_schema_version, p_project_data
  ) returning * into v_version;

  update public.template_projects set
    name = p_name,
    description = coalesce(p_description, ''),
    edition = p_edition,
    state = p_state,
    product_type = p_product_type,
    template_key = p_template_key,
    latest_version_id = v_version.id,
    latest_version_number = v_next_version,
    updated_at = now(),
    archived_at = case when p_state = 'archived' then coalesce(archived_at, now()) else null end
  where id = v_template.id;

  delete from public.template_drafts where template_id = v_template.id;
  return v_version;
end;
$$;

create or replace function public.reject_template_version_mutation()
returns trigger language plpgsql as $$
begin
  raise exception 'template_versions_are_immutable';
end;
$$;

drop trigger if exists template_versions_immutable_update on public.template_versions;
create trigger template_versions_immutable_update
  before update on public.template_versions
  for each row execute function public.reject_template_version_mutation();

drop trigger if exists template_versions_immutable_delete on public.template_versions;
create trigger template_versions_immutable_delete
  before delete on public.template_versions
  for each row execute function public.reject_template_version_mutation();

alter table public.template_projects enable row level security;
alter table public.template_versions enable row level security;
alter table public.template_drafts enable row level security;
alter table public.template_assets enable row level security;
alter table public.template_version_assets enable row level security;

revoke all on public.template_projects from anon, authenticated;
revoke all on public.template_versions from anon, authenticated;
revoke all on public.template_drafts from anon, authenticated;
revoke all on public.template_assets from anon, authenticated;
revoke all on public.template_version_assets from anon, authenticated;
revoke execute on function public.save_template_version(uuid, text, text, text, integer, text, text, text, text, text, uuid, text, jsonb) from public, anon, authenticated;

grant select, insert, update on public.template_projects to service_role;
grant select, insert on public.template_versions to service_role;
grant select, insert, update, delete on public.template_drafts to service_role;
grant select, insert on public.template_assets to service_role;
grant select, insert on public.template_version_assets to service_role;
grant execute on function public.save_template_version(uuid, text, text, text, integer, text, text, text, text, text, uuid, text, jsonb) to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'template-assets',
  'template-assets',
  false,
  20971520,
  array['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

comment on table public.template_projects is '라이브러리에 최신본 한 개만 표시하기 위한 템플릿 기본 정보';
comment on table public.template_versions is '명시적 저장마다 추가되는 수정 불가 버전 기록';
comment on table public.template_drafts is '버전 번호를 늘리지 않는 템플릿별 자동저장 임시본';
comment on table public.template_assets is '내용 해시로 중복 업로드를 막는 공용 이미지 자산';
