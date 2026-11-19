-- Guest submissions use the existing receipt sequence and admin review queue.
-- NULL represents a guest submission, while registered owners retain their FK.
-- Existing grants and RLS keep inserts and reads restricted to the service role.
alter table public.calendar_production_requests
  alter column owner_id drop not null;
