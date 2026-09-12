import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync(new URL('../apps/designer-studio/calendar-type-domain.js',import.meta.url),'utf8');
const context={window:{}};vm.runInNewContext(source,context);const domain=context.window.ACDLCalendarTypeDomain;

test('initial catalog contains only production calendar types',()=>{
 const types=domain.initialDefinitions(),ids=types.map(type=>type.id);
 assert.equal(types.length,8);
 assert.deepEqual([...ids],['desk-standard','desk-large','desk-portrait','desk-wide','poster-standard','wall-standard','wall-large','wall-large-plus']);
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

test('validation enforces production size and allowed ranges',()=>{
 const type=domain.definition('desk-standard');type.productionSize.width=100;type.ranges.frontInsert={min:4,max:2};const result=domain.validate(type);assert.equal(result.valid,false);assert.equal(result.errors.length,2);
});

test('desk minimum is 26 surfaces when cover back shares the first monthly back',()=>{
 const type=domain.definition('desk-standard');
 assert.deepEqual(JSON.parse(JSON.stringify(domain.minimumStructure(type))),{surfaceCount:26,sheetCount:13,monthCount:12});
 assert.equal(domain.normalize(type).policies.backCoverBack,'unsupported');
 type.coverBackMode='separate';
 assert.equal(domain.minimumStructure(type).surfaceCount,28);
 assert.equal(domain.normalize(type).policies.backCoverBack,'required');
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
