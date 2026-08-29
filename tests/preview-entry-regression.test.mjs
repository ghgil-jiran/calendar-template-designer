import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../apps/designer-studio/index.html', import.meta.url), 'utf8');
const previewState = readFileSync(new URL('../apps/designer-studio/preview-state.js', import.meta.url), 'utf8');

test('preview controls are rebound once after legacy listeners are registered', () => {
  assert.match(html, /id="preview-entry-runtime"/);
  assert.match(html, /replacePreviewButton\('previewBtn',togglePagePreview\)/);
  assert.match(html, /replacePreviewButton\('fullPreviewBtn',enterFullPreview\)/);
});

test('both preview modes use the current project page collection', () => {
  assert.match(html, /function availablePreviewPages\(\)/);
  assert.match(html, /ACDLPreviewState\.pages\(project\)/);
  assert.match(previewState, /Array\.isArray\(project\?\.book\?\.pageInstances\)/);
  assert.match(html, /function enterPagePreview\(\)/);
  assert.match(html, /function enterFullPreview\(\)/);
});

test('preview entry repairs a stale selected page before rendering', () => {
  const repairs = html.match(/selectedPageId=window\.ACDLPreviewState\.repairPageId\(project,selectedPageId\)/g) || [];
  assert.equal(repairs.length, 2);
  assert.match(previewState, /available\.some\(page => page\.id === pageId\)/);
});
