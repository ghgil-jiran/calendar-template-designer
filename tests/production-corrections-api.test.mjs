import test from 'node:test';import assert from 'node:assert/strict';import handler from '../api/production-corrections.js';import {documentHash} from '../server/production-corrections.js';
process.env.SUPABASE_URL='https://example.invalid';process.env.SUPABASE_SERVICE_ROLE_KEY='test-only';const old=globalThis.fetch;
const id='11111111-1111-4111-a111-111111111111',revisionId='22222222-2222-4222-a222-222222222222';
function response(){return {statusCode:200,setHeader(){},status(c){this.statusCode=c;return this},json(b){this.body=b;return this},end(b){this.body=b?JSON.parse(b):null;return this}};}
function setup({admin=true,status='reviewing',revisions=[]}={}){const calls=[];globalThis.fetch=async(url,options={})=>{calls.push({url,options});if(url.includes('/auth/v1/user'))return new Response(JSON.stringify({id}));if(url.includes('template_admins'))return new Response(JSON.stringify(admin?[{user_id:id}]:[]));if(url.includes('calendar_production_requests'))return new Response(JSON.stringify([{id,status,snapshot:{document:{template:{pages:[]}},assets:[]}}]));if(url.includes('/calendar_production_revisions?'))return new Response(JSON.stringify(revisions));if(url.includes('/calendar_production_correction_assets?'))return new Response('[]');if(url.includes('/rpc/'))return new Response(JSON.stringify([{id:revisionId,revision_number:1}]));throw Error(url);};return calls;}
const req=()=>({method:'POST',headers:{authorization:'Bearer token'},body:{id:revisionId,requestId:id,baseRevisionId:null,patches:[],note:'첫 교정본'}});
test('non-admin cannot access correction snapshots',async()=>{const calls=setup({admin:false}),res=response();await handler(req(),res);assert.equal(res.statusCode,403);assert.equal(calls.length,2);});
test('stale version and approved receipt cannot create revisions',async()=>{setup({revisions:[{id:revisionId,document:{template:{pages:[]}}}]});let res=response();const request=req();request.body.id='33333333-3333-4333-a333-333333333333';await handler(request,res);assert.equal(res.statusCode,409);setup({status:'approved'});res=response();await handler(req(),res);assert.equal(res.statusCode,409);});
test('new correction uses server receipt data and leaves original receipt untouched',async()=>{const calls=setup(),res=response();await handler(req(),res);assert.equal(res.statusCode,201);const mutation=calls.find(c=>c.options.method==='POST');assert.ok(mutation.url.includes('/rpc/save_calendar_production_revision'));const body=JSON.parse(mutation.options.body);assert.deepEqual(body.p_document,{template:{pages:[]},productionIntegrity:{hashScheme:'sorted-json.v1'}});assert.equal(body.p_document_hash,documentHash(body.p_document));assert.equal(body.p_created_by,id);assert.equal(calls.some(c=>c.options.method==='PATCH'),false);});
test.after(()=>globalThis.fetch=old);

test('confirmation without editor freezes the exact receipt into a revision and never updates receipt',async()=>{
 const {createHash}=await import('node:crypto');const calls=setup(),mock=globalThis.fetch;
 const source={format:'acdl-project',settings:{year:2027,startMonth:3},productType:{category:'desk',pageSize:{width:260,height:180}},template:{masters:{calendar:{}},masterElements:{},resources:{}},book:{pageInstances:[{id:'p1',role:'cover-front'}],elementsByPage:{p1:[]},school:{},events:[],monthlyImages:{},monthlyQuotes:{},sheets:[]}};
 const document={template:{pages:[{id:'p1',role:'cover-front',size:{width:260,height:180},objects:[]}]},dataset:{school:{},calendar:{year:2027,events:[]},monthlyImages:{},monthlyQuotes:{}}};
 const snapshot={doc:{meta:{templateId:'test-template',templateVersion:'1.0.6'}},document,assets:[]};
 const bytes=JSON.stringify({manifest:{templateId:'test-template',version:'1.0.6'},template:{kind:'designer-project-snapshot',projectData:source},assets:[]});
 globalThis.fetch=async(url,options={})=>{
 if(url.includes('calendar_production_requests'))return new Response(JSON.stringify([{id,status:'reviewing',snapshot}]));
 if(url.includes('/template_packages?'))return new Response(JSON.stringify([{package_storage_path:'test-template/1.0.6/package.json',package_sha256:createHash('sha256').update(bytes).digest('hex')}]));
 if(url.includes('/storage/v1/object/template-packages/'))return new Response(bytes);
 return mock(url,options);
 };
 const request=req();request.body.action='confirmReceipt';request.body.note='접수본 확인 완료 · 수정 없음';const res=response();await handler(request,res);assert.equal(res.statusCode,201,JSON.stringify(res.body));
 const mutation=calls.find(c=>c.url.includes('/rpc/')),body=JSON.parse(mutation.options.body);
 assert.deepEqual(body.p_document.template,document.template);assert.equal(body.p_document_hash,documentHash(body.p_document));assert.equal(calls.some(c=>c.options.method==='PATCH'),false);
});
