import test from 'node:test';import assert from 'node:assert/strict';
import '../apps/designer-studio/shared-screen-grid-presentation.js';
const grid=globalThis.ACDLSharedGridPresentation;
test('legacy saved appearance produces the same variables as its normalized form',()=>{
 const legacy={weekday:{mode:'transparent'},dateSize:26,dateFont:'Noto Serif KR',sundayBackground:'#f9e8e0',saturdayBackground:'#e8ece0',weekdayRadius:5,weekdayRuleWidth:1};
 assert.deepEqual(grid.appearanceVariables(legacy),grid.appearanceVariables(grid.normalizeAppearance(legacy)));
 const vars=grid.appearanceVariables(legacy);assert.equal(vars['--calendar-date-size'],'26px');assert.equal(vars['--calendar-date-font'],'Noto Serif KR');assert.equal(vars['--calendar-weekday-bg-1'],'#f9e8e0');assert.equal(vars['--calendar-authored-weekday-radius'],'5px');
 const monday=grid.appearanceVariables(legacy,'monday');assert.equal(monday['--calendar-weekday-bg-6'],'#e8ece0');assert.equal(monday['--calendar-weekday-bg-7'],'#f9e8e0');
});
test('missing or unrelated appearance does not erase existing template chrome',()=>{
 for(const value of [undefined,null,{},'bad',{unknown:1},{schemaVersion:'future-version'}])assert.deepEqual(grid.appearanceVariables(value),{});
});
