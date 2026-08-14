import assert from 'node:assert/strict';

await import('../apps/designer-studio/calendar-domain-bridge.js');

const {
  buildTwelveMonths,
  buildCalendarGrid,
  buildRangeSegments,
  assignRangeLanes
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
