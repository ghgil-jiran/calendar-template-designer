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
