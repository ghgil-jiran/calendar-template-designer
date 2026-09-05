import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { buildImagePrompt, validateGenerationInput } from '../api/ai-design-generate.js';

test('live image prompt protects editable calendar and school data', () => {
  const input=validateGenerationInput({styleKey:'seasonal',palette:['#315e9e','#ffffff'],request:{conditions:{schoolLevel:'middle',decorationDensity:'low',photoMode:'mixed',seasonalVariation:'high',instruction:'봄 느낌을 유지'},versions:{promptSet:'school-calendar-prompt@0.1.0'}}});
  const prompt=buildImagePrompt(input);
  assert.match(prompt,/no readable letters, words, numbers, dates, calendar grids/i);
  assert.match(prompt,/never invent or embed a school photo/i);
  assert.match(prompt,/#315e9e/);
  assert.match(prompt,/Page role: 표지/);
  assert.match(prompt,/empty photo-frame/i);
  assert.match(prompt,/editable year and title/i);
});

test('versioned prompt set defines a distinct contract for every representative page role', async () => {
  const prompts=await import('../apps/designer-studio/ai-design/prompts/school-calendar-design@0.4.0.js');
  assert.equal(prompts.PROMPT_SET_ID,'school-calendar-design@0.4.0');
  assert.deepEqual(Object.keys(prompts.ROLE_PROMPTS),['cover','annual','school-symbols','month','month-back','back-cover']);
  for(const pageRole of Object.keys(prompts.ROLE_PROMPTS)){
    const prompt=buildImagePrompt(validateGenerationInput({styleKey:'balanced',pageRole}));
    assert.match(prompt,/Never rasterize editable content/i);
    assert.match(prompt,new RegExp(`Page role: ${prompts.ROLE_PROMPTS[pageRole].label}`));
  }
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

test('generation endpoint reads the OpenAI key from Supabase Vault', () => {
  const source=fs.readFileSync(new URL('../api/ai-design-generate.js',import.meta.url),'utf8');
  assert.match(source,/readOpenAIKey/);
  assert.doesNotMatch(source,/process\.env\.OPENAI_API_KEY/);
});

test('dynamic Vault save control uses delegated click and a request timeout', () => {
  const html=fs.readFileSync(new URL('../apps/designer-studio/index.html',import.meta.url),'utf8');
  const client=fs.readFileSync(new URL('../apps/designer-studio/ai-design-client.js',import.meta.url),'utf8');
  assert.match(html,/closest\?\.\("#saveAIDesignOpenAIKeyBtn"\)/);
  assert.match(html,/e\.key==="Enter"&&e\.target\?\.id==="aiDesignOpenAIKey"/);
  assert.match(client,/controller\.abort\(\),timeoutMs/);
  assert.match(client,/JSON\.stringify\(input\)\},70000/);
  assert.match(client,/연결 확인 시간이 초과됐습니다/);
});

test('AI generation controls render independently from the Vault connection controls', () => {
  const html=fs.readFileSync(new URL('../apps/designer-studio/index.html',import.meta.url),'utf8');
  assert.match(html,/실제 AI 대표 디자인 세트 생성/);
  assert.match(html,/디자인 스타일/);
  assert.match(html,/단정한 균형형/);
  assert.match(html,/사계절 연결형/);
  assert.match(html,/사진 중심 브랜드형/);
  assert.match(html,/학생 친화 포인트형/);
  assert.match(html,/closest\?\.\("#generateLiveAIDesignBtn"\)/);
  assert.match(html,/if\(!el\("aiDesignOpenAIKey"\)\)/);
  assert.match(html,/if\(!el\("generateLiveAIDesignBtn"\)\)/);
  assert.match(html,/function escapeHtml\(value\)\{return v21Escape\(value\)\}/);
  assert.match(html,/대표 디자인 세트 2개 생성/);
  assert.match(html,/for\(let variantIndex=0;variantIndex<count;variantIndex\+=1\)/);
  assert.match(html,/for\(const pageRole of roles\)/);
  assert.match(html,/pageRole,variantIndex/);
  assert.match(html,/assetsByRole/);
  assert.match(html,/id="aiDesignLiveQuality"/);
  assert.match(html,/applyAICoverLayout/);
  assert.match(html,/layoutApplied/);
  assert.match(html,/const AI_DESIGN_ROLE_MAP=\{cover:\["cover-front"\],annual:\["cover-back","poster-annual"\],"school-symbols"/);
});

test('live AI results stay hidden until generation finishes and the user opens them', () => {
  const html=fs.readFileSync(new URL('../apps/designer-studio/index.html',import.meta.url),'utf8');
  assert.match(html,/aiDesignGenerationState="idle"/);
  assert.match(html,/aiDesignResultsRevealed=false/);
  assert.match(html,/aiDesignGenerationState!=="complete"\|\|!aiDesignMockSession\|\|!aiDesignResultsRevealed/);
  assert.match(html,/sampleActions\.classList\.toggle\("hidden",!\["complete","expanding"\]\.includes\(aiDesignGenerationState\)\)/);
  assert.match(html,/class="ai-live-progress" role="status" aria-live="polite"/);
  assert.match(html,/디자인 페이지 \$\{current\}\/\$\{total\} 생성 중/);
  assert.match(html,/aiDesignGenerationState="complete";renderAIDesignGenerationState\(\{total:count\}\);renderAIDesignMockSession\(\)/);
  assert.match(html,/function showCompletedAIDesignResults\(\)\{[^}]*aiDesignResultsRevealed=true;renderAIDesignMockSession\(\)/);
  assert.match(html,/aiDesignGenerationState="failed"/);
});

test('the selected representative set expands to eleven remaining monthly front and back assets', () => {
  const html=fs.readFileSync(new URL('../apps/designer-studio/index.html',import.meta.url),'utf8');
  assert.match(html,/function expandSelectedAIDesignMonths\(\)/);
  assert.match(html,/pending\.length\*2/);
  assert.match(html,/Promise\.all\(\["month","month-back"\]/);
  assert.match(html,/ai-design-monthly-expansion\.v1/);
  assert.match(html,/나머지 11개월 생성 후 편집 시작/);
  assert.match(html,/selected\.monthlyAssets\?all/);
  assert.match(html,/monthlyAppliedPages/);
  assert.match(html,/pages=selected\.monthlyAssets\?all/);
});
