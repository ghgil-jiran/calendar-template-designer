create table if not exists public.template_catalog_deletions (
  stable_key text primary key,
  deleted_at timestamptz not null default now()
);

alter table public.template_catalog_deletions enable row level security;
revoke all on public.template_catalog_deletions from anon, authenticated;
grant select, insert, update, delete on public.template_catalog_deletions to service_role;

create or replace function public.reject_template_version_mutation()
returns trigger language plpgsql as $$
begin
  if current_setting('app.permanent_template_delete', true) = 'on' then
    return old;
  end if;
  raise exception 'template_versions_are_immutable';
end;
$$;

create or replace function public.delete_template_permanently(
  p_template_id uuid,
  p_stable_key text,
  p_hide_catalog boolean default false
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_project public.template_projects;
  v_asset_ids uuid[] := array[]::uuid[];
  v_orphan_assets jsonb := '[]'::jsonb;
begin
  if nullif(trim(p_stable_key), '') is null then raise exception 'invalid_stable_key'; end if;

  if p_template_id is not null then
    select * into v_project from public.template_projects where id = p_template_id for update;
    if not found then raise exception 'template_not_found'; end if;
    if v_project.stable_key <> p_stable_key then raise exception 'template_stable_key_mismatch'; end if;

    select coalesce(array_agg(distinct tva.asset_id), array[]::uuid[]) into v_asset_ids
      from public.template_version_assets tva
      join public.template_versions tv on tv.id = tva.version_id
      where tv.template_id = p_template_id;

    update public.template_projects set latest_version_id = null where id = p_template_id;
    delete from public.template_drafts where template_id = p_template_id;
    perform set_config('app.permanent_template_delete', 'on', true);
    delete from public.template_versions where template_id = p_template_id;
    delete from public.template_projects where id = p_template_id;
  elsif not p_hide_catalog then
    raise exception 'template_id_required';
  end if;

  if p_hide_catalog then
    insert into public.template_catalog_deletions(stable_key, deleted_at)
      values (p_stable_key, now())
      on conflict (stable_key) do update set deleted_at = excluded.deleted_at;
  end if;

  select coalesce(jsonb_agg(to_jsonb(asset)), '[]'::jsonb) into v_orphan_assets
    from public.template_assets asset
    where asset.id = any(v_asset_ids)
      and not exists (select 1 from public.template_version_assets link where link.asset_id = asset.id);

  delete from public.template_assets asset
    where asset.id = any(v_asset_ids)
      and not exists (select 1 from public.template_version_assets link where link.asset_id = asset.id);

  return jsonb_build_object(
    'templateDeleted', p_template_id is not null,
    'catalogHidden', p_hide_catalog,
    'orphanAssets', v_orphan_assets
  );
end;
$$;

revoke execute on function public.delete_template_permanently(uuid, text, boolean) from public, anon, authenticated;
grant execute on function public.delete_template_permanently(uuid, text, boolean) to service_role;
