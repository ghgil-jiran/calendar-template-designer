import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import '../apps/designer-studio/calendar-preset-catalog.js';
import '../apps/designer-studio/shared-screen-grid-presentation.js';
import '../apps/designer-studio/shared-screen-calendar-layout.js';
const catalog=globalThis.ACDLCalendarPresetCatalog,grid=globalThis.ACDLSharedGridPresentation,layout=globalThis.ACDLSharedCalendarLayout;
const weekdays=Object.keys(catalog.weekdayPresentations),grids=Object.keys(catalog.gridPresentations);
test('all 36 weekday/grid/row choices survive save and reopen without changing fixed geometry',()=>{
 assert.equal(weekdays.length,3);assert.equal(grids.length,6);
 for(const rows of [5,6])for(const weekdayStyle of weekdays)for(const gridStyle of grids){
  const source={calendarPreset:{presetId:'academic-boxed'},design:{weekdayStyle:'filled-tabs',gridStyle:'boxed'},calendarLayout:{rowsMode:String(rows)}},region={x:4,y:20,width:92,height:75};
  layout.separateMonthTitle(source,catalog,region,180);
  const before=JSON.stringify({region,fixed:source.calendarLayout.fixedGeometry});
  source.design={weekdayStyle,gridStyle};source.calendarOverrides={weekdayStyle,gridStyle};
  const restored=JSON.parse(JSON.stringify({source,region}));
  layout.separateMonthTitle(restored.source,catalog,restored.region,180);
  const presentation=catalog.resolvePresentation(restored.source),vertical=layout.resolveVerticalLayout(restored.source,catalog),chrome=layout.resolveChromeLayout(presentation,vertical,restored.region,180,catalog);
  assert.equal(presentation.weekdayStyle,weekdayStyle);assert.equal(presentation.gridStyle,gridStyle);assert.equal(grid.resolve(presentation.gridStyle).className,`grid-${gridStyle}`);
  assert.equal(JSON.stringify({region:restored.region,fixed:restored.source.calendarLayout.fixedGeometry}),before);
  assert.ok(chrome.weekdayStage>0&&chrome.weekdayStage<100);
  assert.equal(restored.source.calendarLayout.rowsMode,String(rows));
 }
});
test('unfrozen weekday rectangles reserve their own gap',()=>{
 const source={design:{weekdayStyle:'outlined-rects',gridStyle:'row-underlines'}};
 const vertical=layout.resolveVerticalLayout(source,catalog),chrome=layout.resolveChromeLayout(source.design,vertical,{height:75},180,catalog);
 assert.equal(chrome.boxHeightMm,5.5);assert.equal(chrome.gridGapMm,1.6);
 assert.deepEqual([...catalog.gridPresentations['row-underlines'].supportedRows],[5,6]);
});
test('obsolete first-week and shared weekday top strokes are removed from authoring styles',()=>{
 const css=readFileSync(new URL('../apps/designer-studio/designer-studio-core.css',import.meta.url),'utf8');
 assert.doesNotMatch(css,/grid-open-rows[^{}]*\.cell:nth-child\(n\+8\):nth-child\(-n\+14\)\{border-top/);
 assert.doesNotMatch(css,/data-standard-family="desk-6"[^{}]*\.calendar\{border-top/);
});
