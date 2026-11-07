import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const code=readFileSync(new URL('../apps/designer-studio/features/object-editing.js',import.meta.url),'utf8');
function editor(){const ctx={calendarEditing:true,selectedElementId:'old',selectedElementScope:'master',selectedDate:'2027-03-01',inspectorActiveTab:'design',allowed:true,renders:0};ctx.confirmDiscardInspectorChanges=()=>ctx.allowed;ctx.render=()=>ctx.renders++;runInNewContext(code.slice(0,code.indexOf('function monthTitleRegion')),ctx);return ctx;}
test('title and grid selections are mutually exclusive and clear stale cell selection',()=>{const ctx=editor();assert.equal(ctx.selectMonthlyPart('title'),true);assert.equal(ctx.calendarEditing,false);assert.equal(runInNewContext('monthTitleEditing',ctx),true);assert.equal(ctx.selectedDate,null);assert.equal(ctx.selectedElementId,null);assert.equal(ctx.inspectorActiveTab,'layout');assert.equal(ctx.selectMonthlyPart('grid'),true);assert.equal(ctx.calendarEditing,true);assert.equal(runInNewContext('monthTitleEditing',ctx),false);assert.equal(ctx.renders,2);assert.equal(ctx.selectMonthlyPart('grid'),false);assert.equal(ctx.renders,2);});
test('canceling unsaved changes leaves the original selection intact',()=>{const ctx=editor();ctx.allowed=false;assert.equal(ctx.selectMonthlyPart('title'),false);assert.equal(ctx.calendarEditing,true);assert.equal(ctx.selectedElementId,'old');assert.equal(ctx.renders,0);});
