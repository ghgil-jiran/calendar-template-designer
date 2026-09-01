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

test('system templates retain their source while editing and save as a custom latest record', () => {
  const html = fs.readFileSync(new URL('../apps/designer-studio/index.html', import.meta.url), 'utf8');
  assert.match(html, /project\.template\.librarySource=t\.source\|\|project\.template\.librarySource\|\|"local"/);
  assert.match(html, /project\.template\.librarySource="local"/);
  assert.match(html, /source:"local"/);
  assert.match(html, /v22Library\(\)\.find\(x=>x\.id===savedId\)/);
});

test('reopened remote templates keep the identity needed to create the next version', () => {
  const html = fs.readFileSync(new URL('../apps/designer-studio/index.html', import.meta.url), 'utf8');
  assert.match(html, /project\.template\.remoteId=t\.remoteId\|\|t\.id/);
  assert.match(html, /project\.template\.remoteStableKey=t\.stableKey/);
  assert.match(html, /project\.template\.remoteVersionNumber=Number\(t\.version\)/);
  assert.match(html, /templateId:project\.template\.remoteId\|\|null/);
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

test('remote template cards expose immutable version history and restore controls', () => {
  const runtime = fs.readFileSync(new URL('../apps/designer-studio/template-library-runtime.js', import.meta.url), 'utf8');
  assert.match(runtime, /<span class="version-badge">v\$\{escape\(String\(record\.version\)\)\}<\/span>/);
  assert.match(runtime, /data-library-history/);
  assert.match(runtime, /ACDLTemplateRemotePersistence\.versions\(templateId\)/);
  assert.match(runtime, /기존 버전은 그대로 보존됩니다/);
  assert.match(runtime, /remote\.restore\(templateId,versionId/);
  assert.match(runtime, /과거 버전 읽기 전용 미리보기/);
});

test('desk 1.4.0 is the exact published canonical system base', () => {
  const catalog = fs.readFileSync(new URL('../apps/designer-studio/template-catalog.js', import.meta.url), 'utf8');
  assert.match(catalog, /tpl-2028-desk-academic-standard-v1-4/);
  assert.match(catalog, /packageVersion:\"1\.4\.0\"/);
  assert.match(catalog, /packageBase:\"\/templates\/desk-academic-standard\/1\.4\.0\/\"/);
  assert.match(catalog, /status:\"published\",registryStatus:\"published\",canonicalPackage:true/);
  const runtime = fs.readFileSync(new URL('../apps/designer-studio/template-library-runtime.js', import.meta.url), 'utf8');
  assert.match(runtime, /function linkedWorkingCopy\(record\)/);
  assert.match(runtime, /derivedFromPackage:\{templateId:record\.template,version:record\.packageVersion/);
  assert.match(runtime, /연결 작업본 만들기/);
});

test('wall academic package is exposed as an editor review sample with its exact version', () => {
  const catalog = fs.readFileSync(new URL('../apps/designer-studio/template-catalog.js', import.meta.url), 'utf8');
  assert.match(catalog, /tpl-2028-wall-academic-standard-v0-3/);
  assert.match(catalog, /name:"벽걸이형 표준 01 · 이미지 월력형"/);
  assert.match(catalog, /packageVersion:"0\.3\.0"/);
  assert.match(catalog, /packageBase:"\/templates\/wall-academic-standard\/0\.3\.0\/"/);
  assert.match(catalog, /pageSummary:"앞표지 1면·앞간지 1면·월력 12면·뒷표지 1면"/);
  assert.doesNotMatch(catalog, /tpl-2028-wall-academic-standard-v0-3[^\n]+status:"published"/);
});

test('prototype system bases are archived and hidden from the default active view', () => {
  const catalog = fs.readFileSync(new URL('../apps/designer-studio/template-catalog.js', import.meta.url), 'utf8');
  const runtime = fs.readFileSync(new URL('../apps/designer-studio/template-library-runtime.js', import.meta.url), 'utf8');
  for (const id of ['tpl-2027-desk-sample-6', 'tpl-2027-desk-sample-2', 'tpl-2027-basic-desk', 'tpl-2027-minimal-desk', 'tpl-2027-wall', 'tpl-2027-poster', 'tpl-2027-postcard']) {
    assert.match(catalog, new RegExp(`${id}[^\\n]+status:\"archived\"`));
  }
  assert.match(runtime, /activeLibraryState==='all'&&record\.state==='archived'/);
  assert.match(runtime, /record\.source==='local'\?`<button data-library-state-change/);
  assert.match(runtime, /if\(!map\.has\(record\.id\)\)map\.set\(record\.id,record\)/);
});

test('new desk planner standard is visible as a separate 2028 draft system base', () => {
  const catalog = fs.readFileSync(new URL('../apps/designer-studio/template-catalog.js', import.meta.url), 'utf8');
  const html = fs.readFileSync(new URL('../apps/designer-studio/index.html', import.meta.url), 'utf8');
  assert.match(catalog, /tpl-2028-desk-planner-standard-01[^\n]+name:"탁상형 표준 01 · 월별 플래너형"[^\n]+status:"draft"[^\n]+template:"desk-sample-6"/);
  assert.match(catalog, /features:\["6번 원본 재현","30면·간지 포함","월별 파스텔 색상","월 목표·할 일","5주 계획·메모","사용자 편집 보호"\]/);
  assert.match(catalog, /pageSummary:"표지 2면·간지 2면·월력 앞뒤 24면·뒷표지 2면\(마지막 학교 상징\)"/);
  assert.match(html, /id="masterMonthTitleAlign"/);
  assert.match(html, /id="masterWeekdayStyle"/);
  assert.match(html, /id="masterGridStyle"/);
  assert.match(html, /id="masterMonthTitleStyle"/);
  assert.match(html, /value="number-inline"/);
  assert.match(html, /calendar\.design\.monthTitleStyle=el\("masterMonthTitleStyle"\)/);
  assert.match(html, /weekday-outlined-pills \.calendar>\.head\{[^}]*border:1\.5px/);
  assert.match(html, /12개월 공통 월력 디자인/);
  assert.match(html, /designer-only-control[^\n]+월 표시 위치/);
  assert.match(html, /page\.planner-back-surface \.surface-content\{background:var\(--planner-background\)/);
});

test('template library entry and save do not reference the removed legacy filter state', () => {
  const html = fs.readFileSync(new URL('../apps/designer-studio/index.html', import.meta.url), 'utf8');
  assert.doesNotMatch(html, /activeLibraryFilter/);
  assert.match(html, /designerHomeLibrary[^\n]+renderTemplateLibrary\('all'\)/);
  assert.match(html, /renderTemplateLibrary\("all"\);/);
});

test('library project opening waits for package loading and clears stale schedule settings', () => {
  const html = fs.readFileSync(new URL('../apps/designer-studio/index.html', import.meta.url), 'utf8');
  const openStart = html.indexOf('async function openDesignerProjectFromRecord(t)');
  const openEnd = html.indexOf('function closeTemplateLibrary()', openStart);
  const openSource = html.slice(openStart, openEnd);
  const packageLoad = openSource.indexOf('ACDLPackageProjectAdapter.loadAndApply');
  const closeLibrary = openSource.indexOf('templateLibraryModal").classList.add("hidden")');
  assert.ok(packageLoad >= 0 && closeLibrary > packageLoad);
  assert.match(html, /resourceScheduleFileName"\)\.textContent="샘플 일정 파일 없음"/);
  assert.match(html, /preview\.classList\.add\("hidden"\);preview\.innerHTML=""/);
  assert.match(openSource, /requestAnimationFrame\(\(\)=>requestAnimationFrame\(\(\)=>\{if\(isCurrentProjectTransition\(transitionId\)&&project===openedProject\)render\(\)\}\)\)/);
  assert.match(html, /\.calendar-stage \.calendar\{height:100%;grid-template-rows:minmax\(20px,auto\) repeat\(var\(--calendar-rows,6\),1fr\)\}/);
  assert.match(html, /\.calendar-stage \.head\{line-height:14px\}/);
});

test('local studio server handles the browser favicon request without a 404', () => {
  const server = fs.readFileSync(new URL('../tools/serve-designer-studio.mjs', import.meta.url), 'utf8');
  assert.match(server, /url\.pathname === '\/favicon\.ico'/);
  assert.match(server, /res\.writeHead\(204/);
});
