-- Retire the separate ImageMagick worker. Preserve all receipt/revision/assets/job records.
-- No table or row deletion, status mutation, or change to the existing PDF worker.
begin;
do $$
declare signature text;
begin
  foreach signature in array array[
    'public.enqueue_calendar_production_image_job(uuid,uuid,uuid,text,text,jsonb,uuid)',
    'public.claim_calendar_production_image_job(uuid)',
    'public.update_calendar_production_image_job(uuid,uuid,text,jsonb,jsonb,text)'
  ] loop
    if to_regprocedure(signature) is not null then
      execute 'revoke all on function ' || signature || ' from public, anon, authenticated, service_role';
    end if;
  end loop;
end $$;
commit;
