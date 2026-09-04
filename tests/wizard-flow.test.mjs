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
  assert.match(html, /function showEntry\(\)\{clearNewTemplateBase\(\);beginProjectTransition\(\{clearProject:true\}\)/);
  assert.match(html, /function clearNewTemplateBase\(\)\{window\.ACDLNewTemplateBaseProject=null;window\.ACDLNewTemplateBaseRecord=null;el\("setupType"\)\.disabled=false\}/);
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

test('public landing presents the template studio without a calendar creation entry', () => {
  const html = fs.readFileSync(new URL('../apps/designer-studio/index.html', import.meta.url), 'utf8');
  const landing = html.match(/<div id="entryScreen"[\s\S]*?<div id="designerHome"/)?.[0] || '';
  assert.match(landing, /모든 시간을/);
  assert.match(landing, /원하는 달력 디자인으로/);
  assert.match(landing, /UNIVERSAL CALENDAR DESIGN STUDIO/);
  assert.match(landing, /템플릿 라이브러리/);
  assert.match(landing, /새 템플릿 만들기/);
  assert.match(landing, /달력 유형 관리/);
  assert.doesNotMatch(landing, /새 달력 만들기/);
});

test('public landing explains the editor beyond academic calendars', () => {
  const html = fs.readFileSync(new URL('../apps/designer-studio/index.html', import.meta.url), 'utf8');
  const landing = html.match(/<div id="entryScreen"[\s\S]*?<div id="designerHome"/)?.[0] || '';
  assert.match(landing, /모든 형태의 달력/);
  assert.match(landing, /풍부한 디자인 요소/);
  assert.match(landing, /디자인을 템플릿으로/);
  assert.match(landing, /화면부터 인쇄까지/);
  assert.match(landing, /기업·학교·개인 포토 달력/);
  assert.doesNotMatch(html, /transform:rotate\(-1\.4deg\)/);
});

test('public landing has a compact JIRANTECH footer with related services', () => {
  const html = fs.readFileSync(new URL('../apps/designer-studio/index.html', import.meta.url), 'utf8');
  const landing = html.match(/<div id="entryScreen"[\s\S]*?<div id="designerHome"/)?.[0] || '';
  assert.match(landing, /class="landing-footer"/);
  assert.match(landing, /href="https:\/\/jirantech\.com\/"/);
  assert.match(landing, /href="https:\/\/schoolp\.co\.kr\/"/);
  assert.match(landing, /href="https:\/\/lib\.schoolp\.co\.kr\/"/);
  assert.match(landing, /href="https:\/\/schoolp\.co\.kr\/contact\/privacy"/);
  assert.match(landing, /rel="noopener noreferrer"/);
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

test('monthly-back mini calendars expose independent month-title and weekend styles', () => {
  const html = fs.readFileSync(new URL('../apps/designer-studio/index.html', import.meta.url), 'utf8');
  assert.match(html, /빈 날짜 셀용 미니 월력과 별개의 독립 디자인 개체/);
  assert.match(html, /id="miniMonthLabelStyle"/);
  assert.match(html, /id="miniTitleSize"/);
  assert.match(html, /id="miniTitleAlign"/);
  assert.match(html, /id="miniSunday"/);
  assert.match(html, /id="miniSaturday"/);
  assert.match(html, /bind\("applyMiniCalendarStyle"/);
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
  assert.match(runtime, /function mountCoverSnapshot\(record,host,page\)/);
  assert.match(runtime, /thumbnailMarkupCache/);
  assert.match(runtime, /library-thumbnail-fallback/);
  assert.match(runtime, /transform',`scale\(\$\{scale\}\)`,'important'/);
  assert.match(runtime, /const designSize=window\.ACDLEditorPageFit\?\.designSize\?\.\(\)/);
  assert.match(runtime, /sourceWidth=Math\.max\(1,Math\.round\(Number\(designSize\?\.width\)\|\|page\.offsetWidth/);
  assert.match(runtime, /render\(\);window\.ACDLEditorPageFit\?\.fit\?\.\(\)/);
  assert.match(runtime, /clone\.style\.removeProperty\('transform'\)/);
  assert.doesNotMatch(runtime, /page\.getBoundingClientRect\(\)/);
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
  assert.match(runtime, /function cardStateLabel\(record\)/);
  assert.match(runtime, /record\.state==='published'\?'게시됨'/);
  assert.match(runtime, /record\.isStandard\?'<span class="standard-badge">표준<\/span>'/);
  assert.match(runtime, /data-library-settings/);
  assert.doesNotMatch(runtime, /data-library-copy/);
  assert.match(runtime, /function internalVersionLabel\(record\)/);
  assert.match(runtime, /library-card-version/);
});

test('template lifecycle separates status, standard, design editing and settings', () => {
  const html = fs.readFileSync(new URL('../apps/designer-studio/index.html', import.meta.url), 'utf8');
  const runtime = fs.readFileSync(new URL('../apps/designer-studio/template-library-runtime.js', import.meta.url), 'utf8');
  assert.match(html, /id="saveTemplateStandard"/);
  assert.match(html, /id="libraryStandardFilter"/);
  assert.match(runtime, /const locked=record\.isStandard===true\|\|record\.state==='published'\|\|record\.state==='archived'/);
  assert.match(runtime, /data-library-settings/);
  assert.match(runtime, /async function saveSettings\(recordId,values\)/);
  assert.match(runtime, /async function startNewFrom\(record\)/);
  assert.match(runtime, /activeStandardOnly&&!record\.isStandard/);
  assert.doesNotMatch(runtime, /data-library-copy/);
  assert.doesNotMatch(runtime, /data-library-state-change/);
});

test('remote template cards expose restore history without the unreliable preview action', () => {
  const runtime = fs.readFileSync(new URL('../apps/designer-studio/template-library-runtime.js', import.meta.url), 'utf8');
  assert.match(runtime, /Package \$\{record\.template\}@\$\{record\.packageVersion\}/);
  assert.match(runtime, /data-library-history/);
  assert.match(runtime, /ACDLTemplateRemotePersistence\.versions\(templateId\)/);
  assert.match(runtime, /기존 버전은 그대로 보존됩니다/);
  assert.match(runtime, /remote\.restore\(templateId,versionId/);
  assert.doesNotMatch(runtime, /data-version-preview/);
  assert.doesNotMatch(runtime, /과거 버전 읽기 전용 미리보기/);
  assert.match(runtime, /data-library-quality-check disabled/);
  assert.match(runtime, /인쇄·출력 품질 검사 · 준비 중/);
});

test('new template setup omits file loading and cancel returns to the library', () => {
  const html = fs.readFileSync(new URL('../apps/designer-studio/index.html', import.meta.url), 'utf8');
  assert.doesNotMatch(html, /id="setupLoadBtn"/);
  assert.match(html, /window\.ACDLReturnToLibraryOnSaveCancel=true/);
  assert.match(html, /if\(!window\.ACDLReturnToLibraryOnSaveCancel\)return/);
  assert.match(html, /el\("templateLibraryModal"\)\.classList\.remove\("hidden"\);renderTemplateLibrary\(\);refreshRemoteTemplateLibrary\(\)/);
});

test('landing uses the requested service title and planner cover', () => {
  const html = fs.readFileSync(new URL('../apps/designer-studio/index.html', import.meta.url), 'utf8');
  assert.match(html, /우리학교인쇄 CALENDAR EDITOR/);
  assert.doesNotMatch(html, /Universal Calendar Design Lab/);
  assert.doesNotMatch(html, /<div class="landing-process">/);
  assert.match(html, /탁상형 검토 01 - 월별 플래너 표지/);
  assert.match(html, /assets\/sample-school\/jiran-building\.webp/);
});

test('desk 1.4.0 is the exact published canonical system base', () => {
  const catalog = fs.readFileSync(new URL('../apps/designer-studio/template-catalog.js', import.meta.url), 'utf8');
  assert.match(catalog, /tpl-2028-desk-academic-standard-v1-4/);
  assert.match(catalog, /packageVersion:\"1\.4\.0\"/);
  assert.match(catalog, /packageBase:\"\/templates\/desk-academic-standard\/1\.4\.0\/\"/);
  assert.match(catalog, /status:\"published\",isStandard:true,registryStatus:\"published\",canonicalPackage:true/);
  assert.match(catalog, /name:\"\[학사달력\] 탁상형 표준 02 - 월별 이미지\"/);
  assert.match(catalog, /description:\"총 28면 · 표지 1면 · 간지 2면 · 월력 24면 · 뒷표지 1면 — 연력 \/ 학교상징 \/ 월별 이미지·월력·미니월력\"/);
  const runtime = fs.readFileSync(new URL('../apps/designer-studio/template-library-runtime.js', import.meta.url), 'utf8');
  assert.match(runtime, /async function startNewFrom\(record\)/);
  assert.match(runtime, /window\.ACDLNewTemplateBaseProject=source/);
  assert.doesNotMatch(runtime, /연결 작업본 만들기/);
});

test('wall academic package is exposed as an editor review sample with its exact version', () => {
  const catalog = fs.readFileSync(new URL('../apps/designer-studio/template-catalog.js', import.meta.url), 'utf8');
  assert.match(catalog, /tpl-2028-wall-academic-standard-v0-3/);
  assert.match(catalog, /name:"\[학사달력\] 벽걸이형 검토 01 - 이미지 월력"/);
  assert.match(catalog, /packageVersion:"0\.3\.0"/);
  assert.match(catalog, /packageBase:"\/templates\/wall-academic-standard\/0\.3\.0\/"/);
  assert.match(catalog, /pageSummary:"총 15면 · 표지 1면 · 간지 1면 · 월력 12면 · 뒷표지 1면"/);
  assert.doesNotMatch(catalog, /tpl-2028-wall-academic-standard-v0-3[^\n]+status:"published"/);
});

test('prototype system bases are archived and hidden from the default active view', () => {
  const catalog = fs.readFileSync(new URL('../apps/designer-studio/template-catalog.js', import.meta.url), 'utf8');
  const runtime = fs.readFileSync(new URL('../apps/designer-studio/template-library-runtime.js', import.meta.url), 'utf8');
  for (const id of ['tpl-2027-desk-sample-6', 'tpl-2027-desk-sample-2', 'tpl-2027-basic-desk', 'tpl-2027-minimal-desk', 'tpl-2027-wall', 'tpl-2027-poster', 'tpl-2027-postcard']) {
    assert.match(catalog, new RegExp(`${id}[^\\n]+status:\"archived\"`));
  }
  assert.match(runtime, /activeLibraryState==='all'&&record\.state==='archived'/);
  assert.doesNotMatch(runtime, /data-library-state-change/);
  assert.match(runtime, /if\(record\.libraryOverride\|\|!map\.has\(record\.id\)\)map\.set\(record\.id,record\)/);
});

test('new desk planner standard is visible as a separate 2028 draft system base', () => {
  const catalog = fs.readFileSync(new URL('../apps/designer-studio/template-catalog.js', import.meta.url), 'utf8');
  const html = fs.readFileSync(new URL('../apps/designer-studio/index.html', import.meta.url), 'utf8');
  assert.match(catalog, /tpl-2028-desk-planner-standard-01[^\n]+name:"\[학사달력\] 탁상형 검토 01 - 월별 플래너"[^\n]+status:"draft"[^\n]+template:"desk-sample-6"/);
  assert.match(catalog, /features:\["6번 원본 재현","28면 구성","월별 파스텔 색상","월 목표·할 일","5주 계획·메모","사용자 편집 보호"\]/);
  assert.match(catalog, /pageSummary:"총 28면 · 표지 1면 · 간지 2면 · 월력 24면 · 뒷표지 1면"/);
  assert.match(html, /id="masterMonthTitleAlign"/);
  assert.match(html, /id="masterWeekdayStyle"/);
  assert.match(html, /id="masterGridStyle"/);
  assert.match(html, /id="masterMonthTitleStyle"/);
  assert.match(html, /value="number-inline"/);
  assert.match(html, /calendar\.design\.monthTitleStyle=el\("masterMonthTitleStyle"\)/);
  assert.match(html, /weekday-outlined-pills \.calendar>\.head\{[^}]*border:1\.5px/);
  assert.match(html, /inlineTitle=`<span class="month-year">\$\{p\.calendarYear\}<\/span><span class="month-number">/);
  assert.match(html, /\.calendar-stage \.head\{[^}]*height:calc\(100% - var\(--calendar-weekday-grid-gap,0%\)\)[^}]*min-height:0/);
  assert.match(html, /weekday-outlined-pills \.calendar>\.head\{[^}]*margin:0 2px[^}]*border:1\.5px solid #98a2b3!important/);
  assert.match(html, /grid-open-rows \.calendar>\.cell:not\(\.head\)\{[^}]*border-right:0!important[^}]*border-bottom:1px solid #a7a7a7!important/);
  assert.match(html, /id="masterCalendarDesignPreset"/);
  assert.match(html, /"sample-6":\{title:"number-stack",align:"left",weekday:"filled-tabs",grid:"boxed"\}/);
  assert.match(html, /derivedMonthKey=p\.monthKey\|\|p\.calendarYear&&p\.calendarMonth/);
  assert.match(html, /monthPrimary=monthStyle\?\.tokens\?\.primary\|\|project\.template\.resources\?\.colorTheme\?\.primary\|\|"#315e9e"/);
  assert.match(html, /12개월 공통 월력 디자인/);
  assert.match(html, /designer-only-control[^\n]+월 표시 위치/);
  assert.match(html, /page\.planner-back-surface \.surface-content\{background:var\(--planner-background\)/);
});

test('sample 3 image mini-calendar review is a separate draft system base', () => {
  const catalog = fs.readFileSync(new URL('../apps/designer-studio/template-catalog.js', import.meta.url), 'utf8');
  assert.match(catalog, /tpl-2028-desk-image-calendar-review-02[^\n]+name:"\[학사달력\] 탁상형 검토 02 - 이미지 미니월력"[^\n]+status:"draft"[^\n]+template:"desk-sample-3"/);
  assert.match(catalog, /features:\["3번 원본 재현","28면 구성","독립 요일 캡슐","세로선 없는 날짜 격자","월별 이미지 콜라주","전후월 미니월력"\]/);
});

test('template library entry and save do not reference the removed legacy filter state', () => {
  const html = fs.readFileSync(new URL('../apps/designer-studio/index.html', import.meta.url), 'utf8');
  assert.doesNotMatch(html, /activeLibraryFilter/);
  assert.match(html, /designerHomeLibrary[^\n]+renderTemplateLibrary\('all'\)/);
  assert.match(html, /if\(isStandard\|\|state==="published"\|\|state==="archived"\)/);
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
  assert.match(html, /\.calendar-stage \.calendar\{height:100%;grid-template-rows:var\(--calendar-weekday-track,6\.5%\) repeat\(var\(--calendar-rows,6\),minmax\(0,1fr\)\)\}/);
  assert.match(html, /\.calendar-stage \.head\{align-self:start;box-sizing:border-box;height:calc\(100% - var\(--calendar-weekday-grid-gap,0%\)\);min-height:0;line-height:14px\}/);
});

test('local studio server handles the browser favicon request without a 404', () => {
  const server = fs.readFileSync(new URL('../tools/serve-designer-studio.mjs', import.meta.url), 'utf8');
  assert.match(server, /url\.pathname === '\/favicon\.ico'/);
  assert.match(server, /res\.writeHead\(204/);
});
