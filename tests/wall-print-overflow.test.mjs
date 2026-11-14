import test from 'node:test';
import assert from 'node:assert/strict';
import '../apps/designer-studio/wall-calendar-policy.js';
import '../apps/designer-studio/project-document.js';
import '../apps/designer-studio/calendar-type-domain.js';
import '../apps/designer-studio/poster-one-page-sample.js';
import '../apps/designer-studio/wall-sample-a.js';
import '../apps/designer-studio/shared-screen-calendar-annotations.js';
import '../apps/designer-studio/shared-screen-mini-calendar.js';
const wall=globalThis.ACDLWallCalendar;
test('Sample A reserves readable six-week dates while allowing the list to yield space',()=>{
 const p=ACDLWallSampleA.create(),page=p.book.pageInstances[0],e=p.book.elementsByPage[page.id].find(e=>e.academicPoster),annual=ACDLSharedMiniCalendar.resolveAnnualCalendar(e,page,p.settings),html=wall.render(annual,e,p),g=wall.geometry(p,e);
 const grids=[...html.matchAll(/data-wall-grid style="[^"]*grid-template-rows:repeat\((\d+),[^"]*min-height:([\d.]+)cqw/g)];
 assert.equal(grids.length,12);assert.ok(grids.some(m=>Number(m[1])===6));
 for(const m of grids){const height=Number(m[2])*g.width/100,rows=Number(m[1]);assert.ok(height/rows>13*25.4/72*1.15+1.2);assert.ok(height<g.monthHeight);}
 assert.match(html,/height:50%;flex:0 1 auto;min-height:0/);
});
function node(region,{width=30,height=20,contentWidth=width,contentHeight=height,date}={}){return {dataset:{wallRegion:region,posterDate:date},clientWidth:width,clientHeight:height,scrollWidth:contentWidth,scrollHeight:contentHeight,closest:()=>({dataset:{posterMonth:'2027-08'}})};}
test('overflow stays blocking and reports the affected date and measured sizes',()=>{
 const n=node('day',{date:'2027-08-31',contentHeight:32}),scope={querySelectorAll:selector=>selector==='[data-wall-region]'?[n]:[]};
 assert.throws(()=>wall.assertFits(scope),/2027-08-31 날짜 칸 \[30×20px \/ 내용 30×32px\]/);
 assert.equal(n.dataset.wallOverflow,'true');
});
test('list overflow names the month; fitting regions pass without hiding content',()=>{
 assert.throws(()=>wall.assertFits({querySelectorAll:selector=>selector==='[data-wall-region]'?[node('list',{contentWidth:40})]:[]}),/2027-08 일정 목록/);
 const n=node('day');assert.deepEqual(wall.assertFits({querySelectorAll:selector=>selector==='[data-wall-region]'?[n]:[]}),[]);assert.equal(n.dataset.wallOverflow,'false');
});
