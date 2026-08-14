import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

await import('../apps/designer-studio/dataset-domain-bridge.js');
await import('../apps/designer-studio/template-package-loader.js');
await import('../apps/designer-studio/desk-academic-package-runtime.js');
await import('../apps/designer-studio/calendar-domain-bridge.js');
await import('../apps/designer-studio/desk-academic-shadow-renderer.js');
await import('../apps/designer-studio/desk-academic-visual-parity.js');

const base = new URL('../templates/desk-academic-standard/1.0.0/', import.meta.url);
const fetcher = async url => {
  const name = String(url).split('/').at(-1);
  try {
    const text = await readFile(new URL(name, base), 'utf8');
    return { ok: true, json: async () => JSON.parse(text) };
  } catch {
    return { ok: false };
  }
};
const pkg = await globalThis.ACDLTemplatePackageLoader.load(fetcher, '/ignored/');
assert.equal(pkg.manifest.publishable, false);
assert.equal(pkg.template.templateId, 'desk-academic-standard');

const size = { width: 260, height: 180, unit: 'mm' };
const page = (role, month = null) => ({
  id: `page.${role}`,
  role,
  size,
  objects: [{ id: 'legacy', type: 'text' }],
  metadata: {},
  calendarYear: month ? 2027 : null,
  calendarMonth: month
});
const roles = ['cover-front', 'annual-calendar', 'school-symbols', 'monthly-calendar', 'monthly-photo-memo', 'back-contact'];
const adapted = {
  template: { pages: roles.map(role => page(role, role.startsWith('monthly-') ? 3 : null)) },
  dataset: {
    school: { name: '테스트 학교', profile: { building: 'asset:school-building' }, contact: { address: '서울', telAcademic: '02-1', telAdmin: '', fax: '', site: '' } },
    calendar: { year: 2027, startMonth: 3 },
    monthlyImages: { '2027-03': 'asset:march' }
  },
  composition: { complete: true }
};
const document = globalThis.ACDLDeskAcademicPackageRuntime.build(adapted, pkg.template);
assert.equal(document.template.id, 'desk-academic-standard');
assert.equal(document.template.pages.length, 6);
assert.equal(document.dataset.calendar.gridRows, 5);
assert.equal(document.template.pages[0].objects.length, 4);
assert.equal(document.template.pages[4].objects[0].type, 'composite-master');
assert.equal(document.template.pages[4].objects[0].contract.children[0].bindingPattern, 'monthlyImages.{YYYY-MM}');
assert.equal(document.template.pages[4].objects[0].contract.children[0].binding, 'monthlyImages.2027-03');
assert.equal(document.template.pages[4].objects[0].contract.children[0].payload, 'asset:march');
assert.equal(document.template.pages[5].objects.length, 3);
const contact = document.template.pages[5].objects.find(object => object.id === 'back.contact-card');
assert.equal(contact.payload.address, '서울');
assert.equal(contact.payload.academicPhone, '02-1');
assert.deepEqual(contact.frame, { x: 12.74, y: 133.56, width: 234.52, height: 33.84 });
const backPhoto = document.template.pages[5].objects.find(object => object.id === 'back.photo');
assert.equal(backPhoto.payload, 'asset:school-building');

const diagnostics = globalThis.ACDLDeskAcademicPackageRuntime.validate(document);
assert.ok(diagnostics.some(item => item.code === 'PACKAGE_SURFACE_COUNT'));
assert.equal(diagnostics.some(item => item.code === 'PACKAGE_CALENDAR_ROWS'), false);

const months = Array.from({ length: 12 }, (_, offset) => {
  const date = new Date(2027, 2 + offset, 1);
  return { year: date.getFullYear(), month: date.getMonth() + 1 };
});
const fullPages = [page('cover-front'), page('annual-calendar'), page('school-symbols')];
fullPages.push(page('monthly-photo-memo', 3));
for (let index = 0; index < 11; index += 1) {
  const current = months[index];
  const next = months[index + 1];
  fullPages.push(
    { ...page('monthly-calendar', current.month), calendarYear: current.year },
    { ...page('monthly-photo-memo', next.month), calendarYear: next.year }
  );
}
fullPages.push(
  { ...page('monthly-calendar', 2), calendarYear: 2028 },
  page('back-contact')
);
const fullDocument = globalThis.ACDLDeskAcademicPackageRuntime.build({ ...adapted, template: { pages: fullPages } }, pkg.template);
const fullDiagnostics = globalThis.ACDLDeskAcademicPackageRuntime.validate(fullDocument);
assert.equal(fullDocument.template.pages.length, 28);
assert.equal(fullDiagnostics.filter(item => item.severity === 'error').length, 0);
assert.equal(fullDiagnostics.filter(item => item.code === 'PACKAGE_MONTHLY_IMAGE_EMPTY').length, 11);
assert.equal(fullDiagnostics.some(item => item.code === 'PACKAGE_CONTACT_EMPTY'), false);

const shadow = globalThis.ACDLDeskAcademicShadowRenderer.renderDocument(fullDocument);
assert.equal(shadow.pageCount, 28);
assert.equal(shadow.pages.filter(item => item.role === 'monthly-calendar').length, 12);
assert.equal(shadow.pages.filter(item => item.role === 'monthly-photo-memo').length, 12);
assert.equal(shadow.pages.at(-1).role, 'back-contact');
assert.match(shadow.pages.find(item => item.role === 'monthly-calendar').html, /data-calendar-rows="5"/);
assert.match(shadow.pages.find(item => item.role === 'monthly-photo-memo').html, /data-layout="photo-1\.7-memo-1"/);
assert.match(shadow.pages.at(-1).html, /CONTACT INFORMATION/);
const visualParity = globalThis.ACDLDeskAcademicVisualParity.compare(shadow);
assert.equal(visualParity.structurallyReady, true);
assert.equal(visualParity.visuallyApproved, false);
assert.deepEqual(visualParity.issues, []);

const html = await readFile(new URL('../apps/designer-studio/index.html', import.meta.url), 'utf8');
assert.match(html, /lastDeskAcademicPackageDocument/);
assert.match(html, /lastDeskAcademicShadowRender/);
assert.match(html, /lastDeskAcademicVisualParity/);
assert.match(html, /ACDLTemplatePackageLoader\.load\(\)/);
