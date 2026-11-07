import test from 'node:test';
import assert from 'node:assert/strict';
import '../apps/designer-studio/shared-screen-composition.js';
import '../apps/designer-studio/pdf-background-print-model.js';
import {resolvePdfBackgroundPrintSources} from '../server/pdf-background-print-source.js';
const model=globalThis.ACDLPdfBackgroundPrint;
function fixture(){
 const source={schemaVersion:'graphic-pdf-source.v1',documentId:'11111111-1111-4111-a111-111111111111',sha256:'a'.repeat(64),byteSize:10,pageNumber:1,widthPt:754.016,heightPt:527.244};
 const bg={id:'bg',type:'image',role:'graphic-package-background',x:-3/260*100,y:-3/180*100,width:266/260*100,height:186/180*100,zIndex:0,fit:'contain',graphicSource:{packageId:'22222222-2222-4222-a222-222222222222',pdfSource:source}};
 const project={productType:{pageSize:{width:260,height:180,unit:'mm'}},template:{masterElements:{m:[]}},book:{pageInstances:[{id:'p',masterId:'m'}],elementsByPage:{p:[bg,{id:'text',type:'text',zIndex:1}]}}};
 return {project,bg,source};
}
test('full bleed frames, master shadowing and hidden backgrounds follow common composition',()=>{
 const {project,bg}=fixture(),plan=model.projectPlans(project)[0];assert.equal(plan.layers.length,1);for(const [k,v] of Object.entries({x:0,y:0,width:266,height:186}))assert.ok(Math.abs(plan.layers[0].frameMm[k]-v)<1e-8);
 bg.visible=false;assert.equal(model.projectPlans(project)[0].layers.length,0);
 bg.visible=true;project.template.masterElements.m=[{...bg,id:'master-bg'}];project.book.elementsByPage.p[0].shadowOfMasterElementId='master-bg';assert.equal(model.projectPlans(project)[0].layers.length,1);
});
test('unsupported placement and invalid originals fail instead of printing previews',()=>{
 for(const mutate of [f=>f.bg.rotation=20,f=>f.bg.opacity=.5,f=>f.bg.zIndex=2,f=>f.bg.graphicSource.pdfSource.sha256='wrong',f=>f.bg.width=0]){const f=fixture();mutate(f);assert.throws(()=>model.projectPlans(f.project),/PDF_BACKGROUND/);}
});
test('signed original chunks are limited to the frozen source identity and verified manifest',async()=>{
 const f=fixture(),manifest={schemaVersion:'graphic-pdf-document.v1',id:f.source.documentId,packageId:f.bg.graphicSource.packageId,verifiedAt:'now',kind:'background',sha256:f.source.sha256,byteSize:10,chunkCount:1,pages:[{pageNumber:1,widthPt:f.source.widthPt,heightPt:f.source.heightPt}]};
 const deps={readJson:async path=>path.endsWith('manifest.json')?manifest:{index:0,byteSize:10,sha256:'b'.repeat(64)},sign:async path=>'https://example.invalid/'+path};
 const plans=await resolvePdfBackgroundPrintSources(f.project,deps);assert.equal(plans[0].layers[0].source.chunks.length,1);assert.ok(plans[0].layers[0].source.chunks[0].url.endsWith('chunk-0.bin'));
 manifest.sha256='c'.repeat(64);await assert.rejects(resolvePdfBackgroundPrintSources(f.project,deps),/SOURCE_MISMATCH/);
});
test('verification requires the exact source page, fit and frame for every page',()=>{
 const f=fixture(),p=model.projectPlans(f.project)[0],layer=p.layers[0];
 const check={status:'passed',evidence:{schemaVersion:model.version,required:1,embedded:1,pages:[{pageId:p.pageId,required:1,embedded:1,layers:[{elementId:layer.elementId,documentId:layer.source.documentId,sha256:layer.source.sha256,pageNumber:1,frameMm:layer.frameMm,fit:layer.fit,vectorEmbedding:true}]}]}};
 assert.equal(model.verifyEvidence(f.project,check),true);const wrong=structuredClone(check);wrong.evidence.pages[0].layers[0].sha256='f'.repeat(64);assert.equal(model.verifyEvidence(f.project,wrong),false);
});
await import('../apps/designer-studio/template-print-preflight.js');
test('preflight recognizes current monthly aliases/styles and validates intended PDF bleed only',()=>{
 const f=fixture();f.bg.src='package-asset://preview';f.project.book.pageInstances[0].role='monthly-back';f.project.book.pageInstances[0].semanticPageRole='month-back';
 f.project.book.elementsByPage.p.push({id:'memo',type:'memo',memoLayout:'daily-plan',zIndex:2,style:{dateScale:110,titleScale:100,stripeColor:'#eeeeee'}});
 const runtime={pages:[{id:'p',role:'monthly-back',objects:[{id:'bg'},{id:'text'},{id:'memo'}]}],diagnostics:[{code:'OBJECT_OUT_OF_BOUNDS',severity:'warning',pageId:'p',objectId:'bg',message:'outside trim'}]};
 const report=globalThis.ACDLTemplatePrintPreflight.analyze(f.project,{runtimeDocument:runtime});
 assert.ok(!report.issues.some(i=>['PAGE_ROLE_UNSUPPORTED','STYLE_NOT_CATALOGED','RUNTIME_OBJECT_OUT_OF_BOUNDS'].includes(i.code)));
 f.bg.x=-5;const outside=globalThis.ACDLTemplatePrintPreflight.analyze(f.project,{runtimeDocument:runtime});assert.ok(outside.issues.some(i=>i.code==='RUNTIME_OBJECT_OUT_OF_BOUNDS'));
});
test('older workers cannot accidentally print foreground without its original background',()=>{
 const plan=model.projectPlans(fixture().project)[0];assert.throws(()=>model.assertWorkerContract(plan,null),/worker_upgrade_required/);assert.equal(model.assertWorkerContract(plan,model.version),true);assert.equal(model.assertWorkerContract({...plan,layers:[]},null),true);
});
