import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import '../apps/designer-studio/shared-screen-month-title.js';
test('new calendar fonts survive monthly title serialization and render independently',()=>{
 for(const family of ['Montserrat','Bodoni Moda','Bebas Neue','DM Sans','KoPub Batang']){
  const style=globalThis.ACDLSharedMonthTitle.normalizeTypography(JSON.parse(JSON.stringify({fontFamily:family,numberFontFamily:family,englishFontFamily:family,yearFontFamily:family})));
  assert.equal(style.fontFamily,family);assert.equal(style.numberFontFamily,family);assert.equal(style.englishFontFamily,family);assert.equal(style.yearFontFamily,family);
 }
});
test('KoPub Batang is selectable in text, calendar and theme controls and has three print-capable font faces',()=>{
 for(const file of ['features/object-editing.js','features/page-widget-styles.js','features/template-settings-library.js']){
  assert.ok(fs.readFileSync(new URL('../apps/designer-studio/'+file,import.meta.url),'utf8').includes('KoPub Batang'),file);
 }
 const css=fs.readFileSync(new URL('../apps/designer-studio/shared-screen-fonts.css',import.meta.url),'utf8');
 for(const [name,weight] of [['Light',300],['Regular',400],['Bold',700]]){
  assert.match(css,new RegExp(`@font-face\\{font-family:'KoPub Batang';src:url\\('https://raw\\.githubusercontent\\.com/google/fonts/main/ofl/kopubbatang/KoPubBatang-${name}\\.ttf'\\).*font-weight:${weight};`));
 }
 assert.match(globalThis.ACDLSharedMonthTitle.title(2027,3,'number-stack',null,{fontFamily:'KoPub Batang'}).markup,/KoPub Batang/);
});
