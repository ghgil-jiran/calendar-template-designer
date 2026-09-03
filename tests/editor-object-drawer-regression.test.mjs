import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const html = fs.readFileSync(path.resolve('apps/designer-studio/index.html'), 'utf8');

test('editor columns keep independent scrolling inside the viewport', () => {
  assert.match(html, /\.insert-sidebar-host>\.drawer-body\{[^}]*overflow-y:auto[^}]*scrollbar-gutter:stable/);
  assert.match(html, /\.workspace>\.center \.canvas-wrap\{[^}]*overflow:auto[^}]*scrollbar-gutter:stable/);
  assert.match(html, /\.workspace>\.right #inspector\{[^}]*height:100%[^}]*overflow-y:auto[^}]*scrollbar-gutter:stable/);
  assert.match(html, /\.page-dock>\.nav\{[^}]*grid-template-columns:repeat\(2,minmax\(0,1fr\)\)[^}]*overflow-y:auto/);
});

test('page navigation is a compact role-colored panel below object insertion', () => {
  assert.match(html, /\.insert-sidebar>\.page-dock\{[^}]*flex:0 0 min\(34vh,270px\)[^}]*grid-template-rows:38px minmax\(0,1fr\)/);
  assert.match(html, /\.page-dock \.sheet\{display:contents\}/);
  assert.match(html, /\.page-dock \.sheet-head\{display:none\}/);
  assert.match(html, /\.page-dock \.page-btn\{[^}]*height:56px/);
  assert.match(html, /id="pageDockStatus"/);
  assert.match(html, /pageDockStatus'\)\.textContent=pages\.length\?`\$\{index\+1\} \/ \$\{pages\.length\}`/);
  assert.match(html, /function pageNavigationKind\(p\)/);
  assert.match(html, /page-kind-cover\{--page-role:#7c3aed\}/);
  assert.match(html, /page-kind-month\{--page-role:#2563eb\}/);
  assert.match(html, /page-kind-back-cover\{--page-role:#db2777\}/);
  assert.match(html, /page-btn\.page-odd/);
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
