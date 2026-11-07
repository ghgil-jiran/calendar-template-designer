create table if not exists public.template_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null default 'master_admin' check (role = 'master_admin'),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists template_admins_email_idx on public.template_admins (lower(email));

alter table public.template_admins enable row level security;
revoke all on public.template_admins from public, anon, authenticated;
grant select, insert, update, delete on public.template_admins to service_role;

comment on table public.template_admins is '템플릿 에디터에 로그인할 수 있는 Master Admin 계정 목록';

-- Supabase Authentication > Users에서 이메일 계정을 먼저 만든 다음 아래 형식으로 등록한다.
-- insert into public.template_admins (user_id, email)
-- select id, email from auth.users where lower(email) = lower('master@example.com');
