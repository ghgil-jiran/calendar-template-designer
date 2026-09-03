(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.ACDLCalendarPresetCatalog = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const schemaVersion = 'monthly-calendar-preset.v1';
  const gridPresentations = Object.freeze({
    boxed: Object.freeze({ id: 'boxed', label: '전체 박스 격자', supportedRows: Object.freeze([5, 6]) }),
    'open-rows': Object.freeze({ id: 'open-rows', label: '독립 밑줄', supportedRows: Object.freeze([5, 6]), source: '월력-날짜 격자 디자인 1.pdf' }),
    minimal: Object.freeze({ id: 'minimal', label: '미니멀 무선', supportedRows: Object.freeze([5, 6]), source: '월력-날짜 격자 디자인 2.pdf' }),
    'detached-cards': Object.freeze({ id: 'detached-cards', label: '개별 사각 셀', supportedRows: Object.freeze([5, 6]) })
  });
  const titlePresentations = Object.freeze({
    'number-stack': Object.freeze({ id: 'number-stack', label: '큰 월 숫자 + 연도·영문월 세로', titlePercent: 16 }),
    'number-inline': Object.freeze({ id: 'number-inline', label: '연도 + 큰 월 숫자 + 영문월 가로', titlePercent: 18 }),
    'number-only': Object.freeze({ id: 'number-only', label: '큰 월 숫자만', titlePercent: 16 }),
    'year-month-korean': Object.freeze({ id: 'year-month-korean', label: '연도년 월월 한글형', titlePercent: 10 }),
    'month-korean': Object.freeze({ id: 'month-korean', label: '월월 한글형', titlePercent: 10 }),
    'english-month': Object.freeze({ id: 'english-month', label: '영문 월 + 연도', titlePercent: 12 })
  });
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
        weekdayCornerRadius: 3.53, titleWeekdayGap: 1.7, dateFontSize: 2.79, miniCalendarDefault: true
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
    if (legacyOverrides.monthTitleStyle === 'korean-label') legacyOverrides.monthTitleStyle = 'year-month-korean';
    return {
      ...preset,
      layout: validRegions ? { titlePercent: Number(regions.titlePercent), weekdayPercent: Number(regions.weekdayPercent), dateGridPercent: Number(regions.dateGridPercent) } : { ...preset.layout },
      presentation: { ...preset.presentation, ...legacyOverrides, ...(source.calendarOverrides || {}) }
    };
  }

  return Object.freeze({ schemaVersion, gridPresentations, titlePresentations, presets, resolve });
});
