/* Authoritative calendar region geometry shared by authoring and user preview. */
(function (root) {
  "use strict";
  const version = "0.1.0-preview.1";
  function resolveVerticalLayout(source = {}, catalog) {
    const design = source.design || {};
    const preset = catalog?.resolve({calendarPreset:source.calendarPreset,calendarLayout:source.calendarLayout,calendarOverrides:source.calendarOverrides,design});
    if (preset) {
      const layout = preset.layout;
      const titleSpec = catalog?.titlePresentations?.[preset.presentation.monthTitleStyle];
      const title = Math.max(layout.titlePercent, titleSpec?.titlePercent || 0);
      const remaining = 100 - title;
      const weekday = Math.min(layout.weekdayPercent, remaining);
      const grid = remaining - weekday;
      return {title,weekday,grid,weekdayStage:weekday/(weekday+grid)*100,preset};
    }
    const presets = {"sample-6":{title:10,weekday:4,grid:86},"sample-3":{title:21,weekday:4,grid:75}};
    const stored = design.verticalLayout;
    const total = Number(stored?.title || 0)+Number(stored?.weekday || 0)+Number(stored?.grid || 0);
    const detected = design.presetId && presets[design.presetId] ? design.presetId : design.monthTitleStyle === "number-inline" ? "sample-3" : "sample-6";
    const layout = total === 100 ? stored : presets[detected];
    const stage = layout.weekday+layout.grid;
    return {...layout,weekdayStage:layout.weekday/stage*100};
  }
  function resolveChromeLayout(presentation,vertical,region,pageHeightMm,catalog) {
    const style = presentation?.weekdayStyle || "filled-tabs";
    const spec = catalog?.weekdayPresentations?.[style] || {boxHeightMm:7.06,gridGapMm:0};
    const regionHeightMm = Number(pageHeightMm || 180)*Number(region?.height || 79)/100;
    const stageHeightMm = Math.max(1,regionHeightMm*(100-Number(vertical.title || 10))/100);
    const boxHeightMm = Number(spec.boxHeightMm || 7.06),gridGapMm = Number(spec.gridGapMm || 0),trackMm = boxHeightMm+gridGapMm;
    return {boxHeightMm,gridGapMm,trackMm,weekdayStage:Math.max(2,Math.min(20,trackMm/stageHeightMm*100)),contract:catalog?.compositionContract};
  }
  root.ACDLSharedCalendarLayout = Object.freeze({version,resolveVerticalLayout,resolveChromeLayout});
})(globalThis);
