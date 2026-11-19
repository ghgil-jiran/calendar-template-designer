import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import test from 'node:test';
import {loadProductionTemplate} from '../src/server/production-template.ts';

const templateId='9ad894c7-6cb6-4f9e-baba-4d167a73a9bc';
const identity={templateId:'desk-school',version:'1.0.4',sourceEditorRevision:5};
const bundle={
 manifest:{...identity},
 template:{kind:'designer-project-snapshot',projectData:{
  format:'acdl-project',book:{pageInstances:[{id:'cover'}]},template:{masters:{}},productType:{pageSize:{width:260,height:180}},settings:{},
 }},
};
const content=JSON.stringify(bundle);
const sha256=createHash('sha256').update(content).digest('hex');
function fixture({revision=5,storedContent=content}={}){
 const calls=[];
 const fetcher=async url=>{
  calls.push(url.href);
  if(url.pathname.endsWith('/template_versions'))return Response.json([{project_data:{template:{publishing:{lastReviewPackage:{...identity,sha256,sourceEditorRevision:revision}}}}}]);
  if(url.pathname.endsWith('/template_packages'))return Response.json([{package_storage_path:'desk-school/1.0.4/package.json',package_sha256:sha256}]);
  return new Response(storedContent);
 };
 return {calls,config:{url:'https://example.invalid',key:'test',fetcher}};
}

test('loads the verified package for the exact revision used by the customer',async()=>{
 const {config,calls}=fixture();
 const result=await loadProductionTemplate(config,templateId,5);
 assert.deepEqual(result,{templateId:identity.templateId,version:identity.version,sha256,bundle});
 assert.match(calls[0],/version_number=eq\.5/);
});

test('does not substitute a package published for a different editor revision',async()=>{
 const {config,calls}=fixture({revision:6});
 await assert.rejects(loadProductionTemplate(config,templateId,5),/연결된 인쇄용 패키지가 없습니다/);
 assert.equal(calls.length,1);
});

test('rejects package bytes that do not match the recorded hash',async()=>{
 const {config}=fixture({storedContent:'{}'});
 await assert.rejects(loadProductionTemplate(config,templateId,5),/저장 기록과 일치하지 않습니다/);
});
