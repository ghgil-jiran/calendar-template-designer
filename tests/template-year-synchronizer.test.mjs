import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../apps/designer-studio/template-year-synchronizer.js', import.meta.url), 'utf8');
const context = vm.createContext({ console, structuredClone });
vm.runInContext(source, context);
const api = context.ACDLTemplateYearSynchronizer;

function fixture() {
  const months = api.monthSequence(2028, 3);
  const pages = [
    { id: 'cover', role: 'cover-front' },
    { id: 'annual', role: 'cover-back' },
    ...months.flatMap((month, index) => [
      { id: `front-${index}`, role: 'monthly-front', calendarYear: month.year, calendarMonth: month.month, monthKey: month.key, pairId: `month-pair.${month.key}`, overrides: { kept: true } },
      { id: `back-${index}`, role: 'monthly-back', calendarYear: month.year, calendarMonth: month.month, monthKey: month.key, pairId: `month-pair.${month.key}`, overrides: { kept: true } }
    ])
  ];
  return {
    settings: { year: 2028, startMonth: 3 },
    template: { metadata: { edition: 2028 }, resources: { aiDesignAssets: [{ id: 'ai-march', src: 'acdl-asset://asset' }] } },
    book: {
      pageInstances: pages,
      elementsByPage: { 'front-0': [{ id: 'edited', binding: 'calendar.year', content: 'fallback', assetId: 'ai-march', x: 17 }] },
      monthlyImages: { '2028-03': 'acdl-asset://march' },
      monthlyImageAssets: { '2028-03': { assetId: 'march' } },
      monthlyQuotes: { '2028-03': { quoteKo: '보존' } },
      monthlyStyleOverrides: [{ monthKey: '2028-03', tokens: { primary: '#123456' } }],
      events: [{ id: 'opening', title: '개학식', startDate: '2028-03-04', endDate: '2028-03-04', source: 'user-import' }]
    }
  };
}

test('edition change synchronizes page months and calendar data without rebuilding edited pages or AI assets', () => {
  const project = fixture();
  const pages = project.book.pageInstances;
  const elements = project.book.elementsByPage;
  const assets = project.template.resources.aiDesignAssets;
  api.synchronize(project, { year: 2030, startMonth: 3 });
  assert.equal(project.settings.year, 2030);
  assert.equal(project.template.metadata.edition, 2030);
  assert.equal(project.book.pageInstances, pages);
  assert.equal(project.book.elementsByPage, elements);
  assert.equal(project.template.resources.aiDesignAssets, assets);
  assert.deepEqual(project.book.pageInstances.slice(2, 4).map(page => page.monthKey), ['2030-03', '2030-03']);
  assert.equal(project.book.pageInstances.at(-1).monthKey, '2031-02');
  assert.equal(project.book.pageInstances[2].overrides.kept, true);
  assert.equal(project.book.elementsByPage['front-0'][0].x, 17);
  assert.equal(project.book.monthlyImages['2030-03'], 'acdl-asset://march');
  assert.equal(project.book.monthlyImageAssets['2030-03'].assetId, 'march');
  assert.equal(project.book.monthlyQuotes['2030-03'].quoteKo, '보존');
  assert.equal(project.book.monthlyStyleOverrides[0].monthKey, '2030-03');
  assert.equal(project.book.events[0].startDate, '2030-03-04');
});

test('start month change remaps existing monthly values by page order', () => {
  const project = fixture();
  api.synchronize(project, { year: 2028, startMonth: 1 });
  assert.equal(project.book.pageInstances[2].monthKey, '2028-01');
  assert.equal(project.book.monthlyImages['2028-01'], 'acdl-asset://march');
  assert.equal(project.book.monthlyStyleOverrides[0].monthKey, '2028-01');
});

test('date remapping clamps leap day and keeps unrecognized values unchanged', () => {
  assert.equal(api.remapDate('2028-02-29', 1), '2029-02-28');
  assert.equal(api.remapDate('학사일정 미정', 1), '학사일정 미정');
});
