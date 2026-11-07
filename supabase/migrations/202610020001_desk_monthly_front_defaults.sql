-- Add kind defaults only. No saved template/project coordinates are modified.
begin;
do $$
begin
  if not exists (select 1 from information_schema.columns where table_schema = 'public'
    and table_name = 'calendar_type_sizes' and column_name = 'monthly_front_defaults') then
    alter table public.calendar_type_sizes add column monthly_front_defaults jsonb;

update public.calendar_type_sizes as sizes
set monthly_front_defaults = jsonb_build_object(
  'schemaVersion', 'monthly-front-defaults.v1',
  'gridFrameMm', jsonb_build_object('x', defaults.x, 'y', defaults.y, 'width', defaults.width, 'height', defaults.height),
  'weekdayHeightMm', 7, 'weekdayGapMm', 0)
from (values
  ('desk-standard', 260, 180, 13, 45, 234, 120),
  ('desk-large', 297, 210, 15, 52, 267, 143),
  ('desk-wide', 297, 148, 15, 40, 267, 95),
  ('desk-portrait', 180, 260, 12, 67, 156, 174)
) as defaults(type_id, page_width, page_height, x, y, width, height)
where sizes.calendar_type_id = defaults.type_id and sizes.is_primary
  and sizes.finished_width_mm = defaults.page_width and sizes.finished_height_mm = defaults.page_height
  and sizes.monthly_front_defaults is null;

  end if;
end;
$$;
comment on column public.calendar_type_sizes.monthly_front_defaults is
  'monthly-front-defaults.v1: gridFrameMm relative to trim page, weekdayHeightMm, weekdayGapMm; new templates only';
notify pgrst, 'reload schema';
commit;

select calendar_type_id, finished_width_mm, finished_height_mm, monthly_front_defaults
from public.calendar_type_sizes
where calendar_type_id in ('desk-standard','desk-large','desk-wide','desk-portrait') and is_primary;
