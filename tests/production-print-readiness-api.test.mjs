import test from 'node:test';import assert from 'node:assert/strict';import handler from '../api/production-print-readiness.js';
process.env.SUPABASE_URL='https://example.invalid';process.env.SUPABASE_SERVICE_ROLE_KEY='test-only';const old=fetch,id='11111111-1111-4111-a111-111111111111',revisionId='22222222-2222-4222-a222-222222222222';
function res(){return {setHeader(){},statusCode:200,end(value){this.body=JSON.parse(value);}};}
function setup(admin){const calls=[];globalThis.fetch=async url=>{calls.push(url);if(url.includes('/auth/v1/user'))return new Response(JSON.stringify({id}));if(url.includes('template_admins'))return new Response(JSON.stringify(admin?[{user_id:id}]:[]));if(url.includes('calendar_production_revisions'))return new Response('[]');throw Error(url);};return calls;}
const request=()=>({method:'GET',headers:{authorization:'Bearer test'},query:{requestId:id,revisionId}});
test('non-admin cannot inspect frozen correction content',async()=>{const calls=setup(false),response=res();await handler(request(),response);assert.equal(response.statusCode,403);assert.equal(calls.some(x=>x.includes('calendar_production_revisions')),false);});
test('revision lookup is scoped to its receipt and missing revisions do not fall back',async()=>{const calls=setup(true),response=res();await handler(request(),response);assert.equal(response.statusCode,404);const url=calls.find(x=>x.includes('calendar_production_revisions'));assert.ok(url.includes(`request_id=eq.${id}`));assert.ok(url.includes(`id=eq.${revisionId}`));});
test.after(()=>{globalThis.fetch=old;});
