import assert from 'node:assert/strict';

await import('../apps/designer-studio/calendar-domain-bridge.js');

const {
  buildTwelveMonths,
  buildCalendarGrid,
  buildRangeSegments,
  assignRangeLanes,
  buildCalendarScheduleLanes,
  calendarScheduleTypography,
  SCHEDULE_MAX_LANES
} = globalThis.ACDLCalendarDomain;

assert.deepEqual(buildTwelveMonths(2027, 3).at(0), { year: 2027, month: 3 });
assert.deepEqual(buildTwelveMonths(2027, 3).at(-1), { year: 2028, month: 2 });
assert.deepEqual(buildTwelveMonths(2027, 12).at(1), { year: 2028, month: 1 });
assert.throws(() => buildTwelveMonths(2027, 0), /startMonth/);
assert.throws(() => buildTwelveMonths(2027, 13), /startMonth/);
assert.throws(() => buildTwelveMonths(1999, 3), /year/);

const sixRows = buildCalendarGrid(2027, 5, 'sunday', 6);
assert.equal(sixRows.length, 42);
assert.deepEqual(sixRows[0], { date: '2027-04-25', day: 25, month: 4, dow: 0 });
assert.deepEqual(sixRows.at(-1), { date: '2027-06-05', day: 5, month: 6, dow: 6 });

const mergedFiveRows = buildCalendarGrid(2027, 5, 'sunday', 5);
assert.equal(mergedFiveRows.length, 35);
assert.equal(mergedFiveRows[28].date, '2027-05-23');
assert.deepEqual(mergedFiveRows[28].extra, { date: '2027-05-30', day: 30, month: 5, dow: 0 });
assert.deepEqual(mergedFiveRows[29].extra, { date: '2027-05-31', day: 31, month: 5, dow: 1 });
assert.equal(mergedFiveRows[30].extra, undefined);
assert.throws(() => buildCalendarGrid(2027, 5, 'tuesday', 5), /weekStart/);
assert.throws(() => buildCalendarGrid(2027, 5, 'sunday', 4), /rows/);

const marchGrid = buildCalendarGrid(2027, 3, 'monday', 5);
const camp = { id: 'camp', title: '수련회', startDate: '2027-03-05', endDate: '2027-03-10', priority: 2 };
const holiday = { id: 'holiday', title: '재량휴업일', startDate: '2027-03-08', endDate: '2027-03-09', priority: 5 };
const segments = buildRangeSegments([camp, holiday], marchGrid, event => event.priority);
assert.equal(segments.length, 3);
assert.deepEqual(
  segments.filter(segment => segment.event.id === 'camp').map(segment => ({
    week: segment.week,
    startColumn: segment.startColumn,
    endColumn: segment.endColumn,
    continuesBefore: segment.continuesBefore,
    continuesAfter: segment.continuesAfter,
    isFirstVisible: segment.isFirstVisible
  })),
  [
    { week: 0, startColumn: 4, endColumn: 6, continuesBefore: false, continuesAfter: true, isFirstVisible: true },
    { week: 1, startColumn: 0, endColumn: 2, continuesBefore: true, continuesAfter: false, isFirstVisible: false }
  ]
);

const laneLayout = assignRangeLanes(segments, 5, 1, event => event.priority);
assert.equal(laneLayout.segments.length, 2);
assert.equal(laneLayout.overflow.length, 1);
assert.equal(laneLayout.overflow[0].event.id, 'camp');
assert.equal(laneLayout.segments.find(segment => segment.event.id === 'holiday').lane, 0);


assert.equal(SCHEDULE_MAX_LANES, 4);
assert.deepEqual(calendarScheduleTypography('123456789012', 1), { fontPx: 8, maxLines: 2 });
assert.deepEqual(calendarScheduleTypography('1234567890123', 1), { fontPx: 7, maxLines: 2 });
assert.deepEqual(calendarScheduleTypography('가'.repeat(29), 1), { fontPx: 6, maxLines: 2 });

const standardEvents = [
  { id: 'long', title: '학급공동체 세우기주간', startDate: '2027-03-05', endDate: '2027-03-12' },
  { id: 'single-a', title: '학부모연수', startDate: '2027-03-06', endDate: '2027-03-06' },
  { id: 'single-b', title: '전교임원선거', startDate: '2027-03-06', endDate: '2027-03-06' },
  { id: 'single-c', title: '학급임원선거', startDate: '2027-03-06', endDate: '2027-03-06' },
  { id: 'hidden', title: '다섯번째 일정', startDate: '2027-03-06', endDate: '2027-03-06' }
];
const standardLayout = buildCalendarScheduleLanes(2027, 3, standardEvents, 'sunday', 5);
assert.equal(standardLayout.maxLanes, 4);
assert.equal(standardLayout.segments.filter(segment => segment.eventId === 'long').length, 2);
assert.equal(standardLayout.segments.filter(segment => segment.startDate === '2027-03-06' && segment.endDate === '2027-03-06').length, 3);
assert.equal(standardLayout.hiddenByDate['2027-03-06'], 1);
assert.deepEqual(
  [...new Set(standardLayout.segments.filter(segment => segment.startDate === '2027-03-06' && segment.endDate === '2027-03-06').map(segment => segment.lane))].sort(),
  [1, 2, 3]
);
