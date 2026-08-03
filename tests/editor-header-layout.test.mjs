import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const html = fs.readFileSync(path.resolve('apps/designer-studio/index.html'), 'utf8');

test('the shared editor header separates context, workspace navigation and edit menus', () => {
  assert.match(html, /id="appBrand"[^>]*>ACDL 템플릿 에디터/);
  assert.match(html, /id="currentWorkflowMenu"[^>]*>새 템플릿 만들기/);
  assert.match(html, /id="currentTemplateTitle"/);
  assert.match(html, /id="workspaceMenubar"/);
  assert.match(html, /id="editorMenubar"/);
  assert.ok(html.indexOf('id="workspaceMenubar"') < html.indexOf('id="editorMenubar"'));
});

test('workspace navigation contains global actions and edit menus stay separate', () => {
  const workspaceNav = html.match(/<nav id="workspaceMenubar"[\s\S]*?<\/nav>/)?.[0] || '';
  const editorNav = html.match(/<nav id="editorMenubar"[\s\S]*?<\/nav>/)?.[0] || '';
  for (const label of ['처음으로', '템플릿', '템플릿 설정', '전체 미리보기']) assert.match(workspaceNav, new RegExp(label));
  for (const label of ['편집', '삽입', '정렬', '보기']) assert.match(editorNav, new RegExp(`>${label}<`));
});

test('page editor heading and preview menu do not compete with blue page selection', () => {
  assert.match(html, /<h2 class="page-panel-title">페이지 편집<\/h2>/);
  assert.match(html, /id="fullPreviewBtn" class="workspace-menu preview-menu"/);
  assert.doesNotMatch(html, /id="fullPreviewBtn" class="workspace-menu primary"/);
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
