import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const source=fs.readFileSync(new URL('../apps/designer-studio/runtime-project-adapter.js',import.meta.url),'utf8');
const context={};vm.createContext(context);vm.runInContext(source,context);

test('runtime project adapter accepts a supplied Dataset without changing the project',()=>{
 const dataset={school:{name:'샘플 학교'},calendar:{year:2027},monthlyQuotes:{'2027-03':{text:'봄'}}};
 const domain={buildRuntimeDataset(){throw new Error('override must be used')},resolvePageBinding(path){return path}};
 const adapter=context.ACDLRuntimeProjectAdapter.create({datasetDomain:domain,parity:{buildDeskAcademicSurfacePlan:()=>[]},pageAdapter:{compose:()=>({pages:[],missing:[],complete:true})}});
 const project={productType:{category:'desk',pageSize:{width:260,height:180,unit:'mm'}},settings:{year:2027,startMonth:3},template:{id:'desk',revision:1,masterElements:{master:[{id:'school',type:'text',binding:'school.name',x:10,y:10,width:20,height:10}]},masters:{}},book:{pageInstances:[{id:'page-1',role:'cover-front',masterId:'master',calendarYear:2027,calendarMonth:3}],elementsByPage:{}}};
 const before=JSON.stringify(project),adapted=adapter.adapt(project,undefined,dataset);
 assert.equal(adapted.dataset,dataset);
 assert.equal(adapted.template.pages[0].objects[0].value,'샘플 학교');
 assert.equal(JSON.stringify(project),before);
});

test('runtime project adapter keeps academic composition separate from Dataset supply',()=>{
 const dataset={calendar:{},monthlyQuotes:{}};
 const adapter=context.ACDLRuntimeProjectAdapter.create({datasetDomain:{buildRuntimeDataset:()=>dataset,resolvePageBinding:path=>path},parity:{buildDeskAcademicSurfacePlan:()=>[{role:'cover-front'}]},pageAdapter:{compose:()=>({pages:[],missing:[],complete:true})}});
 const project={productType:{category:'desk',pageSize:{width:260,height:180}},settings:{year:2027},template:{id:'desk',masterElements:{},masters:{}},book:{pageInstances:[],elementsByPage:{}}};
 const adapted=adapter.adaptDeskAcademic(project,dataset);
 assert.equal(adapted.dataset,dataset);
 assert.equal(adapted.composition.complete,true);
});

test('runtime project adapter blocks invalid user service Dataset before composition',()=>{
 const accepted={dataset:{schemaVersion:'1.0'},diagnostics:[{severity:'error',code:'MISSING_SCHOOL_NAME'}],hasErrors:true};
 let composed=false;
 const adapter=context.ACDLRuntimeProjectAdapter.create({datasetDomain:{},userServiceDataset:{accept:()=>accepted},parity:{buildDeskAcademicSurfacePlan:()=>[]},pageAdapter:{compose:()=>{composed=true;return {pages:[]}}}});
 const result=adapter.adaptUserService({settings:{}},accepted);
 assert.equal(result.hasErrors,true);
 assert.equal(result.template,null);
 assert.equal(composed,false);
});

test('runtime project adapter composes the accepted user service Dataset in shadow mode',()=>{
 const dataset={school:{name:'테스트중학교'},calendar:{},monthlyQuotes:{}};
 const adapter=context.ACDLRuntimeProjectAdapter.create({datasetDomain:{resolvePageBinding:path=>path},userServiceDataset:{accept:result=>result},parity:{buildDeskAcademicSurfacePlan:()=>[{role:'cover-front'}]},pageAdapter:{compose:()=>({pages:[],missing:[],complete:true})}});
 const project={productType:{category:'desk',pageSize:{width:260,height:180}},settings:{year:2027,startMonth:3},template:{id:'desk',masterElements:{},masters:{}},book:{elementsByPage:{}}};
 const adapted=adapter.adaptUserService(project,{dataset,diagnostics:[],hasErrors:false});
 assert.equal(adapted.dataset,dataset);
 assert.equal(adapted.composition.complete,true);
 assert.equal(adapted.hasErrors,false);
});

test('runtime project adapter resolves user assets before shadow composition',async()=>{
 const source={school:{name:'학교'},calendar:{},monthlyImages:{}};
 const resolved={...source,monthlyImages:{'2027-03':{src:'/march.jpg'}}};
 const adapter=context.ACDLRuntimeProjectAdapter.create({datasetDomain:{resolvePageBinding:path=>path},userServiceDataset:{accept:result=>result},userServiceAssets:{resolveDataset:async dataset=>({dataset:resolved,diagnostics:[{severity:'warning',code:'ASSET_NOT_FOUND'}],hasErrors:false})},parity:{buildDeskAcademicSurfacePlan:()=>[]},pageAdapter:{compose:()=>({pages:[],complete:true})}});
 const project={productType:{category:'desk',pageSize:{width:260,height:180}},settings:{year:2027,startMonth:3},template:{id:'desk',masterElements:{},masters:{}},book:{elementsByPage:{}}};
 const result=await adapter.adaptUserServiceWithAssets(project,{dataset:source,diagnostics:[],hasErrors:false});
 assert.equal(result.dataset,resolved);
 assert.equal(result.diagnostics[0].code,'ASSET_NOT_FOUND');
 assert.equal(result.composition.complete,true);
});
