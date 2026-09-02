import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const studio = readFileSync(new URL('../apps/designer-studio/index.html', import.meta.url), 'utf8');

assert.match(studio, /class="tool-group toolbar-insert-tools" aria-label="개체 삽입"/);
assert.match(studio, /\.icon-toolbar \.toolbar-insert-tools,\.icon-toolbar \.toolbar-scope\{display:none!important\}/);
assert.match(studio, /preserveAspectRatio="none"/);
assert.match(studio, /이미지를 더블클릭하여 선택하세요/);
assert.match(studio, /id="frameBrightness"/);
assert.match(studio, /id="graphicShadowBlur"/);
assert.match(studio, /editor-bleed-visible/);
assert.match(studio, /--export-bleed-x-pct/);
assert.match(studio, /clone\.classList\.remove\('editor-bleed-visible','export-crop-marks','export-guides-visible'\)/);
