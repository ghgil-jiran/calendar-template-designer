import test from 'node:test';import assert from 'node:assert/strict';
import {createEditorSession,applyEditor} from '../src/lib/editor/session.ts';
import {prepareSnapshot,hydrateSnapshot} from '../src/lib/projects/store.ts';
import {draftSignature} from '../src/lib/projects/signature.ts';
const shared=globalThis.ACDLSharedSchedule;
function source(){return {format:'acdl-project',settings:{year:2027,startMonth:3},productType:{category:'desk',pageSize:{width:260,height:180}},template:{masters:{calendar:{calendarRegion:{x:8,y:18,width:84,height:75},rangeEventStyle:{enabled:true,barHeight:6,labelPosition:'above',labelMode:'first'}}},masterElements:{month:[]},resources:{},userEditing:{preset:'individual'}},book:{school:{name:'학교'},events:[{id:'e',title:'기간 행사',startDate:'2027-03-02',endDate:'2027-03-08',color:'#aa2233'}],pageInstances:[{id:'march',role:'monthly-front',masterId:'month'},{id:'april',role:'monthly-front',masterId:'month'}],elementsByPage:{march:[],april:[]}}};}
test('style presets are explicit, preserve labels and leave legacy rendering unchanged',()=>{const legacy={enabled:false,barHeight:6,labelMode:'first',labelPosition:'above'},before=JSON.stringify(legacy);assert.equal(shared.displaySegment(legacy,{label:'행사',color:'#123456',height:6,fontPx:8}),null);for(const mode of ['bar','text','line']){const v=shared.displayStyle(mode,legacy);assert.equal(v.displayMode,mode);assert.equal(v.enabled,true);assert.equal(v.labelMode,'first');}assert.equal(JSON.stringify(legacy),before);assert.throws(()=>shared.displayStyle('bad'));});
test('text and line labels stay inside their allocated lanes and escape user text',()=>{const ctx={label:'<행사>',color:'#123456',height:20,fontPx:8};const text=shared.displaySegment(shared.displayStyle('text'),ctx),line=shared.displaySegment(shared.displayStyle('line'),ctx);assert.match(text,/&lt;행사&gt;/);assert.doesNotMatch(text,/<i /);assert.match(line,/<i aria-hidden="true"/);assert.match(line,/height:1px/);assert.match(line,/top:13px;height:1px/);assert.match(line,/top:0;height:12px/);});
test('crowded new styles hide excess lanes with per-date counts rather than overlapping labels',()=>{const grid=Array.from({length:7},(_,i)=>({date:`2027-03-0${i+1}`})),layout={maxLanes:4,hiddenByDate:{},segments:[0,1,2].map(lane=>({lane,row:0,startCol:1,span:2}))},next=shared.fitDisplayLanes(layout,shared.displayStyle('line'),grid,64);assert.equal(next.maxLanes,2);assert.equal(next.segments.length,2);assert.deepEqual(next.hiddenByDate,{'2027-03-02':1,'2027-03-03':1});assert.equal(layout.segments.length,3);assert.equal(shared.fitDisplayLanes(layout,{},grid,60),layout);});
test('desk grid selection changes the shared master for all fronts, preserves source/data/geometry and supports undo',()=>{const p=source(),before=JSON.stringify(p),s=createEditorSession({project:p});s.select(s.targets('march').find(t=>t.rights.scheduleStyle));s.setDeskScheduleStyle('text');const state=JSON.parse(JSON.stringify(s.getState())),d=applyEditor(p,state,[]);assert.equal(d.template.masters.calendar.rangeEventStyle.displayMode,'text');assert.deepEqual(d.book,p.book);assert.deepEqual(d.template.masters.calendar.calendarRegion,p.template.masters.calendar.calendarRegion);assert.equal(JSON.stringify(p),before);s.undo();assert.deepEqual(s.getDocument().template.masters.calendar.rangeEventStyle,p.template.masters.calendar.rangeEventStyle);s.redo();assert.equal(s.getDocument().template.masters.calendar.rangeEventStyle.displayMode,'text');assert.throws(()=>applyEditor(p,{...state,edits:[{pageId:'march',scope:'page',elementId:'$calendar-grid',layout:{x:0,y:0,width:50,height:50}}]},[]),/스타일만/);});
test('schedule choice survives snapshot restore and participates in autosave dirty detection',async()=>{const p=source(),s=createEditorSession({project:p});s.select(s.targets('march').find(t=>t.rights.scheduleStyle));s.setDeskScheduleStyle('line');const d={name:'검사',template:{id:'style-test',version:1,name:'검사',fields:[],pages:[{label:'3월 앞면',number:1}],composition:[],widthMm:260,heightMm:180,previewKind:'published'},source:p,school:{values:{name:'학교'},hidden:[]},events:[],photos:[],assignments:{},step:'editor',editorState:s.getState()};s.setDeskScheduleSizing({fontSizePt:7.5,barHeight:18});assert.notEqual(draftSignature(d),draftSignature({...d,editorState:s.getState()}));d.editorState=s.getState();const snap=await prepareSnapshot(d),h=hydrateSnapshot(snap);try{assert.equal(h.record.editorState.deskScheduleStyle,'line');assert.equal(h.record.editorState.deskScheduleSizing.fontSizePt,7.5);assert.equal(h.appliedProject.template.masters.calendar.rangeEventStyle.barHeight,18);assert.equal(h.appliedProject.template.masters.calendar.rangeEventStyle.displayMode,'line');assert.notEqual(draftSignature(d),draftSignature({...d,editorState:{...d.editorState,deskScheduleStyle:'text'}}));}finally{h.urls.forEach(URL.revokeObjectURL);}});

test('schedule sizing applies across all months, survives restore/style switches and supports undo',async()=>{
 const p=source(),s=createEditorSession({project:p});s.select(s.targets('march').find(t=>t.rights.scheduleStyle));
 s.setDeskScheduleSizing({fontSizePt:8.5,barHeight:20});s.setDeskScheduleStyle('bar');
 const state=JSON.parse(JSON.stringify(s.getState())),doc=applyEditor(p,state,[]);
 assert.equal(doc.template.masters.calendar.rangeEventStyle.fontSizePt,8.5);assert.equal(doc.template.masters.calendar.rangeEventStyle.barHeight,20);assert.deepEqual(doc.book,p.book);
 s.setDeskScheduleSizing({barHeight:16});s.undo();assert.equal(s.getDocument().template.masters.calendar.rangeEventStyle.barHeight,20);s.redo();assert.equal(s.getDocument().template.masters.calendar.rangeEventStyle.barHeight,16);
 const restored=createEditorSession({project:p,state});assert.equal(restored.getDocument().template.masters.calendar.rangeEventStyle.barHeight,20);
 assert.equal(applyEditor(p,{...state,deskScheduleSizing:{fontSizePt:3,joinText:true}},[]).template.masters.calendar.rangeEventStyle.joinText,true);
 for(const sizing of [{fontSizePt:2.5},{joinText:'yes'},{fontSizePt:19},{barHeight:0},{barHeight:25},{fontSizePt:NaN},{unknown:2}])assert.throws(()=>applyEditor(p,{...state,deskScheduleSizing:sizing},[]));
 const other=source();other.productType.category='poster';assert.throws(()=>applyEditor(other,state,[]));
});

test('automatic desk sizing counts overlapping range events on each date in displayed months',()=>{
 const events=Array.from({length:4},(_,i)=>({startDate:'2027-03-0'+(i+1),endDate:'2027-03-06'}));
 const pages=[{role:'monthly-front',calendarYear:2027,calendarMonth:3}];
 assert.deepEqual(shared.deskScheduleDefaults(events,pages),{fontSizePt:3.5,barHeight:5});
 assert.deepEqual(shared.deskScheduleDefaults([...events,{startDate:'2027-03-06'}],pages),{fontSizePt:3,barHeight:4});
 assert.deepEqual(shared.deskScheduleDefaults([{startDate:'2027-04-02'}],pages),{});
});

test('desk text ranges default to a date label on the first day and can repeat on each day',()=>{
 const date='2027-03-04', event={title:'행사',startDate:date,endDate:'2027-03-07'};
 const events=[event,{...event,endDate:'2027-04-02'},{...event,endDate:'2028-01-02'},{...event,endDate:date}];
 assert.deepEqual(shared.deskTextEventsForDate(events,date).map(e=>e.title),['행사 (3/4 - 7)','행사 (3/4 - 4/2)','행사 (2027/3/4 - 2028/1/2)','행사']);
 assert.deepEqual(shared.deskTextEventsForDate(events,'2027-03-05'),[]);
 assert.deepEqual(shared.deskTextEventsForDate([event],'2027-03-05',true),[event]);
 const p=source(),s=createEditorSession({project:p});
 s.select(s.targets('march').find(t=>t.rights.scheduleStyle));
 s.setDeskScheduleStyle('text');
 s.setDeskScheduleSizing({rangeEachDay:true,joinText:true});
 const restored=applyEditor(p,JSON.parse(JSON.stringify(s.getState())),[]);
 assert.equal(restored.template.masters.calendar.rangeEventStyle.rangeEachDay,true);
 s.undo();
 assert.equal(s.getDocument().template.masters.calendar.rangeEventStyle.rangeEachDay,undefined);
});

test('vacation rendering marks each covered day and labels the start and next month',()=>{
 const vacation={title:'겨울 방학(12/20-1/20)',startDate:'2027-12-20',endDate:'2028-01-20'};
 assert.equal(shared.isVacationRange(vacation),true);
 assert.equal(shared.isVacationRange({...vacation,title:'방학 중 캠프'}),false);
 assert.deepEqual(shared.vacationOnDate([vacation],'2027-12-20'),{active:true,labels:['방학(12/20 - 1/20)']});
 assert.deepEqual(shared.vacationOnDate([vacation],'2028-01-01'),{active:true,labels:['방학(12/20 - 1/20)']});
 assert.deepEqual(shared.vacationOnDate([vacation],'2028-01-20'),{active:true,labels:[]});
 assert.deepEqual(shared.vacationOnDate([vacation],'2028-01-21'),{active:false,labels:[]});
 const p=source(),s=createEditorSession({project:p});
 s.select(s.targets('march').find(t=>t.rights.scheduleStyle));
 s.setDeskScheduleSizing({showVacationBackground:true});
 assert.equal(applyEditor(p,JSON.parse(JSON.stringify(s.getState())),[]).template.masters.calendar.rangeEventStyle.showVacationBackground,true);
});
