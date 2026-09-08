import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {buildImagePrompt,validateGenerationInput} from '../api/ai-design-generate.js';

function load(relative,name,context={}){context.window=context;vm.createContext(context);vm.runInContext(fs.readFileSync(new URL(relative,import.meta.url),'utf8'),context);return context[name]}

test('desk style catalog exposes seven template-editable styles and one flexible divider role',()=>{
 const context={},catalog=load('../apps/designer-studio/ai-design/design-type-catalog@0.3.0.js','ACDLDesignTypeCatalog',context),specApi=load('../apps/designer-studio/ai-design/design-spec@0.3.0.js','ACDLDesignSpec',context);
 assert.equal(catalog.scope,'desk-first');assert.equal(catalog.styles.length,7);assert.deepEqual(Object.keys(catalog.roles),['cover','annual','divider','month','month-back','back-cover']);
 assert.deepEqual(Object.keys(catalog.expressionOptions),['variationRhythm','monthBackPhoto','monthBackSeason']);
 const project={template:{settings:{}}},saved=specApi.write(project,{styleId:'modern-geometry',commonGuideline:'현재 템플릿 공통 지침',styleSnapshots:[{id:'modern-geometry',name:'학교 전용 모던',guidance:{divider:{description:'간지 설명',keywords:'unique edge',forbidden:'letters'}}}]},catalog);
 assert.equal(saved.styleSnapshots.find(item=>item.id==='modern-geometry').name,'학교 전용 모던');assert.equal(specApi.read(structuredClone(project),catalog).commonGuideline,'현재 템플릿 공통 지침');
});

test('actual divider pages become separate generation targets without a fixed 28-page assumption',()=>{
 const api=load('../apps/designer-studio/ai-design/ai-generation-context@0.2.0.js','ACDLAIGenerationContext'),pages=[{id:'cover',role:'cover-front'},{id:'insert-a',role:'front-insert-front',semanticPageRole:'school-symbols'},{id:'insert-b',role:'rear-insert-back',semanticPageRole:'divider'},{id:'month',role:'monthly-front'}],project={productType:{category:'desk'},template:{calendarTypeSnapshot:{definition:{id:'desk-standard',family:{id:'desk'},finishedSize:{width:260,height:180},productionSize:{width:266,height:186},binding:{edge:'top',method:'wire-o'}}},resources:{exportSettings:{bleed:3}}},book:{pageInstances:pages,elementsByPage:{'insert-a':[{role:'school-song'}],'insert-b':[{role:'history'}]}}};
 const context=api.build(project),divider=context.roles.find(item=>item.role==='divider');assert.equal(divider.targets.length,2);assert.deepEqual(divider.targets.map(item=>item.pageId),['insert-a','insert-b']);assert.equal(api.plan(context,{monthCount:12}).generationCount,15);
});

test('prompt prioritizes saved page guidance and the concrete divider instance',()=>{
 const designSpec={schemaVersion:'ai-design-spec.v2',version:'0.3.0',styleId:'modern-geometry',commonGuideline:'CURRENT TEMPLATE RULES FIRST',styleSnapshots:[{id:'modern-geometry',name:'학교 전용 모던',guidance:{divider:{description:'THIS DIVIDER DESCRIPTION',keywords:'unique quiet edge',forbidden:'busy center'}}}],pageTypes:{divider:'content-led'},pageInstance:{position:'rear',surface:'back',contentPurpose:'school-history',index:2,total:3},expression:{variationRhythm:'story',monthBackPhoto:'use',monthBackSeason:'subtle'},protectedContent:['school-text']};
 const input=validateGenerationInput({styleKey:'balanced',pageRole:'divider',request:{designSpec}}),prompt=buildImagePrompt(input);assert.equal(input.designSpec.pageInstance.index,2);assert.match(prompt,/CURRENT TEMPLATE RULES FIRST/);assert.match(prompt,/THIS DIVIDER DESCRIPTION/);assert.match(prompt,/unique quiet edge/);assert.match(prompt,/rear/);assert.match(prompt,/school-history/);assert.match(prompt,/Never rasterize editable content/);
});
