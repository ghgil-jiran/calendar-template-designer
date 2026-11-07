import test from 'node:test';
import assert from 'node:assert/strict';
import {installArchBackground,archCover,archDesign,ARCH_PAGES,ARCH_PACKAGE_ID,ARCH_COVER_ID,ARCH_INSTALL_ID} from '../server/graphic-arch-background.js';
import {validateGraphicSvg,validateThumbnail} from '../server/graphic-library.js';
import '../apps/designer-studio/graphic-template-mapping.js';
const model=globalThis.ACDLGraphicVectorDesign;
function fixture(){const records=[],assets=[];let failPackage=false;return {records,assets,setFail:v=>failPackage=v,deps:{records,createRecord:async r=>{if(r.id===ARCH_PACKAGE_ID&&failPackage)throw Error('offline');records.push(r);return r;},storeAsset:async src=>{assets.push(src);return {id:'svg-'+assets.length};},validateSvg:validateGraphicSvg,validateThumbnail}};}
test('arch package installs eleven independent SVG page designs once and preserves edits and deletion',async()=>{
 const f=fixture();assert.equal((await installArchBackground(f.deps)).length,13);assert.equal(f.assets.length,11);
 const pkg=f.records.find(r=>r.id===ARCH_PACKAGE_ID),cover=f.records.find(r=>r.id===ARCH_COVER_ID);assert.equal(Object.keys(pkg.pages).length,11);assert.equal(pkg.pages.cover.graphicId,cover.id);
 for(const page of ARCH_PAGES){const g=f.records.find(r=>r.id===pkg.pages[page].graphicId);assert.equal(g.design.page,page);assert.equal(g.ownership.id,pkg.id);assert.equal(g.mimeType,'image/svg+xml');assert.ok(g.thumbnailDataUrl.startsWith('data:image/webp;'));assert.equal(g.design.backgroundRevision,5);if(page!=='cover')assert.equal(pkg.pages[page].derivedFromCoverId,cover.id);if(page.startsWith('month-'))assert.equal(g.setInfo.months.length,12);}
 pkg.name='관리자 수정';cover.status='archived';assert.deepEqual(await installArchBackground(f.deps),[]);assert.equal(pkg.name,'관리자 수정');assert.ok(f.records.some(r=>r.id===ARCH_INSTALL_ID));f.records.splice(f.records.indexOf(pkg),1);assert.deepEqual(await installArchBackground(f.deps),[]);assert.equal(f.assets.length,11);
});
test('partial arch registration resumes without replacing any stored original',async()=>{
 const f=fixture();f.setFail(true);await assert.rejects(installArchBackground(f.deps));assert.equal(f.assets.length,11);f.records[0].name='기존 표지';f.setFail(false);await installArchBackground(f.deps);assert.equal(f.assets.length,11);assert.equal(f.records[0].name,'기존 표지');assert.equal(f.records.filter(r=>r.id===ARCH_PACKAGE_ID).length,1);
});
test('approved cover geometry stays independent of content layout and has continuous paths through photo area',()=>{
 const p=archCover(),svg=model.svg(p),zones=model.zones(p);validateGraphicSvg(svg);assert.ok(!/<(?:image|text|filter|clipPath|mask|linearGradient|radialGradient)\b/.test(svg));assert.equal((svg.match(/<rect\b/g)||[]).length,1);assert.equal(svg,model.svg({...p,layout:'text-only'}));assert.equal(svg,model.svg(JSON.parse(JSON.stringify(p))));assert.deepEqual(zones.find(z=>z.type==='photo'),{type:'photo',label:'학교 전경 사진 · 1장',x:30,y:9,w:70,h:56});assert.ok(svg.includes('C1142 -128 1503 64 1600 344'));
 for(const key of ['tone','density','scale'])for(const v of [50,150]){const q={...p,coverTuning:{...p.coverTuning,[key]:v}},s=model.svg(q);assert.notEqual(s,svg);assert.deepEqual(model.zones(q),zones);assert.equal((s.match(/<path\b/g)||[]).length,3);validateGraphicSvg(s);}
 const bleed=globalThis.ACDLGraphicTemplateMapping.svg({graphicDesign:p,graphicBleedMm:3});assert.ok(bleed.includes('viewBox="-15 -15 1330 930"'));validateGraphicSvg(bleed);
});
test('monthly colors change without changing line geometry, and front and back keep the master language',()=>{
 const front=archDesign('month-front'),back=archDesign('month-back');assert.ok(model.svg(front).includes('M273 667'));assert.ok(model.svg(back).includes('M273 667'));assert.notEqual(model.svg(front),model.svg(back));const a=model.svg(front,3),b=model.svg(front,7);assert.notEqual(a,b);assert.equal(a.replace(/#[\da-f]{6}/gi,'COLOR'),b.replace(/#[\da-f]{6}/gi,'COLOR'));for(const page of ARCH_PAGES)validateGraphicSvg(model.svg(archDesign(page)));
});
