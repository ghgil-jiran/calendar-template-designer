import assert from 'node:assert/strict';
import test from 'node:test';

await import('../apps/designer-studio/calendar-preset-catalog.js');

const catalog = globalThis.ACDLCalendarPresetCatalog;

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
