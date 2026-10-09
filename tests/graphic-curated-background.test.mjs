import test from 'node:test';
import assert from 'node:assert/strict';
import {installCuratedBackground,flowCover,FLOW_PACKAGE_ID,FLOW_COVER_ID,FLOW_INSTALL_ID} from '../server/graphic-curated-background.js';
import {validateGraphicSvg} from '../server/graphic-library.js';
import '../apps/designer-studio/graphic-package-model.js';
import '../apps/designer-studio/graphic-template-mapping.js';
const model=globalThis.ACDLGraphicVectorDesign;
function fixture(){const records=[],assets=[];let failPackage=false;return {records,assets,setFail:v=>failPackage=v,deps:{records,createRecord:async r=>{if(r.id===FLOW_PACKAGE_ID&&failPackage)throw Error('offline');records.push(r);return r;},storeAsset:async src=>{assets.push(src);return {id:'original-svg'};},validateSvg:validateGraphicSvg,validateThumbnail:s=>s}};}
test('starter installs a saved cover package once, and never overwrites edits or restores deletion',async()=>{
 const f=fixture();assert.equal((await installCuratedBackground(f.deps)).length,3);assert.equal(f.assets.length,1);
 const pkg=f.records.find(r=>r.id===FLOW_PACKAGE_ID),cover=f.records.find(r=>r.id===FLOW_COVER_ID);assert.equal(pkg.pages.cover.graphicId,cover.id);assert.equal(cover.ownership.id,pkg.id);assert.ok(pkg.thumbnailDataUrl.startsWith('data:image/webp;'));assert.ok(f.records.some(r=>r.id===FLOW_INSTALL_ID));
 pkg.name='관리자가 수정한 이름';cover.status='archived';assert.deepEqual(await installCuratedBackground(f.deps),[]);assert.equal(pkg.name,'관리자가 수정한 이름');
 f.records.splice(f.records.indexOf(pkg),1);assert.deepEqual(await installCuratedBackground(f.deps),[]);assert.equal(f.assets.length,1);
});
test('interrupted registration resumes after the cover without creating another original',async()=>{
 const f=fixture();f.setFail(true);await assert.rejects(installCuratedBackground(f.deps));assert.equal(f.records.length,1);f.setFail(false);await installCuratedBackground(f.deps);assert.equal(f.assets.length,1);assert.equal(f.records.filter(r=>r.id===FLOW_PACKAGE_ID).length,1);
});
test('curve tuning changes paint and geometry while keeping decoration count and example zones fixed',()=>{
 const p=flowCover(),svg=model.svg(p),zones=model.zones(p);validateGraphicSvg(svg);assert.equal(zones.filter(z=>z.type==='photo').length,1);assert.ok(!/<(?:image|text|filter|clipPath)\b/.test(svg));assert.equal((svg.match(/<rect\b/g)||[]).length,1);
 for(const key of ['tone','density','scale'])for(const v of [50,150]){const d={...p,coverTuning:{...p.coverTuning,[key]:v}},changed=model.svg(d);assert.notEqual(changed,svg);assert.equal((changed.match(/<path\b/g)||[]).length,(svg.match(/<path\b/g)||[]).length);assert.deepEqual(model.zones(d),zones);validateGraphicSvg(changed);}
 const derived=globalThis.ACDLGraphicPackageModel.derive({design:p},'month-front');assert.equal(derived.style,'curve');assert.ok(model.svg(derived).includes('flow-teal'));assert.notEqual(model.svg({...derived,variation:'monthly'},3),model.svg({...derived,variation:'monthly'},7));
 const prompt=model.applyPrompt(p,'그라데이션 115%, 장식 밀도 85%, 크기 120%');assert.deepEqual(prompt.design.coverTuning,{tone:115,density:85,scale:120});
 const bleed=globalThis.ACDLGraphicTemplateMapping.svg({graphicDesign:p,graphicBleedMm:3});assert.ok(bleed.includes('viewBox="-15 -15 1330 930"'));assert.ok(bleed.includes('M160 -160'));validateGraphicSvg(bleed);
});
