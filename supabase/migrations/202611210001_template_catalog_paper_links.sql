alter table public.template_projects
  add column if not exists visible_in_customer_catalog boolean not null default true;

create table if not exists public.template_paper_links (
  a3_id uuid primary key references public.template_projects(id) on delete cascade,
  a2_id uuid unique not null references public.template_projects(id) on delete cascade,
  representative_id uuid not null,
  check (a3_id <> a2_id),
  check (representative_id in (a3_id, a2_id))
);
alter table public.template_paper_links enable row level security;
revoke all on public.template_paper_links from anon, authenticated;
grant select on public.template_paper_links to service_role;

create or replace function public.save_template_catalog_paper_link(
  p_id uuid, p_other uuid, p_visible boolean
) returns void language plpgsql set search_path = public as $$
declare
  owner_size jsonb;
  other_size jsonb;
  owner_pages integer;
  other_pages integer;
  owner_duplex boolean;
  other_duplex boolean;
  existing public.template_paper_links;
begin
  perform pg_advisory_xact_lock(hashtext('template_paper_links'));
  select v.project_data#>'{productType,pageSize}',
    jsonb_array_length(v.project_data#>'{book,pageInstances}'),
    (v.project_data#>>'{productType,duplex}')::boolean
  into owner_size, owner_pages, owner_duplex
  from template_projects p join template_versions v on v.id=p.latest_version_id
  where p.id=p_id and v.project_data#>>'{productType,category}'='poster';

  if owner_size is null or p_visible is null then raise exception 'invalid_wall_template'; end if;
  select * into existing from template_paper_links where p_id in (a3_id,a2_id);

  if existing.a3_id is not null then
    if p_other is distinct from (case when p_id=existing.a3_id then existing.a2_id else existing.a3_id end) then
      raise exception 'template_already_linked';
    end if;
    update template_paper_links set representative_id=case when p_visible then p_id else p_other end
      where a3_id=existing.a3_id;
    return;
  end if;

  if p_other is null then
    update template_projects set visible_in_customer_catalog=p_visible where id=p_id;
    return;
  end if;

  select v.project_data#>'{productType,pageSize}',
    jsonb_array_length(v.project_data#>'{book,pageInstances}'),
    (v.project_data#>>'{productType,duplex}')::boolean
  into other_size, other_pages, other_duplex
  from template_projects p join template_versions v on v.id=p.latest_version_id
  where p.id=p_other and v.project_data#>>'{productType,category}'='poster';

  if not coalesce(
    owner_pages=other_pages and owner_duplex is not distinct from other_duplex
    and (owner_size @> '{"width":297,"height":420}' and other_size @> '{"width":420,"height":594}'
      or owner_size @> '{"width":420,"height":594}' and other_size @> '{"width":297,"height":420}'), false
  ) then raise exception 'incompatible_wall_templates'; end if;
  if exists(select 1 from template_paper_links where p_other in (a3_id,a2_id)) then
    raise exception 'template_already_linked';
  end if;
  if owner_size @> '{"width":297,"height":420}' then
    insert into template_paper_links values(p_id,p_other,case when p_visible then p_id else p_other end);
  else
    insert into template_paper_links values(p_other,p_id,case when p_visible then p_id else p_other end);
  end if;
end;
$$;
revoke execute on function public.save_template_catalog_paper_link(uuid,uuid,boolean) from public, anon, authenticated;
grant execute on function public.save_template_catalog_paper_link(uuid,uuid,boolean) to service_role;
