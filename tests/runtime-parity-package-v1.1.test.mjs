import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { buildDeskAcademicPackageDocument } from '../packages/designer-runtime-integration/dist/index.js';

await import('../apps/designer-studio/dataset-domain-bridge.js');
await import('../apps/designer-studio/desk-academic-package-runtime.js');
await import('../apps/designer-studio/calendar-domain-bridge.js');
await import('../apps/designer-studio/desk-academic-shadow-renderer.js');

const readTemplate = async version => JSON.parse(await readFile(
  new URL(`../templates/desk-academic-standard/${version}/template.json`, import.meta.url),
  'utf8'
));
const legacy = await readTemplate('1.0.0');
const review = await readTemplate('1.1.0');
const size = { width: 260, height: 180, unit: 'mm' };
const page = (role, month = null) => ({
  id: `page.${role}`,
  role,
  size,
  calendarYear: month ? 2028 : null,
  calendarMonth: month,
  metadata: {}
});
const adapted = {
  template: { pages: [page('annual-calendar'), page('monthly-calendar', 3), page('monthly-photo-memo', 3)] },
  dataset: {
    school: { profile: { motto: { description: '바르게 성장' } }, contact: { site: 'school.example' } },
    calendar: { year: 2028, startMonth: 3, gridRows: 5 },
    monthlyImages: { '2028-03': 'asset:march' }
  }
};

const legacyDocument = buildDeskAcademicPackageDocument(adapted, legacy);
const reviewDocument = buildDeskAcademicPackageDocument(adapted, review);
const browserDocument = globalThis.ACDLDeskAcademicPackageRuntime.build(adapted, review);
assert.deepEqual(browserDocument, reviewDocument);

const legacyMonthly = legacyDocument.template.pages[1].objects[0];
const reviewAnnual = reviewDocument.template.pages[0].objects[0];
const reviewMonthly = reviewDocument.template.pages[1].objects[0];
const reviewPhotoMemo = reviewDocument.template.pages[2].objects[0];

assert.equal(legacyMonthly.contract, undefined);
assert.equal(legacyMonthly.renderFrame, undefined);
assert.equal(reviewAnnual.payload.year, 2028);
assert.equal(reviewAnnual.payload.startMonth, 3);
assert.equal(reviewAnnual.contract.version, 'desk-runtime-parity.v1');
assert.deepEqual(reviewMonthly.frame, { x: 13, y: 47.7, width: 234, height: 119.7 });
assert.deepEqual(reviewMonthly.renderFrame, { x: 0, y: 0, width: 260, height: 180 });
assert.deepEqual(reviewMonthly.contract.weekdayFramePct, { x: 5, y: 23, width: 90, height: 2.5 });
assert.equal(reviewPhotoMemo.contract.model, 'absolute-safe-area');
assert.deepEqual(reviewPhotoMemo.contract.children[0].framePct, { x: 5, y: 9.7, width: 90, height: 50.3 });

const rendered = globalThis.ACDLDeskAcademicShadowRenderer.renderDocument(reviewDocument);
assert.match(rendered.pages[0].html, /data-layout-contract="desk-runtime-parity\.v1"/);
assert.match(rendered.pages[0].html, /2028 학사달력/);
assert.match(rendered.pages[1].html, /class="shadow-calendar-weekdays" style="left:5%;top:23%;width:90%;height:2\.5%"/);
assert.match(rendered.pages[2].html, /data-layout="absolute-safe-area"/);
assert.match(rendered.pages[2].html, /class="shadow-photo-area" style="left:5%;top:9\.7%;width:90%;height:50\.3%"/);
