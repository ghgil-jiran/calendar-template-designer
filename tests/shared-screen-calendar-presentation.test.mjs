import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';

const directory = fileURLToPath(new URL('../apps/designer-studio/', import.meta.url));
function shared(name) {
  const context = {};
  runInNewContext(readFileSync(`${directory}/${name}.js`, 'utf8'), context);
  return context;
}

test('all authored month title types have one reusable markup contract', () => {
  const { ACDLSharedMonthTitle: title } = shared('shared-screen-month-title');
  for (const style of ['number-stack', 'number-inline', 'number-only', 'year-month-korean', 'month-korean', 'english-month']) {
    assert.equal(title.title(2027, 3, style).style, style);
    assert.ok(title.title(2027, 3, style).markup.length > 0);
  }
  assert.equal(title.title(2027, 3, 'number-only', '<img>').markup, '&lt;img&gt;');
});

test('grid contract resolves supported layouts and rejects unsupported styles', () => {
  const { ACDLSharedGridPresentation: grid } = shared('shared-screen-grid-presentation');
  for (const style of ['boxed', 'minimal', 'open-rows', 'detached-cards']) {
    assert.equal(grid.resolve(style).className, `grid-${style}`);
  }
  assert.equal(grid.resolve(undefined).className, 'grid-boxed');
  assert.throws(() => grid.resolve('unexpected'), /Unsupported calendar grid style/);
});

test('date-cell mini calendars render all rows from the shared calendar model', () => {
  const { ACDLSharedMiniCalendar: mini } = shared('shared-screen-mini-calendar');
  const six = mini.resolveMiniCalendar({ type: 'mini-calendar' }, { calendarYear: 2027, calendarMonth: 2 }, { calendarRows: 6, weekStart: 'sunday' });
  const five = mini.resolveMiniCalendar({ type: 'mini-calendar' }, { calendarYear: 2027, calendarMonth: 2 }, { calendarRows: 5, weekStart: 'sunday' });
  assert.equal(six.rows, 6);
  assert.equal(five.rows, 5);
  assert.equal((mini.renderCellMiniCalendarMarkup(six).match(/class="cell-mini-week"/g) ?? []).length, 6);
  assert.equal((mini.renderCellMiniCalendarMarkup(five).match(/class="cell-mini-week"/g) ?? []).length, 5);
});

 test('title typography preserves inherited styles and escapes custom text',()=>{
 const {ACDLSharedMonthTitle:title}=shared('shared-screen-month-title');
 assert.equal(title.title(2027,3,'number-stack',undefined,{}).markup,title.title(2027,3,'number-stack').markup);
 const typography={numberSize:80,yearSize:18,englishSize:20,numberColor:'#112233',yearColor:'#445566',fontFamily:'Noto Serif KR',fontWeight:700,gap:0,metaGap:4};
 const markup=title.title(2027,3,'number-stack',undefined,typography).markup;
 assert.match(markup,/font-size:80px!important/);assert.match(markup,/color:#445566!important/);assert.match(markup,/gap:4px/);
 assert.equal(title.rootStyle(typography).gap,'0px');
 assert.equal(Object.keys(title.rootStyle(null)).length,0);
 assert.equal(Object.keys(title.normalizeTypography({numberSize:Infinity,yearSize:-1,englishColor:'red;display:none',fontFamily:"evil'"})).length,0);
 assert.match(title.title(2027,3,'month-korean','<img>',{textSize:30}).markup,/&lt;img&gt;/);
 });
