-- Read-only verification after applying the single V2 migration.
select c.relname as table_name, c.relrowsecurity as rls_enabled,
  has_table_privilege('anon', c.oid, 'SELECT') as anon_can_select,
  has_table_privilege('authenticated', c.oid, 'SELECT') as user_can_select,
  has_table_privilege('service_role', c.oid, 'SELECT') as server_can_select,
  has_table_privilege('service_role', c.oid, 'INSERT') as server_can_insert,
  has_table_privilege('service_role', c.oid, 'UPDATE') as server_can_update,
  has_table_privilege('service_role', c.oid, 'DELETE') as server_can_delete
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname = 'calendar_v2_migration_drafts';

select tgname, tgenabled from pg_trigger
where tgrelid = to_regclass('public.calendar_v2_migration_drafts') and not tgisinternal;
