import assert from 'node:assert/strict';

await import('../apps/designer-studio/calendar-domain-bridge.js');

const { buildTwelveMonths } = globalThis.ACDLCalendarDomain;

assert.deepEqual(buildTwelveMonths(2027, 3).at(0), { year: 2027, month: 3 });
assert.deepEqual(buildTwelveMonths(2027, 3).at(-1), { year: 2028, month: 2 });
assert.deepEqual(buildTwelveMonths(2027, 12).at(1), { year: 2028, month: 1 });
assert.throws(() => buildTwelveMonths(2027, 0), /startMonth/);
assert.throws(() => buildTwelveMonths(2027, 13), /startMonth/);
assert.throws(() => buildTwelveMonths(1999, 3), /year/);
