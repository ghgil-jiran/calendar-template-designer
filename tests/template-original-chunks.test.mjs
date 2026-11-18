import test from 'node:test';import assert from 'node:assert/strict';
import {uploadTemplateAssetChunk,completeTemplateAssetUpload} from '../server/template-persistence.js';
const uploadId='11111111-1111-4111-8111-111111111111';
test('original chunk assembly stores exact bytes only after all parts exist',async()=>{
 const parts=new Map(),bytes=Buffer.alloc(1500000,73);for(let index=0;index<2;index++)await uploadTemplateAssetChunk({uploadId,index,total:2,data:bytes.subarray(index*1000000,(index+1)*1000000).toString('base64')},{write:async(path,value)=>parts.set(path,value)});
 let stored,removed=false;const result=await completeTemplateAssetUpload({uploadId,total:2,byteSize:bytes.length,mimeType:'image/png'},{read:async path=>parts.get(path),store:async data=>{stored=Buffer.from(data.split(',')[1],'base64');return{id:'remote'}},remove:async()=>{removed=true}});assert.deepEqual(stored,bytes);assert.equal(result.id,'remote');assert.equal(removed,true);
});
test('invalid upload paths and incomplete originals cannot be registered',async()=>{
 await assert.rejects(uploadTemplateAssetChunk({uploadId:'../bad',total:1,index:0,data:'YQ=='}),e=>e.code==='INVALID_ORIGINAL_UPLOAD');
 let stored=false;await assert.rejects(completeTemplateAssetUpload({uploadId,total:1,byteSize:4,mimeType:'image/png'},{read:async()=>Buffer.from('abc'),store:async()=>{stored=true}}),e=>e.code==='ORIGINAL_SIZE_MISMATCH');assert.equal(stored,false);
 await assert.rejects(completeTemplateAssetUpload({uploadId,total:2,byteSize:4,mimeType:'image/png'},{read:async()=>{throw Error('missing chunk')},store:async()=>{stored=true}}),/missing chunk/);assert.equal(stored,false);
});
test('binary chunks use a private binary bucket while final images retain the image-only bucket',async()=>{
 const oldFetch=globalThis.fetch,oldUrl=process.env.SUPABASE_URL,oldKey=process.env.SUPABASE_SERVICE_ROLE_KEY,calls=[];
 process.env.SUPABASE_URL='https://example.invalid';process.env.SUPABASE_SERVICE_ROLE_KEY='test-only';
 globalThis.fetch=async(url,options={})=>{calls.push({url,options});if(url.endsWith('/bucket/template-original-uploads')&&!options.method)return new Response(JSON.stringify({message:'not found'}),{status:404});return new Response('{}',{status:200})};
 try{
  await uploadTemplateAssetChunk({uploadId,total:1,index:0,data:'YWJj'});
  const create=calls.find(c=>c.url.endsWith('/bucket')&&c.options.method==='POST');assert.ok(create);assert.deepEqual(JSON.parse(create.options.body),{id:'template-original-uploads',name:'template-original-uploads',public:false,file_size_limit:1048576,allowed_mime_types:['application/octet-stream']});
  const write=calls.find(c=>c.url.includes('/object/'));assert.ok(write.url.includes('/object/template-original-uploads/'));assert.equal(write.options.headers['Content-Type'],'application/octet-stream');assert.deepEqual(write.options.body,Buffer.from('abc'));
 }finally{globalThis.fetch=oldFetch;if(oldUrl===undefined)delete process.env.SUPABASE_URL;else process.env.SUPABASE_URL=oldUrl;if(oldKey===undefined)delete process.env.SUPABASE_SERVICE_ROLE_KEY;else process.env.SUPABASE_SERVICE_ROLE_KEY=oldKey}
});
