import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const base=new URL('../apps/designer-studio/',import.meta.url);
const read=name=>fs.readFileSync(new URL(name,base),'utf8');
function context(){
 const c={console,queueMicrotask,setTimeout:()=>{},Event};c.window=c;c.globalThis=c;vm.createContext(c);
 for(const file of ['photo-frame-model.js','shared-screen-composition.js','page-composition-runtime.js','shared-screen-mini-calendar.js','shared-screen-schedule.js','shared-page-object-model.js','inspector-element.js','inspector-form.js','persistence-project.js'])vm.runInContext(read(file),c);
 c.project={settings:{year:2027,startMonth:3,weekStart:'sunday'},template:{metadata:{},masterElements:{}},book:{events:[{startDate:'2027-03-02',title:'입학식',category:'school'}],pageInstances:[{id:'p',role:'monthly-back',calendarYear:2027,calendarMonth:3}],elementsByPage:{p:[]}}};
 c.selectedPage=()=>c.project.book.pageInstances[0];c.v21Escape=x=>String(x);c.schoolBindingValue=()=>'';
 const source=read('features/object-editing.js');
 for(const name of ['renderWidgetContent','resolveTextContent']){const start=source.indexOf('function '+name+'('),end=source.indexOf('\nfunction ',start+1);vm.runInContext(source.slice(start,end),c);}
 const workspace=read('features/template-settings-workspace-runtime.js'),ws=workspace.indexOf(' const oldResolve='),we=workspace.indexOf(' // Make text color authoritative',ws);vm.runInContext(workspace.slice(ws,we),c);
 return c;
}
test('all schedule modes paint authored typography and retain it after project save and load',()=>{
 const c=context();
 for(const mode of ['monthly-schedule','month','all','limit','year-by-month']){
  const item={id:mode,type:mode==='monthly-schedule'?mode:'event-list',displayMode:mode,startMonth:3,width:35,height:28,style:{}};
  const original=c.renderWidgetContent(item,c.selectedPage());
  item.style={fontSize:14,fontFamily:'Arial',fontWeight:700,color:'#ff0000',titleSize:18,titleBackground:'#abcdef',contentBackground:'#ededed',containerBorderWidth:2,titlePosition:'bottom'};
  const changed=c.renderWidgetContent(item,c.selectedPage());assert.notEqual(changed,original,mode);assert.match(changed,/Arial/);assert.match(changed,/#ff0000/);
  c.project.book.elementsByPage.p=[item];const saved=c.ACDLPersistenceProject.serialize(c.project);c.project=c.ACDLPersistenceProject.deserialize(saved);
  assert.equal(c.renderWidgetContent(c.project.book.elementsByPage.p[0],c.selectedPage()),changed,mode+' roundtrip');
 }
});
test('fixed Yearly Plan month text remains fixed after save, while automatic month labels still advance years',()=>{
 const c=context(),item={id:'month',type:'text',role:'yearly-plan-month',format:'plan-month',binding:'calendar.year',planStartMonth:3,planMonthOffset:11};
 assert.equal(c.resolveTextContent(item,c.selectedPage()),'2 FEB · 2028');
 c.ACDLInspectorElement.apply(item,'text-content',{content:'직접 입력한 월 제목',binding:''});c.project.book.elementsByPage.p=[item];
 c.project=c.ACDLPersistenceProject.deserialize(c.ACDLPersistenceProject.serialize(c.project));
 assert.equal(c.resolveTextContent(c.project.book.elementsByPage.p[0],c.selectedPage()),'직접 입력한 월 제목');
});
test('serialization and dirty hash do not mutate the source or create split objects until loaded',()=>{
 const c=context();c.project.book.elementsByPage.p=[{id:'plan',type:'memo',memoLayout:'yearly-grid',title:'Yearly Plan',x:5,y:5,width:90,height:90,startMonth:3}];
 const before=JSON.stringify(c.project),saved=c.ACDLPersistenceProject.serialize(c.project);c.ACDLPersistenceProject.hash(c.project);assert.equal(JSON.stringify(c.project),before);
 const loaded=c.ACDLPersistenceProject.deserialize(saved);assert.equal(loaded.book.elementsByPage.p.filter(e=>e.role==='yearly-plan-month').length,12);
 assert.equal(c.ACDLPersistenceProject.serialize(loaded),saved);
});
test('authored monthly title wins over automatic month title and markup escapes input',()=>{
 const c=context(),item={type:'event-list',displayMode:'month',title:'<직접 제목>',style:{},width:35,height:28};
 const html=c.renderWidgetContent(item,c.selectedPage());assert.match(html,/&lt;직접 제목&gt;/);assert.doesNotMatch(html,/3월 학사일정/);
});
function classes(){const values=new Set();return {add:x=>values.add(x),remove:x=>values.delete(x),contains:x=>values.has(x),toggle:(x,on)=>on?values.add(x):values.delete(x)};}
function control(id,value){const listeners={};return {id,type:'text',value,checked:false,min:'',max:'',classList:classes(),addEventListener:(name,fn)=>(listeners[name]||=[]).push(fn),emit:name=>(listeners[name]||[]).forEach(fn=>fn()),closest:()=>null};}
test('late-added style section shares dirty tracking and preserving other section drafts',()=>{
 const c=context(),source=read('features/object-editing.js'),start=source.indexOf('let inspectorTracked=[];'),end=source.indexOf('function confirmDiscardInspectorChanges()',start);
 c.selectedElementId='item';c.selectedElementScope='page';c.calendarEditing=false;c.monthTitleEditing=false;c.inspectorDirty=false;c.inspectorNotice={type:'ready'};c.sourceElement=()=>({id:'item'});c.semanticImageDraftElementId=null;c.pendingCanvasGeometrySaveId=null;c.setInspectorNotice=()=>{};c.showEditorToast=()=>{};c.INSPECTOR_SAVE_MESSAGES={};
 const content=control('content','original'),style=control('style','10');
 const group=fields=>({querySelectorAll:selector=>selector==='input[type="number"]'||selector==='input[pattern]'?[]:fields,classList:classes()});
 const makeButton=(id,container)=>({...control(id,''),closest:()=>container,dataset:{}});
 const a=makeButton('applyTextContent',group([content])),b=makeButton('savePageWidgetStyles',group([style]));
 c.inspectorContainerFor=button=>button.closest();c.inspectorSignature=container=>c.ACDLInspectorForm.signature(container);c.validateInspectorContainer=container=>c.ACDLInspectorForm.validate(container);
 vm.runInContext(source.slice(start,end),c);c.registerInspectorSaveButton(a);c.registerInspectorSaveButton(b);
 assert.equal(a.disabled,true);assert.equal(b.disabled,true);content.value='unsaved content';content.emit('input');style.value='20';style.emit('input');style.value='10';style.emit('input');assert.equal(c.inspectorDirty,true);assert.equal(b.disabled,true);
 style.value='20';style.emit('input');vm.runInContext('inspectorRenderedKey=inspectorSelectionKey();',c);
 b.emit('click',{preventDefault(){},stopImmediatePropagation(){}});
 const drafts=c.captureInspectorDrafts();assert.equal(drafts.length,1);assert.equal(drafts[0].value,'unsaved content');
});

test('final canvas renderer applies saved rotation to text, photos and widgets without doubling graphic rotation',()=>{
 const c=context(),src=read('features/studio-runtime-core.js');
 const nodes=[];const node=tag=>({tag,dataset:{},style:{},children:[],appendChild(child){this.children.push(child)},addEventListener(){},classList:classes()});
 c.document={createElement:tag=>{const value=node(tag);nodes.push(value);return value}};
 c.allVisibleElements=()=>[{id:'t',type:'text',content:'rotate',rotation:15},{id:'i',type:'image',src:'https://test.invalid/img.png',rotation:25},{id:'w',type:'memo',hideTitle:true,lineCount:4,rotation:35},{id:'s',type:'shape',rotation:45}].map(e=>({...e,x:1,y:1,width:20,height:20,_scope:'page'}));
 c.selectedElementId=null;c.selectedElementScope=null;c.preview=true;c.resolveElementImageSource=v=>v.src;c.applyTextElementStyles=()=>{};c.startElementPointer=()=>{};c.graphicMarkup=()=>'<svg/>';
 const start=src.indexOf('renderFreeElements=function(pageNode){',src.indexOf('const v28RenderFreeElements'));
 const end=src.indexOf('\nfunction permissionHTML',start);vm.runInContext(src.slice(start,end),c);
 c.renderFreeElements(node('page'));
 for(const [id,angle] of [['t',15],['i',25],['w',35]])assert.equal(nodes.find(n=>n.dataset.elementId===id).style.transform,`rotate(${angle}deg)`);
 assert.equal(nodes.find(n=>n.dataset.elementId==='s').style.transform,undefined);
 const gs=src.indexOf('function graphicMarkup('),ge=src.indexOf('\nconst v28RenderFreeElements',gs);vm.runInContext(src.slice(gs,ge),c);
 let stroke;c.shapeSVG=(_type,_fill,_color,width)=>{stroke=width;return '<svg/>'};c.graphicMarkup({type:'shape',style:{strokeWidth:0}});assert.equal(stroke,0);
 assert.match(c.graphicMarkup({type:'image-frame',image:{src:'x'},style:{strokeWidth:0}}),/--frame-border-width:0px/);
});
test('shared schedule fitting respects manual type and the configured minimum without losing column choices',()=>{
 const c=context(),values={};const list={style:{setProperty:(key,value)=>{values[key]=value}},querySelectorAll:()=>Array(24),clientHeight:60,clientWidth:200,get scrollHeight(){return Number.parseFloat(values['--event-list-font-size']||'12')*10},scrollWidth:100};
 const warning={};const widget={dataset:{eventColumns:'2',eventFontSize:'12',eventMinFontSize:'5',eventFit:'auto'},classList:classes(),querySelector:selector=>selector==='.annual-event-items'?list:warning};
 const fit=c.ACDLSharedSchedule.fitEventList(widget);assert.equal(fit.fontSize,6);assert.equal(fit.columns,2);assert.equal(fit.overflow,false);
 widget.dataset.eventFit='manual';assert.equal(c.ACDLSharedSchedule.fitEventList(widget).fontSize,12);assert.equal(widget.classList.contains('has-event-overflow'),true);
});

test('workspace wrappers preserve the shared annual renderer and formatted Yearly Plan labels',()=>{
 const c=context(),source=read('features/template-settings-workspace-runtime.js');
 assert.doesNotMatch(source,/window\.renderWidgetContent\s*=/);
 const item={type:'year-calendar',startMonth:3,style:{dateSize:12,dayGridStyle:'boxes'}};assert.match(c.renderWidgetContent(item,c.selectedPage()),/font-size:12px/);assert.match(c.renderWidgetContent(item,c.selectedPage()),/annual-day/);
 assert.equal(c.resolveTextContent({type:'text',role:'yearly-plan-month',binding:'calendar.year',format:'plan-month',planStartMonth:3,planMonthOffset:11},c.selectedPage()),'2 FEB · 2028');
});

test('all content/style/layout save buttons participate in shared validation and dirty tracking',()=>{
 const source=read('features/object-editing.js'),start=source.indexOf('const INSPECTOR_SAVE_MESSAGES='),end=source.indexOf('const INSPECTOR_SAVE_IDS',start),map=source.slice(start,end);
 for(const id of ['applyEventListWidget','applyEventListLayout','applyMiniCalendarContent','applyMiniCalendarStyle','applyDateStripContent','applyDateStripDesign','applyMonthlyQuoteContent','applyMonthlyQuoteStyle','applyGraphicStyle','applyGraphicLayout','applyFrameImage'])assert.match(map,new RegExp(id+':'));
});
