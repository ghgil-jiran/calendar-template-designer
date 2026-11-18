import test from 'node:test';
import assert from 'node:assert/strict';
import {productionGuideGeometry} from '../src/features/editor/production-guide-geometry.ts';
test('desk guides use one physical geometry across template and page overrides',()=>{
 const size={width:260,height:180},expected={width:260,height:180,bleed:3,safeX:8.2,safeY:6.6};
 for(const project of [{productType:{pageSize:size},template:{resources:{exportSettings:{bleed:0}}},page:{contentFramePct:{x:1,y:1,width:98,height:98}}},{productType:{pageSize:size},template:{resources:{exportSettings:{bleed:12}}},page:{contentFramePct:{x:20,y:20,width:60,height:60}}}]){
  const before=JSON.stringify(project);assert.deepEqual(productionGuideGeometry(project.productType.pageSize),expected);assert.equal(JSON.stringify(project),before);
 }
});
test('different physical sizes retain 3mm bleed and valid inset rectangles',()=>{
 const g=productionGuideGeometry({width:297,height:205.615});assert.equal(g.bleed,3);assert.ok(Math.abs(g.safeX-8.94)<1e-8);assert.ok(Math.abs(g.safeY-7.1123)<1e-8);
 for(const size of [{width:0,height:180},{width:260,height:NaN}])assert.throws(()=>productionGuideGeometry(size));
});
