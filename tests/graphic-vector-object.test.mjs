import test from 'node:test';
import assert from 'node:assert/strict';
import '../apps/designer-studio/graphic-illustration-model.js';
import '../apps/designer-studio/graphic-vector-object.js';
import '../apps/designer-studio/shared-screen-vector.js';
import '../apps/designer-studio/page-composition-runtime.js';
import '../apps/designer-studio/inspector-graphic.js';
import catalog from '../server/graphic-curated-data.js';
import {validateGraphicSvg} from '../server/graphic-library.js';
const api=globalThis.ACDLGraphicVectorObject,model=globalThis.ACDLGraphicIllustrationModel;
test('all 56 curated assets become pure vector objects without thumbnail or catalog dependency',()=>{
 assert.equal(catalog.items.length,56);
 for(const item of catalog.items){
  const definition=model.definition(item.recipe),graphic={id:item.key,status:'active',originalAssetId:'original',createdAt:'v1',vectorObject:definition};
  const placed=api.placement(graphic,{width:260,height:180}),saved=JSON.parse(JSON.stringify(placed));
  assert.equal(saved.type,'vector');assert.equal(saved.src,undefined);assert.ok(Math.abs(saved.width*2.6-40)<1e-8);assert.ok(Math.abs(saved.height*1.8-40)<1e-8);
  assert.equal(saved.printIntent.directPdfMapping,false);assert.equal(saved.graphicSource.originalAssetId,'original');
  const svg=globalThis.ACDLSharedVector.renderVectorSvg(saved.assetId,saved.colors);validateGraphicSvg(svg);assert.ok(!/<(?:image|text|filter)\b/.test(svg));
  assert.equal(svg,globalThis.ACDLPageCompositionRuntime.renderVectorSvg(saved.assetId,saved.colors));
  graphic.vectorObject.colors[0]='#000000';graphic.vectorObject.parts=[];
  assert.equal(svg,globalThis.ACDLSharedVector.renderVectorSvg(saved.assetId,saved.colors));
 }
});
test('reject unsafe paths/colors, inactive assets and unsupported photo masks before placing',()=>{
 const original=model.definition(catalog.items[0].recipe);
 for(const mutate of [o=>o.parts[0].d+='" onload="alert(1)',o=>o.colors[0]='url(https://example.test)',o=>o.parts[0].d='M 1 2 C 3 4',o=>o.parts[0].d='M 1 2 L NaN 3']){const bad=structuredClone(original);mutate(bad);assert.throws(()=>api.svg(bad));}
 assert.throws(()=>api.placement({status:'archived',vectorObject:original}));assert.throws(()=>api.placement({status:'active',illustrationCategory:'frame',vectorObject:original}));
});
test('inspector style and layout edits retain custom geometry instead of selecting a stock icon',()=>{
 const placed=api.placement({id:'pencil',status:'active',vectorObject:model.definition(catalog.items[0].recipe)});
 const parts=structuredClone(placed.colors.graphicVectorObject.parts),colors=['#123456','#234567','#345678','#456789'];
 globalThis.ACDLInspectorGraphic.apply(placed,'style',{assetId:'school-building',vectorColors:colors,flipX:'true'});
 globalThis.ACDLInspectorGraphic.apply(placed,'layout',{x:'10',y:'20',width:'30',height:'40',rotation:'15',opacity:'.8'});
 assert.equal(placed.assetId,'graphic-library-vector');assert.deepEqual(placed.colors.graphicVectorObject.parts,parts);assert.deepEqual(placed.colors.graphicVectorObject.colors,colors.map(c=>c.toUpperCase()));
 assert.deepEqual(placed.value.graphicVectorObject,placed.colors.graphicVectorObject);assert.equal(placed.rotation,15);assert.equal(placed.flipX,true);
});
