import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const source = readFileSync(new URL('../apps/designer-studio/shared-screen-schedule.js', import.meta.url), 'utf8');
const sandbox = { globalThis: {} };
runInNewContext(source, sandbox);
const { resolveYearScheduleEvents, renderYearScheduleMarkup } = sandbox.globalThis.ACDLSharedSchedule;

test('yearly schedule uses authored monthly cards, full dates, and no extra title', () => {
  const events = [
    { startDate: '2027-03-03', endDate: '2027-03-04', title: '<개학식>' },
    { startDate: '2027-04-29', endDate: '2027-05-02', title: '연속 일정' },
  ];
  const options = { startMonth: 3, scheduleLayoutType: 'schedule-month-cards', showEndDate: true };
  const html = renderYearScheduleMarkup(resolveYearScheduleEvents(events, options, 2027), options, 2027);
  assert.equal((html.match(/class="academic-month-card"/g) || []).length, 12);
  assert.match(html, /03\.03–03\.04/);
  assert.match(html, /04\.29–05\.02/);
  assert.match(html, /&lt;개학식&gt;/);
  assert.doesNotMatch(html, /전체 학사일정/);
  assert.match(html, /2월 <small>2028<\/small>/);
});
