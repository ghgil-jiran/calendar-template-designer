import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

await import('../apps/designer-studio/inspector-element.js');
await import('../apps/designer-studio/canvas-geometry.js');
await import('../apps/designer-studio/canvas-gesture.js');
await import('../apps/designer-studio/canvas-selection.js');
await import('../apps/designer-studio/persistence-history.js');
const editing=fs.readFileSync(new URL('../apps/designer-studio/features/object-editing.js',import.meta.url),'utf8');
const core=fs.readFileSync(new URL('../apps/designer-studio/features/studio-runtime-core.js',import.meta.url),'utf8');

function monthlyFixture(){
 const logo=id=>({id,type:'semantic-object',role:'school-logo',binding:'school.profile.logo',x:68,y:11,width:27,height:9,style:{color:'#123456'}});
 const first=logo('march.logo'),second=logo('april.logo');
 const project={productType:{category:'desk'},template:{masterElements:{}},book:{pageInstances:[{id:'march',role:'monthly-front'},{id:'april',role:'monthly-front'}],elementsByPage:{march:[first],april:[second]}}};
 const c=vm.createContext({project,structuredClone,window:{ACDLInspectorElement:globalThis.ACDLInspectorElement},selectedElementId:first.id,selectedElementScope:'page',fields:{elemX:{value:'55'},elemY:{value:'14'},elemW:{value:'27'},elemH:{value:'9'}},pendingCanvasGeometrySaveId:first.id,inspectorDirty:false,history:[],handlers:{},showEditorToast(){},markDirty(){},render(){}});
 vm.runInContext(`function selectedPage(){return project.book.pageInstances[0]}function pageElements(page=selectedPage()){return project.book.elementsByPage[page.id]}function sourceElement(){return pageElements().find(item=>item.id===selectedElementId)}function snapshot(){history.push(structuredClone(project))}function changeElement(fn){snapshot();fn(sourceElement());render()}function el(id){return fields[id]}function bind(id,fn){handlers[id]=fn}`,c);
 vm.runInContext(editing.slice(editing.indexOf('function canonicalMasterIdForPage('),editing.indexOf('function verifyMonthlyMasterPropagation(')),c);
 vm.runInContext(editing.slice(editing.indexOf('function monthlyMasterLabel('),editing.indexOf('function promoteSelectedToMonthlyMaster(')),c);
 vm.runInContext(editing.split('\n').find(line=>line.startsWith(' bind("applyElementGeometry"')),c);
 return {c,first,second};
}

test('saving a duplicated monthly logo changes only the selected copy',()=>{
 const {c,first,second}=monthlyFixture(),copy=structuredClone(first);copy.id='march.logo.copy';copy.x=71;copy.y=14;c.project.book.elementsByPage.march.push(copy);c.selectedElementId=copy.id;
 c.handlers.applyElementGeometry();
 assert.deepEqual([copy.x,copy.y],[55,14]);
 assert.deepEqual([first.x,first.y,second.x,second.y],[68,11,68,11]);
 assert.equal(c.project.book.elementsByPage.march.length,2);
 assert.equal(c.history.length,1);
});

test('explicit Apply All still copies to the corresponding month',()=>{
 const {c,first,second}=monthlyFixture();c.handlers.applyElementGeometry();
 assert.equal(second.x,68);
 vm.runInContext('applySelectedMonthlySettings("geometry")',c);
 assert.deepEqual([first.x,first.y,second.x,second.y],[55,14,55,14]);
});

test('Apply All never guesses between duplicates or different data bindings',()=>{
 const {c,first,second}=monthlyFixture();
 const different={...structuredClone(first),id:'march.address',binding:'school.address'};
 c.project.book.elementsByPage.march.push(different);
 assert.deepEqual(Array.from(vm.runInContext('matchingMonthlyObjectsFor(sourceElement()).map(item=>item.id)',c)),[first.id,second.id]);
 c.project.book.elementsByPage.march.push({...structuredClone(first),id:'march.copy'});
 first.x=55;vm.runInContext('applySelectedMonthlySettings("geometry")',c);
 assert.equal(second.x,68);assert.equal(different.x,68);assert.equal(c.history.length,0);
});

test('explicit monthly matching distinguishes month-back components',()=>{
 const {c,first,second}=monthlyFixture();
 for(const page of c.project.book.pageInstances)page.role='monthly-back';
 Object.assign(first,{type:'memo',role:'ai-month-back-component',aiDesignComponent:'memo',memoLayout:'lines',title:'MEMO'});
 Object.assign(second,structuredClone(first),{id:'april.memo'});
 c.project.book.elementsByPage.april.push({...structuredClone(second),id:'april.checklist',aiDesignComponent:'todo',memoLayout:'checklist'});
 assert.deepEqual(Array.from(vm.runInContext('matchingMonthlyObjectsFor(sourceElement()).map(item=>item.id)',c)),[first.id,second.id]);
});

test('a locked member keeps its frame during a group drag',()=>{
 const free={id:'free',x:28,y:51,width:19,height:27},locked={id:'locked',locked:true,x:7,y:51,width:19,height:27};
 const gesture=globalThis.ACDLCanvasGesture.begin({pointerId:1,startX:0,startY:0,handle:'move',rect:{left:0,top:0,width:100,height:100},views:[{item:free},{item:locked}],primary:{item:free}});
 globalThis.ACDLCanvasGesture.update(gesture,{clientX:3,clientY:2});
 assert.deepEqual([free.x,free.y],[31,53]);assert.deepEqual([locked.x,locked.y],[7,51]);
});

test('history restoration removes a selection whose object no longer exists',()=>{
 const items=new Map([['year',{id:'year'}]]),selection=globalThis.ACDLCanvasSelection.createSelectionStore(id=>items.get(id));
 selection.selectOnly('year','page');items.delete('year');
 assert.equal(selection.sync({id:'year',scope:'page'}),null);assert.deepEqual(selection.views(),[]);
});

test('selecting a Master in page insertion scope preserves redo and never detaches it',()=>{
 const item={id:'master.year',type:'text',x:16,y:10,width:68,height:12},listeners={};
 const box={dataset:{elementId:item.id,scope:'master'},classList:{add(){}},style:{}};
 const c=vm.createContext({project:{},selectedElementId:null,selectedElementScope:null,inspectorDirty:false,preview:false,history:[],future:['redo'],structuredClone,renderFreeElements(){},resetEditorViewState(){},masterElements:()=>[item],pageElements:()=>[],sourceElement:()=>item,confirmDiscardInspectorChanges:()=>true,markDirty(){},render(){},renderInspector(){},renderObjectRecommendations(){},el:id=>id==='page'?{getBoundingClientRect:()=>({left:0,top:0,width:100,height:100})}:{value:'page'},document:{addEventListener:(name,fn)=>listeners[name]=fn},window:{ACDLCanvasSelection:globalThis.ACDLCanvasSelection,ACDLCanvasGesture:globalThis.ACDLCanvasGesture,ACDLCanvasInput:{capturePointer:()=>()=>{}}}});
 vm.runInContext('function snapshot(){history.push("snapshot");future=[]}',c);
 vm.runInContext(fs.readFileSync(new URL('../apps/designer-studio/features/object-editing-sprint2-runtime.js',import.meta.url),'utf8'),c);
 const event={currentTarget:box,target:{dataset:{}},pointerId:1,clientX:30,clientY:20,preventDefault(){},stopPropagation(){}};
 c.startElementPointer(event);c.endElementPointer(event);
 assert.equal(c.history.length,0);assert.deepEqual(Array.from(c.future),['redo']);assert.equal(c.selectedElementId,item.id);assert.equal(c.selectedElementScope,'master');
});

test('only an explicit page override detaches a Master and preserves its other pages',()=>{
 const master={id:'master.logo',x:68,y:11,width:27,height:9},locals=[];
 const c=vm.createContext({masterElements:()=>[master],pageElements:()=>locals,selectedElementId:master.id,selectedElementScope:'master',structuredClone,Date,Math});
 vm.runInContext(editing.slice(editing.indexOf('function ensureCurrentPageEditTarget('),editing.indexOf('function maxZ(')),c);
 assert.equal(c.ensureCurrentPageEditTarget().item,master);assert.equal(locals.length,0);
 const detached=c.ensureCurrentPageEditTarget(master.id,'master',{explicit:true});
 assert.equal(detached.created,true);assert.equal(detached.item.shadowOfMasterElementId,master.id);detached.item.x=55;
 assert.equal(master.x,68);assert.equal(locals.length,1);assert.equal(c.selectedElementScope,'page');
 assert.equal(c.ensureCurrentPageEditTarget(master.id,'master',{explicit:true}).created,false);
});

test('undo and redo reset stale inspector values and pending canvas saves',()=>{
 const codec=globalThis.ACDLPersistenceHistory.createHistoryCodec(),make=x=>({template:{masterElements:{}},book:{pageInstances:[{id:'cover',masterId:'cover.master'}],elementsByPage:{cover:[{id:'year',x}]}}});
 const listeners={},c=vm.createContext({project:make(18.4),selectedPageId:'cover',selectedElementId:'year',selectedElementScope:'page',calendarEditing:false,monthTitleEditing:false,history:[codec.stringify(make(16))],future:[],__historyParse:codec.parse,__historyString:codec.stringify,inspectorDirty:true,inspectorTracked:[],inspectorSavedContainer:null,inspectorRenderedKey:'stale',inspectorRenderVersion:1,pendingCanvasGeometrySaveId:'year',semanticImageDraft:'draft',semanticImageDraftElementId:'year',pendingImageElementId:'year',pendingImageElementScope:'page',pendingSemanticRole:'school-logo',window:{ACDLSprint2Editor:{cancelInteraction(){}}},el:id=>({addEventListener:(_event,fn)=>listeners[id]=fn}),showEditorToast(){},markDirty(){}});
 vm.runInContext('function selectedPage(){return project.book.pageInstances.find(page=>page.id===selectedPageId)}function render(){renderedX=project.book.elementsByPage.cover[0].x;drafts=captureInspectorDrafts()}',c);
 vm.runInContext(editing.slice(editing.indexOf('function resetInspectorEditState('),editing.indexOf('function registerInspectorSaveButton(')),c);
 vm.runInContext(core.slice(core.indexOf('function restoreHistoryProject('),core.indexOf('el("publishBtn")')),c);
 listeners.undoBtn();assert.equal(c.renderedX,16);assert.equal(c.inspectorDirty,false);assert.equal(c.pendingCanvasGeometrySaveId,null);assert.equal(c.semanticImageDraft,null);assert.equal(c.drafts.length,0);
 c.inspectorDirty=true;c.pendingCanvasGeometrySaveId='year';listeners.redoBtn();
 assert.equal(c.renderedX,18.4);assert.equal(c.inspectorDirty,false);assert.equal(c.pendingCanvasGeometrySaveId,null);assert.equal(c.drafts.length,0);
});
