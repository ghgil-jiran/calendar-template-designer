create extension if not exists supabase_vault cascade;

create or replace function public.set_ai_openai_api_key(p_secret text)
returns void
language plpgsql
security definer
set search_path = public, vault
as $$
declare
  v_secret_id uuid;
begin
  if p_secret is null or length(trim(p_secret)) < 20 or length(trim(p_secret)) > 500 or trim(p_secret) not like 'sk-%' then
    raise exception 'INVALID_OPENAI_API_KEY';
  end if;

  select id into v_secret_id
  from vault.secrets
  where name = 'ai_design_openai_api_key'
  limit 1;

  if v_secret_id is null then
    perform vault.create_secret(trim(p_secret), 'ai_design_openai_api_key', 'AI Design Editor OpenAI API key');
  else
    perform vault.update_secret(v_secret_id, trim(p_secret), 'ai_design_openai_api_key', 'AI Design Editor OpenAI API key');
  end if;
end;
$$;

create or replace function public.get_ai_openai_api_key()
returns text
language sql
security definer
set search_path = public, vault
as $$
  select decrypted_secret
  from vault.decrypted_secrets
  where name = 'ai_design_openai_api_key'
  limit 1
$$;

revoke all on function public.set_ai_openai_api_key(text) from public, anon, authenticated;
revoke all on function public.get_ai_openai_api_key() from public, anon, authenticated;
grant execute on function public.set_ai_openai_api_key(text) to service_role;
grant execute on function public.get_ai_openai_api_key() to service_role;
