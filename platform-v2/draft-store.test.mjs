import test from 'node:test';
import assert from 'node:assert/strict';
import {createMigrationDraftStore,DRAFT_RESOURCE} from './draft-store.mjs';
import {createMigrationCandidate} from './migration-candidate.mjs';
const id='11111111-1111-4111-8111-111111111111';
const candidate=()=>createMigrationCandidate({book:{pages:[{id:'page'}],elementsByPage:{page:[]}}},{sourceKind:'review-export',templateId:'t',versionId:'v'});
test('round-trip is isolated to V2 resource and stale editor cannot overwrite a newer draft',async()=>{
 let row=null;const paths=[];
 const store=createMigrationDraftStore({request:async(path,options)=>{
  paths.push(path);assert(path.startsWith(DRAFT_RESOURCE));
  if(options.method==='GET')return row?[structuredClone(row)]:[];
  const body=JSON.parse(options.body);
  if(options.method==='POST'){if(row)throw {status:409};row=body;return [structuredClone(row)];}
  const expected=Number(new URLSearchParams(path.split('?')[1]).get('revision').slice(3));
  if(row.revision!==expected)return [];
  row={...row,...body};return [structuredClone(row)];
 }});
 assert.equal(await store.load(id),null);
 await store.save({id,candidate:candidate(),expectedRevision:0});
 const reopened=await store.load(id);assert.equal(reopened.revision,1);
 reopened.candidate.plan.reviewNote='local edit';assert.equal(row.candidate.plan.reviewNote,undefined);
 await store.save({id,candidate:reopened.candidate,expectedRevision:1});
 await assert.rejects(store.save({id,candidate:candidate(),expectedRevision:1}),{code:'V2_DRAFT_CONFLICT'});
 assert.equal((await store.load(id)).revision,2);assert(paths.every(p=>!p.includes('template_versions')));
});
test('invalid IDs and modified source are rejected before storage access',async()=>{
 let calls=0;const store=createMigrationDraftStore({request:async()=>{calls++;return [];}});
 await assert.rejects(store.load('../legacy'));const c=candidate();c.legacySnapshot.book.pages=[];
 await assert.rejects(store.save({id,candidate:c,expectedRevision:0}),/changed/);assert.equal(calls,0);
});
