import { readStudioFeatureSource } from './studio-feature-source.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { buildImagePrompt, validateGenerationInput } from '../api/ai-design-generate.js';
const prompts=await import('../apps/designer-studio/ai-design/prompts/school-calendar-design@0.15.0.js');

test('live image prompt protects editable calendar and school data', () => {
  const input=validateGenerationInput({styleKey:'seasonal',palette:['#315e9e','#ffffff'],request:{conditions:{schoolLevel:'middle',decorationDensity:'low',photoMode:'mixed',seasonalVariation:'high',instruction:'봄 느낌을 유지'},versions:{promptSet:'school-calendar-prompt@0.1.0'}}});
  const prompt=buildImagePrompt(input);
  assert.match(prompt,/Never rasterize or invent school photos, logos, school data, calendar data/i);
  assert.match(prompt,/never invent or embed a school photo/i);
  assert.match(prompt,/#315e9e/);
  assert.match(prompt,/Page role: 표지/);
  assert.match(prompt,/Actual protected coordinates override every visual request/i);
  assert.match(prompt,/one text-free, non-functional print background/i);
});

test('versioned prompt set defines a distinct contract for every representative page role', async () => {
  assert.equal(prompts.PROMPT_SET_ID,'school-calendar-design@0.15.3');
  assert.deepEqual(Object.keys(prompts.ROLE_PROMPTS),['cover','annual','divider','month','month-back','back-cover']);
  for(const pageRole of Object.keys(prompts.ROLE_PROMPTS)){
    const prompt=buildImagePrompt(validateGenerationInput({styleKey:'balanced',pageRole}));
    assert.match(prompt,/Never rasterize or invent school photos/i);
    assert.match(prompt,/Never rasterize or invent school photos/i);
    assert.match(prompt,/Do not draw binding, holes, crop marks/i);
    assert.match(prompt,new RegExp(`Page role: ${prompts.ROLE_PROMPTS[pageRole].label}`));
  }
});

test('every AI background forbids people and generated school environments regardless of school level',()=>{
  for(const schoolLevel of ['all','elementary','middle','high'])for(const pageRole of Object.keys(prompts.ROLE_PROMPTS)){
    const prompt=buildImagePrompt(validateGenerationInput({styleKey:'balanced',pageRole,request:{conditions:{schoolLevel}}}));
    assert.match(prompt,/Never generate people of any age, students, teachers, crowds, human silhouettes, faces, hands, body parts/i);
    assert.match(prompt,/school buildings, campus buildings, classrooms, or identifiable school grounds/i);
    assert.match(prompt,/separate editable assets/i);
  }
});

test('prompt separates month-front and month-back visual modes',()=>{
  const designSpec={schemaVersion:'ai-design-spec.v2',version:'0.3.0',styleId:'campus-documentary',styleSnapshots:[{id:'campus-documentary',name:'Campus Documentary',guidance:{'month-back':{description:'real school photography first',keywords:'documentary markers',forbidden:'fake text'}}}],pageTypes:{'month-back':'photo-collage'},pageSettings:{monthBackMediaMode:'sample-replaceable'},expression:{monthFrontMode:'color-only',monthBackMode:'photo-editorial'},protectedContent:['calendar-data']};
  const prompt=buildImagePrompt(validateGenerationInput({styleKey:'balanced',pageRole:'month-back',request:{designSpec}}));
  assert.match(prompt,/month-front mode color-only/);
  assert.match(prompt,/month-back mode photo-editorial/);
  assert.match(prompt,/photo media sample-replaceable/);
  assert.match(prompt,/real replaceable or school photographs stay dominant/i);
  assert.match(prompt,/Protected editable content: calendar-data/i);
});

test('six design styles keep distinct non-negotiable signatures and a restrained front mode',()=>{
 const styleIds=['editorial-graphic','campus-documentary','modular-color-system','contemporary-illustration','digital-aura-motion','korean-modern-graphic'];
 const signatures=new Set(styleIds.map(styleId=>{const designSpec={schemaVersion:'ai-design-spec.v2',version:'0.3.0',styleId,styleSnapshots:[{id:styleId,name:styleId,guidance:{month:{}}}],pageTypes:{month:'calendar-led'},expression:{monthFrontMode:'color-only',monthBackMode:'auto-match'},protectedContent:['calendar-data']};const prompt=buildImagePrompt(validateGenerationInput({styleKey:'balanced',pageRole:'month',month:{year:2027,month:9,season:'autumn'},request:{designSpec}}));assert.match(prompt,/Required style signature/);assert.match(prompt,/Keep the month front almost plain/);assert.match(prompt,/Apply this style to this page/);return prompt.match(/Required style signature: (.*?)\. Apply this style/)?.[1]||prompt}));
 assert.equal(signatures.size,6);
});

test('new shape-system prompts reject old materials, fake photos, and repeated diagonals',()=>{const promptFor=styleId=>{const designSpec={schemaVersion:'ai-design-spec.v2',version:'0.3.0',styleId,styleSnapshots:[{id:styleId,name:styleId,guidance:{'month-back':{}}}],pageTypes:{'month-back':'photo-collage'},expression:{monthBackMode:'photo-editorial'},protectedContent:['school-photos']};return buildImagePrompt(validateGenerationInput({styleKey:'photo',pageRole:'month-back',month:{year:2028,month:5},request:{designSpec}}))};assert.match(promptFor('editorial-graphic'),/repeated diagonal template/i);const campus=promptFor('campus-documentary');assert.match(campus,/Never generate, reconstruct, or simulate a school photograph/i);assert.match(campus,/No visible paper, paint, watercolor, brushwork, grain/i);assert.match(campus,/Do not generate pencils, pens, notebooks/i);assert.match(campus,/never repeat one identical top rule-and-dot template/i);assert.match(promptFor('korean-modern-graphic'),/no Hanji texture/i)});

test('month fronts vary one selected axis without forcing five simultaneous changes',()=>{
 const designSpec={schemaVersion:'ai-design-spec.v2',version:'0.3.0',styleId:'modular-color-system',styleSnapshots:[{id:'modular-color-system',name:'Modular Color System',guidance:{month:{}}}],pageTypes:{month:'calendar-led'},expression:{monthFrontMode:'color-only',monthBackMode:'auto-match'},protectedContent:['calendar-data']};
 const prompts=[3,4,5].map(month=>buildImagePrompt(validateGenerationInput({styleKey:'balanced',pageRole:'month',month:{year:2028,month,season:'spring'},request:{designSpec}})));
 assert.equal(new Set(prompts.map(prompt=>prompt.match(/Suggested palette step: (.*?)\./)?.[1])).size,3);
 prompts.forEach(prompt=>{assert.match(prompt,/Keep the month front almost plain/);assert.match(prompt,/Do not also vary composition, motif, scale, and decoration/)});
});

test('month front respects the selected editable calendar treatment without assuming transparency',()=>{
 const designSpec={schemaVersion:'ai-design-spec.v2',version:'0.3.0',styleId:'editorial-graphic',styleSnapshots:[{id:'editorial-graphic',name:'Editorial Graphic',guidance:{month:{}}}],pageTypes:{month:'calendar-led'},expression:{monthFrontMode:'color-accent',monthBackMode:'auto-match'},protectedContent:['calendar-data']};
 const prompt=buildImagePrompt(validateGenerationInput({styleKey:'balanced',pageRole:'month',month:{year:2028,month:3},request:{designSpec}}));
 assert.match(prompt,/never assume, draw, or imitate its grid, cells, rules, panels, or background/i);
 assert.match(prompt,/respect the actual editable calendar treatment/i);
 assert.doesNotMatch(prompt,/must remain transparent/i);
 assert.match(prompt,/Do not leave visible rectangular cutouts, cards/i);
});

test('system composition keeps the active monthly rule and the shared commercial direction',()=>{
 const base={schemaVersion:'ai-design-spec.v2',version:'0.3.0',styleId:'editorial-graphic',styleSnapshots:[{id:'editorial-graphic',name:'Editorial Graphic',guidance:{month:{description:'editorial month'},'month-back':{description:'editorial back'}}}],pageSettings:{monthBackMediaMode:'sample-replaceable'},protectedContent:['calendar-data']};
 const front=buildImagePrompt(validateGenerationInput({styleKey:'balanced',pageRole:'month',month:{year:2028,month:4,season:'spring'},request:{designSpec:{...base,commonGuideline:'USER COMMON THEME',pageTypes:{month:'calendar-led'},expression:{monthFrontMode:'color-only',monthBackMode:'auto-match'}}}}));
 assert.match(front,/page-role-composition@0\.1\.0/);
 assert.match(front,/exactly one selected variation mode/);
 assert.match(front,/Do not use flowers, leaves, trees, or seasonal nature as an automatic filler/);
 assert.match(front,/USER COMMON THEME/);
 assert.doesNotMatch(front,/Suggested subject vocabulary/);
 const back=buildImagePrompt(validateGenerationInput({styleKey:'balanced',pageRole:'month-back',month:{year:2028,month:4,season:'spring'},request:{designSpec:{...base,pageTypes:{'month-back':'image-calendar'},expression:{monthFrontMode:'color-only',monthBackMode:'photo-minimal'}}}}));
 assert.match(back,/Do not create a full scene behind the components/);
 assert.doesNotMatch(back,/Suggested subject vocabulary/);
 const illustrated=buildImagePrompt(validateGenerationInput({styleKey:'balanced',pageRole:'month-back',month:{year:2028,month:4,season:'spring'},request:{designSpec:{...base,pageSettings:{monthBackMediaMode:'template-design'},pageTypes:{'month-back':'illustration-led'},expression:{monthFrontMode:'color-only',monthBackMode:'illustration-series'}}}}));
 assert.match(illustrated,/only as optional inspiration rather than a required monthly theme/);
});

test('generation prompt applies shared, style-wide, and actual-page rules from design type settings',()=>{
 const designSpec={schemaVersion:'ai-design-spec.v2',version:'0.3.0',styleId:'editorial-graphic',commonGuideline:'COMMERCIAL SET RULE',commonForbidden:'NO COMMON PROP',styleSnapshots:[{id:'editorial-graphic',name:'Editorial Graphic',forbidden:'NO STYLE TEXTURE',guidance:{divider:{description:'fallback divider'}},pageGuidance:{'page:divider-2':{description:'ACTUAL ACADEMIC SCHEDULE PAGE',keywords:'MONTH GROUP RHYTHM',forbidden:'NO DECORATION IN SCHEDULE'}}}],pageTypes:{divider:'content-led'},pageInstance:{pageId:'divider-2',sourceRole:'front-insert-back',contentPurpose:'academic-schedule',compositionType:'academic-schedule',layoutId:'schedule-month-cards',objects:['title','schedule-list']},expression:{monthFrontMode:'color-accent',monthBackMode:'auto-match'},protectedContent:['event-text']};
 const prompt=buildImagePrompt(validateGenerationInput({styleKey:'balanced',pageRole:'divider',request:{designSpec}}));
 assert.match(prompt,/COMMERCIAL SET RULE/);assert.match(prompt,/NO COMMON PROP/);assert.match(prompt,/NO STYLE TEXTURE/);assert.match(prompt,/ACTUAL ACADEMIC SCHEDULE PAGE/);assert.match(prompt,/MONTH GROUP RHYTHM/);assert.match(prompt,/NO DECORATION IN SCHEDULE/);assert.match(prompt,/twelve independent month-and-event groups/);assert.match(prompt,/editable page title/);assert.match(prompt,/multi-line event information/);
});

test('month generation protects the structural calendar master in addition to editable objects',()=>{
 const runtime=fs.readFileSync(new URL('../apps/designer-studio/features/ai-design-runtime.js',import.meta.url),'utf8');
 assert.match(runtime,/role:"monthly-calendar-master",\.\.\.calendarRegion\(\)/);
 assert.match(runtime,/\[\.\.\.structural,\.\.\.elements\.filter/);
});

test('protected regions are bounded and become low-contrast readability zones',()=>{
 const input=validateGenerationInput({styleKey:'balanced',pageRole:'month',protectedRegions:[{role:'date-grid',objectType:'calendar-information',importance:'critical',protection:'strict',readability:'essential',overlapPolicy:'low-contrast-background-only',footprint:'dominant',shape:'rectangle',areaPercent:80,safetyPadding:2.5,x:-5,y:12.345,width:120,height:80},{role:'invalid',x:10,y:10,width:0,height:4}]});
 assert.deepEqual(input.protectedRegions,[{role:'date-grid',objectType:'calendar-information',importance:'critical',protection:'strict',readability:'essential',overlapPolicy:'low-contrast-background-only',footprint:'dominant',shape:'rectangle',areaPercent:80,safetyPadding:2.5,planned:false,x:0,y:12.35,width:100,height:80}]);
 const prompt=buildImagePrompt(input);
 assert.match(prompt,/Editable object composition contract/);
 assert.match(prompt,/type=calendar-information, importance=critical/);
 assert.match(prompt,/main composition anchors are date-grid/i);
 assert.match(prompt,/Strict zones permit only continuous low-contrast background/i);
 assert.match(prompt,/Never turn any coordinates into visible cutouts/i);
});

test('editor derives object-specific spatial semantics before requesting an image',()=>{
 const runtime=fs.readFileSync(new URL('../apps/designer-studio/features/ai-design-runtime.js',import.meta.url),'utf8');
 assert.match(runtime,/function aiObjectSpatialTraits\(item\)/);
 assert.match(runtime,/objectType:calendar\?"calendar-information":planner\?"planner-functional"/);
 assert.match(runtime,/importance,protection,readability,overlapPolicy/);
 assert.match(runtime,/areaPercent:Number\(area\.toFixed\(2\)\)/);
 assert.match(runtime,/footprint:area>=45\?"dominant"/);
 assert.match(runtime,/function aiPlannedMonthBackRegions\(variant\)/);
 assert.match(runtime,/pageRole==="month-back"\?aiPlannedMonthBackRegions\(sessionVariant\):\[\]/);
 assert.match(runtime,/aiProtectedRegions\(pageRole,pageId,planned\)/);
});
test('month-back prompts enforce one cohesive series and geometry stays abstract',()=>{
 const monthBack=prompts.buildPrompt({pageRole:'month-back',palette:['#123456'],variantDirection:'cohesive',month:{year:2027,month:5},designSpec:{styleId:'modular-color-system',pageTypeId:'image-calendar',expression:{}},protectedRegions:[]});
 assert.match(monthBack,/one coherent series/);
 assert.match(monthBack,/adapting the artwork to this saved page composition/);
 assert.match(monthBack,/one replaceable sample-photo frame beside one editable calendar/);
 assert.match(monthBack,/Lines, columns, and modules remain decorative background language only/);
 assert.match(monthBack,/Never rasterize a calendar grid/);
});

test('design spec selects role-specific composition guidance without rasterizing editable content',()=>{
  const designSpec={schemaVersion:'ai-design-spec.v2',version:'0.3.0',styleId:'modular-color-system',styleSnapshots:[{id:'modular-color-system',name:'Modular Color System',guidance:{month:{description:'modern geometry',keywords:'low-opacity geometric edge shapes',forbidden:'functional-looking regions'}}}],pageTypes:{month:'split-calendar-image'},expression:{monthFrontMode:'color-accent',monthBackMode:'auto-match'},protectedContent:['calendar-data','event-text']};
  const input=validateGenerationInput({styleKey:'balanced',pageRole:'month',request:{designSpec}}),prompt=buildImagePrompt(input);
  assert.equal(input.designSpec.pageTypeId,'split-calendar-image');
  assert.match(prompt,/vertical image field beside the calendar grid/);
  assert.match(prompt,/modern geometry/);
  assert.match(prompt,/Protected editable content: calendar-data, event-text/);
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
  assert.match(client,/JSON\.stringify\(input\),signal:options\.signal\},175000/);
  assert.match(client,/!\[502,503,504\]\.includes\(error\?\.status\)/);
  assert.match(client,/AIGenerationCancelledError/);
  assert.match(client,/연결 확인 시간이 초과됐습니다/);
});

test('editor entry loads the current AI client, expansion, and runtime cache versions',()=>{
  assert.match(studioSource,/ai-design-client\.js\?v=20260912\.2/);
  assert.match(studioSource,/design-set-expansion@0\.2\.0\.js\?v=20260912\.3/);
  assert.match(studioSource,/features\/ai-design-runtime\.js\?v=20260912\.3/);
});

test('AI image generation allows production latency and reports timeouts explicitly',()=>{
  const endpoint=fs.readFileSync(new URL('../api/ai-design-generate.js',import.meta.url),'utf8');
  const vercel=JSON.parse(fs.readFileSync(new URL('../vercel.json',import.meta.url),'utf8'));
  assert.match(endpoint,/AbortSignal\.timeout\(150000\)/);
  assert.match(endpoint,/AI_IMAGE_TIMEOUT/);
  assert.equal(vercel.functions['api/ai-design-generate.js'].maxDuration,180);
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
  assert.match(html,/previewPlans\.map\(target=>aiPagePreviewMarkup\(item,target\)\)/);
  assert.match(html,/실제 AI 생성 자산 · \$\{previewPlans\.length\}개 면 완성/);
  assert.match(html,/variant\.assetsByPage\?\.\[reference\.id\]/);
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
  assert.match(html,/Promise\.allSettled\(monthlyRoles/);
  assert.match(html,/results\.filter\(item=>item\.status==='fulfilled'\)/);
  assert.match(html,/selected\.monthlyAssets\[variation\.key\]\|\|=\{metadata:\{\}\}/);
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
  assert.match(html,/bindings=\{image:"calendar\.monthlyImages\.current","image-2":"","image-3":""\}/);
  assert.match(html,/seasonGroup=Math\.floor\(pageIndex\/3\)\*3/);
  assert.doesNotMatch(html,/"image-2":"calendar\.monthlyImages\.2"/);
  assert.match(html,/sampleFallback:true/);
  assert.match(html,/protectedCalendarClearArea:true/);
  assert.match(html,/pages=selected\.monthlyAssets\?all/);
  assert.match(html,/ACDLDesignSetExpansion\.createReport\(project,selected\)/);
  assert.match(html,/setExpansion\.status!=="complete"/);
  assert.match(html,/designSpecVersion:metadata\.designSpecVersion/);
});

test('editor applies every representative page asset with its real generated role',()=>{
  const html=studioSource,expansion=fs.readFileSync(new URL('../apps/designer-studio/ai-design/design-set-expansion@0.2.0.js',import.meta.url),'utf8');
  assert.match(html,/generatedRole=metadata\.generatedRole\|\|window\.ACDLDesignSetExpansion\?\.generatedRole\?\.\(page\)/);
  assert.match(html,/pageRoles\.forEach\(role=>delete sources\[role\]\)/);
  assert.doesNotMatch(html,/generatedRole:"divider",pageInstance:metadata\.pageInstance/);
  assert.match(expansion,/selected\?\.assetsByPage\?\.\[page\?\.id\]\|\|selected\?\.assetsByRole/);
});

test('AI generation UI follows the enabled role and monthly role contract',()=>{
  const html=studioSource;
  assert.doesNotMatch(html,/6개 대표 페이지/);
  assert.doesNotMatch(html,/실제 페이지 6개/);
  assert.match(html,/context\.monthlyRoles\.includes\("month-back"\)/);
  assert.match(html,/monthBack\.classList\.toggle\("hidden",!hasMonthBack\)/);
  assert.match(html,/section\.classList\.toggle\("hidden",!plan\.monthlyRoles\.length\)/);
  assert.match(html,/대표 디자인을 생성하면 \$\{previewPlans\.length\}개 실제 면/);
  assert.match(html,/plan\.monthlyAssetCount/);
  assert.match(html,/aiCostText\(plan\)/);
  assert.match(html,/const primaryRole=roles\[0\]/);
});
