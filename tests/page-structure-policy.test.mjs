import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync(new URL('../apps/designer-studio/page-structure-policy-runtime.js',import.meta.url),'utf8');
function api(){const context={document:{getElementById(){return null},querySelector(){return null}}};context.window=context;vm.createContext(context);vm.runInContext(source,context);return context.ACDLPageStructurePolicy}
function project(){return {productType:{category:'desk'},template:{settings:{pageStructurePolicy:{coverBackMode:'separate'}}},book:{sheets:Array.from({length:14},(_,index)=>({id:`sheet.${index+1}`})),pageInstances:[{id:'cover-front',role:'cover-front'},{id:'cover-back',role:'cover-back',semanticPageRole:'yearly-calendar'},{id:'month-front',role:'monthly-front'},{id:'month-back',role:'monthly-back'},{id:'back-front',role:'back-cover-front'},{id:'back-back',role:'back-cover-back'}],elementsByPage:{'cover-back':[{id:'year',role:'year',binding:'calendar.year'},{id:'calendar',type:'year-calendar',role:'year-calendar'},{id:'decoration',role:'decoration'}]}}}}

test('desk page structure policy preserves page content and reports both inside surfaces',()=>{const value=project(),policy=api(),before=JSON.stringify(value.book.elementsByPage);policy.apply(value);assert.equal(JSON.stringify(value.book.elementsByPage),before);const summary=policy.summary(value);assert.equal(summary.hasCoverInside,true);assert.equal(summary.hasBackCoverInside,true);assert.equal(summary.surfaceCount,6)});

test('shared 26-surface structure reports no separate inside surfaces',()=>{const value=project(),policy=api();value.template.settings.pageStructurePolicy.coverBackMode='shared-month-back';value.book.pageInstances=value.book.pageInstances.filter(page=>!['cover-back','back-cover-front'].includes(page.role));value.book.pageInstances.find(page=>page.role==='monthly-back').sharedRoles=['cover-back','monthly-back'];const summary=policy.summary(value);assert.equal(summary.hasCoverInside,false);assert.equal(summary.hasBackCoverInside,false);assert.equal(summary.policy.coverBackMode,'shared-month-back')});

test('page settings explain automatic inside-surface structure without content selectors',()=>{assert.match(source,/data-resource-content="page-settings"/);assert.match(source,/pageSettingsPolicyMount/);assert.match(source,/표지 안쪽면 공유 · 뒷표지 안쪽면 없음/);assert.match(source,/topology:'type-policy'/);assert.doesNotMatch(source,/resourceAnnualPageMode|resourceBackCoverFrontMode/)});
