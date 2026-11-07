import test from 'node:test';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';import {loadProductionEditorSource} from '../server/production-editor-source.js';
process.env.SUPABASE_URL='https://example.invalid';process.env.SUPABASE_SERVICE_ROLE_KEY='test-only';const old=fetch;
const snapshot={doc:{meta:{templateId:'desk-school',templateVersion:'1.0.4'}}};
const bytes=Buffer.from(JSON.stringify({manifest:{templateId:'desk-school',version:'1.0.4'},template:{kind:'designer-project-snapshot',projectData:{format:'acdl-project'}},assets:[]}));
function setup(hash=createHash('sha256').update(bytes).digest('hex')){globalThis.fetch=async url=>url.includes('/rest/v1/')?new Response(JSON.stringify([{package_storage_path:'desk-school/1.0.4/review/package.json',package_sha256:hash}])):new Response(bytes);}
test('exact receipt version and package hash are required for restoration',async()=>{setup();const result=await loadProductionEditorSource(snapshot);assert.equal(result.identity.version,'1.0.4');assert.equal(result.projectData.format,'acdl-project');setup('wrong');await assert.rejects(loadProductionEditorSource(snapshot),/해시/);await assert.rejects(loadProductionEditorSource({doc:{meta:{templateId:'desk-school'}}}),/버전/);});
test.after(()=>{globalThis.fetch=old;});
