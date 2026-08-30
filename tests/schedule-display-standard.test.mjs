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
assert.match(studio, /hasSampleSchedule=Boolean\(project\.book\.scheduleImport\?\.events\?\.length\)/);
assert.match(studio, /style\.enabled===false && !hasSampleSchedule/);
assert.match(studio, /project\.template\.masters\.calendar\.rangeEventStyle\.enabled=true/);
assert.doesNotMatch(studio, /maxLanes:\s*3/);
assert.doesNotMatch(projectDocument, /maxLanes:\s*3/);

// 밀집 월에도 날짜·음력·공휴일용 32px를 먼저 예약하고 남은 영역에만 일정 막대를 배치한다.
assert.match(studio, /const cellHeight=Math\.max\(1,\(stageHeight-weekdayHeight\)\/rows\),reservedTop=32/);
assert.match(studio, /cellHeight-reservedTop/);
assert.doesNotMatch(studio, /querySelector\("\.calendar-stage"\)\?\.clientHeight/);
assert.doesNotMatch(studio, /\.day-stack\{position:relative;z-index:14/);
assert.match(studio, /\.range-event-bar\{[^}]*justify-content:center;text-align:center/);

// 벽걸이형 월력은 520px 고정값이 아니라 가용 화면 높이·너비에 맞춰 확대한다.
assert.match(studio, /\.page\.wall\{width:min\(100%,720px,calc\(\(100dvh - 120px\)\*297\/420\)\)/);
assert.doesNotMatch(studio, /\.page\.wall\{width:min\(100%,520px\)/);

// +N은 일정 막대 위 절대 좌표가 아니라 날짜 셀 정보 영역에서 공휴일 다음 줄에 표시한다.
assert.match(studio, /const hiddenScheduleByDate=assignRangeLanes\(grid\)\.hiddenByDate\|\|\{\}/);
assert.match(studio, /class="calendar-overflow-count"/);
assert.doesNotMatch(studio, /class="range-event-overflow" style=/);
// 빈 셀의 이전·다음 달 미니 월력은 사용자 서비스처럼 셀 전체를 사용한다.
assert.match(studio, /\.cell-mini-calendar\{position:absolute;inset:0;/);
assert.match(studio, /\.cell-mini-grid\{[^}]*justify-content:space-between/);
assert.match(studio, /calendarGridFor\(y,m,5\)/);
assert.match(studio, /class="cell-mini-week"/);
assert.match(studio, /c\.extra\?\`\$\{c\.day\}\/\$\{c\.extra\.day\}\`/);
