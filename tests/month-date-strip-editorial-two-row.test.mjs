import test from 'node:test';
import assert from 'node:assert/strict';
import '../apps/designer-studio/page-composition-runtime.js';
const runtime=globalThis.ACDLPageCompositionRuntime;
const page={calendarYear:2028,calendarMonth:2};
const element={type:'month-date-strip',monthSource:'page',showWeekday:true,showDate:true,style:{stripStyle:'editorial-two-row'}};
test('titled two-row strip retains style and leap dates through saved Runtime values',()=>{
 const value=runtime.widgetValue(element,page);
 assert.equal(value.stripStyle,'editorial-two-row');
 const restored=runtime.resolveMonthDateStrip({type:'month-date-strip',value:JSON.parse(JSON.stringify(value))},page);
 assert.equal(restored.cells.length,29);
 const html=runtime.renderMonthDateStripMarkup(restored,true);
 assert.match(html,/2028 2<br>FEBRUARY/);
 assert.equal((html.match(/class="strip-weekday"/g)||[]).length,29);
 assert.equal((html.match(/class="strip-day"/g)||[]).length,29);
 assert.match(html,/>T<\/span><span class="strip-day">1<\/span>/);
 assert.match(html,/<span class="strip-day">29<\/span>/);
 assert.doesNotMatch(html,/strip-rules/);
});
test('titled two-row strip respects independent weekday/date visibility and background rules',()=>{
 for(const [showWeekday,showDate] of [[true,false],[false,true],[false,false]]){
  const strip=runtime.resolveMonthDateStrip({...element,showWeekday,showDate},page);
  const html=runtime.renderMonthDateStripMarkup(strip,false);
  assert.equal(html.includes('class="strip-weekday"'),showWeekday);
  assert.equal(html.includes('class="strip-day"'),showDate);
  assert.match(html,/strip-rules/);
  assert.match(html,/grid-template-rows:repeat\(1,minmax\(0,1fr\)\)/);
 }
});
test('new strip preserves fixed month, weekday public holidays and weekend classes',()=>{
 const strip=runtime.resolveMonthDateStrip({...element,monthSource:'fixed',year:2027,month:3,holidayDates:['2027-03-01']},page);
 assert.equal(strip.month,3);assert.equal(strip.year,2027);assert.equal(strip.cells.length,31);
 const html=runtime.renderMonthDateStripMarkup(strip,true);
 assert.match(html,/strip-inline-date sun[^>]*><span class="strip-weekday">M<\/span><span class="strip-day">1<\/span>/);
 assert.match(html,/strip-inline-date sat[^>]*><span class="strip-weekday">S<\/span><span class="strip-day">6<\/span>/);
});
test('legacy default grid and one-row editorial layouts retain their distinct structures',()=>{
 const grid=runtime.resolveMonthDateStrip({type:'month-date-strip'},page);
 assert.equal(grid.stripStyle,'weekday-grid');
 assert.equal(runtime.widgetValue({type:'month-date-strip'},page).stripStyle,undefined);
 const gridHtml=runtime.renderMonthDateStripMarkup(grid);
 assert.match(gridHtml,/class="dow"/);assert.doesNotMatch(gridHtml,/strip-month-label/);
 const inline=runtime.resolveMonthDateStrip({...element,style:{stripStyle:'editorial-inline'}},page);
 const inlineHtml=runtime.renderMonthDateStripMarkup(inline);
 assert.match(inlineHtml,/strip-month-label/);assert.doesNotMatch(inlineHtml,/strip-weekday|editorial-two-row/);
});
