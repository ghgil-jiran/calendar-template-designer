import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
test('all three schedule styles preserve bar lane bounds, event order and calendar font',()=>{
 const code=fs.readFileSync('apps/designer-studio/features/studio-runtime-core.js','utf8'),start=code.indexOf('renderRangeEventLayer=function(grid,rows){'),body=code.slice(start,code.indexOf('\n  };',start)+5);
 const style={displayMode:'bar',barHeight:24,laneGap:2},ctx={window:{ACDLCalendarDomain:{calendarScheduleTypography:()=>({fontPx:8,maxLines:2})}},project:{template:{resources:{fontTheme:{calendar:'Pretendard'}},masters:{calendar:{rangeEventStyle:style,design:{}}}}},el:()=>({clientHeight:700}),calendarRegion:()=>({height:75}),calendarVerticalLayout:()=>({title:10}),calendarChromeLayout:()=>({weekdayStage:5}),assignRangeLanes:()=>({maxLanes:2,segments:[0,1].map(lane=>({lane,week:0,startColumn:2,endColumn:2,span:1,title:'일정'+lane,event:{title:'일정'+lane,startDate:'2027-03-03',endDate:'2027-03-03'}}))}),eventColor:()=>'#123456',escapeAttr:s=>s};
 vm.createContext(ctx);vm.runInContext(fs.readFileSync('apps/designer-studio/shared-screen-schedule.js','utf8'),ctx);ctx.window.ACDLSharedSchedule=ctx.ACDLSharedSchedule;vm.runInContext(body,ctx);
 let baseline;for(const mode of ['bar','text','line']){style.displayMode=mode;const html=ctx.renderRangeEventLayer([],5),bounds=[...html.matchAll(/left:calc\([^;]+;width:calc\([^;]+;top:calc\([^;]+;height:\d+px/g)].map(m=>m[0]);assert.equal(bounds.length,2);if(baseline)assert.deepEqual(bounds,baseline);else baseline=bounds;assert.match(html,/font-family:Pretendard;font-weight:400/);assert.ok(html.indexOf('일정0')<html.indexOf('일정1'));if(mode!=='bar')assert.match(html,/box-shadow:none/);}
});
