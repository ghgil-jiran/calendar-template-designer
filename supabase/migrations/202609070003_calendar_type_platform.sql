create table if not exists public.calendar_product_families (
  id text primary key,
  name text not null,
  status text not null default 'active' check (status in ('active','preparing','discontinued')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.calendar_type_definitions (
  id text primary key,
  product_family_id text not null references public.calendar_product_families(id),
  name text not null,
  summary text not null default '',
  representative_image text,
  orientation text not null check (orientation in ('landscape','portrait')),
  print_sides text not null check (print_sides in ('simplex','duplex')),
  binding_policy jsonb not null default '{}'::jsonb,
  status text not null default 'preparing' check (status in ('active','preparing','discontinued')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.calendar_type_sizes (
  calendar_type_id text not null references public.calendar_type_definitions(id) on delete cascade,
  id text not null,
  label text not null,
  finished_width_mm numeric(8,2) not null check (finished_width_mm > 0),
  finished_height_mm numeric(8,2) not null check (finished_height_mm > 0),
  production_width_mm numeric(8,2) not null check (production_width_mm >= finished_width_mm),
  production_height_mm numeric(8,2) not null check (production_height_mm >= finished_height_mm),
  is_primary boolean not null default false,
  primary key (calendar_type_id,id)
);

create unique index if not exists calendar_type_one_primary_size on public.calendar_type_sizes(calendar_type_id) where is_primary;

create table if not exists public.calendar_type_capabilities (
  calendar_type_id text primary key references public.calendar_type_definitions(id) on delete cascade,
  cover_policy text not null check (cover_policy in ('required','optional','unsupported')),
  back_cover_policy text not null check (back_cover_policy in ('required','optional','unsupported')),
  monthly_front_policy text not null check (monthly_front_policy in ('required','optional','unsupported')),
  monthly_back_policy text not null check (monthly_back_policy in ('required','optional','unsupported')),
  annual_single_policy text not null check (annual_single_policy in ('required','optional','unsupported')),
  front_insert_min integer not null default 0 check (front_insert_min >= 0),
  front_insert_max integer not null default 0 check (front_insert_max >= front_insert_min),
  rear_insert_min integer not null default 0 check (rear_insert_min >= 0),
  rear_insert_max integer not null default 0 check (rear_insert_max >= rear_insert_min),
  allowed_month_counts integer[] not null default array[12],
  allowed_start_months integer[] not null default array[1]
);

create table if not exists public.calendar_type_page_rules (
  id bigint generated always as identity primary key,
  calendar_type_id text not null references public.calendar_type_definitions(id) on delete cascade,
  page_role text not null,
  rule_kind text not null check (rule_kind in ('required','optional','repeat')),
  min_count integer not null default 0 check (min_count >= 0),
  max_count integer not null default 0 check (max_count >= min_count),
  repeat_by text,
  sort_order integer not null default 0
);

alter table public.calendar_product_families enable row level security;
alter table public.calendar_type_definitions enable row level security;
alter table public.calendar_type_sizes enable row level security;
alter table public.calendar_type_capabilities enable row level security;
alter table public.calendar_type_page_rules enable row level security;

revoke all on public.calendar_product_families, public.calendar_type_definitions, public.calendar_type_sizes, public.calendar_type_capabilities, public.calendar_type_page_rules from anon, authenticated;
grant select, insert, update, delete on public.calendar_product_families, public.calendar_type_definitions, public.calendar_type_sizes, public.calendar_type_capabilities, public.calendar_type_page_rules to service_role;
grant usage, select on sequence public.calendar_type_page_rules_id_seq to service_role;

insert into public.calendar_product_families(id,name,status,sort_order) values
 ('desk','탁상달력','active',10),('single-sheet','한 장 달력','active',20),('wall','벽걸이형','active',30)
on conflict(id) do update set name=excluded.name,status=excluded.status,sort_order=excluded.sort_order,updated_at=now();

insert into public.calendar_type_definitions(id,product_family_id,name,summary,orientation,print_sides,binding_policy,status,sort_order) values
 ('desk-standard','desk','스탠다드','기존 실제 제작 템플릿의 호환 기준 유형','landscape','duplex','{"edge":"top","method":"wire-o","turning":"flip"}','active',10),
 ('desk-large','desk','라지','','landscape','duplex','{"edge":"top","method":"wire-o","turning":"flip"}','preparing',20),
 ('desk-portrait','desk','세로형','','portrait','duplex','{"edge":"top","method":"wire-o","turning":"flip"}','preparing',30),
 ('desk-wide','desk','와이드형','','landscape','duplex','{"edge":"top","method":"wire-o","turning":"flip"}','preparing',40),
 ('poster-standard','single-sheet','포스터형','한 장에 연간 달력을 구성','portrait','simplex','{"edge":"none","method":"none","turning":"none"}','active',50),
 ('wall-standard','wall','스탠다드','커버 1p · 내지 12개월 12p · 연간 소달력 1p · 페이지 추가 가능 · 양면 · 상단 제본','portrait','duplex','{"edge":"top","method":"wire-o","turning":"flip"}','active',60),
 ('wall-large','wall','라지','커버 1p · 내지 12개월 12p · 연간 소달력 1p · 페이지 추가 가능 · 양면 · 상단 제본','portrait','duplex','{"edge":"top","method":"wire-o","turning":"flip"}','active',70),
 ('wall-large-plus','wall','라지 플러스','커버 1p · 내지 12개월 12p · 연간 소달력 1p · 페이지 추가 가능 · 양면 · 상단 제본','portrait','duplex','{"edge":"top","method":"wire-o","turning":"flip"}','active',80)
on conflict(id) do update set product_family_id=excluded.product_family_id,name=excluded.name,summary=excluded.summary,orientation=excluded.orientation,print_sides=excluded.print_sides,binding_policy=excluded.binding_policy,status=excluded.status,sort_order=excluded.sort_order,updated_at=now();

insert into public.calendar_type_sizes(calendar_type_id,id,label,finished_width_mm,finished_height_mm,production_width_mm,production_height_mm,is_primary) values
 ('desk-standard','desk-standard-primary','스탠다드',260,180,266,186,true),('desk-large','desk-large-primary','라지',297,210,303,216,true),('desk-portrait','desk-portrait-primary','세로형',180,260,186,266,true),('desk-wide','desk-wide-primary','와이드형',297,148,303,154,true),('poster-standard','poster-standard-primary','포스터형',420,594,426,600,true),('wall-standard','wall-standard-primary','스탠다드',299,419,305,425,true),('wall-large','wall-large-primary','라지',388,544,394,550,true),('wall-large-plus','wall-large-plus-primary','라지 플러스',501,700,507,706,true)
on conflict(calendar_type_id,id) do update set label=excluded.label,finished_width_mm=excluded.finished_width_mm,finished_height_mm=excluded.finished_height_mm,production_width_mm=excluded.production_width_mm,production_height_mm=excluded.production_height_mm,is_primary=excluded.is_primary;

insert into public.calendar_type_capabilities(calendar_type_id,cover_policy,back_cover_policy,monthly_front_policy,monthly_back_policy,annual_single_policy,front_insert_min,front_insert_max,rear_insert_min,rear_insert_max,allowed_month_counts,allowed_start_months) values
 ('desk-standard','required','required','required','required','optional',0,3,0,3,array[12,13,14],array[1,3]),('desk-large','required','required','required','required','optional',0,3,0,3,array[12,13,14],array[1,3]),('desk-portrait','required','required','required','required','optional',0,3,0,3,array[12,13,14],array[1,3]),('desk-wide','required','required','required','required','optional',0,3,0,3,array[12,13,14],array[1,3]),('poster-standard','unsupported','unsupported','unsupported','unsupported','required',0,0,0,0,array[12],array[1,3]),('wall-standard','required','unsupported','required','required','required',0,3,0,0,array[12],array[1,3]),('wall-large','required','unsupported','required','required','required',0,3,0,0,array[12],array[1,3]),('wall-large-plus','required','unsupported','required','required','required',0,3,0,0,array[12],array[1,3])
on conflict(calendar_type_id) do update set cover_policy=excluded.cover_policy,back_cover_policy=excluded.back_cover_policy,monthly_front_policy=excluded.monthly_front_policy,monthly_back_policy=excluded.monthly_back_policy,annual_single_policy=excluded.annual_single_policy,front_insert_min=excluded.front_insert_min,front_insert_max=excluded.front_insert_max,rear_insert_min=excluded.rear_insert_min,rear_insert_max=excluded.rear_insert_max,allowed_month_counts=excluded.allowed_month_counts,allowed_start_months=excluded.allowed_start_months;

delete from public.calendar_type_page_rules where calendar_type_id in ('desk-standard','desk-large','desk-portrait','desk-wide','poster-standard','wall-standard','wall-large','wall-large-plus');
insert into public.calendar_type_page_rules(calendar_type_id,page_role,rule_kind,min_count,max_count,repeat_by,sort_order)
select type_id,page_role,rule_kind,min_count,max_count,repeat_by,sort_order from (values
 ('desk-standard','cover','required',1,1,null,10),('desk-standard','annual','optional',0,1,null,20),('desk-standard','school-symbols','optional',0,1,null,30),('desk-standard','monthly-front','repeat',12,14,'month',40),('desk-standard','monthly-back','repeat',12,14,'month',50),('desk-standard','back-cover','required',1,1,null,60),
 ('poster-standard','annual','required',1,1,null,10),
 ('wall-standard','cover','required',1,1,null,10),('wall-standard','monthly-front','repeat',12,12,'month',20),('wall-standard','annual','required',1,1,null,30),
 ('wall-large','cover','required',1,1,null,10),('wall-large','monthly-front','repeat',12,12,'month',20),('wall-large','annual','required',1,1,null,30),
 ('wall-large-plus','cover','required',1,1,null,10),('wall-large-plus','monthly-front','repeat',12,12,'month',20),('wall-large-plus','annual','required',1,1,null,30)
) as seed(type_id,page_role,rule_kind,min_count,max_count,repeat_by,sort_order);

-- 기존 template_projects/project_data는 갱신하지 않는다. 기존 템플릿 호환은 읽기 시 desk-standard 스냅샷을 보완한다.
