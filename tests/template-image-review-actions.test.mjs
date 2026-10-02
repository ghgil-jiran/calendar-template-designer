import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../apps/designer-studio/template-library-runtime.js',import.meta.url),'utf8');
const handler=source.slice(source.indexOf(' let templateImageReviewBusy='),source.indexOf(' function renderAiImageInspection'));
function setup(save,history=async()=>{}){
 const snapshots=[],criteria=['identity','frameSuitability','effectiveResolution','placementIntegrity','visualArtifacts'].map(key=>({key,label:key,status:key==='identity'?'passed':'not_run',message:'before'}));
 const context=vm.createContext({preflightArtifact:{id:'job',status:'done'},preflightActiveGate:3,preflightReport:{aiImageInspection:{criteria,criteriaVersion:'template-image-print-quality.v2@0.1.0',inventorySignature:'1:2:3',imageCount:1,aiImageCount:0,images:[{id:'cover:photo'}]}},window:{ACDLTemplatePublishing:{recordTemplateImagePrintQualityReview:save}},normalizedArtifact:job=>job,loadPreflightHistory:history,renderCurrentPreflight:message=>snapshots.push(message),renderAiImageInspection:()=>snapshots.push('render'),showEditorToast:message=>snapshots.push(message)});
 vm.runInContext(handler,context);return {context,snapshots,record:context.recordAiImageCriterion};
}
test('manual verdict saves before automatic checks run, without turning those checks into passes',async()=>{
 let sent;const s=setup(async(id,payload)=>{sent=payload;return {id,status:'done'}});await s.record('placementIntegrity','passed');
 assert.equal(sent.criteria.find(c=>c.key==='placementIntegrity').status,'passed');assert.equal(sent.criteria.find(c=>c.key==='effectiveResolution').status,'review');assert.ok(s.snapshots.some(m=>m.includes('통과 기록을 저장')));
});
test('pending save prevents duplicate clicks and clears busy state on completion',async()=>{
 let release,calls=0;const s=setup(()=>{calls++;return new Promise(resolve=>release=resolve)});const first=s.record('placementIntegrity','passed');await s.record('visualArtifacts','failed');assert.equal(calls,1);assert.equal(vm.runInContext('templateImageReviewBusy',s.context),true);release({id:'job',status:'done'});await first;assert.equal(vm.runInContext('templateImageReviewBusy',s.context),false);
});
test('failed save leaves a visible error and permits retry',async()=>{
 const s=setup(async()=>{throw Error('network unavailable')});await s.record('visualArtifacts','failed');assert.ok(s.snapshots.some(m=>m.includes('저장 실패: network unavailable')));assert.equal(vm.runInContext('templateImageReviewBusy',s.context),false);
});
test('history reload failure is reported as saved, rather than a failed write',async()=>{
 const s=setup(async()=>({id:'job',status:'done'}),async()=>{throw Error('history unavailable')});await s.record('visualArtifacts','failed');assert.ok(s.snapshots.some(m=>m.includes('저장은 완료됐지만')));assert.ok(!s.snapshots.some(m=>m.startsWith('저장 실패')));
});
test('inspection UI shows persistent feedback and disables buttons while saving',()=>{
 assert.match(source,/id="templateImageReviewFeedback" role="status" aria-live="polite"/);assert.match(source,/templateImageReviewBusy\?'disabled'/);assert.doesNotMatch(handler,/automatic\.some/);
});
