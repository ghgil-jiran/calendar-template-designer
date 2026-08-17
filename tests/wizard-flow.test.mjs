import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const values = new Map();
globalThis.localStorage = {
  getItem: key => values.get(key) ?? null,
  setItem: (key, value) => values.set(key, value)
};
await import('../apps/designer-studio/wizard-flow.js');
const wizard = globalThis.ACDLDesignerStudioWizard;

test('a fresh wizard does not choose a type or template', () => {
  values.clear();
  assert.deepEqual(wizard.restoreWizardState(), { selectedType: '', template: '', step: 1 });
});

test('choosing a type does not auto-select a template', () => {
  const next = wizard.applyTypeSelection({ selectedType: '', template: '', step: 1 }, 'postcard');
  assert.deepEqual(next, { selectedType: 'postcard', template: '', step: 1 });
});

test('changing type clears a template selected for the previous type', () => {
  const next = wizard.applyTypeSelection({ selectedType: 'desk', template: 'school-basic', step: 2 }, 'postcard');
  assert.deepEqual(next, { selectedType: 'postcard', template: '', step: 2 });
});

test('designer entry opens the selection home before setup', () => {
  const html = fs.readFileSync(new URL('../apps/designer-studio/index.html', import.meta.url), 'utf8');
  assert.match(html, /if\(source==='entry'\)\{el\('designerHome'\)\.classList\.remove\('hidden'\);return;\}/);
  assert.doesNotMatch(html, /if\(source==='entry'\)\{el\('setup'\)\.classList\.remove\('hidden'\);return;\}/);
});

test('template choices are not rendered preselected', () => {
  const html = fs.readFileSync(new URL('../apps/designer-studio/index.html', import.meta.url), 'utf8');
  const runtime = fs.readFileSync(new URL('../apps/designer-studio/template-library-runtime.js', import.meta.url), 'utf8');
  assert.doesNotMatch(html, /class="template-choice selected"/);
  assert.doesNotMatch(runtime, /index===0\?'selected'/);
  assert.match(runtime, /updateWizardActions\(\)/);
});

test('template click persists the choice before refreshing wizard actions', () => {
  const runtime = fs.readFileSync(new URL('../apps/designer-studio/template-library-runtime.js', import.meta.url), 'utf8');
  assert.match(runtime, /persistWizardState\?\.\(\{selectedType:selectedCalendarType,template:selectedUserTemplate\.template,step:userWizardStep\}\);updateWizardActions\(\)/);
});

test('returning home clears the previous editor project', () => {
  const html = fs.readFileSync(new URL('../apps/designer-studio/index.html', import.meta.url), 'utf8');
  assert.match(html, /function showEntry\(\)\{beginProjectTransition\(\{clearProject:true\}\)/);
  assert.match(html, /function beginProjectTransition\(\{clearProject=false\}=\{\}\)/);
});

test('template switching ignores stale async loads', () => {
  const html = fs.readFileSync(new URL('../apps/designer-studio/index.html', import.meta.url), 'utf8');
  assert.match(html, /const transitionId=beginProjectTransition\(\{clearProject:true\}\)/);
  assert.match(html, /if\(!isCurrentProjectTransition\(transitionId\)\)return;/);
});

test('library thumbnails cannot restore an earlier editor state', () => {
  const runtime = fs.readFileSync(new URL('../apps/designer-studio/template-library-runtime.js', import.meta.url), 'utf8');
  assert.match(runtime, /let thumbnailQueue=Promise\.resolve\(\)/);
  assert.match(runtime, /if\(!host\.isConnected\|\|\(navigation&&!navigation\.isCurrent\(transitionId\)\)\)return;/);
  assert.match(runtime, /original&&\(!navigation\|\|navigation\.isCurrent\(transitionId\)\)/);
});

test('entry screen explains both validation and template management flows', () => {
  const html = fs.readFileSync(new URL('../apps/designer-studio/index.html', import.meta.url), 'utf8');
  assert.match(html, /새 달력 만들기를 통해서 기존 템플릿에서 달력 만들기가 제대로 되는지 확인할 수 있습니다/);
  assert.match(html, /달력 템플릿 만들기에서는 달력 유형을 설정하고 템플릿 만들기와 관리가 가능합니다/);
});

test('calendar type rules disable unsupported insert controls', () => {
  const html = fs.readFileSync(new URL('../apps/designer-studio/index.html', import.meta.url), 'utf8');
  assert.match(html, /setRule\('userFrontInsertField','userFrontInserts',d\.frontInsert!==false/);
  assert.match(html, /setRule\('userRearInsertField','userRearInserts',d\.rearInsert!==false/);
  assert.match(html, /if\(!enabled\)input\.value='0'/);
});

test('template settings persist against the current template id', () => {
  const html = fs.readFileSync(new URL('../apps/designer-studio/index.html', import.meta.url), 'utf8');
  assert.match(html, /const id=project\.template\?\.id/);
  assert.match(html, /saveTemplateProjectData\(id,window\.ACDLPersistenceProject\.clone\(project\)\)/);
  assert.match(html, /persistAfter\('saveSchoolInfoBtn','학교 정보 및 에셋'\)/);
  assert.match(html, /persistCurrentTemplateSettings\('샘플 일정 파일'\)/);
});

test('system template edits preserve their library source', () => {
  const html = fs.readFileSync(new URL('../apps/designer-studio/index.html', import.meta.url), 'utf8');
  assert.match(html, /project\.template\.librarySource=t\.source\|\|project\.template\.librarySource\|\|"local"/);
  assert.match(html, /source:project\.template\.librarySource\|\|"local"/);
});

test('sample schedule registration uses the same primary action style', () => {
  const html = fs.readFileSync(new URL('../apps/designer-studio/index.html', import.meta.url), 'utf8');
  assert.match(html, /id="resourceScheduleUploadBtn" class="save"/);
});

test('system templates expose editable calendar structure defaults', () => {
  const html = fs.readFileSync(new URL('../apps/designer-studio/index.html', import.meta.url), 'utf8');
  assert.match(html, /id="resourceCalendarYear" type="number" min="2020" max="2100"/);
  assert.match(html, /id="resourceStartMonth"><\/select>/);
  assert.match(html, /id="resourceFrontInserts"><\/select>/);
  assert.match(html, /id="resourceRearInserts"><\/select>/);
  assert.match(html, /id="resourceAdjacentMini" type="checkbox"/);
  assert.match(html, /function rebuildProjectFromBasicSettings\(next\)/);
});

test('insert defaults follow calendar type capability instead of template contents', () => {
  const html = fs.readFileSync(new URL('../apps/designer-studio/index.html', import.meta.url), 'utf8');
  assert.match(html, /d\.frontInsert!==false/);
  assert.match(html, /d\.rearInsert!==false/);
  assert.match(html, /사용자는 달력을 만들 때 앞·뒤 간지 수, 5×7·6×7 월력/);
});

test('mini calendar wording applies to both five and six row calendars', () => {
  const html = fs.readFileSync(new URL('../apps/designer-studio/index.html', import.meta.url), 'utf8');
  assert.doesNotMatch(html, /5×7 빈 셀에 (?:전달·다음 달 )?미니 월력/);
  assert.match(html, /빈 날짜 셀에 이전·다음 달 미니 월력 표시/);
  assert.match(html, /월력 그리드의 빈 날짜 셀에 이전 달과 다음 달의 미니 월력을 표시합니다/);
});

test('image-based school asset slots do not render fixed role captions', () => {
  const html = fs.readFileSync(new URL('../apps/designer-studio/index.html', import.meta.url), 'utf8');
  assert.match(html, /\["image","image-text"\]\.includes\(SEMANTIC_DEFS\[item\.role\]\?\.kind\)\)item\.showCaption=false/);
  assert.match(html, /item\.showCaption===true\?/);
  assert.match(html, /semantic-empty-visual non-output editor-only/);
});

test('template thumbnails support uploaded artwork and page fallbacks', () => {
  const html = fs.readFileSync(new URL('../apps/designer-studio/index.html', import.meta.url), 'utf8');
  const runtime = fs.readFileSync(new URL('../apps/designer-studio/template-library-runtime.js', import.meta.url), 'utf8');
  assert.match(html, /id="resourceThumbnailInput"/);
  assert.match(html, /project\.template\.thumbnail=\{kind:'upload'/);
  assert.match(html, /권장 크기는 1200×900px, 최소 크기는 800×600px/);
  assert.match(runtime, /uploaded\?\.dataUrl/);
  assert.match(runtime, /record\.type==='poster'\?pages\.find\(page=>page\.role==='poster-annual'\):pages\.find\(page=>page\.role==='cover-front'\)/);
  assert.match(runtime, /function mountCoverSnapshot\(host,page\)/);
  assert.match(runtime, /transform',`scale\(\$\{scale\}\)`,'important'/);
  assert.match(runtime, /sourceWidth=Math\.max\(1,Math\.round\(rect\.width\|\|page\.offsetWidth\|\|850\)\)/);
  assert.doesNotMatch(html, /\.calendar-product-page \.library-thumb-render\{[^}]*transform:none!important/);
});

test('template library uses unified controls and calendar product thumbnails', () => {
  const html = fs.readFileSync(new URL('../apps/designer-studio/index.html', import.meta.url), 'utf8');
  const runtime = fs.readFileSync(new URL('../apps/designer-studio/template-library-runtime.js', import.meta.url), 'utf8');
  assert.match(html, /grid-template-columns:repeat\(auto-fill,minmax\(268px,300px\)\)/);
  assert.match(html, /\.library-tab,\.library-type-filter,\.library-state-group \[data-library-state\],\.library-edition-group select/);
  assert.match(html, /\.calendar-product-binding/);
  assert.match(html, /\.calendar-product-stand/);
  assert.match(html, /\.calendar-product-wall \.calendar-product-shell/);
  assert.match(runtime, /calendar-product-thumb calendar-product-\$\{escape\(record\.type\)\}/);
  assert.match(runtime, /calendar-product-page.*data-library-thumbnail/);
});
