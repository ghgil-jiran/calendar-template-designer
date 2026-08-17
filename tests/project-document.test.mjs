import assert from 'node:assert/strict';

await import('../apps/designer-studio/calendar-domain-bridge.js');
await import('../apps/designer-studio/project-document.js');

const sizePresets = {
  desk: [{ id: 'desk-standard', label: 'Standard', width: 260, height: 180 }],
  wall: [{ id: 'wall-a3', label: 'A3', width: 297, height: 420 }],
  poster: [{ id: 'poster-a3', label: 'A3', width: 297, height: 420 }]
};
const dependencies = { sizePresets, buildMonths: globalThis.ACDLCalendarDomain.buildTwelveMonths };
const base = { year: 2027, startMonth: 3, frontInsertCount: 1, rearInsertCount: 0, calendarRows: 6, weekStart: 'sunday', showAdjacentMiniCalendars: true };

const desk = globalThis.ACDLProjectDocument.createProject({ ...base, type: 'desk', template: 'school-basic', sizePresetId: 'desk-standard' }, dependencies);
assert.equal(desk.format, 'acdl-project');
assert.equal(desk.version, '2.18.0');
assert.equal(desk.book.sheets.length, 15);
assert.equal(desk.book.pageInstances.length, 30);
assert.deepEqual(desk.book.pageInstances.slice(0, 4).map(page => page.role), ['cover-front', 'cover-back', 'front-insert-front', 'front-insert-back']);
assert.equal(desk.book.pageInstances[4].calendarYear, 2027);
assert.equal(desk.book.pageInstances[4].calendarMonth, 3);

const representative = globalThis.ACDLProjectDocument.createProject({ ...base, type: 'desk', template: 'desk-sample-6', sizePresetId: 'desk-standard' }, dependencies);
assert.equal(representative.template.pageComposition.pageCount, 28);
assert.equal(representative.template.masterElements['master.monthly.back'][0].role, 'planner-title');
assert.equal(representative.book.pageInstances.filter(page => page.semanticPageRole === 'month-calendar').length, 12);
assert.equal(representative.book.monthlyStyleOverrides.length, 12);

const wall = globalThis.ACDLProjectDocument.createProject({ ...base, type: 'wall', template: 'school-basic', sizePresetId: 'wall-a3' }, dependencies);
assert.equal(wall.book.pageInstances.length, 15);
assert.equal(wall.book.sheets.length, 0);

const poster = globalThis.ACDLProjectDocument.createProject({ ...base, type: 'poster', template: 'school-basic', sizePresetId: 'poster-a3' }, dependencies);
assert.equal(poster.book.pageInstances.length, 1);
assert.equal(poster.book.pageInstances[0].role, 'poster-annual');
assert.throws(() => globalThis.ACDLProjectDocument.createProject({ ...base, type: 'desk', template: 'school-basic', sizePresetId: 'missing' }, dependencies), /Unknown size preset/);
