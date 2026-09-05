import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const html=fs.readFileSync(new URL('../apps/designer-studio/index.html',import.meta.url),'utf8')+fs.readFileSync(new URL('../apps/designer-studio/designer-studio-core.css',import.meta.url),'utf8');

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
