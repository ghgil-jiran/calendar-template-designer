import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../apps/designer-studio/features/studio-runtime-core.js', import.meta.url), 'utf8');
const start = source.indexOf('el("saveBasicResourceBtn").addEventListener("click",');
const handler = source.slice(start, source.indexOf('\n', start));

function saveBasic({ mode = 'adaptive', change = {} } = {}) {
  const pages = [
    { id: 'surface.1.front', role: 'cover-front' },
    { id: 'surface.1.back', role: 'cover-back', semanticPageRole: 'yearly-calendar' },
    { id: 'surface.2.front', role: 'front-insert-front', semanticPageRole: 'school-symbols' },
    ...Array.from({ length: 12 }, (_, i) => [
      { id: `month.${i}.back`, role: 'monthly-back', calendarMonth: i + 1 },
      { id: `month.${i}.front`, role: 'monthly-front', calendarMonth: i + 1 },
    ]).flat(),
    { id: 'surface.14.back', role: 'back-cover-back' },
  ];
  const settings = { year: 2027, startMonth: 3, frontInsertCount: 0, rearInsertCount: 0, calendarRows: 5, weekStart: 'sunday', showAdjacentMiniCalendars: false, ...(mode ? { calendarRowsMode: mode } : {}) };
  const project = { settings, template: { metadata: {} }, book: { pageInstances: pages, elementsByPage: { 'surface.2.front': [{ id: 'school-song', binding: 'school.profile.song' }] }, events: Array.from({ length: 55 }, (_, i) => ({ id: `event.${i}` })) } };
  const before = structuredClone(project.book);
  const values = { resourceTemplateName: '샘플 A', resourceTemplateDescription: '', resourceTemplateAuthor: '', resourceTemplateVersion: '1.0.0', resourceTemplateLanguage: 'ko-KR', resourceCalendarYear: '2027', resourceStartMonth: '3', resourceFrontInserts: '0', resourceRearInserts: '0', resourceCalendarRows: '5', resourceWeekStart: 'sunday', resourceUserEditingPreset: 'individual', ...change };
  let click, rebuilds = 0;
  const context = { project, Number, String, el: id => id === 'saveBasicResourceBtn' ? { addEventListener: (_, fn) => { click = fn; } } : { value: values[id], checked: id !== 'resourceAdjacentMini' }, snapshot() {}, normalizeElementData() {}, markDirty() {}, render() {}, populateResourceBasicForm() {}, showEditorToast() {}, collectInputContractRequirements: () => [], rebuildProjectFromBasicSettings() { rebuilds++; }, window: { ACDLPageStructurePolicy: { apply() {} } } };
  vm.runInNewContext(handler, context); click();
  return { project, before, rebuilds };
}

test('saving all public calendar options preserves the authored 28 surfaces and 55 events', () => {
  const { project, before, rebuilds } = saveBasic();
  assert.equal(rebuilds, 0);
  assert.deepEqual(project.book, before);
  assert.equal(project.settings.calendarRowsMode, 'adaptive');
  assert.deepEqual(JSON.parse(JSON.stringify(project.settings.calendarData)), { includeHolidays: true, includeAnniversaries: true, includeSolarTerms: true, includeLunar: true });
  assert.deepEqual(JSON.parse(JSON.stringify(project)).book, before);
});
test('legacy missing row mode does not rebuild existing pages', () => assert.equal(saveBasic({ mode: null }).rebuilds, 0));
test('changing week start or grid rows preserves custom surfaces', () => {
  for (const change of [{ resourceWeekStart: 'monday' }, { resourceCalendarRows: '6' }]) {
    const { project, before, rebuilds } = saveBasic({ change });
    assert.equal(rebuilds, 0); assert.deepEqual(project.book, before);
  }
});
test('explicit year and insert count changes still use structural editing', () => {
  assert.equal(saveBasic({ change: { resourceCalendarYear: '2028' } }).rebuilds, 1);
  assert.equal(saveBasic({ change: { resourceFrontInserts: '1' } }).rebuilds, 1);
});
