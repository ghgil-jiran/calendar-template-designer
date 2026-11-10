import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';
import {refineSampleCProject,refineSampleC} from '../server/sample-c-refinement.js';
import '../apps/designer-studio/shared-screen-memo.js';import '../apps/designer-studio/production-editor-adapter.js';import '../apps/designer-studio/shared-screen-composition.js';import '../apps/designer-studio/pdf-background-print-model.js';import '../apps/designer-studio/template-print-preflight.js';import '../apps/designer-studio/shared-screen-grid-presentation.js';import '../apps/designer-studio/shared-page-object-model.js';
const fixture=()=>readFile(new URL('../assets/sample-c/project.json',import.meta.url),'utf8').then(JSON.parse);
test('reference corrections preserve school inputs, source data and custom objects, and do not repeat',async()=>{
 const p=await fixture();p.book.school.name='사용자가 저장한 학교';p.book.elementsByPage['surface.2.front'].push({id:'designer-note',type:'text',content:'keep'});const before=structuredClone(p);const result=refineSampleCProject(p,{leaf:'leaf',...Object.fromEntries(Array.from({length:12},(_,i)=>['corner'+i,'corner'+i])),...Object.fromEntries(Array.from({length:12},(_,i)=>['spark'+i,'spark'+i]))});
 assert.deepEqual(ACDLTemplatePrintPreflight.analyze(result).issues.filter(i=>i.severity==='error'||i.code==='STYLE_NOT_CATALOGED'),[]);assert.deepEqual(p,before);assert.deepEqual(result.book.school,p.book.school);assert.deepEqual(result.book.pageInstances,p.book.pageInstances);assert.equal(result.book.elementsByPage['surface.2.front'].filter(e=>e.id==='designer-note').length,1);assert.deepEqual(refineSampleCProject(result,{}),result);
 assert.equal(result.book.pageInstances.filter(q=>q.role==='monthly-front').length,12);assert.equal(result.book.monthlyStyleOverrides.filter(q=>q.tokens.miniBackground).length,12);
 const all=Object.values(result.book.elementsByPage).flat();assert.equal(all.filter(e=>e.id.endsWith('.planner.corner')).length,12);assert.equal(all.filter(e=>e.id.endsWith('.planner.spark')).length,12);assert.equal(all.filter(e=>e.id.startsWith('c.symbols.maple.')).length,2);
 for(const e of all.filter(e=>e.id.endsWith('.planner.corner')))assert.ok(e.x>80&&e.x+e.width<100&&e.y>0&&e.y+e.height<25);
});
test('monthly mini backgrounds and bold contact labels share one renderer',()=>{
 const vars=globalThis.ACDLSharedGridPresentation.appearanceVariables({mini:{mode:'monthly'}});assert.match(vars['--calendar-mini-background'],/--month-mini-background/);
 const html=globalThis.ACDLPageObjectModel.renderSchoolContacts({contacts:[{label:'교무실',phone:'123',fax:'456'},{label:'행정실',phone:'789'}],website:'school.example'},{contactLayout:'stacked-website'});assert.match(html,/>교무실<\/strong>/);assert.match(html,/>FAX<\/strong>/);assert.match(html,/school.example/);assert.doesNotMatch(html,/<strong[^>]*>123/);
});
test('a concurrent template save stops refinement before any version is overwritten',async()=>{
 const p=await fixture();let calls=0,saved=false;
 await assert.rejects(refineSampleC({list:async()=>[{id:'t',stableKey:'desk-sample-c-seasonal-illustration-2027'}],get:async()=>({version:{id:++calls===1?'v1':'v2',projectData:p}}),read:async()=>Buffer.from('image'),store:async()=>({id:'asset'}),save:async()=>{saved=true}}),/다른 편집/);assert.equal(saved,false);
});
