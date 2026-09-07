import { readStudioFeatureSource } from './studio-feature-source.mjs';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const studio = readFileSync(new URL('../apps/designer-studio/index.html', import.meta.url), 'utf8')+readStudioFeatureSource()+readFileSync(new URL('../apps/designer-studio/designer-studio-core.css', import.meta.url), 'utf8')+readFileSync(new URL('../apps/designer-studio/designer-studio-overrides.css', import.meta.url), 'utf8');

assert.match(studio, /class="tool-group toolbar-insert-tools" aria-label="개체 삽입"/);
assert.match(studio, /\.icon-toolbar \.toolbar-insert-tools,\.icon-toolbar \.toolbar-scope\{display:none!important\}/);
assert.match(studio, /preserveAspectRatio="none"/);
assert.match(studio, /class="frame-placeholder non-output editor-only">이미지를 선택하세요/);
assert.match(studio, /cls=`frame-shell frame-\$\{view\.frameType\|\|"rect"\} \$\{im\.src\?"":"empty-frame"\}`/);
assert.match(studio, /\.ai-background-layer\{[^}]*z-index:1/);
assert.match(studio, /\.calendar-region\{[^}]*z-index:5/);
assert.match(studio, /\.free-layer\{[^}]*z-index:20/);
assert.match(studio, /if\(selectMonthlyCalendar\(e\)\)return/);
assert.match(studio, /if\(!e\.target\.closest\("\[data-date\]"\)\)selectMonthlyCalendar\(e\)/);
assert.match(studio, /id="frameBrightness"/);
assert.match(studio, /id="graphicShadowBlur"/);
assert.match(studio, /editor-bleed-visible/);
assert.match(studio, /--export-bleed-x-pct/);
assert.match(studio, /clone\.classList\.remove\('editor-bleed-visible','export-crop-marks','export-guides-visible'\)/);
assert.match(studio, /body:has\(#entryScreen:not\(\.hidden\)\) \.page\.editor-bleed-visible::before/);
assert.match(studio, /body:has\(#designerHome:not\(\.hidden\)\) \.page\.editor-bleed-visible::after/);
assert.match(studio, /body:has\(#templateLibraryModal:not\(\.hidden\)\) \.page\.editor-bleed-visible::before/);
assert.match(studio, /page\?\.classList\.remove\("editor-bleed-visible","export-crop-marks","export-guides-visible"\)/);
