import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

await import('../apps/designer-studio/calendar-domain-bridge.js');
await import('../apps/designer-studio/project-document.js');
await import('../apps/designer-studio/package-project-adapter.js');
await import('../apps/designer-studio/persistence-project.js');

const packageTemplate = JSON.parse(await readFile(
  new URL('../templates/desk-academic-standard/1.1.0/template.json', import.meta.url),
  'utf8'
));
const dependencies = {
  sizePresets: { desk: [{ id: 'desk-standard', label: 'Standard', width: 260, height: 180 }] },
  buildMonths: globalThis.ACDLCalendarDomain.buildTwelveMonths
};
const base = globalThis.ACDLProjectDocument.createProject({
  type: 'desk',
  template: 'school-basic',
  year: 2028,
  startMonth: 3,
  frontInsertCount: 0,
  rearInsertCount: 0,
  calendarRows: 5,
  weekStart: 'sunday',
  showAdjacentMiniCalendars: true,
  sizePresetId: 'desk-standard'
}, dependencies);
const project = globalThis.ACDLPackageProjectAdapter.applyPackage(base, packageTemplate);

assert.equal(project.book.pageInstances.length, 28);
assert.equal(project.template.package.templateId, 'desk-academic-standard');
assert.equal(project.template.package.version, '1.1.0');
assert.equal(project.settings.calendarRows, 5);
assert.deepEqual(project.book.pageInstances.slice(0, 6).map(page => page.packageRole), [
  'cover-front', 'annual-calendar', 'school-symbols', 'monthly-photo-memo', 'monthly-calendar', 'monthly-photo-memo'
]);
assert.equal(project.book.pageInstances[3].monthKey, '2028-03');
assert.equal(project.book.pageInstances[4].monthKey, '2028-03');
assert.equal(project.book.pageInstances[5].monthKey, '2028-04');
assert.equal(project.book.pageInstances[26].monthKey, '2029-02');
assert.equal(project.book.pageInstances[27].packageRole, 'back-contact');
assert.equal(project.book.pageInstances[2].role, 'front-insert-front');
assert.equal(project.book.pageInstances[26].role, 'monthly-front');

const symbolPage = project.book.pageInstances[2];
const song = project.book.elementsByPage[symbolPage.id].find(item => item.role === 'school-song');
assert.deepEqual({ x: song.x, y: song.y, width: song.width, height: song.height }, { x: 42, y: 20, width: 53, height: 70 });
const photoPage = project.book.pageInstances[3];
const photo = project.book.elementsByPage[photoPage.id].find(item => item.role === 'monthly-photo');
assert.equal(photo.binding, 'monthlyImages.2028-03');
assert.deepEqual({ x: photo.x, y: photo.y, width: photo.width, height: photo.height }, { x: 5, y: 9.7, width: 90, height: 50.3 });
assert.deepEqual(project.template.masters.calendar.calendarRegion, { x: 5, y: 26.5, width: 90, height: 66.5 });

song.x = 47.5;
song.width = 48;
const saved = globalThis.ACDLPersistenceProject.clone(project);
const reopened = globalThis.ACDLPersistenceProject.clone(saved);
const reopenedSong = reopened.book.elementsByPage[symbolPage.id].find(item => item.role === 'school-song');
assert.equal(reopenedSong.x, 47.5);
assert.equal(reopenedSong.width, 48);
assert.equal(reopened.template.package.version, '1.1.0');
