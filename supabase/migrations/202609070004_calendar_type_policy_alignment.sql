-- 202609070003 적용 후 인쇄 모델과 맞춘 초기 허용값 보정.
-- 기존 template_projects, template_versions, template_assets는 변경하지 않는다.
update public.calendar_type_capabilities
set allowed_month_counts = array[12]
where calendar_type_id in ('desk-standard','desk-large','desk-portrait','desk-wide');

update public.calendar_type_capabilities
set monthly_back_policy = 'optional'
where calendar_type_id in ('wall-standard','wall-large','wall-large-plus');

update public.calendar_type_page_rules
set max_count = 12
where calendar_type_id = 'desk-standard'
  and page_role in ('monthly-front','monthly-back');
