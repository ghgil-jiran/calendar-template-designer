import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import '../apps/designer-studio/wall-calendar-policy.js';
import '../apps/designer-studio/shared-screen-font-catalog.js';
import '../apps/designer-studio/project-document.js';
import '../apps/designer-studio/calendar-type-domain.js';
import '../apps/designer-studio/poster-one-page-sample.js';
import '../apps/designer-studio/poster-two-page-sample.js';
import '../apps/designer-studio/wall-sample-b.js';
import '../apps/designer-studio/shared-screen-calendar-annotations.js';
import '../apps/designer-studio/shared-screen-mini-calendar.js';
const wall=ACDLWallCalendar,mini=ACDLSharedMiniCalendar,grid=(p,i)=>p.book.elementsByPage[p.book.pageInstances[i].id].find(e=>e.academicPoster);
function inspector(project=ACDLWallSampleB.create()){
 const nodes=new Map();let html='';
 function node(id,attrs=''){const listeners=new Map();return {id,disabled:false,value:attrs.match(/value="([^"]*)"/)?.[1]||'',checked:/\bchecked\b/.test(attrs),min:attrs.match(/min="([^"]*)"/)?.[1]||'',max:attrs.match(/max="([^"]*)"/)?.[1]||'',after(){},addEventListener(name,fn){listeners.set(name,[...(listeners.get(name)||[]),fn]);},dispatchEvent(e){for(const fn of listeners.get(e.type)||[])fn(e);this['on'+e.type]?.(e);}};}
 const panel={get innerHTML(){return html},set innerHTML(value){html=value;nodes.clear();for(const m of value.matchAll(/<[a-z]+\b([^>]*\bid="([^"]+)"[^>]*)>/g))nodes.set(m[2],node(m[2],m[1]));for(const m of value.matchAll(/<select\b[^>]*id="([^"]+)"[^>]*>([\s\S]*?)<\/select>/g)){const opts=[...m[2].matchAll(/<option([^>]*)>([^<]*)<\/option>/g)],selected=opts.find(o=>/selected/.test(o[1]))||opts[0];nodes.get(m[1]).value=selected?.[1].match(/value="([^"]*)"/)?.[1]??selected?.[2]??'';}},querySelectorAll:()=>[]};
 const ctx=vm.createContext({ACDLFontCatalog:globalThis.ACDLFontCatalog,ACDLWallCalendar:wall,ACDLSharedMiniCalendar:mini,project,renderInspector(){},sourceElement:()=>grid(project,0),selectedPage:()=>project.book.pageInstances[0],document:{createElement:()=>({}),getElementById:id=>id==='inspector'?{querySelector:()=>panel}:nodes.get(id),querySelector:()=>null},inspectorTracked:[],registerInspectorSaveButton(){},change:fn=>fn(),confirmDiscardInspectorChanges:()=>true,Event:class {constructor(type){this.type=type}},structuredClone});ctx.window=ctx;vm.runInContext(fs.readFileSync(new URL('../apps/designer-studio/wall-calendar-editor.js',import.meta.url),'utf8'),ctx);ctx.renderInspector();
 return {project,ctx,nodes,panel,apply:()=>nodes.get('wallApply').onclick(),change(key,value){const n=nodes.get('wall'+key);if(typeof value==='boolean')n.checked=value;else n.value=String(value);n.dispatchEvent({type:'change'});}};
}
test('cell-mode typography is immediately visible and only the relevant controls are enabled',()=>{const ui=inspector();assert.match(ui.panel.innerHTML,/data-wall-section="cell-info" open/);for(const key of ['eventPt','referencePt'])assert.equal(ui.nodes.get('wall'+key).disabled,false);assert.equal(ui.nodes.get('walllistPt').disabled,true);assert.match(ui.panel.innerHTML,/wall-check-copy/);assert.equal(ui.nodes.get('walleventPt').min,'3');assert.equal(ui.nodes.get('walleventPt').max,'24');ui.change('StylePreset','minimal');assert.equal(ui.nodes.get('walleventPt').disabled,true);assert.equal(ui.nodes.get('wallreferencePt').disabled,true);assert.equal(ui.nodes.get('walllistPt').disabled,false);ui.apply();assert.equal(grid(ui.project,0).wallCalendarSettings.eventPt,9);ui.change('schedulePlacement','both');assert.equal(ui.nodes.get('walleventPt').disabled,false);assert.equal(ui.nodes.get('walllistPt').disabled,false);});
test('actual inspector applies font sizes and month arrangement to both sheets without changing their identities',()=>{const ui=inspector(),p=ui.project,before=structuredClone(p.book.pageInstances);ui.change('eventPt',14.2);ui.change('referencePt',11.3);ui.change('listPt',12.4);ui.change('Columns',3);ui.change('AllPages',true);ui.apply();const reopened=JSON.parse(JSON.stringify(p));for(const i of [0,1]){const e=grid(reopened,i),v=wall.resolve(e,reopened);assert.equal(e.columns,3);assert.equal(v.eventPt,14.2);assert.equal(v.referencePt,11.3);assert.equal(v.listPt,12.4);}assert.deepEqual(reopened.book.pageInstances,before);assert.deepEqual([grid(p,0).posterMonthOffset,grid(p,1).posterMonthOffset],[0,6]);});
test('per-month scope disables common layout, ignores old per-month gaps and retains the global gap',()=>{const p=ACDLWallSampleB.create();grid(p,0).wallMonthOverrides={3:{gapMm:12,eventPt:11}};const ui=inspector(p);ui.ctx.wallCalendarMonthScope='3';ui.ctx.renderInspector();assert.equal(ui.nodes.get('wallgapMm').disabled,true);assert.equal(ui.nodes.get('wallColumns').disabled,true);assert.equal(ui.nodes.get('wallResetMonths').disabled,true);assert.equal(ui.nodes.get('wallgapMm').value,'6');ui.change('eventPt',14);ui.apply();assert.equal(grid(p,0).wallMonthOverrides[3].gapMm,undefined);assert.equal(wall.resolve(grid(p,0),p,3).gapMm,6);assert.equal(wall.resolve(grid(p,0),p,3).eventPt,14);assert.equal(wall.resolve(grid(p,0),p,4).eventPt,9);});
test('month overrides survive by default and reset only when explicitly selected, across both pages',()=>{const p=ACDLWallSampleB.create();grid(p,0).wallMonthOverrides={3:{eventPt:20}};grid(p,1).wallMonthOverrides={9:{eventPt:18}};const ui=inspector(p);assert.match(ui.panel.innerHTML,/월별 개별 설정 1개/);ui.change('eventPt',13);ui.change('AllPages',true);ui.apply();assert.equal(wall.resolve(grid(p,0),p,3).eventPt,20);assert.equal(wall.resolve(grid(p,1),p,9).eventPt,18);ui.change('ResetMonths',true);ui.apply();for(const i of [0,1]){assert.equal(grid(p,i).wallMonthOverrides,undefined);assert.equal(wall.resolve(grid(p,i),p).eventPt,13);}});
test('shared arrangement leaves a different month-count layout intact',()=>{const p=ACDLWallSampleB.create(),a=grid(p,0),b=grid(p,1);b.monthCount=12;b.columns=4;wall.apply(p,a,wall.resolve(a,p),{allPages:true,columns:3});assert.equal(a.columns,3);assert.equal(b.columns,4);assert.equal(b.monthCount,12);});
test('boxed date grid closes every left edge and bottom row; horizontal and no-line styles remain distinct',()=>{const p=ACDLWallSampleB.create(),page=p.book.pageInstances[0],e=grid(p,0),render=()=>mini.renderPosterCalendarMarkup(mini.resolveAnnualCalendar(e,page,p.settings),e,p),cells=()=>[...render().matchAll(/data-poster-date="[^"]+" data-wall-region="day" style="([^"]*)"/g)].slice(0,42).map(m=>m[1]);for(const [i,style] of cells().entries()){assert.equal(style.includes('border-left:'),i%7===0);assert.equal(style.includes('border-bottom:'),i>=35);}e.wallCalendarSettings.gridStyle='horizontal';for(const [i,style] of cells().entries()){assert.equal(style.includes('border-left:'),false);assert.equal(style.includes('border-right:'),false);assert.equal(style.includes('border-bottom:'),i>=35);}e.wallCalendarSettings.gridStyle='none';for(const style of cells()){assert.match(style,/border-top:0;/);assert.doesNotMatch(style,/border-(left|right|bottom):/);}});

test('small type preserves exact values through save/reopen and warns without blocking',()=>{const ui=inspector();ui.change('eventPt',5.2);ui.change('referencePt',5.5);assert.match(ui.nodes.get('wallSmallTypeHint').textContent,/6pt 미만/);ui.apply();const p=JSON.parse(JSON.stringify(ui.project));assert.equal(wall.resolve(grid(p,0),p).eventPt,5.2);assert.equal(wall.resolve(grid(p,0),p).referencePt,5.5);ui.change('eventPt',6);ui.change('referencePt',6);assert.equal(ui.nodes.get('wallSmallTypeHint').textContent,'');});

test('below and side layouts share the inspector and keep their saved arrangement',()=>{
 for(const [style,position,columns] of [['basic-2-1','bottom',3],['basic-1-2','right',2]]){
  const project=ACDLWallSampleB.create(),item=grid(project,0);
  item.monthCount=12;
  item.columns=columns;
  item.wallCalendarSettings={...wall.presets[style],listWidthPercent:47,columnGapMm:3,rowGapMm:6};
  const ui=inspector(project);
  assert.match(ui.panel.innerHTML,/data-wall-section="list"/);
  assert.match(ui.panel.innerHTML,/data-wall-section="cell-info"/);
  assert.equal(ui.nodes.get('wallStylePreset').value,style);
  assert.equal(ui.nodes.get('walllistPosition').value,position);
  ui.change('listPt',10);
  ui.apply();
  assert.equal(item.columns,columns);
  assert.equal(item.wallCalendarSettings.listPosition,position);
  assert.equal(item.wallCalendarSettings.listWidthPercent,47);
  assert.equal(item.wallCalendarSettings.columnGapMm,3);
  assert.equal(item.wallCalendarSettings.rowGapMm,6);
  assert.equal(wall.presetName(item.wallCalendarSettings),style);
 }
});

test('poster auto-fit and tracking settings survive applying and reopening',()=>{
 const ui=inspector();
 ui.change('cellAutoFit',true);
 ui.change('listAutoFit',true);
 ui.change('scheduleTracking',-.04);
 ui.apply();
 const reopened=inspector(JSON.parse(JSON.stringify(ui.project)));
 assert.equal(reopened.nodes.get('wallcellAutoFit').checked,true);
 assert.equal(reopened.nodes.get('walllistAutoFit').checked,true);
 assert.equal(reopened.nodes.get('wallscheduleTracking').value,'-0.04');
});

test('cell fit tests leading before shrinking and stops at 3pt on overflow',()=>{
 const values={};
 let required=4.2;
 const cell={clientHeight:10,clientWidth:10,scrollWidth:10,
  get scrollHeight(){return parseFloat(values['--wall-cell-fit-size'])*Number(values['--wall-cell-fit-leading'])>required?12:10;}};
 const wallGrid={clientHeight:100,querySelectorAll:()=>[{closest:()=>cell}]};
 const month={querySelector:selector=>selector==='[data-wall-grid]'?wallGrid:null,
  dataset:{wallCellFit:'4',wallPtUnit:'1'},style:{setProperty:(key,value)=>{values[key]=value;}}};
 const scope={querySelectorAll:selector=>selector==='[data-wall-cell-fit]'?[month]:[]};
 wall.fit(scope);
 assert.equal(values['--wall-cell-fit-size'],'3.5cqw');
 assert.equal(values['--wall-cell-fit-leading'],'1.15');
 required=2;
 wall.fit(scope);
 assert.equal(values['--wall-cell-fit-size'],'3cqw');
 assert.equal(cell.scrollHeight,12);
});

test('one-page style changes columns and placement without modifying the month sequence',()=>{
 const project=ACDLWallSampleB.create();
 project.book.pageInstances.splice(1);
 const item=grid(project,0);
 item.monthCount=12;item.columns=3;
 const before=structuredClone(project.book.pageInstances);
 const ui=inspector(project);
 for(const [preset,columns,placement] of [['poster-right',2,'list'],['poster-cells',3,'cells'],['poster-bottom',3,'list']]){
  ui.change('StylePreset',preset);
  ui.apply();
  assert.equal(item.columns,columns);
  assert.equal(item.wallCalendarSettings.schedulePlacement,placement);
  assert.deepEqual(project.book.pageInstances,before);
 }
});

test('wall editor exposes and saves the list column separator option',()=>{
 const ui=inspector();
 assert.match(ui.panel.innerHTML,/단 구분선 표시/);
 assert.equal(ui.nodes.get('walllistColumnColors').checked,false);
 ui.change('listColumnColors',true);
 ui.apply();
 assert.equal(inspector(JSON.parse(JSON.stringify(ui.project))).nodes.get('walllistColumnColors').checked,true);
});
