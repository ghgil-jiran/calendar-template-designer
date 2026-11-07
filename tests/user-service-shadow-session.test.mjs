import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

await import('../apps/designer-studio/dataset-domain-bridge.js');
await import('../apps/designer-studio/calendar-domain-bridge.js');
await import('../apps/designer-studio/desk-academic-package-runtime.js');
await import('../apps/designer-studio/desk-academic-shadow-renderer.js');
await import('../apps/designer-studio/desk-academic-visual-parity.js');
await import('../apps/designer-studio/user-service-shadow-session.js');
const shadow = globalThis.ACDLUserServiceShadowSession;

function pages() {
  return [
    { role: 'cover-front' }, { role: 'annual-calendar' }, { role: 'school-symbols' },
    ...Array.from({ length: 12 }, () => ({ role: 'monthly-calendar' })),
    ...Array.from({ length: 12 }, () => ({ role: 'monthly-photo-memo' })),
    { role: 'back-contact' }
  ];
}

test('compares school, events, image keys and the 28 surface roles', () => {
  const source = { school: { name: '학교', contacts: [] }, calendar: { events: [{ id: 'e1', title: '개학', startDate: '2027-03-02', endDate: '2027-03-02', range: false }] }, monthlyImages: { '2027-03': { assetRef: { ref: 'url', src: '/a.jpg' } } } };
  const resolved = { ...source, school: { ...source.school, contact: { address: '', telAcademic: '', telAdmin: '', fax: '', site: '' } }, monthlyImages: { '2027-03': { ...source.monthlyImages['2027-03'], src: '/a.jpg' } } };
  const report = shadow.compareData(source, resolved, { dataset: resolved, template: { pages: pages() } });
  assert.equal(report.matches, true);
  assert.equal(report.metrics.pageCount, 28);
  assert.equal(report.metrics.resolvedMonthlyImageCount, 1);
  assert.deepEqual(report.issues, []);
});

test('reports data loss and unresolved images without changing approval state', () => {
  const source = { school: { name: '원본', contacts: [] }, calendar: { events: [{ id: 'e1', title: '개학' }] }, monthlyImages: { '2027-03': { assetRef: { ref: 'idb', id: 'missing' } } } };
  const resolved = { ...source, school: { ...source.school, contact: { address: '', telAcademic: '', telAdmin: '', fax: '', site: '' } }, monthlyImages: { '2027-03': source.monthlyImages['2027-03'] } };
  const report = shadow.compareData(source, resolved, { dataset: { ...resolved, school: { name: '변경됨' }, calendar: { events: [] } }, template: { pages: pages().slice(1) } });
  assert.equal(report.matches, false);
  assert.ok(report.issues.some(item => item.code === 'SHADOW_SCHOOL_NAME_MISMATCH'));
  assert.ok(report.issues.some(item => item.code === 'SHADOW_EVENTS_MISMATCH'));
  assert.ok(report.issues.some(item => item.code === 'SHADOW_MONTHLY_IMAGE_UNRESOLVED' && item.severity === 'warning'));
  assert.ok(report.issues.some(item => item.code === 'SHADOW_PAGE_ROLE_COUNT'));
});

test('stops before package loading when the user Dataset is invalid', async () => {
  let loaded = false;
  const session = shadow.create({
    runtimeAdapter: { adaptUserServiceWithAssets: async () => ({ hasErrors: true, diagnostics: [{ severity: 'error', code: 'INVALID_DATASET' }] }) },
    packageLoader: { load: async () => { loaded = true; } }
  });
  const result = await session.run({}, { dataset: {} });
  assert.equal(result.status, 'blocked');
  assert.equal(result.readyForReview, false);
  assert.equal(loaded, false);
});

test('runs the complete hidden shadow pipeline and never approves replacement', async () => {
  const dataset = { school: { name: '학교', contacts: [], contact: { address: '', telAcademic: '', telAdmin: '', fax: '', site: '' } }, calendar: { events: [] }, monthlyImages: {} };
  const document = { dataset, template: { pages: pages() } };
  const session = shadow.create({
    runtimeAdapter: { adaptUserServiceWithAssets: async () => ({ hasErrors: false, diagnostics: [], dataset, template: { pages: pages() } }) },
    packageLoader: { load: async () => ({ template: {}, parity: {} }) },
    packageRuntime: { build: () => document, validate: () => [] },
    renderer: { renderDocument: () => ({ pageCount: 28, pages: [] }) },
    visualParity: { compare: () => ({ structurallyReady: true, visuallyApproved: false, issues: [] }) }
  });
  const result = await session.run({}, { dataset });
  assert.equal(result.status, 'ready');
  assert.equal(result.readyForReview, true);
  assert.equal(result.approvedForReplacement, false);
  assert.equal(result.parity.data.matches, true);
});

test('renders a confirmed user Dataset through the real 28-page package pipeline', async () => {
  const months = Array.from({ length: 12 }, (_, offset) => {
    const date = new Date(2027, 2 + offset, 1);
    return { year: date.getFullYear(), month: date.getMonth() + 1, key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}` };
  });
  const size = { width: 260, height: 180, unit: 'mm' };
  const page = (role, index, month) => ({ id: `shadow.${index}`, role, size, objects: [], metadata: month ? { calendarYear: month.year, calendarMonth: month.month } : {} });
  const runtimePages = [page('cover-front', 0), page('annual-calendar', 1), page('school-symbols', 2), page('monthly-photo-memo', 3, months[0])];
  for (let index = 0; index < 11; index++) runtimePages.push(page('monthly-calendar', runtimePages.length, months[index]), page('monthly-photo-memo', runtimePages.length + 1, months[index + 1]));
  runtimePages.push(page('monthly-calendar', 26, months[11]), page('back-contact', 27));

  const source = {
    school: { name: '테스트중학교', address: '서울시 중구', website: 'school.example', contacts: [{ type: 'academic', value: '02-1' }, { type: 'fax', value: '02-3' }], profile: { motto: { description: '바르게 살자' } } },
    calendar: { year: 2027, startMonth: 3, weekStart: 'sunday', gridRows: 5, events: [] },
    monthlyImages: Object.fromEntries(months.map((month, index) => [month.key, { assetRef: { ref: 'url', src: `/${month.key}.jpg` }, sourcePageN: index * 2 + 3 }]))
  };
  const resolved = {
    ...source,
    school: { ...source.school, contact: { address: '서울시 중구', telAcademic: '02-1', telAdmin: '', fax: '02-3', site: 'school.example' } },
    monthlyImages: Object.fromEntries(Object.entries(source.monthlyImages).map(([key, value]) => [key, { ...value, src: value.assetRef.src }]))
  };
  const base = new URL('../templates/desk-academic-standard/1.0.0/', import.meta.url);
  const pkg = {
    template: JSON.parse(await readFile(new URL('template.json', base), 'utf8')),
    parity: JSON.parse(await readFile(new URL('parity.json', base), 'utf8'))
  };
  const session = shadow.create({ runtimeAdapter: { adaptUserServiceWithAssets: async () => ({ dataset: resolved, template: { pages: runtimePages }, composition: { complete: true }, diagnostics: [], hasErrors: false }) } });
  const result = await session.run({}, { dataset: source }, { package: pkg });
  assert.equal(result.status, 'ready');
  assert.equal(result.document.template.pages.length, 28);
  assert.equal(result.parity.data.metrics.resolvedMonthlyImageCount, 12);
  assert.match(result.rendered.pages.find(item => item.role === 'monthly-photo-memo').html, /2027-03\.jpg/);
  assert.match(result.rendered.pages.at(-1).html, /02-1/);
  assert.equal(result.approvedForReplacement, false);
});
