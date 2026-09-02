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
assert.equal(representative.template.pageComposition.leadingSurfaceCount, 3);
assert.equal(representative.book.sheets.length, 14);
assert.equal(representative.book.pageInstances.length, 28);
assert.equal(representative.settings.frontInsertCount, 0);
assert.equal(representative.settings.rearInsertCount, 0);
assert.ok(representative.book.pageInstances.every((page, index) => page.number === index + 1));
assert.deepEqual(representative.template.masters.calendar.design, {
  monthTitleAlign: 'left',
  monthTitleStyle: 'number-stack',
  weekdayStyle: 'filled-tabs',
  gridStyle: 'boxed',
  eventStyle: 'strong-bars',
  presetId: 'sample-6'
});
const plannerElements = representative.template.masterElements['master.monthly.back'];
assert.deepEqual(plannerElements.map(item => item.memoLayout), ['goal', 'checklist', 'weekly']);
assert.equal(plannerElements.find(item => item.role === 'weekly-planner').weekCount, 5);
assert.equal(plannerElements.find(item => item.role === 'monthly-todo').itemCount, 9);
assert.ok(plannerElements.every(item => item.required && Object.values(item.permissions).every(value => value === false)));
assert.equal(representative.book.pageInstances.filter(page => page.semanticPageRole === 'month-calendar').length, 12);
assert.equal(representative.book.monthlyStyleOverrides.length, 12);
assert.deepEqual(representative.book.monthlyStyleOverrides.map(item => item.tokens.primary), ['#2fb79d', '#f47c20', '#ec407a', '#3275c8', '#2cb7d5', '#6758ba', '#f47c20', '#8b4a24', '#2cb7d5', '#7554b8', '#ec407a', '#7b8798']);
assert.deepEqual(
  representative.book.pageInstances.filter(page => ['cover-front', 'cover-back', 'front-insert-front', 'back-cover-back'].includes(page.role)).map(page => page.semanticPageRole),
  ['cover-front', 'yearly-calendar', 'school-symbols', 'back-cover-information']
);
assert.ok(representative.book.elementsByPage['surface.1.front'].some(item => item.role === 'school-building'));
assert.ok(representative.book.elementsByPage['surface.1.back'].some(item => item.type === 'year-calendar'));
assert.ok(representative.book.elementsByPage['surface.2.front'].some(item => item.role === 'school-motto'));
assert.ok(representative.book.elementsByPage['surface.2.front'].some(item => item.role === 'school-song'));
assert.deepEqual(representative.template.standardIdentity, { catalogId: 'tpl-2028-desk-planner-standard-01', templateKey: 'desk-sample-6' });
assert.equal(representative.template.documentVersion, 13);
assert.equal(representative.settings.calendarRowsMode, 'adaptive');
assert.equal(representative.book.events.filter(item => item.sample).length, 6);
assert.equal(representative.template.review.status, 'review');
assert.equal(representative.template.review.publicPackage, false);
assert.equal(representative.template.resources.sampleAssets.length, 5);
assert.deepEqual(new Set(representative.template.resources.sampleAssets.map(item => item.role)), new Set(['school-building', 'school-logo', 'school-song', 'school-tree', 'school-flower']));
assert.equal(representative.book.school.name, '지란중학교');
assert.equal(representative.book.school.englishName, 'JIRAN MIDDLE SCHOOL');
assert.equal(representative.book.school.profile.tree.name, '은행나무');
assert.equal(representative.book.school.profile.flower.name, '장미');
assert.deepEqual(representative.book.school.contacts, [
  { label: '교무실', phone: '031-608-9735', fax: '' },
  { label: '행정실', phone: '031-608-9735', fax: '' },
  { label: '팩스', phone: '', fax: '031-608-9735' }
]);
assert.match(representative.book.school.profile.building.image, /jiran-building\.webp$/);
assert.match(representative.book.elementsByPage['surface.1.front'].find(item => item.role === 'school-building').sampleContent.image, /jiran-building\.webp$/);
assert.match(representative.book.elementsByPage['surface.14.back'].find(item => item.role === 'school-building').sampleContent.image, /jiran-building\.webp$/);
assert.match(representative.book.elementsByPage['surface.14.back'].find(item => item.role === 'school-logo').sampleContent.image, /jiran-logo-composite\.svg$/);
assert.match(representative.book.elementsByPage['surface.2.front'].find(item => item.role === 'school-song').sampleContent.image, /jiran-song\.webp$/);
assert.equal(representative.book.elementsByPage['surface.2.front'].find(item => item.role === 'school-song').showCaption, false);
assert.equal(representative.book.elementsByPage['surface.1.front'].find(item => item.role === 'year').format, 'year-plain');
assert.deepEqual(
  (({ x, y, width, height }) => ({ x, y, width, height }))(representative.book.elementsByPage['surface.1.back'].find(item => item.id === 'page.yearly.title')),
  { x: 34, y: 4.5, width: 32, height: 15 }
);
assert.equal(representative.template.resources.backgroundPresetLibraryVersion, 1);
assert.equal(representative.template.resources.backgroundPresets.length, 4);
assert.ok(representative.template.resources.backgroundPresets.every(item => item.editable && item.supportsBleed));
assert.ok(representative.book.elementsByPage['surface.1.front'].some(item => item.role === 'background-decoration' && item.backgroundPresetId === 'background.desk-6.cover'));
assert.ok(representative.book.elementsByPage['surface.1.front'].some(item => item.x < 0));
assert.equal(representative.book.elementsByPage['surface.1.front'].filter(item => ['school-name', 'school-english-name'].includes(item.role)).length, 0);
assert.equal(representative.book.elementsByPage['surface.14.back'].filter(item => ['school-name', 'school-english-name'].includes(item.role)).length, 0);
assert.equal(representative.book.elementsByPage['surface.1.front'].find(item => item.role === 'school-logo').width, 17);
assert.equal(representative.book.elementsByPage['surface.14.back'].find(item => item.role === 'school-logo').width, 20);
assert.deepEqual(plannerElements.map(item => [item.x, item.y, item.width, item.height]), [
  [4, 9.6, 35, 40.8],
  [4, 52.1, 35, 42.5],
  [41, 9.6, 55, 85]
]);

const savedPlanner = structuredClone(representative);
delete savedPlanner.template.standardIdentity;
delete savedPlanner.template.documentVersion;
delete savedPlanner.template.metadata.sampleFamily;
const migratedPlanner = globalThis.ACDLProjectDocument.migrateProject(savedPlanner);
assert.equal(migratedPlanner.project.book.pageInstances.length, 28);
assert.equal(migratedPlanner.project.template.standardIdentity.catalogId, 'tpl-2028-desk-planner-standard-01');
assert.equal(migratedPlanner.project.template.metadata.sampleFamily, 'desk-6');
assert.deepEqual(migratedPlanner.report.applied, ['desk-planner-sample-family', 'desk-planner-standard-identity', 'desk-planner-master-source-match-v2', 'desk-planner-fixed-surfaces-v3', 'desk-planner-sample-6-sequence-v4', 'desk-planner-fixed-surfaces-v5', 'desk-planner-editable-background-presets-v6', 'desk-planner-review-sample-data-v7', 'desk-planner-review-color-contact-fix-v8', 'desk-planner-sample-six-visual-parity-v9', 'desk-planner-back-cover-parity-v10', 'desk-planner-special-page-text-image-parity-v11', 'desk-planner-year-caption-parity-v12', 'desk-planner-calendar-layout-parity-v13', 'desk-planner-document-version-13']);
assert.deepEqual(globalThis.ACDLProjectDocument.migrateProject(migratedPlanner.project).report.applied, []);

const customizedPlanner = structuredClone(representative);
customizedPlanner.template.documentVersion = 7;
customizedPlanner.book.school.name = '사용자 학교';
customizedPlanner.book.school.profile.building.image = 'data:image/png;base64,custom';
customizedPlanner.book.elementsByPage['surface.1.front'].find(item => item.role === 'school-building').sampleContent.image = '';
customizedPlanner.template.resources.sampleAssets = [{ id: 'asset.project.school-building.1', role: 'school-building', image: 'data:image/png;base64,custom' }];
const migratedCustomizedPlanner = globalThis.ACDLProjectDocument.migrateProject(customizedPlanner).project;
assert.equal(migratedCustomizedPlanner.book.school.name, '사용자 학교');
assert.equal(migratedCustomizedPlanner.book.school.profile.building.image, 'data:image/png;base64,custom');
assert.equal(migratedCustomizedPlanner.book.elementsByPage['surface.1.front'].find(item => item.role === 'school-building').sampleContent.image, 'data:image/png;base64,custom');
assert.equal(migratedCustomizedPlanner.template.resources.sampleAssets.find(item => item.role === 'school-building').id, 'asset.project.school-building.1');

const versionElevenPlanner = structuredClone(representative);
versionElevenPlanner.template.documentVersion = 11;
const legacyYearlyTitle = versionElevenPlanner.book.elementsByPage['surface.1.back'].find(item => item.id === 'page.yearly.title');
legacyYearlyTitle.format = 'year-ko';
legacyYearlyTitle.y = 7;
legacyYearlyTitle.height = 11;
const legacySong = versionElevenPlanner.book.elementsByPage['surface.2.front'].find(item => item.role === 'school-song');
legacySong.showCaption = true;
legacySong.sampleContent.image = 'data:image/png;base64,custom-song';
const migratedVersionTwelve = globalThis.ACDLProjectDocument.migrateProject(versionElevenPlanner);
assert.deepEqual(migratedVersionTwelve.report.applied, ['desk-planner-year-caption-parity-v12', 'desk-planner-calendar-layout-parity-v13', 'desk-planner-document-version-13']);
assert.equal(legacyYearlyTitle.format, 'year-plain');
assert.equal(legacyYearlyTitle.y, 4.5);
assert.equal(legacyYearlyTitle.height, 15);
assert.equal(legacySong.showCaption, false);
assert.equal(legacySong.sampleContent.image, 'data:image/png;base64,custom-song');

const versionTwelvePlanner = structuredClone(representative);
versionTwelvePlanner.template.documentVersion = 12;
versionTwelvePlanner.template.masters.calendar.calendarRegion = { x: 3, y: 20, width: 94, height: 70 };
versionTwelvePlanner.template.masters.calendar.design = { monthTitleAlign: 'center', monthTitleStyle: 'number-inline', weekdayStyle: 'outlined-pills', gridStyle: 'open-rows', presetId: 'sample-3' };
delete versionTwelvePlanner.book.elementsByPage['surface.1.back'].find(item => item.type === 'year-calendar').rowsMode;
const migratedVersionThirteen = globalThis.ACDLProjectDocument.migrateProject(versionTwelvePlanner);
assert.deepEqual(migratedVersionThirteen.report.applied, ['desk-planner-calendar-layout-parity-v13', 'desk-planner-document-version-13']);
assert.deepEqual(versionTwelvePlanner.template.masters.calendar.calendarRegion, { x: 0, y: 8, width: 100, height: 91 });
assert.equal(versionTwelvePlanner.template.masters.calendar.design.presetId, 'sample-6');
assert.equal(versionTwelvePlanner.book.elementsByPage['surface.1.back'].find(item => item.type === 'year-calendar').rowsMode, 'inherit');

const legacyReviewContacts = structuredClone(representative);
legacyReviewContacts.template.documentVersion = 7;
legacyReviewContacts.book.school.contacts = [{ label: '교무실', value: '02-111-2222' }, { label: '팩스', value: '02-111-3333' }];
const migratedLegacyReviewContacts = globalThis.ACDLProjectDocument.migrateProject(legacyReviewContacts).project.book.school.contacts;
assert.deepEqual(migratedLegacyReviewContacts, [{ label: '교무실', phone: '02-111-2222' }, { label: '팩스', fax: '02-111-3333' }]);

assert.deepEqual(
  representative.book.pageInstances.slice(0, 5).map(page => page.semanticPageRole),
  ['cover-front', 'yearly-calendar', 'school-symbols', 'month-back', 'month-calendar']
);
assert.deepEqual(
  representative.book.pageInstances.slice(-3).map(page => page.semanticPageRole),
  ['month-back', 'month-calendar', 'back-cover-information']
);
assert.ok(representative.book.elementsByPage['surface.2.front'].some(item => item.role === 'symbols-title'));
assert.ok(representative.book.elementsByPage['surface.14.back'].some(item => item.role === 'school-building'));
assert.equal(representative.book.pageInstances[3].calendarMonth, 3);
assert.equal(representative.book.pageInstances[3].role, 'monthly-back');
assert.equal(representative.book.pageInstances[4].calendarMonth, 3);
assert.equal(representative.book.pageInstances[4].role, 'monthly-front');
assert.equal(representative.book.pageInstances[26].calendarMonth, 2);
assert.equal(representative.book.pageInstances[26].role, 'monthly-front');

const legacyThirtyPagePlanner = structuredClone(desk);
legacyThirtyPagePlanner.settings.template = 'desk-sample-6';
legacyThirtyPagePlanner.template.documentVersion = 3;
const migratedLegacy = globalThis.ACDLProjectDocument.migrateProject(legacyThirtyPagePlanner);
assert.equal(migratedLegacy.project.book.pageInstances.length, 28);
assert.deepEqual(migratedLegacy.project.book.pageInstances.slice(2, 5).map(page => page.role), ['front-insert-front', 'monthly-back', 'monthly-front']);
assert.equal(migratedLegacy.project.book.pageInstances.at(-1).role, 'back-cover-back');

const wall = globalThis.ACDLProjectDocument.createProject({ ...base, type: 'wall', template: 'school-basic', sizePresetId: 'wall-a3' }, dependencies);
assert.equal(wall.book.pageInstances.length, 15);
assert.equal(wall.book.sheets.length, 0);

const poster = globalThis.ACDLProjectDocument.createProject({ ...base, type: 'poster', template: 'school-basic', sizePresetId: 'poster-a3' }, dependencies);
assert.equal(poster.book.pageInstances.length, 1);
assert.equal(poster.book.pageInstances[0].role, 'poster-annual');
assert.throws(() => globalThis.ACDLProjectDocument.createProject({ ...base, type: 'desk', template: 'school-basic', sizePresetId: 'missing' }, dependencies), /Unknown size preset/);
