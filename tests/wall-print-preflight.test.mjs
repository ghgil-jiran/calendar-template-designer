import test from 'node:test';
import assert from 'node:assert/strict';
await import('../apps/designer-studio/desk-academic-print-parity.js');
await import('../apps/designer-studio/print-output-preflight.js');
function fixture(pages=1){
 return {productType:{category:'poster',pageSize:{width:420,height:594,unit:'mm'},productionSize:{width:426,height:600,unit:'mm'}},template:{calendarTypeSnapshot:{definition:{finishedSize:{width:420,height:594,unit:'mm'},productionSize:{width:426,height:600,unit:'mm'}}},resources:{exportSettings:{format:'pdf',dpi:300,bleed:3,colorMode:'cmyk',cropMarks:true}}},book:{pageInstances:Array.from({length:pages},(_,i)=>({id:`page-${i}`})),elementsByPage:{}}};
}
for(const pages of [1,2])test(`A2 ${pages}-page contract uses its saved calendar type`,()=>{
 const report=globalThis.ACDLPrintOutputPreflight.inspect(fixture(pages));
 assert.equal(report.contractReady,true);
 assert.equal(report.geometryMappingVerified,true);
 assert.equal(report.artifactVerified,false);
});
for(const [name,change,code] of [
 ['trim',p=>p.productType.pageSize.width=419,'PRINT_TRIM_SIZE_MISMATCH'],
 ['production',p=>p.productType.productionSize.height=601,'PRINT_PRODUCTION_SIZE_MISMATCH'],
 ['bleed',p=>p.template.resources.exportSettings.bleed=2,'PRINT_BLEED_MISMATCH'],
 ['unit',p=>p.productType.pageSize.unit='pt','PRINT_TRIM_SIZE_MISMATCH'],
 ['missing definition geometry',p=>delete p.template.calendarTypeSnapshot.definition.finishedSize,'PRINT_TRIM_SIZE_MISMATCH'],
 ['color',p=>p.template.resources.exportSettings.colorMode='rgb','PRINT_COLOR_MODE_INVALID']
])test(`wall contract rejects incorrect ${name}`,()=>{const p=fixture();change(p);const r=globalThis.ACDLPrintOutputPreflight.inspect(p);assert.equal(r.contractReady,false);assert.ok(r.issues.some(i=>i.code===code));});
