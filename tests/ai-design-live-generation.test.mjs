import { readStudioFeatureSource } from './studio-feature-source.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { buildImagePrompt, validateGenerationInput } from '../api/ai-design-generate.js';
const prompts=await import('../apps/designer-studio/ai-design/prompts/school-calendar-design@0.13.0.js');

test('live image prompt protects editable calendar and school data', () => {
  const input=validateGenerationInput({styleKey:'seasonal',palette:['#315e9e','#ffffff'],request:{conditions:{schoolLevel:'middle',decorationDensity:'low',photoMode:'mixed',seasonalVariation:'high',instruction:'봄 느낌을 유지'},versions:{promptSet:'school-calendar-prompt@0.1.0'}}});
  const prompt=buildImagePrompt(input);
  assert.match(prompt,/Never rasterize or invent school photos, logos, school data, calendar data/i);
  assert.match(prompt,/never invent or embed a school photo/i);
  assert.match(prompt,/#315e9e/);
  assert.match(prompt,/Page role: 표지/);
  assert.match(prompt,/actual protected coordinates are authoritative/i);
  assert.match(prompt,/editable year and title/i);
});

test('versioned prompt set defines a distinct contract for every representative page role', async () => {
  assert.equal(prompts.PROMPT_SET_ID,'school-calendar-design@0.13.0');
  assert.deepEqual(Object.keys(prompts.ROLE_PROMPTS),['cover','annual','divider','month','month-back','back-cover']);
  for(const pageRole of Object.keys(prompts.ROLE_PROMPTS)){
    const prompt=buildImagePrompt(validateGenerationInput({styleKey:'balanced',pageRole}));
    assert.match(prompt,/Never rasterize or invent school photos/i);
    assert.match(prompt,/Never rasterize or invent school photos/i);
    assert.match(prompt,/Do not draw binding, holes, crop marks/i);
    assert.match(prompt,new RegExp(`Page role: ${prompts.ROLE_PROMPTS[pageRole].label}`));
  }
});

test('prompt separates month-front and month-back visual modes',()=>{
  const designSpec={schemaVersion:'ai-design-spec.v2',version:'0.3.0',styleId:'campus-documentary',styleSnapshots:[{id:'campus-documentary',name:'Campus Documentary',guidance:{'month-back':{description:'real school photography first',keywords:'documentary markers',forbidden:'fake text'}}}],pageTypes:{'month-back':'photo-collage'},pageSettings:{monthBackMediaMode:'sample-replaceable'},expression:{monthFrontMode:'color-only',monthBackMode:'photo-editorial'},protectedContent:['calendar-data']};
  const prompt=buildImagePrompt(validateGenerationInput({styleKey:'balanced',pageRole:'month-back',request:{designSpec}}));
  assert.match(prompt,/Month-front visual mode: color-only/);
  assert.match(prompt,/Month-back visual mode: photo-editorial/);
  assert.match(prompt,/Month-back media: sample-replaceable/);
  assert.match(prompt,/replaceable sample-photo frames visually dominant/i);
  assert.match(prompt,/following components will be added later as editable objects|never create calendar data/i);
});

test('six design styles keep distinct non-negotiable signatures and a restrained front mode',()=>{
 const styleIds=['editorial-graphic','campus-documentary','modular-color-system','contemporary-illustration','digital-aura-motion','korean-modern-graphic'];
 const signatures=new Set(styleIds.map(styleId=>{const designSpec={schemaVersion:'ai-design-spec.v2',version:'0.3.0',styleId,styleSnapshots:[{id:styleId,name:styleId,guidance:{month:{}}}],pageTypes:{month:'calendar-led'},expression:{monthFrontMode:'color-only',monthBackMode:'auto-match'},protectedContent:['calendar-data']};const prompt=buildImagePrompt(validateGenerationInput({styleKey:'balanced',pageRole:'month',month:{year:2027,month:9,season:'autumn'},request:{designSpec}}));assert.match(prompt,/Non-negotiable style signature/);assert.match(prompt,/Month-front rule: Keep the month front almost plain/);assert.match(prompt,/Style-and-page direction/);return prompt.match(/Non-negotiable style signature: (.*?)\. Do not borrow/)?.[1]||prompt}));
 assert.equal(signatures.size,6);
});

test('new shape-system prompts reject old materials, fake photos, and repeated diagonals',()=>{const promptFor=styleId=>{const designSpec={schemaVersion:'ai-design-spec.v2',version:'0.3.0',styleId,styleSnapshots:[{id:styleId,name:styleId,guidance:{'month-back':{}}}],pageTypes:{'month-back':'photo-collage'},expression:{monthBackMode:'photo-editorial'},protectedContent:['school-photos']};return buildImagePrompt(validateGenerationInput({styleKey:'photo',pageRole:'month-back',month:{year:2028,month:5},request:{designSpec}}))};assert.match(promptFor('editorial-graphic'),/repeated diagonal template/i);assert.match(promptFor('campus-documentary'),/Never generate, reconstruct, or simulate a school photograph/i);assert.match(promptFor('korean-modern-graphic'),/no Hanji texture/i)});

test('month fronts vary one selected axis without forcing five simultaneous changes',()=>{
 const designSpec={schemaVersion:'ai-design-spec.v2',version:'0.3.0',styleId:'modular-color-system',styleSnapshots:[{id:'modular-color-system',name:'Modular Color System',guidance:{month:{}}}],pageTypes:{month:'calendar-led'},expression:{monthFrontMode:'color-only',monthBackMode:'auto-match'},protectedContent:['calendar-data']};
 const prompts=[3,4,5].map(month=>buildImagePrompt(validateGenerationInput({styleKey:'balanced',pageRole:'month',month:{year:2028,month,season:'spring'},request:{designSpec}})));
 assert.equal(new Set(prompts.map(prompt=>prompt.match(/Suggested palette step: (.*?)\./)?.[1])).size,3);
 prompts.forEach(prompt=>{assert.match(prompt,/Keep the month front almost plain/);assert.match(prompt,/Do not also vary composition, motif, scale, and decoration/)});
});

test('month front keeps the editable grid transparent over one continuous background',()=>{
 const designSpec={schemaVersion:'ai-design-spec.v2',version:'0.3.0',styleId:'editorial-graphic',styleSnapshots:[{id:'editorial-graphic',name:'Editorial Graphic',guidance:{month:{}}}],pageTypes:{month:'calendar-led'},expression:{monthFrontMode:'color-accent',monthBackMode:'auto-match'},protectedContent:['calendar-data']};
 const prompt=buildImagePrompt(validateGenerationInput({styleKey:'balanced',pageRole:'month',month:{year:2028,month:3},request:{designSpec}}));
 assert.match(prompt,/calendar object and its grid must remain transparent/i);
 assert.match(prompt,/continuous pale background pass underneath it/i);
 assert.match(prompt,/without creating a white rectangle, card, panel/i);
});

test('protected regions are bounded and become low-contrast readability zones',()=>{
 const input=validateGenerationInput({styleKey:'balanced',pageRole:'month',protectedRegions:[{role:'date-grid',x:-5,y:12.345,width:120,height:80},{role:'invalid',x:10,y:10,width:0,height:4}]});
 assert.deepEqual(input.protectedRegions,[{role:'date-grid',x:0,y:12.35,width:100,height:80}]);
 const prompt=buildImagePrompt(input);
 assert.match(prompt,/Protected readability zones including safety padding/);
 assert.match(prompt,/continue only low-contrast background color, soft atmosphere, broad tonal fields, or non-focal shapes/i);
 assert.match(prompt,/Do not leave visible rectangular cutouts/i);
});
test('month-back prompts enforce one cohesive series and geometry stays abstract',()=>{
 const monthBack=prompts.buildPrompt({pageRole:'month-back',palette:['#123456'],variantDirection:'cohesive',month:{year:2027,month:5},designSpec:{styleId:'modular-color-system',pageTypeId:'image-calendar',expression:{}},protectedRegions:[]});
 assert.match(monthBack,/one coherent series/);
 assert.match(monthBack,/match the artwork to the saved page type/);
 assert.match(monthBack,/replaceable sample-photo frames visually dominant/);
 assert.match(monthBack,/Lines, columns, and modules remain decorative background language only/);
 assert.match(monthBack,/Never rasterize a calendar grid/);
});

test('design spec selects role-specific composition guidance without rasterizing editable content',()=>{
  const designSpec={schemaVersion:'ai-design-spec.v2',version:'0.3.0',styleId:'modular-color-system',styleSnapshots:[{id:'modular-color-system',name:'Modular Color System',guidance:{month:{description:'modern geometry',keywords:'low-opacity geometric edge shapes',forbidden:'functional-looking regions'}}}],pageTypes:{month:'split-calendar-image'},expression:{monthFrontMode:'color-accent',monthBackMode:'auto-match'},protectedContent:['calendar-data','event-text']};
  const input=validateGenerationInput({styleKey:'balanced',pageRole:'month',request:{designSpec}}),prompt=buildImagePrompt(input);
  assert.equal(input.designSpec.pageTypeId,'split-calendar-image');
  assert.match(prompt,/editable composition is split-calendar-image/);
  assert.match(prompt,/vertical image field beside the calendar grid/);
  assert.match(prompt,/modern geometry/);
  assert.match(prompt,/Protected content contract: calendar-data, event-text/);
  assert.match(prompt,/Never rasterize or invent school photos/);
});

test('generation response preserves the role-specific design contract for comparison',()=>{
  const source=fs.readFileSync(new URL('../api/ai-design-generate.js',import.meta.url),'utf8');
  assert.match(source,/designContext:input\.designSpec/);
  assert.match(source,/styleId:input\.designSpec\.styleId/);
  assert.match(source,/pageTypeId:input\.designSpec\.pageTypeId/);
});

test('live generation input rejects unknown styles and long instructions', () => {
  assert.throws(()=>validateGenerationInput({styleKey:'unknown'}),/지원하지 않는/);
  assert.equal(validateGenerationInput({styleKey:'balanced',pageRole:'month'}).pageRole,'month');
  assert.throws(()=>validateGenerationInput({styleKey:'balanced',pageRole:'unknown'}),/페이지 역할/);
  assert.throws(()=>validateGenerationInput({styleKey:'balanced',request:{conditions:{instruction:'가'.repeat(501)}}}),/500자/);
});

test('cover variants retain distinct directions and selectable generation quality', () => {
  const centered=validateGenerationInput({styleKey:'balanced',variantIndex:0,quality:'low'});
  const asymmetric=validateGenerationInput({styleKey:'balanced',variantIndex:1,quality:'medium'});
  assert.equal(centered.variantDirection,'centered-photo');
  assert.equal(asymmetric.variantDirection,'asymmetric-photo');
  assert.equal(centered.quality,'low');
  assert.equal(asymmetric.quality,'medium');
});

test('browser client keeps the API key server-side and sends the admin token', async () => {
  const source=fs.readFileSync(new URL('../apps/designer-studio/ai-design-client.js',import.meta.url),'utf8');let call;
  const context={window:null,AbortController,setTimeout,clearTimeout,ACDLTemplateRemotePersistence:{accessToken:()=> 'admin-token'},fetch:async(url,options)=>{call={url,options};return {ok:true,json:async()=>({asset:{dataUrl:'data:image/webp;base64,AA=='}})}}};context.window=context;vm.createContext(context);vm.runInContext(source,context);
  await context.ACDLAIDesignClient.generate({styleKey:'balanced'});
  assert.equal(call.url,'/api/ai-design-generate');
  assert.equal(call.options.headers.Authorization,'Bearer admin-token');
  assert.doesNotMatch(source,/process\.env|sk-[a-z0-9]/i);
});

test('browser client stores a submitted key only through the authenticated config endpoint', async () => {
  const source=fs.readFileSync(new URL('../apps/designer-studio/ai-design-client.js',import.meta.url),'utf8');let call;
  const context={window:null,AbortController,setTimeout,clearTimeout,ACDLTemplateRemotePersistence:{accessToken:()=> 'admin-token'},fetch:async(url,options)=>{call={url,options};return {ok:true,json:async()=>({configured:true,storage:'supabase-vault'})}}};context.window=context;vm.createContext(context);vm.runInContext(source,context);
  await context.ACDLAIDesignClient.saveApiKey('sk-private-test-value');
  assert.equal(call.url,'/api/ai-design-config');
  assert.equal(call.options.method,'PUT');
  assert.equal(call.options.headers.Authorization,'Bearer admin-token');
  assert.deepEqual(JSON.parse(call.options.body),{apiKey:'sk-private-test-value'});
  assert.doesNotMatch(source,/localStorage|sessionStorage|indexedDB/);
});

const studioSource=fs.readFileSync(new URL('../apps/designer-studio/index.html',import.meta.url),'utf8')+readStudioFeatureSource();

test('generation endpoint reads the OpenAI key from Supabase Vault', () => {
  const source=fs.readFileSync(new URL('../api/ai-design-generate.js',import.meta.url),'utf8');
  assert.match(source,/readOpenAIKey/);
  assert.doesNotMatch(source,/process\.env\.OPENAI_API_KEY/);
});

test('dynamic Vault save control uses delegated click and a request timeout', () => {
  const html=studioSource;
  const client=fs.readFileSync(new URL('../apps/designer-studio/ai-design-client.js',import.meta.url),'utf8');
  assert.match(html,/closest\?\.\("#saveAIDesignOpenAIKeyBtn"\)/);
  assert.match(html,/e\.key==="Enter"&&e\.target\?\.id==="aiDesignOpenAIKey"/);
  assert.match(client,/controller\.abort\(\),timeoutMs/);
  assert.match(client,/JSON\.stringify\(input\),signal:options\.signal\},70000/);
  assert.match(client,/AIGenerationCancelledError/);
  assert.match(client,/연결 확인 시간이 초과됐습니다/);
});

test('AI generation controls render independently from the Vault connection controls', () => {
  const html=studioSource;
  assert.match(html,/실제 AI 대표 디자인 생성/);
  assert.match(html,/앞 단계 디자인 스타일/);
  assert.match(html,/단정한 균형형/);
  assert.match(html,/사계절 연결형/);
  assert.match(html,/사진 중심 브랜드형/);
  assert.match(html,/학생 친화 포인트형/);
  assert.match(html,/closest\?\.\("#generateLiveAIDesignBtn"\)/);
  assert.match(html,/if\(!el\("aiDesignOpenAIKey"\)\)/);
  assert.match(html,/if\(!el\("generateLiveAIDesignBtn"\)\)/);
  assert.match(html,/function escapeHtml\(value\)\{return v21Escape\(value\)\}/);
  assert.match(html,/대표 디자인 1개 생성/);
  assert.match(html,/count=1/);
  assert.match(html,/for\(let variantIndex=0;variantIndex<count;variantIndex\+=1\)/);
  assert.match(html,/for\(const pageRole of roles\)/);
  assert.match(html,/pageRole,variantIndex/);
  assert.match(html,/assetsByRole/);
  assert.match(html,/id="aiDesignLiveQuality"/);
  assert.match(html,/applyAICoverLayout/);
  assert.match(html,/layoutApplied/);
  assert.match(html,/const AI_DESIGN_ROLE_MAP=\{cover:\["cover-front"\],annual:\["cover-back","poster-annual"\],divider:/);
  assert.doesNotMatch(html,/item\.pagePlans\.filter\(plan=>\['cover','month','month-back'\]/);
  assert.match(html,/item\.pagePlans\.map\(plan=>aiPagePreviewMarkup\(item,plan\)\)/);
  assert.match(html,/실제 AI 생성 자산 · \$\{item\.pagePlans\.length\}개 역할 완성/);
  assert.match(html,/designStyleId:designContext\.styleId/);
  assert.match(html,/pageTypeId:designContext\.pageTypeId/);
  assert.match(html,/metadata\.promptVersion/);
});

test('one live AI result opens automatically and waits for explicit selection', () => {
  const html=studioSource;
  assert.match(html,/aiDesignGenerationState="idle"/);
  assert.match(html,/aiDesignResultsRevealed=false/);
  assert.match(html,/aiDesignGenerationState!=="complete"\|\|!aiDesignMockSession\|\|!aiDesignResultsRevealed/);
  assert.match(html,/sampleActions\.classList\.add\("hidden"\)/);
  assert.match(html,/class="ai-live-progress" role="status" aria-live="polite"/);
  assert.match(html,/대표 페이지 \$\{current\}\/\$\{total\} 생성 중/);
  assert.match(html,/aiDesignGenerationState="complete";aiDesignResultsRevealed=true/);
  assert.match(html,/선택하기/);
  assert.match(html,/대표 디자인 생성 완료 · 선택 대기/);
  assert.match(html,/대표 디자인 다시 생성하기/);
  assert.match(html,/function regenerateRepresentativeAIDesign\(\)/);
  assert.match(html,/aiDesignGenerationState="failed"/);
});

test('AI setup is initialized from the saved design type specification',()=>{
  const html=studioSource;
  const css=fs.readFileSync(new URL('../apps/designer-studio/designer-studio-core.css',import.meta.url),'utf8')+fs.readFileSync(new URL('../apps/designer-studio/designer-studio-overrides.css',import.meta.url),'utf8');
  assert.match(html,/function initializeAIDesignFromDesignSpec\(\)/);
  assert.match(html,/aiDesignInputSignature!==signature/);
  assert.match(html,/aiDesignGenerationState="idle"/);
  assert.match(html,/aiDesignDecorationDensity:"low"/);
  assert.match(html,/illustration=spec\.pageTypes\?\.\['month-back'\]===/);
  assert.match(html,/aiDesignPhotoMode:illustration\?/);
  assert.match(html,/aiDesignSeasonalVariation:"low"/);
  assert.match(html,/대표 디자인 미리보기/);
  assert.match(css,/\.ai-design-proposal-grid\{grid-template-columns:minmax\(0,1fr\)\}/);
  assert.match(css,/\.ai-page-preview\{position:relative;height:190px/);
  assert.match(html,/function renderGeneratedAIDesignPreviews\(\)/);
  assert.doesNotMatch(html,/class="ai-preview-title"/);
  assert.doesNotMatch(html,/class="ai-preview-grid"/);
  assert.doesNotMatch(html,/다시 설정하기/);
});

test('the selected representative set expands to eleven remaining monthly front and back assets', () => {
  const html=studioSource;
  assert.match(html,/monthlyVariations:structuredClone\(sessionVariant\.monthlyVariations\|\|prepared\.designSet\?\.monthlyVariations\|\|\[\]\)/);
  assert.match(html,/function expandSelectedAIDesignMonths\(signal=null\)/);
  assert.match(html,/total=variations\.length\*monthlyRoles\.length/);
  assert.match(html,/generatedMonthCount\*monthlyRoles\.length/);
  assert.match(html,/월별 디자인 자산 \$\{current\}\/\$\{total\} 생성 중/);
  assert.doesNotMatch(html,/월력 전체 생성 \$\{current\}\/\$\{total\}/);
  assert.match(html,/const pending=variations\.filter\(item=>monthlyRoles\.some\(role=>!selected\.monthlyAssets\?\.\[item\.key\]\?\.\[role\]\)\)/);
  assert.match(html,/generatedMonthCount!==variations\.length/);
  assert.match(html,/function aiMonthlyAssetCoverage\(selected=selectedAIDesignVariant\(\)\)/);
  assert.match(html,/coverage\.complete===coverage\.expected/);
  assert.match(html,/Promise\.all\(monthlyRoles/);
  assert.match(html,/ai-design-monthly-expansion\.v1/);
  assert.match(html,/월력 전체 생성/);
  assert.match(html,/aiMonthlyExpansionState="generating"/);
  assert.match(html,/function generateAllAIDesignMonths\(\)/);
  assert.match(html,/function startTemplateEditorAfterGeneration\(\)/);
  assert.match(html,/newTemplateEnterEditorBtn"\)\.addEventListener\("click",startTemplateEditorAfterGeneration\)/);
  assert.doesNotMatch(html,/async function startTemplateEditorAfterGeneration\(\)[\s\S]*?await expandSelectedAIDesignMonths\(\)/);
  assert.match(html,/selected\.monthlyAssets\?all/);
  assert.match(html,/monthlyAppliedPages/);
  assert.match(html,/const AI_MONTH_BACK_SAMPLE_PHOTOS=Object\.freeze\(\[/);
  assert.match(html,/"calendar\.monthlyImages\.current"/);
  assert.match(html,/sampleFallback:true/);
  assert.match(html,/protectedCalendarClearArea:true/);
  assert.match(html,/pages=selected\.monthlyAssets\?all/);
  assert.match(html,/ACDLDesignSetExpansion\.createReport\(project,selected\)/);
  assert.match(html,/setExpansion\.status!=="complete"/);
  assert.match(html,/designSpecVersion:metadata\.designSpecVersion/);
});

test('AI generation UI follows the enabled role and monthly role contract',()=>{
  const html=studioSource;
  assert.doesNotMatch(html,/6개 대표 페이지/);
  assert.doesNotMatch(html,/실제 페이지 6개/);
  assert.match(html,/context\.monthlyRoles\.includes\("month-back"\)/);
  assert.match(html,/monthBack\.classList\.toggle\("hidden",!hasMonthBack\)/);
  assert.match(html,/section\.classList\.toggle\("hidden",!plan\.monthlyRoles\.length\)/);
  assert.match(html,/대표 디자인을 생성하면 \$\{plan\.representativeCount\}개 대표 페이지/);
  assert.match(html,/plan\.monthlyAssetCount/);
  assert.match(html,/aiCostText\(plan\)/);
  assert.match(html,/const primaryRole=roles\[0\]/);
});
