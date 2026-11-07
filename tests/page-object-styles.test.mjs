import test from 'node:test';
import assert from 'node:assert/strict';
import '../apps/designer-studio/shared-page-object-model.js';
import '../apps/designer-studio/shared-screen-mini-calendar.js';
import '../apps/designer-studio/shared-screen-schedule.js';
import '../apps/designer-studio/runtime-project-adapter.js';
const model=globalThis.ACDLPageObjectModel;
function project(elements){return {settings:{year:2027,startMonth:3},template:{masterElements:{}},book:{school:{profile:{}},pageInstances:[{id:'symbols',semanticPageRole:'school-symbols'}],elementsByPage:{symbols:elements}}};}
test('separate bound symbol descriptions, fixed titles and content without recreating deleted titles',()=>{
 const p=project(['motto','tree','flower','song'].map((key,index)=>({id:key,type:'semantic-object',role:'school-'+key,x:5+index*20,y:10,width:18,height:60,sampleContent:{description:key+' description',image:'https://example.invalid/'+key+'.png'},permissions:{move:true}})));
 model.normalizeProject(p);const elements=p.book.elementsByPage.symbols;
 for(const key of ['motto','tree','flower','song'])assert.equal(elements.find(e=>e.id===key+'.title').type,'text');
 for(const key of ['tree','flower'])assert.equal(elements.find(e=>e.id===key+'.description').binding,'school.profile.'+key+'.description');
 assert.equal(elements.find(e=>e.id==='song').showCaption,false);
 assert.equal(elements.find(e=>e.id==='motto').binding,'school.profile.motto.description');
 const saved=JSON.stringify(p);model.normalizeProject(p);assert.equal(JSON.stringify(p),saved);
 p.book.elementsByPage.symbols=elements.filter(e=>e.id!=='song.title');model.normalizeProject(p);assert.equal(p.book.elementsByPage.symbols.some(e=>e.id==='song.title'),false);
});
test('Yearly Plan separates title and twelve month labels, with a live academic-year transition',()=>{
 const p=project([{id:'plan',type:'memo',memoLayout:'yearly-grid',title:'Yearly Plan',startMonth:3,x:5,y:5,width:90,height:90}]);model.normalizeProject(p);
 const e=p.book.elementsByPage.symbols;assert.equal(e.filter(e=>e.role==='yearly-plan-title').length,1);assert.equal(e.filter(e=>e.role==='yearly-plan-month').length,12);
 const feb=e.find(e=>e.planMonthOffset===11);assert.equal(model.monthText(feb,2028),'2 FEB · 2029');assert.equal(globalThis.ACDLRuntimeProjectAdapter.formatYearText(feb,{}, {settings:{year:2028}}),'2 FEB · 2029');
 const saved=JSON.stringify(p);model.normalizeProject(p);assert.equal(JSON.stringify(p),saved);
});
test('annual number colors distinguish Saturdays, Sundays and a weekday public holiday in all day-grid styles',()=>{
 const source={type:'year-calendar',startMonth:3,monthCount:1,style:{dateSize:12,sunday:'#dd0000',saturday:'#0000dd',dayGridStyle:'boxes'},holidayDates:['2027-03-01']};
 const annual=globalThis.ACDLSharedMiniCalendar.resolveAnnualCalendar(source,{}, {year:2027,calendarRows:6});
 const html=globalThis.ACDLSharedMiniCalendar.renderAnnualCalendarMarkup(annual,source);
 assert.match(html,/data-date="2027-03-01" style="color:#dd0000"/);assert.match(html,/data-date="2027-03-06" style="color:#0000dd"/);assert.match(html,/data-date="2027-03-07" style="color:#dd0000"/);assert.match(html,/font-size:12px/);assert.match(html,/border:1px solid/);
 source.style.dayGridStyle='underline';assert.match(globalThis.ACDLSharedMiniCalendar.renderAnnualCalendarMarkup(annual,source),/border:none;border-bottom:1px solid/);
});
test('academic schedule renders saved typography and separate title, body, month and outer styles',()=>{
 const source={startMonth:3,showEndDate:true,style:{fontFamily:'Noto Serif KR',fontSize:15,color:'#123456',titleBackground:'#abcdef',contentBackground:'#fedcba',monthBackground:'#aaaaaa',monthBorderWidth:2,containerBackground:'#eeeeee',containerBorderWidth:3,titlePosition:'bottom'}};
 const shared=globalThis.ACDLSharedSchedule,schedule=shared.resolveYearScheduleEvents([{startDate:'2027-03-03',title:'입학식'}],source,2027),html=shared.renderYearScheduleMarkup(schedule,source,2027);
 assert.match(html,/font-size:15px/);assert.match(html,/font-family:Noto Serif KR/);assert.match(html,/border:3px solid/);assert.match(html,/background:#abcdef/);assert.match(html,/background:#fedcba/);assert.match(html,/background:#aaaaaa/);assert.ok(html.indexOf('입학식')<html.indexOf('3월'));
});
