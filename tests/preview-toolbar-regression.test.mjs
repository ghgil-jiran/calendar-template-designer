import { readStudioFeatureSource } from './studio-feature-source.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const html = fs.readFileSync(path.resolve('apps/designer-studio/index.html'), 'utf8')+readStudioFeatureSource()+fs.readFileSync(path.resolve('apps/designer-studio/designer-studio-overrides.css'), 'utf8');

test('page and full previews preserve the shared editor header and use a unified toolbar', () => {
  const appHeader = html.indexOf('<header class="app-header">');
  const workspaceMenu = html.indexOf('<nav id="workspaceMenubar"');
  const pagePreviewMenu = html.indexOf('<div id="pagePreviewToolbar"');
  assert.ok(appHeader < workspaceMenu && workspaceMenu < pagePreviewMenu);
  assert.doesNotMatch(html, /<nav id="editorMenubar"/);
  assert.match(html, /\.preview-only \.app-header\{display:flex\}/);
  assert.match(html, /\.preview-only \.workspace-menubar\{display:flex\}/);
  assert.match(html, /\.full-preview-overlay\{top:92px\}/);
  assert.match(html, /\.preview-toolbar button,#closeFullPreviewBtn\{/);
  assert.match(html, /designer-studio-overrides\.css\?v=20260911\.1/);
  assert.match(html, /\.preview-only \.workspace>\.insert-sidebar,\.preview-only \.workspace>\.page-dock,\.preview-only \.workspace>\.right\{display:none!important\}/);
  assert.match(html, /\.preview-only \.workspace>\.center\{display:flex!important;grid-column:1!important;grid-row:1!important/);
});

test('full preview uses a compact zoom select without a range bar', () => {
  assert.match(html, /<select id="previewZoom">[\s\S]*?<option value="100" selected>100%<\/option>[\s\S]*?<\/select>/);
  assert.doesNotMatch(html, /id="previewZoom" type="range"/);
  assert.match(html, /el\('previewZoom'\)\.onchange=/);
});
