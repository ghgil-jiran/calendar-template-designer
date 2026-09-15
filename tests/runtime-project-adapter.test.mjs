import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const source=fs.readFileSync(new URL('../apps/designer-studio/runtime-project-adapter.js',import.meta.url),'utf8');
const assetSource=fs.readFileSync(new URL('../apps/designer-studio/project-asset-resolver.js',import.meta.url),'utf8');
const context={};vm.createContext(context);vm.runInContext(assetSource,context);vm.runInContext(source,context);

test('runtime distinguishes a usable template fallback from an empty binding value',()=>{
 const {hasRenderableValue}=context.ACDLRuntimeProjectAdapter;
 assert.equal(hasRenderableValue({src:'/sample.jpg'}),true);
 assert.equal(hasRenderableValue('sample'),true);
 assert.equal(hasRenderableValue({}),false);
 assert.equal(hasRenderableValue(''),false);
 assert.equal(hasRenderableValue(null),false);
});

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

test('runtime project adapter resolves an AI background through the shared project asset registry',()=>{
 const dataset={calendar:{},monthlyQuotes:{},assets:[]};
 const adapter=context.ACDLRuntimeProjectAdapter.create({datasetDomain:{buildRuntimeDataset:()=>dataset,resolvePageBinding:path=>path},parity:{buildDeskAcademicSurfacePlan:()=>[]},pageAdapter:{compose:()=>({pages:[],complete:true})}});
 const project={productType:{category:'desk',pageSize:{width:260,height:180}},settings:{year:2027},template:{id:'desk',masterElements:{},resources:{aiDesignAssets:[{id:'ai-cover',kind:'image',src:'https://assets.example/cover.webp'}]}},book:{pageInstances:[{id:'cover',role:'cover-front'}],elementsByPage:{cover:[{id:'bg',type:'image',role:'ai-design-background',assetId:'ai-cover',x:0,y:0,width:100,height:100}]}}};
 context.ACDLProjectAssetResolver.normalize(project);
 const adapted=adapter.adapt(project,undefined,dataset),background=adapted.template.pages[0].objects[0];
 assert.equal(background.value.assetId,'ai-cover');
 assert.equal(background.value.src,'https://assets.example/cover.webp');
 assert.equal(background.value.assetRef.ref,'template');
 assert.equal(background.value.assetRef.id,'ai-cover');
});

test('runtime project adapter normalizes design-type aliases and supplies page-aware widget values',()=>{
 const dataset={calendar:{},monthlyQuotes:{}};
 const adapter=context.ACDLRuntimeProjectAdapter.create({datasetDomain:{buildRuntimeDataset:()=>dataset,resolvePageBinding:path=>path},parity:{buildDeskAcademicSurfacePlan:()=>[]},pageAdapter:{compose:()=>({pages:[],complete:true})}});
 const elements=[
  {id:'frame',type:'frame',x:0,y:0,width:20,height:20,src:'/sample.jpg'},
  {id:'current',type:'mini-calendar',x:0,y:20,width:20,height:20},
  {id:'previous',type:'mini-calendar-prev',x:20,y:20,width:20,height:20},
  {id:'next',type:'mini-calendar-next',x:40,y:20,width:20,height:20},
  {id:'strip',type:'month-date-strip',x:0,y:40,width:80,height:10},
  {id:'memo',type:'memo',memoLayout:'checklist',title:'TO DO',itemCount:7,x:0,y:50,width:30,height:30}
 ];
 const project={productType:{category:'desk',pageSize:{width:260,height:180}},settings:{year:2027},template:{id:'desk',masterElements:{},masters:{}},book:{pageInstances:[{id:'march',role:'monthly-back',calendarYear:2027,calendarMonth:3}],elementsByPage:{march:elements}}};
 const objects=adapter.adapt(project).template.pages[0].objects,index=id=>objects.find(item=>item.id===id);
 assert.equal(index('frame').type,'image-frame');
 assert.deepEqual(JSON.parse(JSON.stringify(index('current').value)),{year:2027,month:3,showWeekday:true,showDate:true});
 assert.equal(index('previous').value.month,2);
 assert.equal(index('next').value.month,4);
 assert.equal(index('strip').value.month,3);
 assert.deepEqual(JSON.parse(JSON.stringify(index('memo').value)),{layout:'checklist',title:'TO DO',lineCount:8,itemCount:7,weekCount:5,showMemo:true});
});

test('runtime project adapter carries the complete calendar master presentation contract',()=>{
 const dataset={calendar:{},monthlyQuotes:{}};
 const adapter=context.ACDLRuntimeProjectAdapter.create({datasetDomain:{buildRuntimeDataset:()=>dataset,resolvePageBinding:path=>path},parity:{buildDeskAcademicSurfacePlan:()=>[]},pageAdapter:{compose:()=>({pages:[],complete:true})}});
 const calendar={rows:6,weekStart:'monday',calendarRegion:{x:4,y:18,width:92,height:76},calendarLayout:{rowsMode:'fixed-6',weekStartsOn:'monday',regions:{titlePercent:21,weekdayPercent:4,dateGridPercent:75}},calendarPreset:{schemaVersion:'monthly-calendar-preset.v1',presetId:'segmented-underline',presetVersion:'1.0.0',supportedRows:[5,6]},calendarOverrides:{gridStyle:'open-rows',lineColor:'#123456',lineWidth:2},design:{monthTitleStyle:'number-inline',weekdayStyle:'outlined-pills',gridStyle:'open-rows'}};
 const project={productType:{category:'desk',pageSize:{width:260,height:180}},settings:{year:2027,calendarRows:5,weekStart:'sunday'},template:{id:'desk',masterElements:{},masters:{calendar}},book:{pageInstances:[{id:'march',role:'monthly-front',calendarYear:2027,calendarMonth:3}],elementsByPage:{march:[]}}};
 const object=adapter.adapt(project).template.pages[0].objects[0];
 assert.equal(object.role,'current-calendar');
 assert.equal(object.value.rows,6);
 assert.equal(object.value.weekStart,'monday');
 assert.equal(object.value.calendarLayout.rowsMode,'fixed-6');
 assert.equal(object.value.calendarOverrides.lineColor,'#123456');
 assert.equal(object.style.design.weekdayStyle,'outlined-pills');
 assert.equal(object.style.calendarPreset.presetId,'segmented-underline');
});

test('runtime project adapter mirrors source pages and master shadow composition',()=>{
 const dataset={calendar:{},monthlyQuotes:{}};
 const adapter=context.ACDLRuntimeProjectAdapter.create({datasetDomain:{buildRuntimeDataset:()=>dataset,resolvePageBinding:path=>path},parity:{buildDeskAcademicSurfacePlan:()=>[]},pageAdapter:{compose:()=>({pages:[],complete:true})}});
 const project={productType:{category:'desk',pageSize:{width:260,height:180}},settings:{year:2027},template:{id:'desk',masterElements:{monthly:[{id:'master-title',type:'text',content:'MASTER',x:0,y:0,width:20,height:10},{id:'master-keep',type:'text',content:'KEEP',x:0,y:10,width:20,height:10}]},masters:{calendar:{}}},book:{pageInstances:[{id:'march-instance',sourcePageId:'march-source',role:'monthly-front',masterId:'monthly',calendarYear:2027,calendarMonth:3}],elementsByPage:{'march-source':[{id:'page-title',shadowOfMasterElementId:'master-title',type:'text',content:'PAGE',x:0,y:0,width:20,height:10},{id:'calendar-explicit',type:'calendar-grid',role:'current-calendar',x:0,y:20,width:100,height:80}]}}};
 const ids=adapter.adapt(project).template.pages[0].objects.map(object=>object.id);
 assert.equal(JSON.stringify(ids),JSON.stringify(['master-keep','page-title','calendar-explicit']));
 assert.equal(ids.includes('march-instance.calendar'),false);
});

test('runtime project adapter keeps physical surface, content purpose, master, and advanced widgets independent',()=>{
 const dataset={calendar:{},monthlyQuotes:{}};
 const adapter=context.ACDLRuntimeProjectAdapter.create({datasetDomain:{buildRuntimeDataset:()=>dataset,resolvePageBinding:path=>path},parity:{buildDeskAcademicSurfacePlan:()=>[]},pageAdapter:{compose:()=>({pages:[],complete:true})}});
 const project={productType:{category:'desk',pageSize:{width:260,height:180}},settings:{year:2032},template:{id:'desk',masterElements:{divider:[{id:'plan',type:'memo',role:'yearly-plan',memoLayout:'yearly-grid',yearlyColumns:4,linesPerMonth:4,baseYear:2032,yearlyLayoutType:'yearly-vertical-groups',yearlyGroupSize:3,yearlyContainerStyle:'vertical-group'}]},masters:{}},book:{pageInstances:[{id:'insert',role:'front-insert-back',contentPurpose:'yearly-plan',masterId:'divider'}],elementsByPage:{insert:[]}}};
 const page=adapter.adapt(project).template.pages[0],plan=page.objects[0];
 assert.equal(page.role,'front-insert-back');
 assert.equal(page.metadata.surfaceRole,'front-insert-back');
 assert.equal(page.metadata.contentPurpose,'yearly-plan');
 assert.equal(page.metadata.masterId,'divider');
 assert.equal(plan.runtimeWidget.yearlyColumns,4);
 assert.equal(plan.runtimeWidget.yearlyLayoutType,'yearly-vertical-groups');
 assert.equal(plan.runtimeWidget.yearlyContainerStyle,'vertical-group');
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
