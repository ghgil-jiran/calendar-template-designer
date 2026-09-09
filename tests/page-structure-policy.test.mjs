import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync(new URL('../apps/designer-studio/page-structure-policy-runtime.js',import.meta.url),'utf8');
function api(){const context={document:{getElementById(){return null},querySelector(){return null}}};context.window=context;vm.createContext(context);vm.runInContext(source,context);return context.ACDLPageStructurePolicy}
function project(annualMode='annual'){return {productType:{category:'desk'},template:{settings:{pageStructurePolicy:{annualMode,backCoverFrontMode:'school-info'}}},book:{sheets:Array.from({length:14},(_,index)=>({id:`sheet.${index+1}`})),pageInstances:[{id:'cover-front',role:'cover-front'},{id:'cover-back',role:'cover-back',semanticPageRole:'yearly-calendar'},{id:'month-front',role:'monthly-front'},{id:'month-back',role:'monthly-back'},{id:'back-front',role:'back-cover-front'},{id:'back-back',role:'back-cover-back'}],elementsByPage:{'cover-back':[{id:'year',role:'year',binding:'calendar.year'},{id:'calendar',type:'year-calendar',role:'year-calendar'},{id:'decoration',role:'decoration'}]}}}}

test('desk standard page policy separates the physical cover-back surface from optional annual content',()=>{const value=project('cover-continuation'),policy=api();policy.apply(value);assert.equal(value.book.pageInstances[1].role,'cover-back');assert.equal(value.book.pageInstances[1].semanticPageRole,'cover-continuation');assert.deepEqual(value.book.elementsByPage['cover-back'].map(item=>item.id),['decoration']);assert.deepEqual(value.template.settings.pageStructureDetachedElements['cover-back'].map(item=>item.id),['year','calendar']);const summary=policy.summary(value);assert.equal(summary.annualEnabled,false);assert.equal(summary.surfaceCount,6)});

test('turning annual content back on restores its editable objects',()=>{const value=project('cover-continuation'),policy=api();policy.apply(value);value.template.settings.pageStructurePolicy.annualMode='annual';policy.apply(value);assert.equal(value.book.pageInstances[1].semanticPageRole,'yearly-calendar');assert.deepEqual(JSON.parse(JSON.stringify(value.book.elementsByPage['cover-back'].map(item=>item.id))),['decoration','year','calendar']);assert.equal(value.template.settings.pageStructureDetachedElements['cover-back'],undefined)});

test('page settings expose a reviewable locked topology and optional annual selector',()=>{assert.match(source,/data-resource-content="page-settings"/);assert.match(source,/pageSettingsPolicyMount/);assert.match(source,/연력은 선택 콘텐츠/);assert.match(source,/topology:'locked-standard'/);assert.match(source,/resourceAnnualPageMode/);assert.match(source,/resourceBackCoverFrontMode/)});
