import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { readStudioFeatureSource } from './studio-feature-source.mjs';

const html=fs.readFileSync(new URL('../apps/designer-studio/index.html',import.meta.url),'utf8')+readStudioFeatureSource()+fs.readFileSync(new URL('../apps/designer-studio/designer-studio-core.css',import.meta.url),'utf8')+fs.readFileSync(new URL('../apps/designer-studio/designer-studio-overrides.css',import.meta.url),'utf8');

test('template menu exposes a review PDF export distinct from package output',()=>{
 assert.match(html,/id="reviewPdfBtn">검토용 PDF 저장</);
 assert.match(html,/검토용이며 인쇄 원고가 아닙니다/);
});

test('review PDF renders every project surface at the product trim size',()=>{
 assert.match(html,/for\(const pageInfo of pages\)/);
 assert.match(html,/sheet\.style\.width=`\$\{width\}mm`/);
 assert.match(html,/sheet\.style\.height=`\$\{height\}mm`/);
 assert.match(html,/@page\{size:\$\{width\}mm \$\{height\}mm;margin:0\}/);
 assert.match(html,/print-color-adjust:exact/);
});

test('review PDF reuses clean preview clones and restores editor state',()=>{
 assert.match(html,/ACDLPreviewState\.clonePage\(live,pageInfo\)/);
 assert.match(html,/ACDLPreviewState\.capture/);
 assert.match(html,/ACDLPreviewState\.restore/);
 assert.match(html,/window\.print\(\)/);
 assert.match(html,/setTimeout\(cleanup,0\)/);
});

test('review PDF compresses AI backgrounds and hides empty image instructions',()=>{
 assert.match(html,/optimizeReviewBackgrounds/);
 assert.match(html,/toDataURL\('image\/jpeg',\.72\)/);
 assert.match(html,/data-element-role="ai-design-background"/);
 assert.match(html,/frame-placeholder non-output editor-only/);
 assert.match(html,/frame-shell\.empty-frame/);
 assert.match(html,/clone\.querySelectorAll\('\.empty-frame'\)/);
 assert.match(html,/node\.closest\('\.free-element'\)/);
});

test('review PDF removes empty frame outlines and protects mini-calendar readability',()=>{
  const css=fs.readFileSync(new URL('../apps/designer-studio/designer-studio-core.css',import.meta.url),'utf8');
  assert.match(css,/review-pdf-printing \.frame-shell\.empty-frame \.frame-outline\{display:none!important\}/);
  assert.match(css,/data-element-role="ai-month-back-component"\] \.widget-mini-calendar\{background:rgba\(255,255,255,\.97\)/);
  assert.match(css,/\.semantic-song \.semantic-media img\{object-fit:contain/);
});
