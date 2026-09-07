import { readStudioFeatureSource } from './studio-feature-source.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../apps/designer-studio/index.html', import.meta.url), 'utf8')+readStudioFeatureSource();
const previewState = readFileSync(new URL('../apps/designer-studio/preview-state.js', import.meta.url), 'utf8');
const previewEntry = readFileSync(new URL('../apps/designer-studio/features/preview-entry-runtime.js', import.meta.url), 'utf8');
const runtimeCore = readFileSync(new URL('../apps/designer-studio/features/studio-runtime-core.js', import.meta.url), 'utf8');

test('preview controls are rebound once after legacy listeners are registered', () => {
  assert.match(html, /preview-entry-runtime\.js\?v=20260907\.3" data-runtime-source="preview-entry-runtime"/);
  assert.match(html, /replacePreviewButton\('previewBtn',togglePagePreview\)/);
  assert.match(html, /replacePreviewButton\('fullPreviewBtn',enterFullPreview\)/);
  assert.match(html, /bindPreviewMenuAction\('preview-page',togglePagePreview\)/);
  assert.match(html, /button\.onclick=null/);
  assert.match(previewEntry, /replacePreviewButton\('returnToEditBtn',returnToEditor\)/);
  assert.match(previewEntry, /replacePreviewButton\('previewPrevPageBtn',\(\)=>goPreviewPage\(-1\)\)/);
  assert.match(previewEntry, /replacePreviewButton\('previewNextPageBtn',\(\)=>goPreviewPage\(1\)\)/);
  assert.match(previewEntry, /replacePreviewButton\('closeFullPreviewBtn',closeTemplatePreview\)/);
  assert.doesNotMatch(runtimeCore, /function goPreviewPage\(/);
  assert.doesNotMatch(runtimeCore, /el\("previewBtn"\)\.addEventListener/);
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
