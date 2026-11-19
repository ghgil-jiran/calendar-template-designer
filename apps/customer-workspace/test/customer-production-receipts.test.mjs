import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {submitProductionReceipt} from '../src/server/customer-production-receipts.ts';

const id='11111111-1111-4111-8111-111111111111',templateId='22222222-2222-4222-8222-222222222222';
const photoId='33333333-3333-4333-8333-333333333333',access='a'.repeat(64);
const bytes=Uint8Array.of(1,2,3),sha256=createHash('sha256').update(bytes).digest('hex');
const source={format:'acdl-project',settings:{year:2027},productType:{pageSize:{width:260,height:180}},
 template:{masters:{cover:{}},masterElements:{},resources:{}},
 book:{school:{name:'샘플'},pageInstances:[{id:'cover',role:'cover-front',masterId:'cover'}],elementsByPage:{cover:[]}}};
const submission={id,name:'학교 달력',templateId,templateVersion:3,school:{values:{name:'우리학교'},hidden:[]},events:[],assignments:{},photos:[{id:photoId,name:'원본.png',sha256}]};

function setup({broken=false}={}){
 let stored;
 const calls=[];
 const fetcher=async (input,options)=>{
  const url=new URL(input),path=url.pathname;
  calls.push(path);
  if(path.endsWith('/template_versions')){
   assert.equal(url.searchParams.get('version_number'),'eq.3');
   return Response.json([{project_data:source}]);
  }
  if(path.includes('/receipts/'))return Response.json({mimeType:'image/png',byteSize:3});
  if(path.includes('/files/'))return new Response(broken?Uint8Array.of(2,2,2):bytes);
  if(path.includes('/calendar-production-assets/'))return new Response(null,{status:201});
  if(path.endsWith('/calendar_production_requests')){
   if(options.method==='POST'){stored=JSON.parse(options.body);return Response.json([{receipt_number:19}]);}
   return Response.json(stored?[{receipt_number:19}]:[]);
  }
  throw Error('Unexpected URL: '+url);
 };
 return {config:{url:'https://example.invalid',key:'test',fetcher},calls,stored:()=>stored};
}

test('stores edited content and original before returning the CAL number, and retries reuse the number',async()=>{
 const db=setup();
 assert.deepEqual(await submitProductionReceipt(db.config,access,submission),{receiptNumber:'CAL-000019'});
 const record=db.stored();
 assert.equal(record.owner_id,null);
 assert.equal(record.school_name,'우리학교');
 assert.equal(record.snapshot.document.editorProject.book.school.name,'우리학교');
 assert.equal(record.snapshot.assets[0].path,`guest/${record.id}/${sha256}`);
 assert.equal(JSON.stringify(record).includes(access),false);
 assert.deepEqual(await submitProductionReceipt(db.config,access,submission),{receiptNumber:'CAL-000019'});
 assert.equal(db.calls.filter(path=>path.includes('/calendar-production-assets/')).length,1);
});

test('original integrity failure produces no receipt',async()=>{
 const db=setup({broken:true});
 await assert.rejects(submitProductionReceipt(db.config,access,submission),/무결성/);
 assert.equal(db.stored(),undefined);
 assert.equal(db.calls.some(path=>path.includes('/calendar-production-assets/')),false);
});
