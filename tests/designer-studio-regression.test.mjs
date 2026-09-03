import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const htmlPath = path.resolve('apps/designer-studio/index.html');
const html = fs.readFileSync(htmlPath, 'utf8');
const projectDocument = fs.readFileSync(path.resolve('apps/designer-studio/project-document.js'), 'utf8');

test('new template setup covers the editor chrome and remains scrollable on short screens', () => {
  assert.match(html, /\.setup\{[^}]*z-index:200[^}]*overflow:auto/);
  assert.match(html, /\.setup-card\{[^}]*max-height:calc\(100dvh - 36px\)[^}]*overflow:auto/);
});

test('the insertion library is docked on the left and separates calendar objects from school data', () => {
  assert.match(html, /\.object-drawer\{position:fixed;top:128px;[^}]*height:calc\(100vh - 128px\)/);
  assert.match(html, /id="insertSidebar" class="panel insert-sidebar/);
  assert.match(html, /id="insertSidebarHost"/);
  assert.match(html, /id="calendarObjectSection" class="object-section" data-library-section="calendar"/);
  assert.match(html, /data-library-section="school"><h3>학교 개체/);
  assert.match(html, /host\.appendChild\(body\)/);
  assert.match(html, /\(backgroundSection\|\|registered\)\?\.after\(calendarSection\)/);
});

test('monthly calendar rendering uses the active product type region', () => {
  assert.match(html, /title=p\.overrides\.monthTitle\|\|[^,]+,cr=calendarRegion\(\),rows=/);
  assert.doesNotMatch(html, /cr=project\.template\.masters\.calendar\.calendarRegion\|\|\{x:5,y:16,width:90,height:79\}/);
});

test('monthly calendar uses sample-measured fixed vertical ratios', () => {
  assert.match(html, /function calendarVerticalLayout\(design=/);
  assert.match(html, /"sample-6":\{title:10,weekday:4,grid:86\}/);
assert.match(html, /"sample-3":\{title:21,weekday:4,grid:75\}/);
assert.match(html, /data-standard-family="desk-3"\] \.widget-mini-calendar\{background:transparent;border:0/);
assert.match(html, /view\.monthLabelStyle==="number-en"/);
assert.match(html, /view\.showWeekdayHeader!==false/);
  assert.match(html, /--calendar-title-share:\$\{vertical\.title\}%/);
  assert.match(html, /--calendar-weekday-stage-share:\$\{vertical\.weekdayStage\}%/);
  assert.doesNotMatch(html, /function calendarVerticalMetrics\(rows\)/);
});

test('calendar inspector choices override the measured preset presentation', () => {
  assert.match(html, /calendar\.calendarOverrides=\{\.\.\.\(calendar\.calendarOverrides\|\|\{\}\),monthTitleAlign:calendar\.design\.monthTitleAlign/);
  assert.match(html, /\.calendar-region\.grid-boxed\[data-calendar-preset="academic-boxed"\]/);
  assert.doesNotMatch(html, /\.calendar-region\[data-calendar-preset="academic-boxed"\] \.calendar>\.cell:not\(\.head\)\{border-color/);
});

test('open rows draw the boundary directly below weekday headers', () => {
  assert.match(html, /\.grid-open-rows \.calendar>\.cell:nth-child\(n\+8\):nth-child\(-n\+14\)\{border-top:1px solid #a7a7a7!important\}/);
});

test('month title keeps the measured vertical gap above weekday headers', () => {
  assert.match(html, /--calendar-title-weekday-gap:\$\{presentation\.titleWeekdayGap\}mm/);
  assert.match(html, /\.calendar-region \.month-title\{[^}]*padding-bottom:var\(--calendar-title-weekday-gap,0\)/);
});

test('month title variants reserve their own vertical footprint and clip accidental overlap', () => {
  assert.match(html, /titlePresentations\?\.\[preset\.presentation\.monthTitleStyle\]/);
  assert.match(html, /title=Math\.max\(layout\.titlePercent,titleSpec\?\.titlePercent\|\|0\)/);
  assert.match(html, /\.calendar-region \.month-title\{[^}]*overflow:hidden/);
  assert.match(html, />큰 월 숫자만<\/option>/);
  assert.match(html, />연도년 월월 한글형<\/option>/);
  assert.match(html, />월월 한글형<\/option>/);
  assert.match(html, />영문 월 \+ 연도<\/option>/);
  assert.match(html, /"number-only":`<span class="month-number">/);
  assert.match(html, /"english-month":`<span class="month-en">/);
  assert.match(html, /month-title-right \.month-title/);
  assert.match(html, />오른쪽<\/option>/);
  assert.match(html, /classList\.add\(`month-title-\$\{\["left","center","right"\]\.includes\(align\)\?align:"left"\}`\)/);
});

test('date grid selector exposes independent underline, minimal and detached cell structures', () => {
  assert.match(html, /value="open-rows"[^>]*>독립 밑줄 · 첨부 디자인 1/);
  assert.match(html, /value="minimal"[^>]*>미니멀 무선 · 첨부 디자인 2/);
  assert.match(html, /value="detached-cards"[^>]*>개별 사각 셀/);
  assert.match(html, /minimal:"grid-minimal","detached-cards":"grid-detached-cards"/);
  assert.match(html, /\.grid-minimal \.calendar>\.cell:not\(\.head\)\{border:0!important/);
  assert.match(html, /\.grid-detached-cards \.calendar>\.cell:not\(\.head\)\{border:1px solid #b8bec7!important/);
  assert.match(html, /detachedCards=activeGridStyle==='detached-cards'/);
  assert.match(html, /detachedCards\?'detached-cell-range'/);
  assert.match(html, /background=detachedCards&&span>1\?`linear-gradient/);
});

test('five and six week modes only repartition the fixed date grid', () => {
  assert.match(html, /repeat\(var\(--calendar-rows,6\),minmax\(0,1fr\)\)/);
  assert.match(html, /--mini-calendar-rows:\$\{rows\}/);
  assert.match(html, /grid-template-rows:repeat\(var\(--mini-calendar-rows,6\),minmax\(0,1fr\)\)/);
});

test('mini calendars use either three-cell edge reserve', () => {
  assert.match(html, /const leading=\[\];for\(let i=0;i<grid\.length&&isEmpty\(grid\[i\]\);i\+\+\)leading\.push\(i\)/);
  assert.match(html, /if\(trailing\.length>=3\)return trailing\.slice\(-2\)/);
  assert.match(html, /if\(leading\.length>=3\)return leading\.slice\(0,2\)/);
});

test('adjacent month fading does not fade calendar rules', () => {
  assert.match(html, /\.calendar \.cell\.adj\{opacity:1\}/);
  assert.match(html, /\.calendar \.cell\.adj \.day-stack\{opacity:\.35\}/);
  assert.doesNotMatch(html, /\.page\[data-standard-family="desk-6"\] \.calendar-region \.adj\{opacity:\.22\}/);
  assert.match(html, /\.page\[data-standard-family="desk-6"\] \.calendar-region \.calendar>\.cell\.adj\{opacity:1\}/);
  assert.match(html, /\.page\[data-standard-family="desk-6"\] \.calendar-region \.calendar>\.cell\.adj>\.day-stack\{opacity:\.22\}/);
});

test('desk calendar typography follows the rendered page width', () => {
  assert.match(html, /--calendar-title-responsive:\$\{project\.template\.masters\.calendar\.monthTitleSize\/8\.5\}cqw/);
  assert.match(html, /\.calendar-region \.month-title\{font-size:clamp\(14px,var\(--calendar-title-responsive/);
  assert.match(html, /\.calendar-region \.day\{font-size:clamp\(7px,1\.176cqw,12px\)/);
});

test('template objects allow overlap without collision avoidance or forced grid snapping', () => {
  assert.doesNotMatch(html, /rectanglesOverlap\(/);
  assert.doesNotMatch(html, /findOpenWidgetPlacement|widgetOverlap|placementItems/);
  assert.match(html, /function findSemanticPlacement\(base,arr\)\{\s*return \{/);
  assert.doesNotMatch(html, /if\(e\.altKey===false\)\{x=snap\(x,grid\.x\);y=snap\(y,grid\.y\)\}/);
  assert.match(html, /data-s2="front">맨 앞으로/);
  assert.match(html, /data-s2="back">맨 뒤로/);
});

test('dragging and resizing mutate only the selected element', () => {
  assert.match(html, /function moveElementPointer\(e\)\{[\s\S]*?const item=sourceElement\(\);[\s\S]*?if\(elementDrag\.handle==="move"\)\{item\.x=o\.x\+dx;item\.y=o\.y\+dy\}/);
  assert.doesNotMatch(html, /function moveElementPointer\(e\)\{[\s\S]*?(?:masterElements|pageElements)\(\)\.(?:forEach|map)/);
});

test('system base templates start without sample school events', () => {
  assert.match(projectDocument, /pageInstances: \[\], events: \[\], elementsByPage: \{\}/);
  assert.doesNotMatch(projectDocument, /events:\s*SAMPLE_EVENTS\.filter/);
});

test('postcard calendar editing uses the single shared toggle handler', () => {
  assert.match(
    html,
    /el\("editCalendarBtn"\)\.addEventListener\("click",\(\)=>\{\s*calendarEditing=!calendarEditing;/,
    'the shared calendar edit button should toggle the selection once'
  );
  assert.doesNotMatch(
    html,
    /editCalendarBtn['"]\)\?\.addEventListener\(['"]click['"],[\s\S]{0,220}productType\?\.category===['"]postcard['"]/,
    'postcard should not register a second capture-phase click handler'
  );
});

test('desk thumbnail gives most of the card area to the cover design', () => {
  assert.match(html, /calendar-product-thumb\{[^}]*padding:7px/);
  assert.match(html, /calendar-product-shell\{[^}]*width:98%;height:94%/);
  assert.match(html, /calendar-product-page\{[^}]*height:90%/);
});

test('designer studio entry flow uses the unified studio entry and hides sample entry', () => {
  assert.match(html, /<script src="\.\/wizard-flow\.js"><\/script>/, 'wizard-flow script should be loaded');
  assert.match(html, /function openDesignerStudio\(/, 'the studio entry flow should expose openDesignerStudio');
  assert.doesNotMatch(html, /id="designerHomeSample"/, 'the sample project action should be removed from the home UI');
  assert.doesNotMatch(html, /designerHomeSample/, 'sample entry handler should not remain in the app shell');
});

test('wizard state helper is available for step persistence', () => {
  const wizardPath = path.resolve('apps/designer-studio/wizard-flow.js');
  const wizard = fs.readFileSync(wizardPath, 'utf8');
  assert.match(wizard, /ACDLDesignerStudioWizard/, 'wizard helper should expose the shared state API');
  assert.match(wizard, /persistWizardState/, 'wizard helper should persist the selected type and step');
});

test('wizard primary action styling stays visible without design tokens', () => {
  assert.match(html, /\.wizard-actions button\.primary\{[^}]*background:\s*#2563eb/, 'primary wizard button should use the fallback blue background');
  assert.match(html, /\.wizard-actions button\.primary\{[^}]*color:\s*#fff/, 'primary wizard button should use white text');
  assert.match(html, /\.wizard-actions button\.primary:hover\{[^}]*background:\s*#1d4ed8/, 'primary wizard button should use a hover state');
  assert.match(html, /--accent:\s*var\(--acds-primary,\s*#2563eb\)/, 'wizard styles should define an accent fallback token');
});

test('desk sample templates remain visible after the type definition options are rebuilt', () => {
  assert.match(html, /\{id:'desk-sample-6',name:'탁상형 6번 · 월별 플래너형'\}/);
  assert.match(html, /\{id:'desk-sample-3',name:'탁상형 3번 · 이미지 미니월력형'\}/);
  assert.match(html, /\{id:'desk-sample-2',name:'탁상형 2번 · 이미지 콜라주형'\}/);
  assert.match(html, /DESK_SAMPLE_MIGRATION_KEY='acdl\.deskSamples\.v2'/);
  assert.match(html, /desk\.starterTemplates=\['desk-sample-6','desk-sample-3','desk-sample-2',\.\.\.current\.filter/);
  assert.match(html, /requiredStarters=d\.id==='desk'\?\['desk-sample-6','desk-sample-3','desk-sample-2'\]:\[\]/);
  assert.match(html, /required=typeId==='desk'\?\['desk-sample-6','desk-sample-3','desk-sample-2'\]:\[\]/);
});

test('wizard helper can reset step and selection state for a fresh flow', () => {
  const wizardPath = path.resolve('apps/designer-studio/wizard-flow.js');
  const source = fs.readFileSync(wizardPath, 'utf8');
  const storage = new Map();
  const context = {
    window: {},
    globalThis: {},
    localStorage: {
      getItem: (key) => (storage.has(key) ? storage.get(key) : null),
      setItem: (key, value) => storage.set(key, String(value)),
      removeItem: (key) => storage.delete(key)
    }
  };
  context.window = context;
  context.globalThis = context;
  vm.runInNewContext(source, context);
  const wizard = context.ACDLDesignerStudioWizard;
  wizard.persistWizardState({ selectedType: 'desk', template: 'school-basic', step: 3 });
  const reset = wizard.resetWizardState();
  assert.equal(reset.step, 1);
  assert.equal(reset.selectedType, '');
  assert.equal(reset.template, '');
  assert.equal(wizard.restoreWizardState().step, 1);
  assert.equal(wizard.restoreWizardState().selectedType, '');
  assert.match(source, /resetWizardState/, 'wizard helper should expose a reset helper');
});

test('designer studio keeps local storage while adding protected remote persistence', () => {
  assert.match(html, /template-remote-persistence\.js/);
  assert.match(html, /await saveTemplateProjectData\(id,projectCopy\)/);
  assert.match(html, /await remote\.save\(/);
  assert.match(html, /remoteSaved\?`원격 저장 완료/);
  assert.match(html, /remote\.saveDraft\(/);
});


test('template saves report whether data reached Supabase or only the browser', () => {
  assert.match(html, /저장 위치: Supabase 원격 저장/);
  assert.match(html, /템플릿은 이 브라우저에만 저장되었습니다/);
  assert.match(html, /버전 이력과 Package 검사를 사용하려면 Supabase 원격 저장이 필요합니다/);
});

test('template library labels remote and browser-only records explicitly', () => {
  const runtime = fs.readFileSync(path.resolve('apps/designer-studio/template-library-runtime.js'), 'utf8');
  assert.match(runtime, /Supabase 원격 저장/);
  assert.match(runtime, /브라우저 저장 · 원격 저장 필요/);
  assert.match(runtime, /const remoteHistory=remoteStored/);
});

test('canonical package edits keep their origin on a separate working copy', () => {
  const runtime = fs.readFileSync(path.resolve('apps/designer-studio/template-library-runtime.js'), 'utf8');
  assert.match(runtime, /id:`tpl-work-\$\{record\.template\}-\$\{record\.packageVersion\}-\$\{suffix\}`/);
  assert.match(runtime, /state:'draft',status:'draft'/);
  assert.match(runtime, /derivedFromPackage:\{templateId:record\.template,version:record\.packageVersion/);
  assert.match(html, /project\.template\.derivedFromPackage=t\.derivedFromPackage/);
  assert.match(html, /derivedFromPackage:project\.template\?\.derivedFromPackage\|\|undefined/);
});

test('template settings author required optional and unused inputs with sample fallback', () => {
  assert.match(html, /id="resourceInputContractGrid"/);
  assert.match(html, /const TEMPLATE_INPUT_DEFINITIONS=/);
  assert.match(html, /필수<\/option><option value="optional"/);
  assert.match(html, /선택 · 샘플 유지/);
  assert.match(html, /stage==="optional"\?\{fallback:"sample"\}/);
  assert.match(html, /project\.template\.publishing=\{/);
});
