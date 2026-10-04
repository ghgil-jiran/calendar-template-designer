import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {freezeProductionPackage,requestProductionJob,publicProductionJob,checkRenderAccess,productionIdentity} from '../server/production-print-package.js';
import {sealProductionDocument} from '../server/production-corrections.js';
const sha=value=>createHash('sha256').update(value).digest('hex');
const requestId='11111111-1111-4111-a111-111111111111',revisionId='22222222-2222-4222-a222-222222222222',assetId='33333333-3333-4333-a333-333333333333',owner='44444444-4444-4444-a444-444444444444';
const png=Buffer.alloc(24);Buffer.from([137,80,78,71,13,10,26,10]).copy(png);png.write('IHDR',12);png.writeUInt32BE(1200,16);png.writeUInt32BE(900,20);
function fixture(){
 const project={format:'acdl-project',template:{publishing:{},masters:{calendar:{}},masterElements:{},metadata:{}},productType:{pageSize:{width:260,height:180}},book:{pageInstances:[{id:'p1'}],elementsByPage:{p1:[{id:'photo',src:`production-asset://${assetId}`}]}},settings:{},productionCorrection:{schemaVersion:'production-editor.v1',requestId}};
 const document={template:{pages:[{id:'p1',objects:[]}]},editorProject:project};const revision={id:revisionId,revision_number:5,document,document_hash:sealProductionDocument(document)};
 const receipt={id:requestId,owner_id:owner,school_name:'테스트 학교',snapshot:{doc:{meta:{templateId:'desk-test',templateVersion:'1.0.0'}},assets:[{id:assetId,path:`${owner}/${requestId}/${assetId}`,byteSize:png.length,mimeType:'image/png'}]}};
 const bundle={schemaVersion:'template-package-bundle.v1',manifest:{templateId:'desk-test',version:'1.0.0',schemaVersion:'template-package.v1',productType:'desk',compatibility:{runtime:'1.x',datasetSchema:'1.x',templateSchema:'2.x'}},template:{kind:'designer-project-snapshot',projectData:project},print:{nativeCompilation:{status:'ready'}},parity:{status:'passed'},bindings:{templateVersion:'1.0.0'},publishing:{},assets:[]};
 return {receipt,revision,bundle};
}
function database(f,{missingAsset=false,publicBucket=false}={}){
 const original=JSON.stringify(f.bundle),objects=new Map(),packages=[],jobs=[],calls=[];
 globalThis.fetch=async(url,options={})=>{
  const method=options.method||'GET',body=options.body;calls.push({url,method});
  if(url.includes('/rest/v1/template_packages')){
   if(method==='POST'){const row=JSON.parse(body);packages.push(row);return Response.json([row]);}
   if(url.includes('eq.production-'))return Response.json(packages);
   return Response.json([{package_storage_path:'desk-test/1.0.0/review/package.json',package_sha256:sha(original)}]);
  }
  if(url.includes('/rest/v1/template_print_preflight_jobs')){
   if(method==='POST'){const row={...JSON.parse(body),status:'queued'};jobs.unshift(row);return Response.json([row]);}
   return Response.json(jobs);
  }
  if(url.endsWith('/bucket/template-packages'))return Response.json({public:publicBucket});
  if(url.includes('/object/template-packages/desk-test/'))return new Response(original);
  if(url.includes('/object/calendar-production-assets/'))return missingAsset?new Response('missing',{status:404}):new Response(png);
  if(url.includes('/object/info/authenticated/print-pdfs/'))return Response.json({size:100});
  if(url.includes('/object/template-packages/production-')){if(method==='POST'){objects.set(url,Buffer.from(body));return Response.json({});}return objects.has(url)?new Response(objects.get(url)):new Response('missing',{status:404});}
  throw Error(url);
 };
 return {objects,packages,jobs,calls};
}
const oldFetch=globalThis.fetch;process.env.SUPABASE_URL='https://example.invalid';process.env.SUPABASE_SERVICE_ROLE_KEY='test-only';
test('freeze uses saved project and exact stored bytes, creates private draft, and preserves receipt/revision',async()=>{
 const f=fixture(),before=structuredClone(f),db=database(f),row=await freezeProductionPackage(f.receipt,f.revision);
 assert.equal(row.status,'draft');assert.equal(row.template_id,`production-${revisionId}`);assert.equal(row.publishing_contract.lifecycle.userServiceVisible,false);
 const bytes=db.objects.get(`https://example.invalid/storage/v1/object/template-packages/${row.package_storage_path}`),bundle=JSON.parse(bytes);
 assert.equal(sha(bytes),row.package_sha256);assert.equal(bundle.template.projectData.productionCorrection.savedRevisionId,revisionId);assert.ok(bundle.template.projectData.book.elementsByPage.p1[0].src.startsWith('package-asset://'));
 assert.equal(bundle.assets[0].sha256,sha(png));assert.equal(bundle.parity.status,'pending');assert.equal(bundle.print.nativeCompilation,undefined);assert.deepEqual(f,before);
 const count=db.calls.filter(call=>call.method==='POST').length;await freezeProductionPackage(f.receipt,f.revision);assert.equal(db.calls.filter(call=>call.method==='POST').length,count);
});
test('unreadable originals and public package bucket cannot create printable jobs',async()=>{
 for(const config of [{missingAsset:true},{publicBucket:true}]){const f=fixture(),db=database(f,config);await assert.rejects(()=>requestProductionJob(f.receipt,f.revision,owner,'https://editor.invalid'));assert.equal(db.jobs.length,0);assert.equal(db.packages.length,0);}
});
test('same version reuses active/completed jobs, force preserves history and cannot interrupt active work',async()=>{
 const f=fixture(),db=database(f),first=await requestProductionJob(f.receipt,f.revision,owner,'https://editor.invalid');
 assert.equal(first.payload.kind,'template-print-preflight');assert.equal(first.payload.rendererId,'template-editor-review-dom.v1');assert.deepEqual(first.payload.production,productionIdentity(requestId,f.revision));
 assert.equal((await requestProductionJob(f.receipt,f.revision,owner,'https://editor.invalid',{force:true})).id,first.id);assert.equal(db.jobs.length,1);
 Object.assign(db.jobs[0],{status:'done',report:{verified:true,pipelineVersion:productionIdentity(requestId,f.revision).pipelineVersion,production:productionIdentity(requestId,f.revision)},file_path:'template-preflight/test.pdf'});Object.assign(first,db.jobs[0]);assert.equal((await requestProductionJob(f.receipt,f.revision,owner,'https://editor.invalid')).id,first.id);
 const second=await requestProductionJob(f.receipt,f.revision,owner,'https://editor.invalid',{force:true});assert.notEqual(first.id,second.id);assert.equal(db.jobs.length,2);assert.equal(first.status,'done');
});
test('production render requires Worker token; public job response excludes token and storage path',()=>{
 const token='a'.repeat(64),job={id:revisionId,package_storage_path:'private',payload:{production:{revisionId},renderAccessToken:token}};
 assert.throws(()=>checkRenderAccess(job,undefined),{statusCode:401});assert.throws(()=>checkRenderAccess(job,'b'.repeat(64)),{statusCode:401});checkRenderAccess(job,token);checkRenderAccess({payload:{}},undefined);
 const value=JSON.stringify(publicProductionJob(job));assert.ok(!value.includes(token));assert.ok(!value.includes('private'));
});
test.after(()=>{globalThis.fetch=oldFetch;});
