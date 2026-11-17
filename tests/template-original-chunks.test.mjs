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
