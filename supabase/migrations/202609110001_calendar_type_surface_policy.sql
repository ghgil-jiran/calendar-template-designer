alter table public.calendar_type_capabilities
  add column if not exists cover_back_mode text not null default 'separate',
  add column if not exists back_cover_back_policy text not null default 'optional';

alter table public.calendar_type_capabilities
  drop constraint if exists calendar_type_capabilities_cover_back_mode_check;

alter table public.calendar_type_capabilities
  add constraint calendar_type_capabilities_cover_back_mode_check
  check (cover_back_mode in ('shared-month-back', 'separate'));

alter table public.calendar_type_capabilities
  drop constraint if exists calendar_type_capabilities_back_cover_back_policy_check;

alter table public.calendar_type_capabilities
  add constraint calendar_type_capabilities_back_cover_back_policy_check
  check (back_cover_back_policy in ('required', 'optional', 'unsupported'));

update public.calendar_type_capabilities
set cover_back_mode = 'shared-month-back',
    back_cover_back_policy = 'optional'
where calendar_type_id like 'desk-%';
