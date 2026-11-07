import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { hasOpenAIKey, readOpenAIKey, storeOpenAIKey } from '../server/ai-secret-store.js';

test('OpenAI API key is written and read only through protected Supabase Vault RPCs', async () => {
  const previous={url:process.env.SUPABASE_URL,key:process.env.SUPABASE_SERVICE_ROLE_KEY,fetch:globalThis.fetch};
  process.env.SUPABASE_URL='https://project.supabase.co';process.env.SUPABASE_SERVICE_ROLE_KEY='service-role-test';
  const calls=[];
  globalThis.fetch=async(url,options)=>{calls.push({url,options});return {ok:true,text:async()=>url.endsWith('get_ai_openai_api_key')?'"sk-test-secret-value-123456"':''}};
  try {
    await storeOpenAIKey('sk-test-secret-value-123456');
    assert.equal(await readOpenAIKey(),'sk-test-secret-value-123456');
    assert.equal(await hasOpenAIKey(),true);
    assert.match(calls[0].url,/\/rpc\/set_ai_openai_api_key$/);
    assert.equal(calls[0].options.headers.Authorization,'Bearer service-role-test');
    assert.deepEqual(JSON.parse(calls[0].options.body),{p_secret:'sk-test-secret-value-123456'});
  } finally {
    globalThis.fetch=previous.fetch;
    previous.url===undefined?delete process.env.SUPABASE_URL:process.env.SUPABASE_URL=previous.url;
    previous.key===undefined?delete process.env.SUPABASE_SERVICE_ROLE_KEY:process.env.SUPABASE_SERVICE_ROLE_KEY=previous.key;
  }
});

test('Vault migration limits secret functions to service_role', () => {
  const sql=fs.readFileSync(new URL('../supabase/migrations/202609050001_ai_design_openai_vault.sql',import.meta.url),'utf8');
  assert.match(sql,/supabase_vault/i);
  assert.match(sql,/vault\.create_secret/);
  assert.match(sql,/vault\.update_secret/);
  assert.match(sql,/revoke all on function public\.get_ai_openai_api_key\(\) from public, anon, authenticated/i);
  assert.match(sql,/grant execute on function public\.get_ai_openai_api_key\(\) to service_role/i);
});

test('secret store rejects invalid API keys before any network request', async () => {
  await assert.rejects(()=>storeOpenAIKey('not-a-key'),/올바른 OpenAI API 키/);
});
