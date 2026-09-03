(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.ACDLCalendarPresetCatalog = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const schemaVersion = 'monthly-calendar-preset.v1';
  const presets = Object.freeze({
    'academic-boxed': Object.freeze({
      schemaVersion,
      presetId: 'academic-boxed',
      presetVersion: '1.0.0',
      supportedRows: Object.freeze([5, 6]),
      layout: Object.freeze({ titlePercent: 10, weekdayPercent: 4, dateGridPercent: 86 }),
      presentation: Object.freeze({
        monthTitleStyle: 'number-stack', monthTitleAlign: 'left', weekdayStyle: 'filled-tabs', gridStyle: 'boxed', eventStyle: 'strong-bars',
        cellPaddingX: 2.4, cellPaddingY: 2, lineWidth: 0.155, lineColor: '#aeb4bd', weekdayHeight: 7.06,
        weekdayCornerRadius: 3.53, dateFontSize: 2.79, miniCalendarDefault: true
      }),
      sourceMeasurement: Object.freeze({
        source: '[탁상형]2026-6-학교전경-연력-학교상징-뒷면-월목표할일플래너.pdf',
        pageWidth: 260, pageHeight: 180, gridLeft: 8.12, gridTop: 44.81, gridWidth: 243.8,
        gridHeightFiveRows: 125.19, cellWidth: 34.83, rowHeightFiveRows: 25.04, unit: 'mm'
      })
    })
  });

  function legacyPresetId(source) {
    const direct = source?.calendarPreset?.presetId;
    if (presets[direct]) return direct;
    const design = source?.design || {};
    if (design.presetId === 'sample-6') return 'academic-boxed';
    if (design.monthTitleStyle === 'number-stack' && design.weekdayStyle === 'filled-tabs' && design.gridStyle === 'boxed') return 'academic-boxed';
    return null;
  }

  function resolve(source = {}) {
    const preset = presets[legacyPresetId(source)];
    if (!preset) return null;
    const regions = source.calendarLayout?.regions;
    const validRegions = regions && [regions.titlePercent, regions.weekdayPercent, regions.dateGridPercent].every(value => Number(value) > 0)
      && Math.abs(Number(regions.titlePercent) + Number(regions.weekdayPercent) + Number(regions.dateGridPercent) - 100) < .001;
    const design = source.design || {};
    const legacyOverrides = Object.fromEntries(['monthTitleStyle', 'monthTitleAlign', 'weekdayStyle', 'gridStyle', 'eventStyle']
      .filter(key => typeof design[key] === 'string').map(key => [key, design[key]]));
    return {
      ...preset,
      layout: validRegions ? { titlePercent: Number(regions.titlePercent), weekdayPercent: Number(regions.weekdayPercent), dateGridPercent: Number(regions.dateGridPercent) } : { ...preset.layout },
      presentation: { ...preset.presentation, ...legacyOverrides, ...(source.calendarOverrides || {}) }
    };
  }

  return Object.freeze({ schemaVersion, presets, resolve });
});
