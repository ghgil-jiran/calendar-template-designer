import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
const source = readFileSync(new URL('../apps/designer-studio/shared-screen-mini-calendar.js', import.meta.url), 'utf8');
const sandbox = { globalThis: {} };
runInNewContext(source, sandbox);
const mini = sandbox.globalThis.ACDLSharedMiniCalendar;
test('shared mini calendar follows authored month, rows and adjacent month shifts', () => {
  assert.equal(mini.version, '0.1.0-preview.1');
  const march = mini.resolveMiniCalendar({type:'mini-calendar', calendarRows:5}, {calendarYear:2027, calendarMonth:3});
  assert.equal(march.cells.length, 35);
  assert.equal(march.cells[0].day, 28);
  assert.match(mini.renderMiniCalendarMarkup(march,{}), /2027년 3월/);
  const feb = mini.resolveMiniCalendar({type:'mini-calendar-prev'}, {calendarYear:2028, calendarMonth:3});
  assert.equal(`${feb.year}-${feb.month}`, '2028-2');
  assert.equal(feb.cells.length, 42);
  const april = mini.resolveMiniCalendar({type:'mini-calendar-next'}, {calendarYear:2027, calendarMonth:3});
  assert.equal(`${april.year}-${april.month}`, '2027-4');
  assert.doesNotMatch(mini.renderMiniCalendarMarkup(march,{style:{primary:'red" onload="x'}}), /onload=/);
});


test('shared annual calendar preserves open and grouped layouts with academic-year rollover',()=>{
 const api=mini;
 const widget={startMonth:3,monthCount:12,layoutType:'open-grid',columns:4,monthLabelStyle:'number-en',showWeekdayHeader:false};
 const model=api.resolveAnnualCalendar(widget,{calendarYear:2027},{calendarRows:6});
 const html=api.renderAnnualCalendarMarkup(model,widget);
 assert.match(html,/annual-layout-open-grid/);assert.match(html,/data-month-key="2028-02"/);assert.doesNotMatch(html,/class="mh"/);assert.equal((html.match(/class="year-month"/g)||[]).length,12);
 widget.layoutType='vertical-three-month-groups';const grouped=api.renderAnnualCalendarMarkup(api.resolveAnnualCalendar(widget,{calendarYear:2027}),widget);
 assert.equal((grouped.match(/class="year-calendar-group"/g)||[]).length,4);
});
