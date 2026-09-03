import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const html = fs.readFileSync(path.resolve('apps/designer-studio/index.html'), 'utf8');

test('the shared editor header keeps context and one workspace navigation row', () => {
  assert.match(html, /id="appBrand"[^>]*>ACDL 템플릿 에디터/);
  assert.match(html, /id="currentWorkflowMenu"[^>]*>새 템플릿 만들기/);
  assert.match(html, /id="currentTemplateTitle"/);
  assert.match(html, /id="workspaceMenubar"/);
  assert.doesNotMatch(html, /id="editorMenubar"/);
});

test('workspace navigation owns preview choices and the redundant menu row is removed', () => {
  const workspaceNav = html.match(/<nav id="workspaceMenubar"[\s\S]*?<\/nav>/)?.[0] || '';
  for (const label of ['처음으로', '템플릿', '템플릿 설정', '미리 보기', '현재 페이지 미리보기', '전체 미리보기']) assert.match(workspaceNav, new RegExp(label));
  for (const label of ['편집', '삽입', '정렬', '보기']) assert.doesNotMatch(workspaceNav, new RegExp(`>${label}<`));
  assert.match(html, /class="tool-group toolbar-align-tools"/);
  for (const action of ['align-left', 'align-center', 'align-right', 'align-top', 'align-middle', 'align-bottom']) assert.match(html, new RegExp(`data-menu-action="${action}"`));
});

test('workspace roles and preview action remain visually distinct', () => {
  assert.match(html, /<h2 class="page-panel-title">자료·개체 추가<\/h2>/);
  assert.match(html, /class="page-dock editor-chrome" aria-label="페이지 구성 및 선택"/);
  assert.match(html, /<\/div>\s*<section class="page-dock editor-chrome" aria-label="페이지 구성 및 선택">[\s\S]*?<\/section>\s*<\/aside>/);
  assert.match(html, /id="inspectorPanelTitle" class="inspector-panel-title">페이지 스타일/);
  assert.match(html, /id="previewMenuBtn" class="workspace-menu preview-menu"/);
  assert.match(html, /id="fullPreviewBtn" type="button">전체 미리보기/);
  assert.match(html, /\.workspace-menu\.preview-menu\{[^}]*background:#fff/);
  assert.match(html, /\.page-panel-title\{[^}]*background:#f8fafc/);
  assert.match(html, /\.page-panel-title\{[^}]*justify-content:center!important/);
});

test('successful validation does not leave a stale message in the inspector', () => {
  assert.doesNotMatch(html, /Validation 통과/);
  assert.match(html, /if\(validationMessages\.length\)content\+=`<div class="section validation warn">/);
});

test('persistent save state, inspector heading and page-count summary are removed', () => {
  assert.doesNotMatch(html, /id="saveStatus"/);
  assert.doesNotMatch(html, /<h2>Inspector<\/h2>/);
  assert.doesNotMatch(html, /id="bookSummary"/);
  assert.doesNotMatch(html, /id="inspectorFeedback"/);
});

test('all editor entry paths update the shared context and inspector saves use a toast', () => {
  for (const label of ['새 템플릿 만들기', '템플릿 라이브러리', '기존 템플릿 열기', '새 달력 만들기']) {
    assert.match(html, new RegExp(`setEditorContext\\(["']${label}["']\\)`));
  }
  assert.match(html, /showEditorToast\("저장되었습니다\."\)/);
  assert.match(html, /body\.user-mode \.editor-toast\{display:block!important\}/);
});
