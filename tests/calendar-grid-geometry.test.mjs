import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const css=readFileSync(new URL('../apps/designer-studio/shared-screen-calendar-presentation.css',import.meta.url),'utf8');
test('grid backgrounds do not paint the schedule overlay or fade adjacent cell surfaces',()=>{
 assert.doesNotMatch(css,/\.shared-month-date-grid>div/);
 assert.match(css,/\.calendar>\.cell\.adj\s*\{opacity:1\}/);
 assert.match(css,/\.calendar>\.cell\.adj>\.day-stack\s*\{opacity:\.35\}/);
});
test('grid geometry owns directional strokes and matches weekday/date/range gaps',()=>{
 assert.doesNotMatch(css,/\[style\*="--calendar-line-width"\]/);
 assert.match(css,/\.shared-month-range-grid\)\s*\{[\s\S]*?column-gap:var\(--calendar-grid-gap\)!important;row-gap:var\(--calendar-grid-gap\)!important/);
 assert.match(css,/grid-boxed[\s\S]*?border-right:var\(--calendar-grid-line\)!important;border-bottom:var\(--calendar-grid-line\)!important/);
 assert.match(css,/grid-open-rows[\s\S]*?border-bottom:var\(--calendar-grid-line\)!important/);
});
