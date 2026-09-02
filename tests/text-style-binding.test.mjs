import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const html = fs.readFileSync(path.resolve('apps/designer-studio/index.html'), 'utf8');

test('cover text renders its element font size before the cover master default', () => {
  const renderers = html.match(/applyTextElementStyles\(t,view\)/g) || [];
  assert.equal(renderers.length, 2);
  assert.match(html, /size=style\.fontSize\|\|project\.template\.masters\.cover\.titleSize\|\|18/);
  assert.doesNotMatch(html, /isCoverTitle\?project\.template\.masters\.cover\.titleSize/);
});

test('every text object exposes the complete designer style set through one shared renderer', () => {
  ['elemFontFamily', 'elemFontWeight', 'elemItalic', 'elemUnderline', 'elemStrike', 'elemAlign', 'elemVerticalAlign', 'elemLetterSpacing', 'elemLineHeight', 'elemOpacity', 'elemBackgroundColor', 'elemStrokeWidth', 'elemStrokeColor', 'elemShadow', 'elemShadowX', 'elemShadowY', 'elemShadowBlur', 'elemShadowColor'].forEach(id => assert.match(html, new RegExp(`id="${id}"`)));
  assert.match(html, /node\.style\.webkitTextStroke/);
  assert.match(html, /node\.style\.textShadow/);
  assert.match(html, /node\.style\.alignItems/);
});

test('saving the cover master applies its size to every cover school-name element', () => {
  assert.match(html, /function applyCoverTitleSize\(size\)/);
  assert.match(html, /pageInstances\.filter\(page=>page\.role==="cover-front"\)/);
  assert.match(html, /item\.type==="text"&&item\.role==="school-name"/);
  assert.match(html, /applyCoverTitleSize\(Number\(el\("coverTitleSize"\)\.value\)\)/);
  assert.match(html, /applyCoverTitleSize\(Number\(el\("masterSettingCoverTitle"\)\.value\)\)/);
});

test('bound text inspector explains the displayed value and fixed-text switch', () => {
  assert.match(html, /현재 화면 표시:/);
  assert.match(html, /고정 텍스트 · 아래 입력값 표시/);
  assert.match(html, /표시 방식·텍스트 저장/);
});
