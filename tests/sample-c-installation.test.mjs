import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {installSampleC} from '../server/sample-c-installation.js';
import '../apps/designer-studio/shared-screen-memo.js';
import '../apps/designer-studio/shared-screen-grid-presentation.js';
import '../apps/designer-studio/production-editor-adapter.js';
import '../apps/designer-studio/shared-page-object-model.js';
import '../apps/designer-studio/shared-screen-composition.js';
import '../apps/designer-studio/pdf-background-print-model.js';
import '../apps/designer-studio/template-print-preflight.js';
import {validateVersionSave} from '../server/template-persistence.js';
const root=new URL('../assets/sample-c/',import.meta.url);
test('Sample C installs verified originals, shared widgets and 28 surfaces, then preserves designer edits',async()=>{
 const json=new Map(),bytes=new Map(),records=new Map();let asset=0,saves=0,saved;
 const missing=()=>Object.assign(Error('missing'),{storageStatus:404});
 const d={ensureBucket:async()=>{},getRecord:async id=>records.get(id),putRecord:async r=>{records.set(r.id,structuredClone(r));return r;},readJson:async k=>{if(!json.has(k))throw missing();return structuredClone(json.get(k));},writeJson:async(k,v)=>json.set(k,structuredClone(v)),readBytes:async k=>{if(!bytes.has(k))throw missing();return bytes.get(k)},writeBytes:async(k,b)=>bytes.set(k,b),list:async prefix=>[...json.keys()].filter(k=>k.startsWith(prefix)).map(k=>({name:k.split('/').at(-1)})),storePreview:async()=>({id:'10000000-0000-4000-8000-'+String(++asset).padStart(12,'0')}),validateThumbnail:v=>v};
 const overrides={d,createPackage:async body=>{const p={...body,id:'20000000-0000-4000-8000-000000000001',schemaVersion:'graphic-package.v1',revision:1,pages:{},status:'active'};records.set(p.id,p);return p;},storeAsset:d.storePreview,list:async()=>[],save:async input=>{validateVersionSave(input);saved=input.projectData;saves++;return {template:{id:'30000000-0000-4000-8000-000000000001'}};}};
 await assert.rejects(installSampleC({step:'save'},overrides),/Start installation/);
 const start=await installSampleC({step:'start'},overrides);
 for(let index=0;index<start.documentCount;index++)await installSampleC({step:'document',index},overrides);
 for(let index=0;index<start.assetCount;index++)await installSampleC({step:'asset',index},overrides);
 await installSampleC({step:'save'},overrides);
 assert.equal(saved.book.pageInstances.length,28);
 assert.equal(saved.book.pageInstances.filter(p=>p.role==='monthly-front').length,12);
 assert.equal(saved.book.pageInstances.filter(p=>p.role==='monthly-back').length,12);
 const all=Object.values(saved.book.elementsByPage).flat();
 assert.equal(all.filter(e=>e.graphicSource?.pdfSource).length,4);
 assert.equal(all.filter(e=>e.memoLayout==='weekly-columns').length,12);
 assert.equal(all.filter(e=>e.memoLayout==='striped-checklist').length,24);
 assert.equal(all.filter(e=>e.memoLayout==='split-notes').length,12);
 assert.equal(all.filter(e=>e.type==='year-calendar').length,1);
 assert.ok(all.find(e=>e.format==='school-song-title'&&e.binding==='school.name'));
 for(const key of ['tree','flower'])for(const part of ['name','description'])assert.ok(all.find(e=>e.binding===`school.profile.${key}.${part}`));
 assert.doesNotMatch(JSON.stringify(saved),/__ASSET:|token=|5c3eee14|33c0eee6/);
 const report=globalThis.ACDLTemplatePrintPreflight.analyze(saved);
 assert.deepEqual(report.issues.filter(i=>i.severity==='error'||i.code==='STYLE_NOT_CATALOGED'),[]);
 const manifest=JSON.parse(await readFile(new URL('manifest.json',root)));
 for(const doc of manifest.documents){const m=[...json.values()].find(v=>v.fileName===doc.file&&v.schemaVersion==='graphic-pdf-document.v1');assert.ok(m.verifiedAt);const joined=Buffer.concat(Array.from({length:m.chunkCount},(_,i)=>bytes.get(`graphics-pdf-sources/${m.id}/chunk-${i}.bin`)));assert.deepEqual(joined,doc.parts?Buffer.concat(await Promise.all(doc.parts.map(part=>readFile(new URL(part,root))))):await readFile(new URL(doc.file,root)));}
 assert.equal(saved.template.settings.graphicPackage.referencePdfId,[...json.values()].find(v=>v.fileName==='reference-overview.pdf'&&v.schemaVersion==='graphic-pdf-document.v1').id);
 await installSampleC({step:'save'},overrides);assert.equal(saves,1);
});
test('new writing styles retain shared vector structure, typography and safe labels',()=>{
 const api=globalThis.ACDLSharedMemo;
 for(const memoLayout of ['weekly-columns','striped-checklist','split-notes']){
  const html=api.renderWritingPlanner({memoLayout,title:'<script>',itemCount:11,style:{lineColor:'#123456',stripeColor:'#eeeeee'}});
  assert.match(html,/^<svg /);assert.match(html,/&lt;script&gt;/);assert.doesNotMatch(html,/<image|<script>/);assert.match(html,/#123456/);
 }
 const weekly=api.renderWritingPlanner({memoLayout:'weekly-columns'});for(const day of ['MON','TUE','WED','THU','FRI','SAT','SUN'])assert.match(weekly,new RegExp('>'+day+'<'));
 assert.equal(globalThis.ACDLSharedGridPresentation.resolve('top-rules').className,'grid-top-rules');
});
