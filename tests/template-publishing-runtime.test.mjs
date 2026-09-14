import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {forwardReviewPackage} from '../server/user-service-review-publisher.js';

const source=readFileSync(new URL('../apps/designer-studio/template-publishing-runtime.js',import.meta.url),'utf8');
function runtime(){const window={crypto:globalThis.crypto,fetch:globalThis.fetch,TextEncoder,FileReader:class{}};vm.runInNewContext(source,{window,TextEncoder,FileReader:window.FileReader,structuredClone,btoa});return window.ACDLTemplatePublishing}

test('snapshot review bundle preserves the complete editor project and author input contract',()=>{const api=runtime(),project={productType:{category:'desk',pageSize:{width:260,height:180,unit:'mm'}},settings:{startMonth:3},template:{publishing:{dataRequirements:[{path:'school.name',stage:'project-create-required'},{path:'monthlyImages',stage:'optional',fallback:'sample'}]}},book:{pageInstances:[{id:'cover',role:'cover-front'},{id:'month',role:'monthly-front'}]}};const bundle=api.buildBundle(project,{id:'test-template',version:'1.0.0',name:'테스트',productType:'desk'});assert.equal(bundle.template.kind,'designer-project-snapshot');assert.equal(bundle.template.projectData,project);assert.equal(bundle.bindings.bindings[0].required,true);assert.equal(bundle.bindings.bindings[1].missing,'sample');assert.equal(bundle.manifest.status,'review');assert.equal(bundle.manifest.publishable,false)});

test('package id normalization is stable and accepted by the user service contract',()=>{const api=runtime();assert.equal(api.packageId('TPL 2027 / Desk 01'),'tpl-2027-desk-01');assert.match(api.packageId('한글 이름'),/^template-\d+$/)});

test('review proxy forwards only authenticated supported operations',async()=>{await assert.rejects(()=>forwardReviewPackage({authorization:'',body:{mode:'chunk'},fetcher:async()=>{}}),/AUTH_REQUIRED/);let received;const result=await forwardReviewPackage({authorization:'Bearer token',body:{mode:'next-version',packageId:'a',baseVersion:'1.0.0'},fetcher:async(url,options)=>{received={url,options};return {ok:true,json:async()=>({version:'1.0.1'})}}});assert.equal(result.version,'1.0.1');assert.match(received.url,/template-packages\/review$/);assert.equal(received.options.headers.Authorization,'Bearer token')});

test('browser reuses the existing templates endpoint so deployment function count does not grow',()=>{assert.match(source,/fetch\('\/api\/templates'/);assert.match(source,/operation:'publish-review'/)});
