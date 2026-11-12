import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {repairSampleDPrint,replacePrintSources} from '../server/sample-d-print-repair.js';
const manifest=JSON.parse(await readFile(new URL('../assets/sample-d-cmyk/manifest.json',import.meta.url)));
function setup(){
 const records=new Map(),uploads=new Map();let saves=0;
 const project={version:1,template:{metadata:{sampleDRemoteRevision:'sample-d-v4'},savedPagePreviews:{one:'old'}},book:{school:{song:'교체한 악보'},elementsByPage:{front:manifest.documents.map(e=>({id:e.file,x:17,graphicSource:{graphicId:'old',packageId:'old',pdfSource:{sha256:e.sourceSha256,pageNumber:1,documentId:'old-'+e.file}}})).concat({id:'unrelated',x:29,graphicSource:{pdfSource:{sha256:'unrelated',pageNumber:1}}})}}};
 let current={template:{id:manifest.templateId,name:'샘플 D',state:'published',stableKey:'sample-d',edition:2027,productType:'desk',templateKey:'desk',isStandard:false},version:{id:'v7',versionNumber:7,schemaVersion:1,projectData:project}};
 const deps={d:{ensureBucket:async()=>{},readJson:async k=>{if(!records.has(k))throw {storageStatus:404};return structuredClone(records.get(k));},writeJson:async(k,v)=>records.set(k,structuredClone(v))},get:async()=>structuredClone(current),createPackage:async()=>({id:'cmyk-package'}),pdf:async b=>{if(b.operation==='pdf-start'){const id='new-'+b.fileName;uploads.set(id,{...b,chunks:[]});return {document:{id}};}const entry=uploads.get(b.documentId);if(b.operation==='pdf-status')return {document:{verifiedAt:entry.done,chunkCount:1},uploaded:[]};if(b.operation==='pdf-chunk'){entry.chunks.push(Buffer.from(b.data,'base64'));return {};}if(b.operation==='pdf-complete'){assert.equal(createHash('sha256').update(Buffer.concat(entry.chunks)).digest('hex'),entry.sha256);entry.done=true;return {}; }throw Error(b.operation);},save:async input=>{saves++;assert.equal(input.state,'published');assert.equal(input.sourceVersionId,'v7');current={template:current.template,version:{id:'v8',versionNumber:8,schemaVersion:1,projectData:structuredClone(input.projectData)}};return current;}};
 return {deps,project,get current(){return current;},get saves(){return saves;},change(){current.version.id='changed';}};
}
test('registers CMYK bytes, replaces only known backgrounds, retains edits and verifies idempotently',async()=>{
 const s=setup(),start=await repairSampleDPrint({step:'start'},s.deps);assert.equal(start.documents,manifest.documents.length);assert.equal(start.completed,false);
 await assert.rejects(repairSampleDPrint({step:'save',versionId:start.versionId},s.deps),/등록/);
 for(let index=0;index<manifest.documents.length;index++)await repairSampleDPrint({step:'document',index},s.deps);
 const saved=await repairSampleDPrint({step:'save',versionId:start.versionId},s.deps);assert.equal(saved.changed,manifest.documents.length);assert.equal(saved.version,8);
 const p=s.current.version.projectData;assert.equal(p.book.school.song,'교체한 악보');assert.equal(p.book.elementsByPage.front[0].x,17);assert.deepEqual(p.book.elementsByPage.front.at(-1),s.project.book.elementsByPage.front.at(-1));assert.equal(p.book.elementsByPage.front[0].graphicSource.pdfSource.sha256,manifest.documents[0].sha256);assert.equal(s.project.book.elementsByPage.front[0].graphicSource.pdfSource.sha256,manifest.documents[0].sourceSha256);
 assert.equal((await repairSampleDPrint({step:'verify'},s.deps)).completed,true);await repairSampleDPrint({step:'save'},s.deps);assert.equal(s.saves,1);
});
test('rejects intervening template changes and invalid pages without saving',async()=>{
 const s=setup(),start=await repairSampleDPrint({step:'start'},s.deps);for(let index=0;index<manifest.documents.length;index++)await repairSampleDPrint({step:'document',index},s.deps);s.change();await assert.rejects(repairSampleDPrint({step:'save',versionId:start.versionId},s.deps),/변경/);assert.equal(s.saves,0);
 const invalid=structuredClone(s.project);invalid.book.elementsByPage.front[0].graphicSource.pdfSource.pageNumber=999;assert.throws(()=>replacePrintSources(invalid,manifest,{packageId:'new',documents:Object.fromEntries(manifest.documents.map(e=>[e.file,{done:true,id:'new'}]))}),/페이지 번호/);
});
test('upgrades already-applied v1 sources, preserves valid direct CMYK sources and verifies completion',async()=>{
 const s=setup();s.project.template.metadata.sampleDPrintRepair='sample-d-cmyk-v1';
 for(const item of s.project.book.elementsByPage.front){const entry=manifest.documents.find(e=>e.file===item.id);if(entry)item.graphicSource.pdfSource.sha256=entry.previousSha256||entry.sha256;}
 const start=await repairSampleDPrint({step:'start'},s.deps);assert.equal(start.completed,false);
 for(let index=0;index<manifest.documents.length;index++)await repairSampleDPrint({step:'document',index},s.deps);
 const result=await repairSampleDPrint({step:'save',versionId:start.versionId},s.deps);assert.equal(result.changed,manifest.documents.filter(e=>e.previousSha256).length);assert.equal((await repairSampleDPrint({step:'verify'},s.deps)).completed,true);assert.equal(s.current.version.projectData.book.school.song,'교체한 악보');assert.equal(s.saves,1);
});
