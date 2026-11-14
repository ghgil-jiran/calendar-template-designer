import test from 'node:test';
import assert from 'node:assert/strict';
import '../apps/designer-studio/wall-calendar-policy.js';
import '../apps/designer-studio/project-document.js';
import '../apps/designer-studio/calendar-type-domain.js';
import '../apps/designer-studio/poster-one-page-sample.js';
import '../apps/designer-studio/poster-two-page-sample.js';
import '../apps/designer-studio/shared-screen-calendar-annotations.js';
import '../apps/designer-studio/shared-screen-mini-calendar.js';
const wall=ACDLWallCalendar,mini=ACDLSharedMiniCalendar;
function model(){const p=ACDLPosterTwoPageSample.create({}),page=p.book.pageInstances[0],item=p.book.elementsByPage[page.id].find(e=>e.academicPoster);return {p,page,item};}
const html=({p,page,item})=>wall.render(mini.resolveAnnualCalendar(item,page,p.settings),item,p);
test('display presets retain physical typography, reference flags, geometry and both pages month bindings',()=>{
 const {p,item}=model(),before=structuredClone(p);const value={...wall.resolve(item,p),datePt:17,listPt:9,includeLunar:true,includeSolarTerms:true};
 for(const name of Object.keys(wall.presets)){const next=wall.preset(value,name);assert.equal(next.datePt,17);assert.equal(next.listPt,9);assert.equal(next.includeLunar,true);assert.equal(next.includeSolarTerms,true);assert.equal(wall.presetName(next),name);wall.apply(p,item,next,{allPages:true});}
 assert.deepEqual(p.book.pageInstances,before.book.pageInstances);assert.deepEqual(p.book.events,before.book.events);for(const page of p.book.pageInstances){const a=p.book.elementsByPage[page.id].find(e=>e.academicPoster),b=before.book.elementsByPage[page.id].find(e=>e.academicPoster);for(const key of ['id','x','y','width','height','posterMonthOffset','monthCount'])assert.equal(a[key],b[key]);}
});
test('weekday order and date columns agree for every displayed month and both week starts',()=>{
 const {p,page,item}=model();for(const weekStart of ['sunday','monday']){p.settings.weekStart=weekStart;for(const pg of p.book.pageInstances){const calendar=p.book.elementsByPage[pg.id].find(e=>e.academicPoster),annual=mini.resolveAnnualCalendar(calendar,pg,p.settings);for(const month of annual.months){const offset=weekStart==='monday'?1:0;for(const [i,day] of month.cells.entries()){assert.equal((i%7+offset)%7,new Date(day.date+'T00:00:00Z').getUTCDay());}assert.equal(month.cells.filter(d=>d.month===month.month).length,new Date(Date.UTC(month.year,month.month,0)).getUTCDate());}}}
});
test('date-only month centers numbers; schedule style retains the date-side reference layout',()=>{
 const m=model();m.item.wallCalendarSettings=wall.preset(wall.resolve(m.item,m.p),'minimal');assert.match(html(m),/justify-content:center/);assert.doesNotMatch(html(m),/overflow:hidden/);m.item.wallCalendarSettings=wall.preset(m.item.wallCalendarSettings,'schedule');assert.match(html(m),/justify-content:flex-start/);
});
test('list groups preserve all events once in date order, with aligned dates and vertical column flow',()=>{
 const m=model();m.item.wallCalendarSettings={schedulePlacement:'list',referencePlacement:'list',listLayout:'three'};m.p.book.events=[{id:'s2',title:'후행 학교 일정',startDate:'2027-03-12',endDate:'2027-03-14'},{id:'s1',title:'선행 학교 일정',startDate:'2027-03-02',endDate:'2027-03-02'},{id:'h',title:'공휴일 테스트',category:'holiday',startDate:'2027-03-01',endDate:'2027-03-01'}];const out=html(m);for(const id of ['s1','s2','h'])assert.equal(out.split('data-poster-list-event="'+id+'"').length-1,1);assert.ok(out.indexOf('선행 학교 일정')<out.indexOf('후행 학교 일정'));assert.match(out,/학교 일정/);assert.match(out,/공휴일·기념일/);assert.match(out,/column-count:3/);assert.match(out,/column-fill:balance/);assert.match(out,/12–14/);
});
test('automatic list columns compare measured wrapped heights and retain every entry',()=>{
 const group={style:{columnCount:'2'}},list={dataset:{wallListLayout:'auto'},clientWidth:120,clientHeight:100,get scrollHeight(){return group.style.columnCount==='2'?150:98},scrollWidth:120,querySelectorAll:()=>[group]},scope={querySelectorAll:()=>[list]};wall.fit(scope);assert.equal(list.dataset.wallResolvedColumns,'3');Object.defineProperty(list,'scrollHeight',{get:()=>160});wall.fit(scope);assert.equal(list.dataset.wallResolvedColumns,'2');list.dataset.wallListLayout='three';wall.fit(scope);assert.equal(list.dataset.wallResolvedColumns,'3');
});
test('customer display changes cannot alter sizes or reference inclusion flags',()=>{for(const name of Object.keys(wall.presets))assert.deepEqual(wall.validateCustomer(wall.presets[name]),wall.presets[name]);assert.deepEqual(wall.validateCustomer({listLayout:'three',titleStyle:'underline',weekdayFormat:'english'}),{listLayout:'three',titleStyle:'underline',weekdayFormat:'english'});assert.throws(()=>wall.validateCustomer({listLayout:'four'}));assert.throws(()=>wall.validateCustomer({includeLunar:true}));assert.throws(()=>wall.validateCustomer({datePt:4}));});
