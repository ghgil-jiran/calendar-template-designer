import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';
import {photoFrameModel,wallStylePatch,wallStyleName,wallOptions} from '../src/lib/editor/session.ts';
import {fontChoices} from '../src/lib/editor/font-catalog.ts';
import {applyFieldDrafts,fieldChanged} from '../src/lib/editor/card-state.ts';
const require=createRequire(new URL('../src/features/editor/object-tools.tsx',import.meta.url));
const React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
function component(url){const js=ts.transpileModule(readFileSync(url,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText,module={exports:{}};new Function('require','module','exports',js)(name=>name==='@/lib/editor/session'?{photoFrameModel,wallStylePatch,wallStyleName,wallOptions}:name==='@/lib/editor/font-catalog'?{fontChoices}:name==='@/lib/editor/card-state'?{applyFieldDrafts,fieldChanged}:name==='@/components/ui/button'?component(new URL('../src/components/ui/button.tsx',import.meta.url)):name==='./monthly-schedule-tools'?{MonthlyScheduleTools:()=>null}:name==='./color-palette'?component(new URL('../src/features/editor/color-palette.tsx',import.meta.url)):require(name),module,module.exports);return module.exports;}
const {ObjectTools,TextFormattingToolbar}=component(new URL('../src/features/editor/object-tools.tsx',import.meta.url));
const noop=()=>{},props={selection:null,item:undefined,fields:[],school:{values:{},hidden:[]},fit:{fit:'contain',scale:1,offsetX:0,offsetY:0},hasEditableTargets:false,schoolImageLinked:false,sharing:{layout:false,image:false,layoutCount:0,imageCount:0,poster:false},canReset:false,onFieldChange:noop,onFieldHide:noop,onStyle:noop,onFit:noop,onShare:noop,onReset:noop};
const render=p=>renderToStaticMarkup(React.createElement(ObjectTools,{...props,...p}));
test('tools distinguish a page with no editable objects from a page awaiting selection',()=>{
 const empty=render({});assert.match(empty,/<h2>현재 페이지<\/h2>/);assert.match(empty,/이 페이지에는 편집할 수 있는 개체가 없습니다/);assert.doesNotMatch(empty,/개체를 선택/);assert.match(render({hasEditableTargets:true}),/개체의 배치와 표시 설정을 변경할 수 있습니다/);
});
test('text visibility is positive and restored from saved hidden state; numeric geometry controls are absent',()=>{
 const selection={label:'학교 슬로건',type:'text',binding:'school.slogan',rights:{content:true,textStyle:true,move:true,resize:true}},fields=[{key:'slogan',binding:'school.slogan',label:'학교 슬로건',allowHide:true,maxLength:200}],base={selection,fields,item:{content:'기본 문구',style:{fontSize:17}},school:{values:{slogan:'저장한 문구'},hidden:[]}};
 const visible=render(base);assert.match(visible,/aria-label="학교 슬로건 표시" checked/);assert.match(visible,/value="저장한 문구"/);assert.doesNotMatch(visible,/표시하지 않음|가로 위치 \(%\)|세로 위치 \(%\)/);
 const hidden=render({...base,school:{...base.school,hidden:['slogan']}});assert.doesNotMatch(hidden,/aria-label="학교 슬로건 표시" checked/);assert.match(hidden,/disabled=""/);
 const toolbar=renderToStaticMarkup(React.createElement(TextFormattingToolbar,{style:{fontWeight:700,fontStyle:'italic',textDecoration:'underline'},onChange:noop}));assert.equal((toolbar.replace(/<div[^>]*aria-label="기본 색"[\s\S]*?<\/div>/g,'').match(/aria-pressed="true"/g)||[]).length,4);assert.match(toolbar,/popover="auto"/);assert.match(toolbar,/사용자 지정 색/);assert.match(toolbar,/aria-label="밑줄"/);
});
test('image controls share compact layout with independent poster copy scopes and retained fitting sliders',()=>{
 const html=render({selection:{label:'학교 전경',type:'image-frame',binding:'',rights:{replaceImage:true,imageFit:true,move:true,resize:true}},hasEditableTargets:true,sharing:{layout:false,image:false,layoutCount:1,imageCount:1,poster:true}});
 assert.match(html,/다른 페이지의 같은 개체에 위치·크기 적용/);assert.match(html,/다른 페이지의 같은 개체에 이미지 적용/);assert.equal((html.match(/type="checkbox"/g)||[]).length,2);assert.equal((html.match(/type="range"/g)||[]).length,3);assert.doesNotMatch(html,/보여줄 방법|위치와 크기|<h3>사진 교체/);assert.match(html,/aria-label="사진 맞춤"/);
});
test('inspector summarizes permitted actions and shows page/object identity with summary guidance and no object buttons',()=>{const selection={pageId:'cover',scope:'page',elementId:'school',label:'학교명',type:'text',binding:'school.name',rights:{content:true,move:true}};const empty=render({pageName:'표지',hasEditableTargets:true,editableTargets:[selection]});assert.match(empty,/<h2>표지<\/h2>/);assert.match(empty,/텍스트를 변경할 수 있습니다/);assert.doesNotMatch(empty,/<button/);const selected=render({pageName:'표지',selection});assert.match(selected,/<h3 class="editor-selected-object-name">학교명/);assert.doesNotMatch(selected,/학교 정보와 연결된 글자|개체를 끌어|왼쪽 사진을/);});

test('content inputs and unchanged save action share one card, with a separate style card',()=>{const html=render({selection:{label:'학교 이름',type:'text',binding:'school.name',rights:{content:true,textStyle:true}},fields:[{key:'name',binding:'school.name',label:'학교명',maxLength:200}],school:{values:{name:'학교'},hidden:[]}});assert.match(html,/editor-tool-card editor-text-content/);assert.match(html,/button-secondary editor-card-apply[\s\S]*?disabled/);assert.match(html,/editor-tool-card editor-font-style/);assert.match(html,/<h3>글꼴과 글자/);for(const label of ['글자 굵기','취소선','세로 정렬','자간','행간','불투명도','배경색','외곽선','그림자'])assert.ok(html.includes(label),label);});

test('wall tools expose the template style and schedule options',()=>{
 const html=render({posterProject:{book:{pageInstances:[{}]},template:{}},selection:{label:'전체 월력',type:'year-calendar',rights:{calendarStyle:true}},item:{wallCalendarSettings:{gridStyle:'boxed',schedulePlacement:'cells',referencePlacement:'cells',titleStyle:'band',dateAlign:'left'}}});
 assert.match(html,/적용 스타일<select disabled/);
 assert.match(html,/목록 단수/);
 assert.match(html,/글자 크기/);
 assert.match(html,/날짜에 요일 표시/);
 assert.match(html,/공휴일 포함/);
});

test('wall calendar shows schedule overflow guidance for cell and list layouts',()=>{
 const props={selection:{label:'전체 월력',type:'year-calendar',rights:{calendarStyle:true}},posterProject:{book:{pageInstances:[{},{}]},template:{}},posterTemplateName:'벽보형 샘플 G',wallScheduleOverflow:true};
 const item={monthCount:6,wallCalendarSettings:{schedulePlacement:'cells',scheduleDisplayMode:'text'}};
 assert.match(render({...props,item}),/role="alert">일정이 많아 일부 일정이 제대로 표시되지 않았습니다. 글자 크기나 줄 높이를 줄여 주세요./);
 assert.match(render({...props,item:{...item,wallCalendarSettings:{...item.wallCalendarSettings,scheduleDisplayMode:'bar'}}}),/‘텍스트만’으로 바꿔 주세요/);
 assert.doesNotMatch(render({...props,item,wallScheduleOverflow:false}),/wall-schedule-warning/);
 assert.match(render({...props,posterTemplateName:'벽보형 샘플 E',item:{monthCount:12,wallCalendarSettings:{schedulePlacement:'list'}}}),/글자 크기나 자간을 줄이거나 목록 단수를 조정해 주세요/);
});


test('photo frames show a separate style card after fitting and use the shared color palette',()=>{
 const html=render({selection:{label:'프레임',type:'image-frame',rights:{imageFit:true,frameStyle:true}},item:{frameType:'circle',style:{background:false,shadowColor:'transparent'}},onFrameStyle:noop});
 assert.ok(html.indexOf('<h3>사진 맞춤')<html.indexOf('<h3>프레임 스타일'));
 for(const label of ['프레임 형태','배경색 없음','테두리 두께','부드러운 가장자리 크기','0pt는 효과 없음입니다.','그림자 없음'])assert.ok(html.includes(label),label);
 assert.match(html,/원형 사진/);
 assert.match(html,/popover="auto"/);
 assert.match(html,/배경색 없음 <input type="checkbox" checked/);
 assert.match(html,/그림자 없음 <input type="checkbox" checked/);
 assert.doesNotMatch(render({selection:{type:'image',rights:{replaceImage:true}},onFrameStyle:noop}),/<h3>프레임 스타일/);
});
