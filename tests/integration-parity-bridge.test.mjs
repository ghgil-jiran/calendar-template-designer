import assert from 'node:assert/strict';

await import('../apps/designer-studio/dataset-domain-bridge.js');
await import('../apps/designer-studio/desk-academic-page-adapter.js');
await import('../apps/designer-studio/integration-parity-bridge.js');

const { buildDeskAcademicSurfacePlan, compareSurfacePlan, compareProject } = globalThis.ACDLIntegrationParity;

const expected = buildDeskAcademicSurfacePlan(2027, 3);
assert.equal(expected.length, 28);
assert.deepEqual(expected.slice(0, 4), [
  { index: 0, sheet: 1, side: 'front', role: 'cover-front' },
  { index: 1, sheet: 1, side: 'back', role: 'annual-calendar' },
  { index: 2, sheet: 2, side: 'front', role: 'school-symbols' },
  { index: 3, sheet: 2, side: 'back', role: 'monthly-photo-memo', monthKey: '2027-03' }
]);
assert.deepEqual(expected.slice(-2), [
  { index: 26, sheet: 14, side: 'front', role: 'monthly-calendar', monthKey: '2028-02' },
  { index: 27, sheet: 14, side: 'back', role: 'back-contact' }
]);

const exactPages = expected.map(item => ({
  role: ({
    'cover-front': 'cover-front',
    'annual-calendar': 'cover-back',
    'school-symbols': 'back-cover-front',
    'monthly-calendar': 'monthly-front',
    'monthly-photo-memo': 'monthly-back',
    'back-contact': 'back-cover-back'
  })[item.role],
  calendarYear: item.monthKey ? Number(item.monthKey.slice(0, 4)) : null,
  calendarMonth: item.monthKey ? Number(item.monthKey.slice(5)) : null
}));
assert.equal(compareSurfacePlan(exactPages, expected).matches, true);

const currentDesignerOrder = [exactPages[0], exactPages[1]];
for (let index = 0; index < 12; index += 1) {
  const month = expected.filter(item => item.role === 'monthly-calendar')[index].monthKey;
  currentDesignerOrder.push(
    { role: 'monthly-front', calendarYear: Number(month.slice(0, 4)), calendarMonth: Number(month.slice(5)) },
    { role: 'monthly-back', calendarYear: Number(month.slice(0, 4)), calendarMonth: Number(month.slice(5)) }
  );
}
currentDesignerOrder.push({ role: 'back-cover-front' }, { role: 'back-cover-back' });
const mismatch = compareSurfacePlan(currentDesignerOrder, expected);
assert.equal(mismatch.matches, false);
assert.ok(mismatch.issues.some(issue => issue.code === 'SURFACE_ROLE_MISMATCH' && issue.index === 2));
assert.ok(mismatch.issues.some(issue => issue.code === 'SURFACE_MONTH_MISMATCH'));

const report = compareProject({
  settings: { year: 2027, startMonth: 3 },
  book: { pageInstances: currentDesignerOrder, school: {}, monthlyImages: { '2027-03': 'asset:march' } }
});
assert.equal(report.readyForComposition, true);
assert.equal(report.readyForReplacement, false);
assert.deepEqual(report.replacementBlockers, ['MONTHLY_PHOTO_MEMO_MASTER_NOT_RENDERED', 'BACK_CONTACT_MASTER_NOT_RENDERED']);
assert.equal(report.composition.complete, true);
assert.equal(report.composition.surface.matches, true);
assert.equal(report.dataIssues.filter(issue => issue.code === 'MONTHLY_IMAGE_MISSING').length, 11);
assert.ok(report.dataIssues.some(issue => issue.code === 'BACK_CONTACT_EMPTY'));
