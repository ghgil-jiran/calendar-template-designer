import test from 'node:test';
import assert from 'node:assert/strict';
import {createMigrationCandidate,assertCandidateUnchanged,assertExecutableDocument} from './migration-candidate.mjs';
const provenance={sourceKind:'saved-project',templateId:'template-a',versionId:'version-3'};
const document=()=>({format:'acdl-project',book:{pageInstances:[{id:'march',role:'monthly-back',masterId:'back',calendarMonth:3},{id:'april',role:'monthly-back',masterId:'back',calendarMonth:4}],elementsByPage:{march:[{id:'photo',type:'image-frame',x:3,image:{binding:'monthlyImages.3'},style:{fill:'#f00'},unknownOption:{keep:true}}],april:[{id:'photo',type:'image-frame',x:7,image:{binding:'monthlyImages.4'},style:{fill:'#0f0'}}]}},template:{masterElements:{back:[{id:'mark',type:'shape',role:'background-decoration'}]},masters:{calendar:{unknownRule:true}}}});
test('source, monthly distinctions and unknown fields survive without mutation or style inference',()=>{
 const source=document(),before=structuredClone(source),result=createMigrationCandidate(source,provenance);
 assert.deepEqual(source,before);assert.deepEqual(result.legacySnapshot,before);assertCandidateUnchanged(result);
 assert.equal(result.plan.pages[0].objects[0].explicitBinding,'monthlyImages.3');
 assert.equal(result.plan.pages[1].objects[0].explicitBinding,'monthlyImages.4');
 assert.equal(result.plan.pages[0].composition.styleBundleId,null);
 assert.equal(result.plan.masters[0].objects[0].disposition,'separate-background');
 source.book.elementsByPage.march[0].x=99;assert.equal(result.legacySnapshot.book.elementsByPage.march[0].x,3);
});
test('diagnostic exports remain blocked, and cannot masquerade as saved projects',()=>{
 const source=document();delete source.format;
 assert.throws(()=>createMigrationCandidate(source,provenance),/saved project/);
 const candidate=createMigrationCandidate(source,{...provenance,sourceKind:'review-export'});
 assert.equal(candidate.publishable,false);assert.throws(()=>assertExecutableDocument(candidate),/cannot/);
 assert(candidate.plan.issues.some(i=>i.code==='diagnostic-source-not-publishable'));
});
test('tampering and unpinned versions fail; unknown types are explicit unresolved issues',()=>{
 assert.throws(()=>createMigrationCandidate(document(),{}));
 const source=document();source.book.elementsByPage.march.push({id:'custom',type:'future-widget'});
 const result=createMigrationCandidate(source,provenance);assert.equal(result.plan.summary.unmapped,1);
 result.legacySnapshot.book.elementsByPage.march[0].unknownOption.keep=false;
 assert.throws(()=>assertCandidateUnchanged(result),/changed/);
});
test('source identity survives jsonb-style object key reordering while array order remains significant',()=>{
 const result=createMigrationCandidate(document(),provenance);
 const reorder=value=>Array.isArray(value)?value.map(reorder):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).reverse().map(k=>[k,reorder(value[k])])):value;
 result.legacySnapshot=reorder(result.legacySnapshot);assertCandidateUnchanged(result);
 result.legacySnapshot.book.pageInstances.reverse();assert.throws(()=>assertCandidateUnchanged(result),/changed/);
});
