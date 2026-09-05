import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const html=fs.readFileSync(new URL('../apps/designer-studio/index.html',import.meta.url),'utf8');
const remote=fs.readFileSync(new URL('../apps/designer-studio/template-remote-persistence.js',import.meta.url),'utf8');

test('step 10 keeps one AI draft through save, library reopen and version restore paths',()=>{
 assert.match(html,/remote\.save\(\{templateId:project\.template\.remoteId\|\|null/);
 assert.match(html,/remote\.load\(id\)/);
 assert.match(remote,/async function hydrateVersion\(version\)/);
 assert.match(remote,/async function restore\(templateId,versionId,saveNote\)/);
 assert.match(html,/project\.template\.aiDesignDraft\.quality=/);
});

test('step 10 renders all project pages into the review PDF at trim size',()=>{
 assert.match(html,/const pages=window\.ACDLPreviewState\?\.pages\(project\)\|\|\[\]/);
 assert.match(html,/for\(const pageInfo of pages\)/);
 assert.match(html,/sheet\.style\.width=`\$\{width\}mm`/);
 assert.match(html,/sheet\.style\.height=`\$\{height\}mm`/);
 assert.match(html,/검토용이며 인쇄 원고가 아닙니다/);
});

test('published library selection remains the user-service boundary',()=>{
 assert.match(html,/const published=v22Library\(\)\.filter\(t=>t\.state==="published"\)/);
 assert.match(html,/data-user-library-id/);
 assert.match(html,/project\.template\.sourceTemplateId=selectedUserTemplate\.libraryId\|\|null/);
});
