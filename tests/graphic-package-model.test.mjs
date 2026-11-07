import test from 'node:test';
import assert from 'node:assert/strict';
import '../apps/designer-studio/graphic-vector-design.js';
import '../apps/designer-studio/graphic-package-model.js';
import {validateGraphicSvg} from '../server/graphic-library.js';
const model=globalThis.ACDLGraphicPackageModel,vector=globalThis.ACDLGraphicVectorDesign;
test('cover-based pages retain palette, reproducible tuning and safe zones while providing month sets',()=>{
 const cover={design:vector.normalize({composition:'cover-circle-01',coverTuning:{tone:115,density:85,scale:120},colors:['#FFF8EE','#84AFCA','#BACBB4','#465B73']})};
 for(const page of Object.keys(model.pages)){const p=model.derive(cover,page),svg=vector.svg(p);validateGraphicSvg(svg);assert.equal(svg,vector.svg(JSON.parse(JSON.stringify(p))));assert.deepEqual(p.colors,cover.design.colors);assert.equal(p.page,page);if(page!=='cover'){assert.deepEqual(p.familyTuning,cover.design.coverTuning);assert.ok(svg.includes('gl-family-safe'));assert.equal(p.composition,null)}if(page.startsWith('month-'))assert.equal(vector.setInfo(p).months.length,12);}
 const p=model.derive(cover,'month-front'),baseline=vector.svg(p);for(const k of ['tone','density','scale']){const q={...p,familyTuning:{...p.familyTuning,[k]:50}};assert.notEqual(vector.svg(q),baseline);assert.deepEqual(vector.zones(q),vector.zones(p));assert.equal((baseline.match(/<circle/g)||[]).length,(vector.svg(q).match(/<circle/g)||[]).length)}
 const edited=vector.applyPrompt(p,'조금 진하게, 장식은 여유롭게, 전체적으로 작게');assert.deepEqual(edited.design.familyTuning,{tone:130,density:70,scale:105});assert.throws(()=>model.derive(null,'month-front'));
});
test('package reports old cover ancestry without mutating unrelated page records',()=>{const pkg={pages:{cover:{graphicId:'new'},'month-front':{graphicId:'monthly',derivedFromCoverId:'old'}}},before=JSON.stringify(pkg);assert.equal(model.count(pkg),2);assert.equal(model.outdated(pkg,'month-front'),true);assert.equal(model.outdated(pkg,'cover'),false);assert.equal(JSON.stringify(pkg),before);assert.throws(()=>model.metadata({name:'',size:'desk-standard'}));assert.throws(()=>model.metadata({name:'valid',size:'unknown'}));});
