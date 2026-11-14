import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';
import {wallStylePatch,wallStyleName} from '../src/lib/editor/session.ts';
import {applyFieldDrafts,fieldChanged} from '../src/lib/editor/card-state.ts';
const require=createRequire(new URL('../src/features/editor/object-tools.tsx',import.meta.url));
const React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
function component(url){const js=ts.transpileModule(readFileSync(url,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText,module={exports:{}};new Function('require','module','exports',js)(name=>name==='@/lib/editor/session'?{wallStylePatch,wallStyleName}:name==='@/lib/editor/card-state'?{applyFieldDrafts,fieldChanged}:name==='@/components/ui/button'?component(new URL('../src/components/ui/button.tsx',import.meta.url)):require(name),module,module.exports);return module.exports;}
const {ObjectTools,TextFormattingToolbar}=component(new URL('../src/features/editor/object-tools.tsx',import.meta.url));
const noop=()=>{},props={selection:null,item:undefined,fields:[],school:{values:{},hidden:[]},fit:{fit:'contain',scale:1,offsetX:0,offsetY:0},hasEditableTargets:false,schoolImageLinked:false,sharing:{layout:false,image:false,layoutCount:0,imageCount:0,poster:false},canReset:false,onFieldChange:noop,onFieldHide:noop,onStyle:noop,onFit:noop,onShare:noop,onReset:noop};
const render=p=>renderToStaticMarkup(React.createElement(ObjectTools,{...props,...p}));
test('tools distinguish a page with no editable objects from a page awaiting selection',()=>{
 const empty=render({});assert.match(empty,/<h2>편집 도구<\/h2>/);assert.match(empty,/이 페이지에는 수정할 수 있는 개체가 없습니다/);assert.doesNotMatch(empty,/개체를 선택/);assert.match(render({hasEditableTargets:true}),/편집할 개체를 선택해 주세요/);
});
test('text visibility is positive and restored from saved hidden state; numeric geometry controls are absent',()=>{
 const selection={label:'학교 슬로건',type:'text',binding:'school.slogan',rights:{content:true,textStyle:true,move:true,resize:true}},fields=[{key:'slogan',binding:'school.slogan',label:'학교 슬로건',allowHide:true,maxLength:200}],base={selection,fields,item:{content:'기본 문구',style:{fontSize:17}},school:{values:{slogan:'저장한 문구'},hidden:[]}};
 const visible=render(base);assert.match(visible,/aria-label="학교 슬로건 표시" checked/);assert.match(visible,/value="저장한 문구"/);assert.doesNotMatch(visible,/표시하지 않음|가로 위치 \(%\)|세로 위치 \(%\)/);
 const hidden=render({...base,school:{...base.school,hidden:['slogan']}});assert.doesNotMatch(hidden,/aria-label="학교 슬로건 표시" checked/);assert.match(hidden,/disabled=""/);
 const toolbar=renderToStaticMarkup(React.createElement(TextFormattingToolbar,{style:{fontWeight:700,fontStyle:'italic',textDecoration:'underline'},onChange:noop}));assert.equal((toolbar.match(/aria-pressed="true"/g)||[]).length,4);assert.match(toolbar,/aria-label="밑줄"/);
});
test('image controls share compact layout with independent poster copy scopes and retained fitting sliders',()=>{
 const html=render({selection:{label:'학교 전경',type:'image-frame',binding:'',rights:{replaceImage:true,imageFit:true,move:true,resize:true}},hasEditableTargets:true,sharing:{layout:false,image:false,layoutCount:1,imageCount:1,poster:true}});
 assert.match(html,/다른 페이지의 같은 개체에 위치·크기 적용/);assert.match(html,/다른 페이지의 같은 개체에 이미지 적용/);assert.equal((html.match(/type="checkbox"/g)||[]).length,2);assert.equal((html.match(/type="range"/g)||[]).length,3);assert.doesNotMatch(html,/보여줄 방법|위치와 크기|<h3>사진 교체/);assert.match(html,/aria-label="사진 맞춤"/);
});

test('content inputs and unchanged save action share one card, with a separate style card',()=>{const html=render({selection:{label:'학교 이름',type:'text',binding:'school.name',rights:{content:true,textStyle:true}},fields:[{key:'name',binding:'school.name',label:'학교명',maxLength:200}],school:{values:{name:'학교'},hidden:[]}});assert.match(html,/editor-tool-card editor-text-content/);assert.match(html,/button-secondary editor-card-apply[\s\S]*?disabled/);assert.match(html,/editor-tool-card editor-compact-style/);assert.match(html,/<h3>글자 모양/);});

test('wall tools expose presets and list columns without physical typography or month binding controls',()=>{const html=render({selection:{label:'전체 월력',type:'year-calendar',rights:{calendarStyle:true}},item:{wallCalendarSettings:{gridStyle:'boxed',schedulePlacement:'cells',referencePlacement:'cells',titleStyle:'band',dateAlign:'left'}}});assert.match(html,/일정형 · 날짜 칸에 표시/);assert.match(html,/value="schedule" selected/);assert.match(html,/자동 · 2단\/3단/);assert.match(html,/학교 일정 \/ 공휴일·기념일/);assert.doesNotMatch(html,/type="number"/);});
