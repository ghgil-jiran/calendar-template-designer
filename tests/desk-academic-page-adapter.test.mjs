import assert from 'node:assert/strict';

await import('../apps/designer-studio/desk-academic-page-adapter.js');
await import('../apps/designer-studio/integration-parity-bridge.js');

const plan = globalThis.ACDLIntegrationParity.buildDeskAcademicSurfacePlan(2027, 3);
const sourcePages = [
  { id: 'cover.f', role: 'cover-front' },
  { id: 'cover.b', role: 'cover-back' }
];
for (let offset = 0; offset < 12; offset += 1) {
  const date = new Date(2027, 2 + offset, 1);
  const base = { calendarYear: date.getFullYear(), calendarMonth: date.getMonth() + 1 };
  sourcePages.push(
    { id: `month.${offset}.f`, role: 'monthly-front', ...base },
    { id: `month.${offset}.b`, role: 'monthly-back', ...base }
  );
}
sourcePages.push(
  { id: 'back.f', role: 'back-cover-front' },
  { id: 'back.b', role: 'back-cover-back' }
);

const project = { book: { pageInstances: sourcePages } };
const result = globalThis.ACDLDeskAcademicPageAdapter.compose(project, plan);
assert.equal(result.complete, true);
assert.equal(result.pages.length, 28);
assert.equal(result.pages[2].role, 'school-symbols');
assert.equal(result.pages[2].sourcePageId, 'back.f');
assert.equal(result.pages[3].role, 'monthly-photo-memo');
assert.equal(result.pages[3].monthKey, '2027-03');
assert.equal(result.pages[3].sourcePageId, 'month.0.b');
assert.equal(result.pages[4].role, 'monthly-calendar');
assert.equal(result.pages[4].sourcePageId, 'month.0.f');
assert.equal(result.pages[5].monthKey, '2027-04');
assert.equal(result.pages.at(-1).sourcePageId, 'back.b');
assert.equal(sourcePages[2].role, 'monthly-front');
assert.equal(sourcePages[2].sourcePageId, undefined);

const missingProject = { book: { pageInstances: sourcePages.filter(page => page.id !== 'month.4.b') } };
const missing = globalThis.ACDLDeskAcademicPageAdapter.compose(missingProject, plan);
assert.equal(missing.complete, false);
assert.deepEqual(missing.missing, [
  { index: 11, role: 'monthly-photo-memo', monthKey: '2027-07', sourceRole: 'monthly-back' }
]);

const html = await import('node:fs/promises').then(fs => fs.readFile(new URL('../apps/designer-studio/index.html', import.meta.url), 'utf8'));
assert.match(html, /function adaptDeskAcademic\(project\)/);
assert.match(html, /adapt\(project,composition\.pages\)/);
assert.match(html, /sourcePageId=p\.sourcePageId\|\|p\.id/);
