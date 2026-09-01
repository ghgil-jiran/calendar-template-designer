import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const html = fs.readFileSync(path.resolve('apps/designer-studio/index.html'), 'utf8');

test('editor columns keep independent scrolling inside the viewport', () => {
  assert.match(html, /\.insert-sidebar-host>\.drawer-body\{[^}]*overflow-y:auto[^}]*scrollbar-gutter:stable/);
  assert.match(html, /\.workspace>\.center \.canvas-wrap\{[^}]*overflow:auto[^}]*scrollbar-gutter:stable/);
  assert.match(html, /\.workspace>\.right #inspector\{[^}]*height:100%[^}]*overflow-y:auto[^}]*scrollbar-gutter:stable/);
  assert.match(html, /\.page-dock>\.nav\{[^}]*overflow-x:auto[^}]*overflow-y:hidden/);
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
