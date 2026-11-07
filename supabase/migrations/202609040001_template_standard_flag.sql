alter table public.template_projects
  add column if not exists is_standard boolean not null default false;

create index if not exists template_projects_standard_idx
  on public.template_projects (is_standard, state, updated_at desc);

comment on column public.template_projects.is_standard is
  'Independent reference-template flag. Publishing state remains in state.';
