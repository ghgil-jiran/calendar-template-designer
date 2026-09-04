import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const html = fs.readFileSync(path.resolve('apps/designer-studio/index.html'), 'utf8');

test('editor columns keep independent scrolling inside the viewport', () => {
  assert.match(html, /\.insert-sidebar-host>\.drawer-body\{[^}]*overflow-y:auto[^}]*scrollbar-gutter:stable/);
  assert.match(html, /\.workspace>\.center \.canvas-wrap\{[^}]*overflow:auto[^}]*scrollbar-gutter:stable/);
  assert.match(html, /\.workspace>\.right #inspector\{[^}]*height:100%[^}]*overflow-y:auto[^}]*scrollbar-gutter:stable/);
  assert.match(html, /\.page-dock>\.nav\{[^}]*display:flex[^}]*overflow-x:auto[^}]*overflow-y:hidden/);
});

test('page navigation is a horizontal role-colored dock below the center canvas', () => {
  assert.match(html, /\.workspace>\.page-dock\{[^}]*grid-column:2[^}]*grid-row:2[^}]*grid-template-columns:76px minmax\(0,1fr\)/);
  assert.match(html, /\.page-dock \.sheet\{display:contents\}/);
  assert.match(html, /\.page-dock \.sheet-head\{display:none\}/);
  assert.match(html, /\.page-dock \.page-btn\{[^}]*flex:0 0 78px[^}]*height:72px/);
  assert.match(html, /id="pageDockStatus"/);
  assert.match(html, /pageDockStatus'\)\.textContent=pages\.length\?`\$\{index\+1\} \/ \$\{pages\.length\}`/);
  assert.match(html, /function pageNavigationKind\(p\)/);
  assert.match(html, /page-kind-cover\{--page-role:#7c3aed\}/);
  assert.match(html, /page-kind-month\{--page-role:#2563eb\}/);
  assert.match(html, /page-kind-back-cover\{--page-role:#db2777\}/);
  assert.match(html, /page-btn\.page-odd\{background:var\(--page-role/);
  assert.match(html, /page-btn\.page-even\{background:color-mix/);
});

test('editor page auto-fit preserves a fixed print-layout canvas while only the viewport scales', () => {
  assert.match(html, /id="editor-page-auto-fit-runtime"/);
  assert.match(html, /id="editorPageViewport" class="editor-page-viewport"/);
  assert.match(html, /window\.ACDLEditorCanvasFit\.fixedCanvasViewport\(\{pageWidth:width,pageHeight:height,availableWidth,availableHeight\}\)/);
  assert.match(html, /node\.style\.width=`\$\{fit\.designWidth\}px`;node\.style\.height=`\$\{fit\.designHeight\}px`;node\.style\.transform=`scale\(\$\{fit\.scale\}\)`/);
  assert.match(html, /frameNode\.style\.width=`\$\{fit\.displayWidth\}px`;frameNode\.style\.height=`\$\{fit\.displayHeight\}px`/);
  assert.match(html, /\.editor-page-viewport>\.page\{position:absolute!important;left:0!important;top:0!important;max-width:none!important;transform-origin:top left!important\}/);
  assert.match(html, /node\.dataset\.fitAxis=fit\.fitAxis/);
  assert.match(html, /new ResizeObserver\(scheduleFit\)\.observe\(host\)/);
  assert.match(html, /window\.addEventListener\('resize',scheduleFit/);
  assert.match(html, /window\.visualViewport\?\.addEventListener\('resize',scheduleFit/);
});

test('the object inspector uses one typography and form-control scale', () => {
  assert.match(html, /\.workspace>\.right label\{[^}]*font-size:11px[^}]*line-height:1\.4/);
  assert.match(html, /\.workspace>\.right \.action\{[^}]*height:36px[^}]*font-size:11px[^}]*font-weight:700/);
  assert.match(html, /\.workspace>\.right \.inline-check\{[^}]*flex-direction:row[^}]*align-items:center[^}]*font-size:11px/);
  assert.match(html, /\.workspace>\.right \.inline-check input\[type="checkbox"\]\{[^}]*width:15px!important[^}]*height:15px!important/);
});

test('the reorganized workspace completes insertion scope, search and inspector support', () => {
  assert.match(html, /id="insertScopeMirror"/);
  assert.match(html, /scopeMirror\.addEventListener\('change'/);
  assert.match(html, /objectCards\.forEach\(card=>card\.dataset\.search/);
  assert.match(html, /const filterObjects=/);
  assert.match(html, /\[\['data','데이터'\],\['permission','권한'\]\]/);
  assert.match(html, /item\.permissions=Object\.fromEntries/);
  assert.match(html, /id="inspectorSelectionSummary"/);
});

test('current-page editing shadows a Master object without mutating other pages', () => {
  assert.match(html, /shadowOfMasterElementId/);
  assert.match(html, /masterElements\(\)\.filter\(e=>!shadowed\.has\(e\.id\)\)/);
  assert.match(html, /scope==="master"&&el\("elementScope"\)\?\.value==="page"/);
  assert.match(html, /clone\.originScope="master"/);
  assert.match(html, /pageOverrideCreated/);
  assert.match(html, /function ensureCurrentPageEditTarget/);
  assert.match(html, /const usePageOverride=scope==='master'&&el\('elementScope'\)\?\.value==='page'/);
  assert.match(html, /if\(usePageOverride\)\{const target=ensureCurrentPageEditTarget/);
  assert.match(html, /function changeElement\(fn\)\{snapshot\(\);const target=ensureCurrentPageEditTarget\(\)/);
  assert.match(html, /function applyGraphicInspector\(action\)\{snapshot\(\);const target=ensureCurrentPageEditTarget\(\)/);
  assert.match(html, /삽입·편집 적용 범위/);
});
