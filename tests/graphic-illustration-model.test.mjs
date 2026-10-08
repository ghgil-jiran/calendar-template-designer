import test from 'node:test';
import assert from 'node:assert/strict';
import '../apps/designer-studio/graphic-illustration-model.js';
import {validateGraphicSvg} from '../server/graphic-library.js';
const m=globalThis.ACDLGraphicIllustrationModel;
test('all 52 samples are reproducible font-free transparent vectors with physical stroke and frame masks',()=>{
 let count=0;for(const [category,items] of Object.entries(m.catalogs))for(const item of items){count++;const recipe=m.normalize({category,item:item.id}),svg=m.svg(recipe),obj=m.definition(recipe);assert.equal(validateGraphicSvg(svg),svg);assert.match(svg,/width="40mm"/);assert.ok(!/<text|image|filter|href|font|foreignObject/.test(svg));assert.equal(obj.strokeWidth,.875);assert.equal(m.svg(JSON.parse(JSON.stringify(recipe))),svg);assert.equal(Boolean(obj.mask),category==='frame');assert.ok(obj.parts.length);assert.ok(svg.includes('viewBox="0 0 100 100"'));}assert.equal(count,52);
});
test('count is chosen per theme, produces distinct independently editable recipes, rejects invalid print parameters',()=>{const input={name:'학용품',category:'school',count:5,palette:'warm',strokeMm:.4},results=m.recipes(input);assert.equal(results.length,5);assert.equal(new Set(results.map(x=>x.recipe.item)).size,5);const original=JSON.stringify(results[1]);results[0].recipe.colors[0]='#FFFFFF';assert.equal(JSON.stringify(results[1]),original);assert.throws(()=>m.metadata({...input,count:0}));assert.throws(()=>m.metadata({...input,count:9}));assert.throws(()=>m.normalize({category:'school',item:'pencil',strokeMm:.01}));assert.throws(()=>m.normalize({category:'school',item:'pencil',colors:['url(https://x)','a','b','c']}));});
