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
test('large month style preserves the year/month hierarchy and all month lengths after save/reload',()=>{
 for(const [year,month,count] of [[2027,2,28],[2028,2,29],[2027,4,30],[2027,12,31]]){
  const page={calendarYear:year,calendarMonth:month},e={...element,style:{stripStyle:'editorial-large-month',background:false}};
  const stored=JSON.parse(JSON.stringify(runtime.widgetValue(e,page))),model=runtime.resolveMonthDateStrip({type:e.type,value:stored},page),html=runtime.renderMonthDateStripMarkup(model,true);
  assert.equal(stored.stripStyle,'editorial-large-month');assert.equal(model.cells.length,count);
  assert.match(html,new RegExp('class="strip-year">'+year+'<'));assert.match(html,new RegExp('class="strip-month-number">'+month+'<'));assert.match(html,/class="strip-month-unit">월</);
  assert.equal((html.match(/class="strip-weekday"/g)||[]).length,count);assert.equal((html.match(/class="strip-day"/g)||[]).length,count);
  assert.doesNotMatch(html,/APRIL|DECEMBER|strip-rules|<img|<canvas/);assert.match(html,/background:transparent/);
 }
});
test('large month weekdays, weekends, holidays and visibility use the same calendar contract',()=>{
 const e={...element,style:{stripStyle:'editorial-large-month'},monthSource:'fixed',year:2027,month:4,holidayDates:['2027-04-05']};
 const html=runtime.renderMonthDateStripMarkup(runtime.resolveMonthDateStrip(e,page),true);
 assert.match(html,/strip-weekday">T<\/span><span class="strip-day">1</);
 assert.match(html,/strip-inline-date sat[^>]*><span class="strip-weekday">S<\/span><span class="strip-day">3</);
 assert.match(html,/strip-inline-date sun[^>]*><span class="strip-weekday">S<\/span><span class="strip-day">4</);
 assert.match(html,/strip-inline-date sun[^>]*><span class="strip-weekday">M<\/span><span class="strip-day">5</);
 for(const [showWeekday,showDate] of [[true,false],[false,true],[false,false]]){
  const h=runtime.renderMonthDateStripMarkup(runtime.resolveMonthDateStrip({...e,showWeekday,showDate},page),false);assert.equal(h.includes('class="strip-weekday"'),showWeekday);assert.equal(h.includes('class="strip-day"'),showDate);assert.match(h,/strip-rules/);
 }
});
test('large month styles expose responsive vector text and Saturday color',()=>{
 assert.match(runtime.monthDateStripCss,/--strip-saturday:#3289b4/);assert.match(runtime.monthDateStripCss,/font-size:min\(4\.2cqw,54cqh\)/);
});

