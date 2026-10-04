import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import {readFileSync} from 'node:fs';
test('correction editing and Worker share calendar context while ordinary templates retain their original behavior',()=>{
 let normalized=0,geometry=0,rendered=0;const calendar={calendarRegion:{x:10}},context={window:{},project:null,normalizeElementData(){normalized++;},syncMonthlyGeometry(){geometry++;return 5;},allVisibleElements:()=>[{type:'calendar'},{type:'text'}],selectedPage:()=>({productionCalendarMaster:calendar}),renderPage(){rendered++;}};
 vm.runInNewContext(readFileSync(new URL('../apps/designer-studio/features/production-render-context.js',import.meta.url),'utf8'),context);
 context.normalizeElementData();assert.equal(context.syncMonthlyGeometry(),5);assert.equal(context.allVisibleElements().length,2);
 context.project={productionCorrection:{},book:{},template:{masters:{}}};context.normalizeElementData();assert.equal(normalized,1);assert.equal(context.syncMonthlyGeometry(),0);assert.equal(geometry,1);assert.equal(context.allVisibleElements().length,1);context.renderPage();assert.equal(context.project.template.masters.calendar,calendar);assert.equal(rendered,1);
 const html=readFileSync(new URL('../apps/designer-studio/index.html',import.meta.url),'utf8');assert.ok(html.indexOf('production-render-context.js')<html.indexOf('preview-pdf-review-export.js'));assert.ok(html.indexOf('production-editor-adapter.js')<html.indexOf('preview-pdf-review-export.js'));
});
