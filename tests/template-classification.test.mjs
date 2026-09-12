import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

function api(records=[]){const window={ACDLTemplateCatalog:{records:()=>records}};const document={getElementById(){return null},createElement(){return {}}};vm.runInNewContext(fs.readFileSync(new URL('../apps/designer-studio/template-classification.js',import.meta.url),'utf8'),{window,document});return window.ACDLTemplateClassification}

test('classification generates a stable administrator identity',()=>{const value=api().identity({productType:'desk',size:{width:260,height:180},sizeLabel:'260×180',compositionType:'monthly-photo',designStyle:'campus-documentary'});assert.equal(value.managementName,'탁상형 260×180 · 월별 사진 · 캠퍼스 다큐멘터리 · 01');assert.equal(value.packageId,'desk-260x180-monthly-photo-campus-documentary-01')});

test('classification stores a quick-order input contract without renaming a working draft',()=>{const classification=api(),project={productType:{category:'desk',pageSize:{width:260,height:180}},template:{settings:{aiDesignSpec:{styleId:'editorial-graphic'}},metadata:{name:'검토 중 작업본'}},book:{pageInstances:[{role:'cover-front'},...Array.from({length:12},()=>({role:'monthly-front'})),{role:'back-cover-front'}]}};classification.ensure(project,{compositionType:'basic'});assert.equal(project.template.classification.compositionType,'basic');assert.equal(project.template.userInput.recommendedFlow,'quick-order');assert.ok(project.template.userInput.userServiceCapabilities.includes('add-image'));assert.equal(project.template.metadata.name,'검토 중 작업본');classification.ensure(project,{}, {finalize:true});assert.equal(project.template.metadata.name,'탁상형 260×180 · 기본 구성 · 에디토리얼 그래픽 · 01')});

test('monthly photo classification requires twelve month backs',()=>{const classification=api(),project={productType:{category:'desk',pageSize:{width:260,height:180}},template:{metadata:{}},book:{pageInstances:[]}};classification.ensure(project,{compositionType:'monthly-photo'});const result=classification.validate(project);assert.equal(result.valid,false);assert.ok(result.errors.includes('월별 사진 구성에는 월력 뒷면 12개가 필요합니다.'))});

test('a second template with the same classification receives the next sequence',()=>{const classification=api([{classification:{productType:'desk',sizeCode:'260x180',compositionType:'basic',designStyle:'editorial-graphic',templateSequence:'01'}}]);assert.equal(classification.nextSequence({productType:'desk',size:{width:260,height:180},compositionType:'basic',designStyle:'editorial-graphic'}),'02')});
