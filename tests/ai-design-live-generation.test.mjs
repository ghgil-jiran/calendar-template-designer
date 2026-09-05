import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { buildImagePrompt, validateGenerationInput } from '../api/ai-design-generate.js';

test('live image prompt protects editable calendar and school data', () => {
  const input=validateGenerationInput({styleKey:'seasonal',palette:['#315e9e','#ffffff'],request:{conditions:{schoolLevel:'middle',decorationDensity:'low',photoMode:'mixed',seasonalVariation:'high',instruction:'봄 느낌을 유지'},versions:{promptSet:'school-calendar-prompt@0.1.0'}}});
  const prompt=buildImagePrompt(input);
  assert.match(prompt,/no letters, words, numbers, dates, calendar grids/i);
  assert.match(prompt,/never invent or alter a school photo or logo/i);
  assert.match(prompt,/#315e9e/);
});

test('live generation input rejects unknown styles and long instructions', () => {
  assert.throws(()=>validateGenerationInput({styleKey:'unknown'}),/지원하지 않는/);
  assert.throws(()=>validateGenerationInput({styleKey:'balanced',request:{conditions:{instruction:'가'.repeat(501)}}}),/500자/);
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
  assert.match(client,/controller\.abort\(\),15000/);
  assert.match(client,/연결 확인 시간이 초과됐습니다/);
});

test('AI generation controls render independently from the Vault connection controls', () => {
  const html=fs.readFileSync(new URL('../apps/designer-studio/index.html',import.meta.url),'utf8');
  assert.match(html,/실제 AI 디자인 생성/);
  assert.match(html,/생성할 디자인 스타일/);
  assert.match(html,/단정한 균형형/);
  assert.match(html,/사계절 연결형/);
  assert.match(html,/사진 중심 브랜드형/);
  assert.match(html,/학생 친화 포인트형/);
  assert.match(html,/closest\?\.\("#generateLiveAIDesignBtn"\)/);
  assert.match(html,/if\(!el\("aiDesignOpenAIKey"\)\)/);
  assert.match(html,/if\(!el\("generateLiveAIDesignBtn"\)\)/);
});
