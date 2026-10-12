import test from 'node:test';
import assert from 'node:assert/strict';
import '../apps/designer-studio/shared-page-object-model.js';
import '../apps/designer-studio/runtime-project-adapter.js';
import '../apps/designer-studio/persistence-project.js';
import '../apps/designer-studio/inspector-element.js';
const model=globalThis.ACDLPageObjectModel,adapter=globalThis.ACDLRuntimeProjectAdapter;
const project=(lines='two',format='number-calendar')=>({settings:{year:2027},template:{masterElements:{},settings:{aiDesignSpec:{pageSettings:{roleCompositions:{cover:{yearFormat:format,yearLines:lines}}}}}},book:{pageInstances:[{id:'cover',role:'cover-front'}],elementsByPage:{cover:[{id:'year',type:'text',role:'year',binding:'calendar.year',content:'2027',x:10,y:15,width:60,height:30,style:{fontSize:40,fontFamily:'Arial',color:'#123456'},permissions:{move:true}}]}}});
test('one and two line cover titles become separate editable text objects with a live year binding',()=>{
 for(const lines of ['one','two']){
  const p=project(lines);model.normalizeProject(p);const [year,label]=p.book.elementsByPage.cover;
  assert.equal(year.id,'year');assert.equal(year.binding,'calendar.year');assert.equal(year.yearFormat,'number');assert.equal(label.binding,null);assert.equal(label.content,'CALENDAR');assert.equal(label.role,'cover-calendar-label');assert.equal(label.style.fontFamily,'Arial');
  assert.equal(adapter.formatYearText(year,{role:'cover-front'},p),'2027');p.settings.year=2028;assert.equal(adapter.formatYearText(year,{},p),'2028');
  if(lines==='two')assert.ok(label.y>year.y);else assert.ok(label.x>year.x);
 }
});
test('separate styles, content and position survive save/reload and page defaults cannot recombine them',()=>{
 const p=project();model.normalizeProject(p);const [year,label]=p.book.elementsByPage.cover;year.style.fontSize=180;label.style.fontSize=17;label.style.fontFamily='Noto Serif KR';label.content='ACADEMIC CALENDAR';label.x=30;
 const saved=globalThis.ACDLPersistenceProject.serialize(p),loaded=globalThis.ACDLPersistenceProject.deserialize(saved);
 assert.deepEqual(loaded.book.elementsByPage.cover,p.book.elementsByPage.cover);assert.equal(adapter.formatYearText(loaded.book.elementsByPage.cover[0],{role:'cover-front'},loaded),'2027');
 model.normalizeProject(loaded);assert.equal(globalThis.ACDLPersistenceProject.serialize(loaded),saved);
 loaded.book.elementsByPage.cover.pop();model.normalizeProject(loaded);assert.equal(loaded.book.elementsByPage.cover.length,1);
});
test('fixed year text and supported year formats remain editable after splitting',()=>{
 const p=project();model.normalizeProject(p);const year=p.book.elementsByPage.cover[0];year.format='year-ko';assert.equal(adapter.formatYearText(year,{},p),'2027년');globalThis.ACDLInspectorElement.apply(year,'text-content',{binding:'',content:'SPECIAL EDITION'});assert.equal(year.bindingEnabled,false);assert.equal(adapter.formatYearText(year,{},p),'SPECIAL EDITION');
});
test('number-only covers, non-cover objects and production correction documents are preserved',()=>{
 const p=project('one','number');model.normalizeProject(p);assert.equal(p.book.elementsByPage.cover.length,1);
 const annual=project();annual.book.pageInstances[0].role='annual';model.normalizeProject(annual);assert.equal(annual.book.elementsByPage.cover.length,1);
 const correction=project();correction.productionCorrection={};model.normalizeProject(correction);assert.equal(correction.book.elementsByPage.cover.length,1);
});
test('page settings generate separate cover objects and later renders preserve each style',async()=>{
 await import('../apps/designer-studio/ai-design/design-type-catalog@0.3.0.js');
 await import('../apps/designer-studio/ai-design/design-spec@0.3.0.js');
 await import('../apps/designer-studio/ai-design/page-composition-policy.js');
 await import('../apps/designer-studio/ai-design/design-layout-application@0.1.0.js');
 const p=project();p.book.school={name:'학교',profile:{}};p.template.masters={calendar:{}};p.productType={pageSize:{width:260,height:180}};
 const spec=globalThis.ACDLDesignSpec.normalize({pageSettings:{roleCompositions:{cover:{typeId:'center-photo',components:['year'],yearFormat:'number-calendar',yearLines:'two'}}}},globalThis.ACDLDesignTypeCatalog);
 globalThis.ACDLDesignLayoutApplication.apply(p,spec);
 const [year,label]=p.book.elementsByPage.cover;assert.equal(year.binding,'calendar.year');assert.equal(label.content,'CALENDAR');assert.ok(label.y>year.y);
 year.style.fontSize=180;label.style.fontSize=17;label.content='ACADEMIC';model.normalizeProject(p);assert.equal(label.content,'ACADEMIC');assert.equal(year.style.fontSize,180);
});
