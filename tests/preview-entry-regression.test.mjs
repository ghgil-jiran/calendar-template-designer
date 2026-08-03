import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../apps/designer-studio/index.html', import.meta.url), 'utf8');

test('preview controls are rebound once after legacy listeners are registered', () => {
  assert.match(html, /id="preview-entry-runtime"/);
  assert.match(html, /replacePreviewButton\('previewBtn',togglePagePreview\)/);
  assert.match(html, /replacePreviewButton\('fullPreviewBtn',enterFullPreview\)/);
});

test('both preview modes use the current project page collection', () => {
  assert.match(html, /function availablePreviewPages\(\)/);
  assert.match(html, /Array\.isArray\(project\?\.book\?\.pageInstances\)/);
  assert.match(html, /function enterPagePreview\(\)/);
  assert.match(html, /function enterFullPreview\(\)/);
});

test('preview entry repairs a stale selected page before rendering', () => {
  const repairs = html.match(/if\(!pages\.some\(page=>page\.id===selectedPageId\)\)selectedPageId=pages\[0\]\.id/g) || [];
  assert.equal(repairs.length, 2);
});
