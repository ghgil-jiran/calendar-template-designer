import vm from 'node:vm';
import '../apps/designer-studio/wall-calendar-policy.js';
import { readStudioFeatureSource } from './studio-feature-source.mjs';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const shared=readFileSync(new URL('../apps/designer-studio/shared-screen-schedule.js',import.meta.url),'utf8');
const source = readFileSync(new URL('../apps/designer-studio/index.html', import.meta.url), 'utf8')+readStudioFeatureSource()+readFileSync(new URL('../apps/designer-studio/designer-studio-overrides.css', import.meta.url), 'utf8');

test('annual event list supports limited and full display modes', () => {
  assert.match(source, /id="eventListDisplayMode"/);
  assert.match(source, /<option value="all"[^>]*>전체 일정 표시<\/option>/);
  assert.match(source, /limitedMode=!\['all','year-by-month','month'\]\.includes\(item\.displayMode\)/);
});

test('new and previously saved poster grids open with academic editing and monthly lists',()=>{
 const editing=readFileSync(new URL('../apps/designer-studio/features/object-editing.js',import.meta.url),'utf8');
 const legacy={id:'existing',type:'year-calendar',x:8,y:14,width:83,height:70,columns:3};
 const pages=[{id:'new',role:'poster-annual'},{id:'old',role:'poster-annual'}];
 const project={productType:{category:'poster'},settings:{year:2027,posterPageCount:2},template:{},book:{school:{name:'학교'},pageInstances:pages,elementsByPage:{old:[legacy]},posterElementsInitialized:{old:true}}};
 const context=vm.createContext({project,structuredClone,window:{ACDLWallCalendar}});
 vm.runInContext(editing.slice(editing.indexOf('function createPosterElements('),editing.indexOf('function schoolBindingValue('))+'\nensureEditablePoster();',context);
 const newGrid=project.book.elementsByPage.new.find(item=>item.type==='year-calendar');
 for(const item of [newGrid,legacy]){
  assert.equal(item.academicPoster,true);
  assert.equal(item.monthCount,6);
  assert.equal(ACDLWallCalendar.presetName(item.wallCalendarSettings),'basic-2-1');
 }
 assert.equal(legacy.posterMonthOffset,6);
 assert.deepEqual([legacy.x,legacy.y,legacy.width,legacy.height],[8,14,83,70]);
 const prior=legacy.wallCalendarSettings;
 vm.runInContext('ensureEditablePoster()',context);
 assert.equal(legacy.wallCalendarSettings,prior);
});

test('event list exposes automatic columns and bounded type controls', () => {
  assert.match(source, /<option value="auto"[^>]*>자동 · 개체 크기에 맞춤<\/option>/);
  assert.match(source, /id="eventListFontSize"/);
  assert.match(source, /id="eventListMinFontSize"/);
  assert.match(source, /id="eventListAutoShrink"/);
  assert.match(shared, /while\(list\.scrollHeight>list\.clientHeight\+1&&font>minFont\)/);
});

test('overflow feedback is editor-only', () => {
  assert.match(source, /event-list-overflow-warning/);
  assert.match(source, /\.preview-only \.event-list-overflow-warning/);
  assert.match(shared, /'전체 '\+count\+'건 · 영역 초과'/);
});
