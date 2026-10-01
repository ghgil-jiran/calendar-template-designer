import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const sandbox={globalThis:{}};
runInNewContext(readFileSync(new URL('../apps/designer-studio/shared-screen-calendar-layout.js',import.meta.url),'utf8'),sandbox);
const layout=sandbox.globalThis.ACDLSharedCalendarLayout;
const catalog=requireCatalog();
function requireCatalog(){const ctx={globalThis:{},module:{exports:{}}};runInNewContext(readFileSync(new URL('../apps/designer-studio/calendar-preset-catalog.js',import.meta.url),'utf8'),ctx);return ctx.globalThis.ACDLCalendarPresetCatalog;}
test('authoring layout uses stored zone shares and editor preset contract',()=>{
  assert.equal(layout.version,'0.1.0-preview.1');
  const custom=layout.resolveVerticalLayout({design:{monthTitleStyle:'english-month',verticalLayout:{title:16,weekday:5,grid:79}}},catalog);
  assert.equal(custom.title,16);assert.equal(custom.weekday,5);
  const fallback=layout.resolveVerticalLayout({design:{monthTitleStyle:'english-month'}},catalog);
  assert.equal(fallback.title,10);
  const preset=layout.resolveVerticalLayout({calendarPreset:{presetId:'academic-boxed'},design:{monthTitleStyle:'number-stack'}},catalog);
  assert.equal(preset.title,18);
  const chrome=layout.resolveChromeLayout(preset.preset.presentation,preset,{height:87},180,catalog);
  assert.ok(chrome.weekdayStage>2 && chrome.weekdayStage<10);
});

test('saved geometry survives title and weekday presentation changes and serialization',()=>{
 const master={design:{monthTitleStyle:'number-stack',weekdayStyle:'filled-tabs',gridStyle:'boxed'},calendarPreset:{presetId:'academic-boxed'}};
 const region={height:79},geometry=layout.preserveGeometry(master,catalog,region,180),before=layout.resolveVerticalLayout(master,catalog),chrome=layout.resolveChromeLayout(before.preset.presentation,before,region,180,catalog);
 for(const title of ['number-inline','number-only','year-month-korean','english-month']){
  const changed=JSON.parse(JSON.stringify(master));changed.calendarOverrides={monthTitleStyle:title,weekdayStyle:'outlined-pills'};const after=layout.resolveVerticalLayout(changed,catalog),afterChrome=layout.resolveChromeLayout(after.preset.presentation,after,region,180,catalog);
  assert.equal(after.title,before.title);assert.equal(after.grid,before.grid);assert.equal(afterChrome.trackMm,chrome.trackMm);assert.equal(afterChrome.gridGapMm,chrome.gridGapMm);
 }
 assert.equal(layout.preserveGeometry(master,catalog,region,180),geometry);
});
test('geometry conversion preserves existing authored layout before freezing it',()=>{
 const master={design:{verticalLayout:{title:16,weekday:5,grid:79}}};const before=layout.resolveVerticalLayout(master,catalog);layout.preserveGeometry(master,catalog,{height:79},180);const after=layout.resolveVerticalLayout(master,catalog);assert.equal(after.title,before.title);assert.equal(after.grid,before.grid);
});

test('title separation preserves grid frame and is idempotent after save and reopen',()=>{
 const source={design:{monthTitleStyle:'number-stack',weekdayStyle:'filled-tabs',gridStyle:'boxed'},calendarPreset:{presetId:'academic-boxed'}},region={x:5,y:16,width:90,height:79};
 const before=layout.resolveVerticalLayout(source,catalog),oldGridY=region.y+region.height*before.title/100,oldGridHeight=region.height*(100-before.title)/100;
 const title=layout.separateMonthTitle(source,catalog,region,180);assert.equal(region.y,oldGridY);assert.equal(region.height,oldGridHeight);assert.equal(title.frame.y,16);assert.equal(layout.resolveVerticalLayout(source,catalog).title,0);
 const saved=JSON.parse(JSON.stringify({source,region}));layout.separateMonthTitle(saved.source,catalog,saved.region,180);assert.equal(saved.region.y,oldGridY);assert.equal(saved.region.height,oldGridHeight);
 const titleY=title.frame.y;region.y+=5;region.height-=4;assert.equal(title.frame.y,titleY);const relative=layout.relativeTitleFrame(title,region);assert.ok(relative.y<0);assert.equal(region.y+relative.y/100*region.height,titleY);
});
