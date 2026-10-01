/* Authoritative calendar region geometry shared by authoring and user preview. */
(function (root) {
  "use strict";
  const version = "0.1.0-preview.1";
  function legacyVerticalLayout(source = {}, catalog) {
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
  function resolveVerticalLayout(source = {}, catalog) {
    const result=legacyVerticalLayout(source,catalog),geometry=source.calendarLayout?.fixedGeometry;
    if(geometry?.schemaVersion!=="monthly-grid-geometry.v1"||!Number.isFinite(geometry.titlePercent)||geometry.titlePercent<0||geometry.titlePercent>=100)return result;
    const title=geometry.titlePercent,remaining=100-title,weekday=Math.min(result.weekday,remaining),grid=remaining-weekday;
    return {...result,title,weekday,grid,weekdayStage:weekday/remaining*100,fixedGeometry:geometry};
  }
  function preserveGeometry(source,catalog,region,pageHeightMm){
    const existing=source.calendarLayout?.fixedGeometry;
    if(existing?.schemaVersion==="monthly-grid-geometry.v1"&&Number.isFinite(existing.titlePercent)&&existing.titlePercent>=0&&existing.titlePercent<100)return existing;
    const vertical=legacyVerticalLayout(source,catalog),presentation=vertical.preset?.presentation||source.design||{},chrome=resolveChromeLayout(presentation,vertical,region,pageHeightMm,catalog);
    source.calendarLayout||={};
    return source.calendarLayout.fixedGeometry={schemaVersion:"monthly-grid-geometry.v1",titlePercent:vertical.title,weekdayTrackMm:chrome.trackMm,weekdayGapMm:chrome.gridGapMm};
  }
  function separateMonthTitle(source,catalog,region,pageHeightMm){
    preserveGeometry(source,catalog,region,pageHeightMm);
    const layout=source.calendarLayout;
    if(layout.monthTitle?.schemaVersion==="monthly-title-object.v1")return layout.monthTitle;
    const share=layout.fixedGeometry.titlePercent,titleHeight=region.height*share/100;
    layout.monthTitle={schemaVersion:"monthly-title-object.v1",id:"master.monthly.title",frame:{x:region.x,y:region.y,width:region.width,height:titleHeight}};
    region.y+=titleHeight;region.height-=titleHeight;layout.fixedGeometry.titlePercent=0;
    return layout.monthTitle;
  }
  function relativeTitleFrame(title,region){
    const frame=title?.frame;
    if(!frame||!(region?.width>0&&region?.height>0))return null;
    return {x:(frame.x-region.x)/region.width*100,y:(frame.y-region.y)/region.height*100,width:frame.width/region.width*100,height:frame.height/region.height*100};
  }
  function resolveChromeLayout(presentation,vertical,region,pageHeightMm,catalog) {
    const style = presentation?.weekdayStyle || "filled-tabs";
    const spec = catalog?.weekdayPresentations?.[style] || {boxHeightMm:7.06,gridGapMm:0};
    const regionHeightMm = Number(pageHeightMm || 180)*Number(region?.height || 79)/100;
    const stageHeightMm = Math.max(1,regionHeightMm*(100-Number(vertical.title ?? 10))/100);
    const geometry=vertical.fixedGeometry,fixedTrack=Number(geometry?.weekdayTrackMm),fixedGap=Number(geometry?.weekdayGapMm),hasFixedTrack=Number.isFinite(fixedTrack)&&fixedTrack>0&&Number.isFinite(fixedGap)&&fixedGap>=0&&fixedGap<fixedTrack;
    const gridGapMm=hasFixedTrack?fixedGap:Number(spec.gridGapMm||0),trackMm=hasFixedTrack?fixedTrack:Number(spec.boxHeightMm||7.06)+gridGapMm,boxHeightMm=trackMm-gridGapMm;
    return {boxHeightMm,gridGapMm,trackMm,weekdayStage:Math.max(2,Math.min(20,trackMm/stageHeightMm*100)),contract:catalog?.compositionContract};
  }
  root.ACDLSharedCalendarLayout = Object.freeze({version,resolveVerticalLayout,resolveChromeLayout,preserveGeometry,separateMonthTitle,relativeTitleFrame});
})(globalThis);
