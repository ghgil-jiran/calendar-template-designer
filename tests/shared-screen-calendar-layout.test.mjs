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
