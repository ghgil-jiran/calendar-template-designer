import test from 'node:test';
import assert from 'node:assert/strict';
import '../apps/designer-studio/project-document.js';
import '../apps/designer-studio/calendar-type-domain.js';
import '../apps/designer-studio/poster-one-page-sample.js';
import '../apps/designer-studio/poster-two-page-sample.js';
import {createPosterDuplex,installPosterDuplex,DUPLEX_KEY,TWO_PAGE_KEY} from '../server/poster-duplex-installation.js';
const domain=globalThis.ACDLCalendarTypeDomain;
function source(){const p=globalThis.ACDLPosterTwoPageSample.create({});p.book.elementsByPage[p.book.pageInstances[0].id][0].x=4.6;p.book.elementsByPage[p.book.pageInstances[1].id].find(e=>e.academicPoster).posterColors=['#123456'];p.template.remoteId='source';p.template.publishing.packageId='old';return {template:{id:'source'},version:{id:'source-v7',versionNumber:7,projectData:p}};}
test('duplex is two authored pages on one sheet, preserving the latest source layout and content',()=>{
 const src=source(),before=JSON.stringify(src),p=createPosterDuplex(src,domain.definition('poster-duplex'));
 assert.equal(JSON.stringify(src),before);assert.deepEqual(p.book.elementsByPage,src.version.projectData.book.elementsByPage);assert.deepEqual(p.book.school,src.version.projectData.book.school);assert.deepEqual(p.book.events,src.version.projectData.book.events);assert.equal(p.book.sheets.length,1);assert.equal(p.book.sheets[0].surfaces.length,2);assert.deepEqual(p.book.pageInstances.map(x=>x.posterMonthOffset),[0,6]);assert.deepEqual(p.book.pageInstances.map(x=>x.side),['front','back']);assert.equal(p.productType.duplex,true);assert.equal(p.template.cloneProvenance.sourceVersion,7);assert.equal(p.template.remoteId,undefined);assert.equal(p.template.publishing.packageId,undefined);assert.equal(domain.minimumStructure(domain.definition('poster-duplex')).sheetCount,1);assert.equal(domain.minimumStructure(domain.definition('poster-two-page')).sheetCount,2);assert.equal(domain.validateProject(p,domain.definition('poster-duplex')).valid,true);
});
test('registration reads the newest saved two-page version and saves a separate draft, then reopens it',async()=>{
 const src=source(),records=[{id:'source',stableKey:TWO_PAGE_KEY}],writes=[];let saved,registered;
 const deps={list:async()=>records,load:async id=>id==='source'?src:{template:{id:'duplex'},version:{versionNumber:1,projectData:saved.projectData}},types:async()=>[domain.definition('poster-two-page')],saveType:async t=>{registered=t},save:async input=>{writes.push(input);saved=input;return {template:{id:'duplex'},version:{versionNumber:1}}}};
 const result=await installPosterDuplex({},deps);assert.equal(result.verified,true);assert.equal(result.sourceVersion,7);assert.equal(registered.printSides,'duplex');assert.equal(writes.length,1);assert.equal(saved.templateId,undefined);assert.equal(saved.stableKey,DUPLEX_KEY);assert.equal(saved.state,'draft');
 records.push({id:'duplex',stableKey:DUPLEX_KEY});assert.equal((await installPosterDuplex({},deps)).existing,true);assert.equal(writes.length,1);
});
test('wrong source topology or target size fails before creating any records',async()=>{
 const src=source(),wrong=domain.definition('poster-duplex');wrong.finishedSize.width=300;assert.throws(()=>createPosterDuplex(src,wrong),/규격/);src.version.projectData.book.pageInstances.pop();let writes=0;const deps={list:async()=>[{id:'source',stableKey:TWO_PAGE_KEY}],load:async()=>src,types:async()=>[],saveType:async()=>writes++,save:async()=>writes++};await assert.rejects(installPosterDuplex({},deps),/2페이지/);assert.equal(writes,0);
});
