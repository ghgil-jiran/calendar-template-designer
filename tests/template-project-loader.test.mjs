import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const source=await readFile(new URL('../apps/designer-studio/template-project-loader.js',import.meta.url),'utf8');
function runtime(){const window={};vm.runInNewContext(source,{window,structuredClone});return window.ACDLTemplateProjectLoader}
function project(pageCount=28){const pages=Array.from({length:pageCount},(_,index)=>({id:`page-${index+1}`}));return {productType:{category:'desk'},template:{aiDesignDraft:{status:'sample-applied'},pageComposition:{pageCount},resources:{aiDesignAssets:[{id:'bg',src:'acdl-asset://asset'}]}},book:{pageInstances:pages,elementsByPage:Object.fromEntries(pages.map(page=>[page.id,[]]))}}}

test('saved template preparation hydrates, migrates, validates and preserves all pages',async()=>{
 const calls=[],api=runtime(),prepared=await api.prepare(project(),{hydrate:async value=>{calls.push('hydrate');value.template.resources.aiDesignAssets[0].src='https://signed.example/bg.webp';return value},migrate:value=>{calls.push('migrate');return {project:value}},assertIntegrity:()=>calls.push('integrity')});
 assert.equal(prepared.book.pageInstances.length,28);assert.deepEqual(calls,['migrate','hydrate','integrity']);assert.equal(prepared.template.resources.aiDesignAssets[0].src,'https://signed.example/bg.webp');
});

test('saved template preparation rejects an empty page collection before editor entry',async()=>{
 const broken=project();broken.book.pageInstances=[];
 await assert.rejects(()=>runtime().prepare(broken),error=>error.code==='TEMPLATE_PROJECT_INVALID'&&/페이지/.test(error.message));
});

test('saved AI desk templates reject partial page collections before preview and PDF',async()=>{
 const broken=project();broken.book.pageInstances.pop();
 await assert.rejects(()=>runtime().prepare(broken),error=>error.code==='TEMPLATE_PROJECT_INVALID'&&error.details.expectedPageCount===28);
});

test('complete pages still open when private image recovery temporarily fails',async()=>{
 const prepared=await runtime().prepare(project(),{hydrate:async()=>{throw Object.assign(new Error('signed url failed'),{code:'SIGNED_URL_FAILED'})},assertIntegrity:()=>{throw Object.assign(new Error('image missing'),{code:'AI_DESIGN_INCOMPLETE'})},allowAssetFallback:true});
 assert.equal(prepared.book.pageInstances.length,28);
 assert.equal(prepared.template.assetRecovery.status,'pending');
 assert.equal(prepared.template.assetRecovery.code,'AI_DESIGN_INCOMPLETE');
});
