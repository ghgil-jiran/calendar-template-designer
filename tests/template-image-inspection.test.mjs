import test from 'node:test';
import assert from 'node:assert/strict';
await import('../apps/designer-studio/template-image-inspection.js');
await import('../apps/designer-studio/print-output-preflight.js');
await import('../apps/designer-studio/template-print-preflight.js');
await import('../apps/designer-studio/desk-academic-print-parity.js');
const api=globalThis.ACDLTemplateImageInspection;
const fixture=()=>({productType:{pageSize:{width:260,height:180}},template:{resources:{assets:[{id:'unused',src:'unused.png'}]}},book:{pageInstances:[{id:'cover',role:'cover'}],elementsByPage:{cover:[{id:'photo',type:'image',src:'original.png',width:50,height:50,fit:'cover'}]}}});
const load=async()=>({width:2400,height:1800});
function saved(p){const i=api.inspect(p);return {criteriaVersion:api.VERSION,evidence:{inventorySignature:i.inventorySignature},criteria:Object.fromEntries(i.criteria.map(c=>[c.key,{status:'passed',message:'reviewed'}]))}}
test('editor images and library backgrounds are collected; unused assets are excluded',()=>{
 const p=fixture();p.book.elementsByPage.cover.push({id:'bg',type:'image',src:'bg.png',graphicSource:{originalAssetId:'g'},width:100,height:100});
 assert.equal(api.inventory(p).count,2);assert.equal(api.inventory(p).aiCount,0);assert.equal(api.inspect(p).criteria.length,5);
});
test('common checks complete only after source decoding and visual review',async()=>{
 const p=fixture();assert.equal(api.inspect(p,saved(p)).status,'pending');await api.probe(p,load);
 assert.equal(api.inspect(p).status,'pending');assert.equal(api.inspect(p,saved(p)).status,'passed');
});
test('same original is checked at every placement and cover crop reduces effective DPI',async()=>{
 const p=fixture();p.book.elementsByPage.cover.push({id:'large',type:'image',src:'original.png',width:100,height:100});let calls=0;
 await api.probe(p,async()=>{calls++;return load()});const i=api.inspect(p,saved(p));
 assert.equal(calls,1);assert.equal(i.placements.length,2);assert.equal(i.status,'blocked');
 assert.ok(api.resolution({widthMm:100,heightMm:100,fit:'cover',scale:1},3000,1000)<300);
 assert.ok(api.resolution({widthMm:100,heightMm:100,fit:'contain',scale:1},3000,1000)>300);
});
test('source, size and crop edits invalidate saved visual approval',async()=>{
 for(const change of [e=>e.src='replacement.png',e=>e.width=40,e=>e.image={scale:2,offsetX:15}]){
  const p=fixture();await api.probe(p,load);const prior=saved(p);assert.equal(api.inspect(p,prior).status,'passed');change(p.book.elementsByPage.cover[0]);await api.probe(p,load);assert.notEqual(api.inspect(p,prior).status,'passed');
 }
});
test('missing and broken images block; empty replaceable placeholders require review',async()=>{
 const p=fixture();await api.probe(p,async()=>{throw Error('broken')});assert.equal(api.inspect(p,saved(p)).status,'blocked');
 p.book.elementsByPage.cover=[{id:'empty',type:'image-frame',replaceable:true,emptyBehavior:'placeholder',width:20,height:20}];await api.probe(p,load);assert.equal(api.inspect(p,saved(p)).status,'pending');
});
test('AI additions require extra criteria even when generation was disabled',async()=>{
 const p=fixture();p.template.settings={aiDesignDisabled:true};p.book.elementsByPage.cover[0].aiDesign={resourceId:'ai'};await api.probe(p,load);assert.equal(api.inspect(p).criteria.length,7);assert.equal(api.inspect(p).aiImageCount,1);assert.equal(api.inspect(p).status,'pending');
});
test('unused AI assets cannot create an AI inspection requirement',()=>{
 const p=fixture();p.template.resources.aiDesignAssets=[{id:'ai-design.unused',src:'unused'}];assert.equal(api.inspect(p).aiImageCount,0);
});
test('no images is not applicable; core PDF prerequisites still lock final approval',()=>{
 const p=fixture();p.book.elementsByPage.cover=[];const out=globalThis.ACDLPrintOutputPreflight.inspect(p),report=globalThis.ACDLTemplatePrintPreflight.analyze(p,{printOutput:out});
 assert.equal(out.templateImageInspection.status,'passed');assert.equal(out.templateImageInspection.disposition,'not-applicable');assert.equal(report.gates[3].access,'locked');assert.equal(report.gates[4].access,'locked');assert.equal(report.finalApproved,false);
});
test('common image approval unlocks final completion, and an image edit locks it again',async()=>{
 const p=fixture();p.template.id='fixture.desk';p.template.print={bleed:3};p.template.resources.exportSettings={format:'pdf',dpi:300,bleed:3,cropMarks:true,colorMode:'cmyk'};
 await api.probe(p,load);const review=saved(p),pass={status:'passed'},artifact={status:'done',checks:Object.fromEntries(['pdfx4','outputIntent','cmyk','k100','trimBox','bleedBox','fontOutlined','vectorContentPreserved','trimContentParity'].map(k=>[k,pass]))};artifact.checks.templateImagePrintQuality=review;
 const runtimeDocument={pages:[{id:'cover',sourcePageId:'cover',role:'cover',objects:[{id:'photo',sourceObjectId:'photo'}]}],diagnostics:[]},renderParity={generated:true,pages:1,screenObjects:1,rgbObjects:1,issues:[]};
 const report=()=>globalThis.ACDLTemplatePrintPreflight.analyze(p,{runtimeDocument,renderParity,printOutput:globalThis.ACDLPrintOutputPreflight.inspect(p,{artifact})});
 assert.equal(report().gates[3].status,'passed');assert.equal(report().finalApproved,true);
 p.book.elementsByPage.cover[0].width=40;
 assert.equal(report().gates[4].access,'locked');assert.equal(report().finalApproved,false);
});
test('reloaded object URLs retain approval identity for the same remote asset',()=>{
 const prior=globalThis.ACDLTemplateRemotePersistence;
 try{globalThis.ACDLTemplateRemotePersistence={canonicalAssetSource:src=>src.startsWith('blob:')?'acdl-asset://immutable':src};const p=fixture();p.book.elementsByPage.cover[0].src='blob:first';const signature=api.inventory(p).signature;p.book.elementsByPage.cover[0].src='blob:reloaded';assert.equal(api.inventory(p).signature,signature)}finally{globalThis.ACDLTemplateRemotePersistence=prior}
});
