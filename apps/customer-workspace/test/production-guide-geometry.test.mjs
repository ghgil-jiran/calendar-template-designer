import test from 'node:test';
import assert from 'node:assert/strict';
import {productionGuideGeometry,bindingPreviewRects} from '../src/features/editor/production-guide-geometry.ts';
test('desk guides use one physical geometry across template and page overrides',()=>{
 const size={width:260,height:180},expected={width:260,height:180,bleed:3,safeX:3,safeTop:15,safeBottom:3};
 for(const project of [{productType:{pageSize:size},template:{resources:{exportSettings:{bleed:0}}},page:{contentFramePct:{x:1,y:1,width:98,height:98}}},{productType:{pageSize:size},template:{resources:{exportSettings:{bleed:12}}},page:{contentFramePct:{x:20,y:20,width:60,height:60}}}]){
  const before=JSON.stringify(project);assert.deepEqual(productionGuideGeometry(project.productType.pageSize),expected);assert.equal(JSON.stringify(project),before);
 }
});
test('different physical sizes retain 3mm bleed and valid inset rectangles',()=>{
 const g=productionGuideGeometry({width:297,height:205.615});assert.equal(g.bleed,3);assert.equal(g.safeX,3);assert.equal(g.safeTop,15);assert.equal(g.safeBottom,3);assert.ok(Math.abs((g.height-g.safeTop-g.safeBottom)-187.615)<1e-8);const poster=productionGuideGeometry({width:420,height:594},"poster");assert.deepEqual(poster,{width:420,height:594,bleed:3,safeX:5,safeTop:5,safeBottom:5});
 for(const size of [{width:0,height:180},{width:260,height:NaN}])assert.throws(()=>productionGuideGeometry(size));
});

test('binding previews keep every mark inside the same top strip at any page size',()=>{for(const [w,h] of [[260,180],[297,205.615]]){const marks=bindingPreviewRects(w,h);assert.equal(marks.length,26);for(const r of marks){assert.ok(r.x>0&&r.x+r.width<w);assert.ok(r.y>0&&r.y+r.height<15);}assert.ok(Math.abs(marks[0].x/w-bindingPreviewRects(260,180)[0].x/260)<1e-10)}});
