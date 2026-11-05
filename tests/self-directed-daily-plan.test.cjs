const assert=require('node:assert/strict');const fs=require('node:fs');const vm=require('node:vm');
const base=__dirname+'/../apps/designer-studio/';
for(const p of ['shared-screen-memo.js','ai-design-settings.js','page-composition-runtime.js'])vm.runInThisContext(fs.readFileSync(base+p,'utf8'));
const api=globalThis.ACDLSharedMemo;
for(let year=2024;year<=2032;year++)for(let month=1;month<=12;month++){
 const m=api.resolveDailyPlan({memoLayout:'daily-plan'},{calendarYear:year,calendarMonth:month});
 const days=m.rows.flat().filter(Boolean);assert.equal(days.length,new Date(Date.UTC(year,month,0)).getUTCDate());assert.equal(new Set(days.map(x=>x.day)).size,days.length);assert.equal(m.rows.length,16);assert.equal(m.rows[14][0].day,15);assert.equal(m.rows[0][1].day,16);assert.equal(m.rows[15][0],null);
 for(const day of days)assert.equal(day.weekday,new Date(day.date+'T00:00:00Z').getUTCDay());
 const html=api.renderDailyPlan(m);assert.equal((html.match(/data-plan-date=/g)||[]).length,days.length);assert.ok(!/<image|foreignObject|data:image/.test(html));
}
assert.equal(api.resolveDailyPlan({},{}),null);
const m=api.resolveDailyPlan({holidayDates:['2027-03-01'],title:'<script>'},{calendarYear:2027,calendarMonth:3});assert.equal(m.rows[0][0].holiday,true);assert.ok(api.renderDailyPlan(m).includes('&lt;script&gt;'));
const layouts=ACDLAIDesignSettings.monthBackLayouts(['image','current-calendar','academic-schedule','planner-daily'],{mode:'self-directed'});assert.equal(layouts.length,1);assert.equal(layouts[0].boxes.length,4);assert.equal(ACDLAIDesignSettings.monthBackLayouts(['image']).length,4);
const value=ACDLPageCompositionRuntime.widgetValue({type:'memo',memoLayout:'daily-plan',title:'일일 자기주도 계획'},{calendarYear:2028,calendarMonth:2});assert.equal(value.year,2028);assert.equal(value.month,2);assert.equal(value.memoLayout,'daily-plan');
console.log('PASS: date-based planner calendar, vector and Runtime checks');
