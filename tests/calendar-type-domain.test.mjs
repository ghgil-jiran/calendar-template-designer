import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync(new URL('../apps/designer-studio/calendar-type-domain.js',import.meta.url),'utf8');
const context={window:{}};vm.runInNewContext(source,context);const domain=context.window.ACDLCalendarTypeDomain;

test('initial catalog contains only production calendar types',()=>{
 const types=domain.initialDefinitions(),ids=types.map(type=>type.id);
 assert.equal(types.length,9);
 assert.deepEqual([...ids],['desk-standard','desk-large','desk-portrait','desk-wide','poster-standard','poster-two-page','wall-standard','wall-large','wall-large-plus']);
 assert.equal(ids.some(id=>/a4|postcard/.test(id)),false);
 assert.deepEqual(JSON.parse(JSON.stringify(types.filter(type=>type.family.id==='wall').map(type=>[type.finishedSize.width,type.finishedSize.height]))),[[299,419],[388,544],[501,700]]);
});

test('type definition excludes template-owned options',()=>{
 const value=domain.normalize({id:'x',name:'X',family:{id:'desk',name:'탁상달력'},status:'active',finishedSize:{width:10,height:10},productionSize:{width:12,height:12},policies:{cover:'required',backCover:'optional',monthlyFront:'required',monthlyBack:'required',annualSingle:'optional'},starterTemplates:['sample'],allowedObjects:['text'],monthlyImages:true,allowedMonthCounts:[12],allowedStartMonths:[3]});
 assert.equal('starterTemplates' in value,false);assert.equal('allowedObjects' in value,false);assert.equal('monthlyImages' in value,false);
});

test('legacy real templates map to desk standard without analyzing their contents',()=>{
 for(const legacy of ['desk',undefined,null])assert.equal(domain.compatibleTypeId({productType:{category:legacy}}),'desk-standard');
 assert.equal(domain.compatibleTypeId({productType:{category:'wall'}}),null);
 assert.equal(domain.compatibleTypeId({productType:{category:'postcard'}}),null);
});

test('snapshot is independent from later system definition changes',()=>{
 const type=domain.definition('desk-standard'),snap=domain.snapshot(type);type.finishedSize.width=999;assert.equal(snap.definition.finishedSize.width,260);
});

test('every desk type keeps its own trim and production sizes after a standard rebuild',()=>{
 for(const id of ['desk-standard','desk-large','desk-wide','desk-portrait']){
  const type=domain.definition(id),project={settings:{sizePreset:{id:'desk-standard'}},productType:{category:'desk',pageSize:{width:260,height:180}}};
  domain.applyProjectSize(project,type);
  assert.deepEqual(JSON.parse(JSON.stringify(project.productType.pageSize)),JSON.parse(JSON.stringify(type.finishedSize)));
  assert.deepEqual(JSON.parse(JSON.stringify(project.productType.productionSize)),JSON.parse(JSON.stringify(type.productionSize)));
  assert.equal(project.settings.sizePreset.id,id);
  assert.deepEqual([project.settings.sizePreset.width,project.settings.sizePreset.height],[type.finishedSize.width,type.finishedSize.height]);
 }
});

test('opening an older wide document corrects its size without changing saved objects',()=>{
 const type=domain.definition('desk-wide'),object={id:'school-logo',x:12,y:18,width:20,height:10},project={settings:{sizePreset:{id:'desk-standard'}},productType:{category:'desk',pageSize:{width:260,height:180}},template:{calendarTypeSnapshot:domain.snapshot(type)},book:{elementsByPage:{cover:[object]}}};
 assert.equal(domain.reconcileProjectSize(project),true);
 assert.deepEqual(JSON.parse(JSON.stringify(project.productType.pageSize)),JSON.parse(JSON.stringify(type.finishedSize)));
 assert.deepEqual(JSON.parse(JSON.stringify(project.book.elementsByPage.cover[0])),object);
 assert.equal(domain.reconcileProjectSize(project),false);
});

test('validation enforces production size and allowed ranges',()=>{
 const type=domain.definition('desk-standard');type.productionSize.width=100;type.ranges.frontInsert={min:4,max:2};const result=domain.validate(type);assert.equal(result.valid,false);assert.equal(result.errors.length,2);
});

test('desk type leaves cover-inside topology to each template',()=>{
 const type=domain.definition('desk-standard'),structure=domain.minimumStructure(type);
 assert.equal(type.coverBackMode,'template-defined');
 assert.equal(type.policies.annualSingle,'unsupported');
 assert.equal(type.policies.backCoverBack,'unsupported');
 assert.deepEqual(JSON.parse(JSON.stringify(structure)),{surfaceCount:null,sheetCount:null,minimumSurfaceCount:26,maximumSurfaceCount:28,monthCount:12});
 type.coverBackMode='shared-month-back';
 assert.equal(domain.normalize(type).coverBackMode,'template-defined');
});

test('desk structural rules block incompatible type policies',()=>{
 const type=domain.definition('desk-standard');
 type.policies.monthlyBack='optional';
 const result=domain.validate(type);
 assert.equal(result.valid,false);
 assert.match(result.errors.join(' '),/월력 뒷면/);
});

test('blank type cannot be saved without a required page role',()=>{
 const type=domain.definition('desk-standard');for(const key of Object.keys(type.policies))type.policies[key]='unsupported';const result=domain.validate(type);assert.equal(result.valid,false);assert.match(result.errors.join(' '),/필수 페이지 정책/);
});

test('template validation uses the captured type range and required monthly surfaces',()=>{
 const type=domain.definition('desk-standard'),pages=[...Array.from({length:12},(_,index)=>({id:`f${index}`,role:'monthly-front'})),...Array.from({length:12},(_,index)=>({id:`b${index}`,role:'monthly-back'}))],project={settings:{monthCount:12,startMonth:3,frontInsertCount:1,rearInsertCount:0},productType:{pageSize:{width:260,height:180}},book:{pageInstances:pages}};assert.equal(domain.validateProject(project,type).valid,true);project.settings.startMonth=2;project.book.pageInstances.pop();const result=domain.validateProject(project,type);assert.equal(result.valid,false);assert.equal(result.errors.length,2)
});


test('poster kinds are simplex sheets with twelve months divided over one or two pages',()=>{
 for(const [id,count] of [['poster-standard',1],['poster-two-page',2]]){
  const type=domain.definition(id),structure=domain.minimumStructure(type);
  assert.equal(type.family.name,'벽보형');
  assert.equal(domain.validate(type).valid,true);
  assert.equal(structure.surfaceCount,count);assert.equal(structure.sheetCount,count);assert.equal(structure.monthsPerPage,12/count);
  assert.equal(type.printSides,'simplex');assert.equal(type.binding.method,'none');
  for(const key of ['cover','backCover','monthlyFront','monthlyBack'])assert.equal(type.policies[key],'unsupported');
 }
});
test('poster normalization discards desk topology without changing paper size or status',()=>{
 const input=domain.definition('poster-standard');input.printSides='duplex';input.policies.cover='required';input.ranges.frontInsert.max=3;input.finishedSize.width=300;input.status='preparing';
 const value=domain.normalize(input);assert.equal(value.printSides,'simplex');assert.equal(value.ranges.frontInsert.max,0);assert.equal(value.policies.cover,'unsupported');assert.equal(value.finishedSize.width,300);assert.equal(value.status,'preparing');
 const invalid={...value,pageRules:[{role:'annual',kind:'required',min:3,max:3}]};assert.equal(domain.validate(invalid).valid,false);
});


test('poster page count survives database repeatBy null fields on readback',()=>{
 const selected=domain.definition('poster-two-page'),loaded=JSON.parse(JSON.stringify(selected));loaded.pageRules[0].repeatBy=null;
 assert.equal(domain.posterPageCount(loaded),domain.posterPageCount(selected));assert.equal(domain.validate(loaded).valid,true);
});
