import assert from 'node:assert/strict';
import test from 'node:test';

await import('../apps/designer-studio/user-service-dataset-bridge.js');
const bridge = globalThis.ACDLUserServiceDatasetBridge;

function dataset() {
  return {
    schemaVersion: '1.0', locale: 'ko-KR', timezone: 'Asia/Seoul',
    school: { name: '테스트중학교', contacts: [], profile: {} },
    calendar: { year: 2027, startMonth: 3, weekStart: 'sunday', gridRows: 5, events: [], dataOptions: { includeHolidays: true, includeSolarTerms: true, includeLunar: true } },
    monthlyImages: { '2027-03': { assetRef: { ref: 'idb', id: 'march-photo' }, sourcePageN: 3 } },
    variables: { source: 'jirantech-calendar-editor-v1.1', sourceDocumentId: 'doc-1', sourceTemplateId: 'desk-v1.1' }
  };
}

test('accepts the confirmed user service v1.1 Dataset contract without cloning it', () => {
  const source = dataset();
  const accepted = bridge.accept({ dataset: source, diagnostics: [], hasErrors: false });
  assert.equal(accepted.dataset, source);
  assert.equal(accepted.hasErrors, false);
  assert.deepEqual(accepted.diagnostics, []);
});

test('combines upstream adapter diagnostics with template boundary diagnostics', () => {
  const source = dataset();
  source.calendar.gridRows = 6;
  source.monthlyImages.bad = { assetRef: { ref: 'idb', id: '' }, sourcePageN: '3' };
  const accepted = bridge.accept({ dataset: source, diagnostics: [{ severity: 'warning', code: 'ORPHAN_MONTHLY_IMAGE', message: '원본 경고' }], hasErrors: false });
  assert.equal(accepted.hasErrors, true);
  assert.deepEqual(accepted.diagnostics.map(item => item.code), ['ORPHAN_MONTHLY_IMAGE', 'INVALID_GRID_ROWS', 'INVALID_MONTH_KEY', 'INVALID_ASSET_REF', 'INVALID_SOURCE_PAGE']);
});

test('recognizes only the two confirmed v1.1 asset reference forms', () => {
  assert.equal(bridge.isAssetRef({ ref: 'idb', id: 'asset-1' }), true);
  assert.equal(bridge.isAssetRef({ ref: 'url', src: '/photo.jpg' }), true);
  assert.equal(bridge.isAssetRef({ assetId: 'guessed-shape' }), false);
});
