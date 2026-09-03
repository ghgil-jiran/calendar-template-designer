import assert from 'node:assert/strict';
import test from 'node:test';

await import('../apps/designer-studio/calendar-preset-catalog.js');

const catalog = globalThis.ACDLCalendarPresetCatalog;

test('grid presentation catalog exposes four date-cell structures for five and six rows', () => {
  assert.deepEqual(Object.keys(catalog.gridPresentations), ['boxed', 'open-rows', 'minimal', 'detached-cards']);
  Object.values(catalog.gridPresentations).forEach(grid => assert.deepEqual([...grid.supportedRows], [5, 6]));
  assert.equal(catalog.gridPresentations['open-rows'].source, '월력-날짜 격자 디자인 1.pdf');
  assert.equal(catalog.gridPresentations.minimal.source, '월력-날짜 격자 디자인 2.pdf');
});

test('month title catalog declares six structures and their required vertical shares', () => {
  assert.deepEqual(Object.keys(catalog.titlePresentations), ['number-stack', 'number-inline', 'number-only', 'year-month-korean', 'month-korean', 'english-month']);
  assert.equal(catalog.titlePresentations['number-stack'].titlePercent, 18);
  assert.equal(catalog.titlePresentations['number-inline'].titlePercent, 20);
  assert.equal(catalog.titlePresentations['number-only'].titlePercent, 20);
  assert.equal(catalog.titlePresentations['year-month-korean'].titlePercent, 10);
});

test('academic boxed preset keeps measured sample 6 geometry', () => {
  const preset = catalog.presets['academic-boxed'];
  assert.equal(preset.schemaVersion, 'monthly-calendar-preset.v1');
  assert.deepEqual([...preset.supportedRows], [5, 6]);
  assert.deepEqual(preset.layout, { titlePercent: 10, weekdayPercent: 4, dateGridPercent: 86 });
  assert.equal(preset.sourceMeasurement.pageWidth, 260);
  assert.equal(preset.sourceMeasurement.pageHeight, 180);
  assert.equal(preset.sourceMeasurement.gridWidth, 243.8);
  assert.equal(preset.sourceMeasurement.lineWidth, undefined);
  assert.equal(preset.presentation.lineWidth, .155);
  assert.equal(preset.presentation.titleWeekdayGap, 1.7);
});

test('academic boxed resolver reads the new contract and whitelisted overrides', () => {
  const preset = catalog.resolve({
    calendarPreset: { presetId: 'academic-boxed' },
    calendarLayout: { regions: { titlePercent: 10, weekdayPercent: 4, dateGridPercent: 86 } },
    calendarOverrides: { lineColor: '#123456' }
  });
  assert.equal(preset.presetId, 'academic-boxed');
  assert.equal(preset.presentation.lineColor, '#123456');
});

test('legacy inspector choices override the preset until they are migrated', () => {
  const preset = catalog.resolve({
    calendarPreset: { presetId: 'academic-boxed' },
    design: { presetId: 'sample-6', weekdayStyle: 'outlined-pills', gridStyle: 'open-rows' }
  });
  assert.equal(preset.presentation.weekdayStyle, 'outlined-pills');
  assert.equal(preset.presentation.gridStyle, 'open-rows');
});

test('legacy sample 6 resolves without treating sample 3 as the same preset', () => {
  assert.equal(catalog.resolve({ design: { presetId: 'sample-6' } }).presetId, 'academic-boxed');
  assert.equal(catalog.resolve({ design: { presetId: 'sample-3' } }), null);
});
