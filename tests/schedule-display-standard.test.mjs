import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

await import('../apps/designer-studio/calendar-domain-bridge.js');

const {
  buildCalendarScheduleLanes,
  calendarScheduleTypography,
  SCHEDULE_MAX_LANES
} = globalThis.ACDLCalendarDomain;

assert.equal(SCHEDULE_MAX_LANES, 4);
assert.deepEqual(calendarScheduleTypography('가'.repeat(12), 1), { fontPx: 8, maxLines: 2 });
assert.deepEqual(calendarScheduleTypography('가'.repeat(13), 1), { fontPx: 7, maxLines: 2 });
assert.deepEqual(calendarScheduleTypography('가'.repeat(29), 1), { fontPx: 6, maxLines: 2 });

const events = [
  { id: 'period', title: '학급공동체 세우기주간', startDate: '2028-03-04', endDate: '2028-03-12' },
  { id: 'single-1', title: '학부모연수', startDate: '2028-03-05', endDate: '2028-03-05' },
  { id: 'single-2', title: '전교임원선거', startDate: '2028-03-05', endDate: '2028-03-05' },
  { id: 'single-3', title: '학급임원선거', startDate: '2028-03-05', endDate: '2028-03-05' },
  { id: 'hidden', title: '다섯 번째 일정', startDate: '2028-03-05', endDate: '2028-03-05' }
];
const layout = buildCalendarScheduleLanes(2028, 3, events, 'sunday', 5);
assert.equal(layout.segments.filter(segment => segment.eventId === 'period').length, 3);
const visibleSameDate = layout.segments.filter(segment => segment.startDate === '2028-03-05' && segment.endDate === '2028-03-05');
assert.equal(visibleSameDate.length, 3);
assert.deepEqual(visibleSameDate.map(segment => segment.lane).sort(), [1, 2, 3]);
assert.equal(layout.hiddenByDate['2028-03-05'], 1);

const studio = await readFile(new URL('../apps/designer-studio/index.html', import.meta.url), 'utf8');
const projectDocument = await readFile(new URL('../apps/designer-studio/project-document.js', import.meta.url), 'utf8');
assert.match(studio, /buildCalendarScheduleLanes/);
assert.match(studio, /const evs=\[\],vis=\[\],hidden=0/);
assert.match(studio, /SCHEDULE_MAX_LANES/);
assert.doesNotMatch(studio, /maxLanes:\s*3/);
assert.doesNotMatch(projectDocument, /maxLanes:\s*3/);
