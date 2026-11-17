import test from 'node:test';
import assert from 'node:assert/strict';
import {createV2DraftTransport} from './server-transport.mjs';
const env={CALENDAR_V2_SUPABASE_URL:'https://test.supabase.co',CALENDAR_V2_SUPABASE_SERVICE_ROLE_KEY:'server-test-key'};
test('V2 transport rejects legacy resources, deletes and origin escapes before network access',async()=>{
 let calls=0;const request=createV2DraftTransport({env,fetchImpl:async()=>{calls++;return {ok:true,json:async()=>[]};}});
 for(const resource of ['template_versions','calendar_v2_migration_drafts/../template_versions','https://other.example','calendar_v2_migration_drafts?on_conflict=id'])await assert.rejects(request(resource));
 await assert.rejects(request('calendar_v2_migration_drafts',{method:'DELETE'}));assert.equal(calls,0);
 await request('calendar_v2_migration_drafts?select=*');assert.equal(calls,1);
});
test('legacy environment variables are not used as a fallback and credentials cannot be overridden',async()=>{
 assert.throws(()=>createV2DraftTransport({env:{SUPABASE_URL:env.CALENDAR_V2_SUPABASE_URL,SUPABASE_SERVICE_ROLE_KEY:'legacy'}}),/not configured/);
 let received;const request=createV2DraftTransport({env,fetchImpl:async(url,options)=>{received={url,options};return {ok:true,json:async()=>[]};}});
 await request('calendar_v2_migration_drafts',{headers:{Authorization:'attacker'}});
 assert.equal(received.options.headers.Authorization,'Bearer server-test-key');assert.equal(received.options.redirect,'error');
});
