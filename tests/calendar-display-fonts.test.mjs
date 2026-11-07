import test from 'node:test';
import assert from 'node:assert/strict';
import '../apps/designer-studio/shared-screen-month-title.js';
test('new calendar fonts survive monthly title serialization and render independently',()=>{
 for(const family of ['Montserrat','Bodoni Moda','Bebas Neue','DM Sans']){
  const style=globalThis.ACDLSharedMonthTitle.normalizeTypography(JSON.parse(JSON.stringify({fontFamily:family,numberFontFamily:family,englishFontFamily:family,yearFontFamily:family})));
  assert.equal(style.fontFamily,family);assert.equal(style.numberFontFamily,family);assert.equal(style.englishFontFamily,family);assert.equal(style.yearFontFamily,family);
 }
});
