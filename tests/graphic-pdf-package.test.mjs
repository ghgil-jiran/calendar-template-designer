import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,randomUUID} from 'node:crypto';
import {pdfPackageOperation as op} from '../server/graphic-pdf-package.js';
const model=globalThis.ACDLGraphicPdfPackageModel,sha=x=>createHash('sha256').update(x).digest('hex');
const copy=x=>JSON.parse(JSON.stringify(x));
function fixture(){
 const id=randomUUID(),records=new Map([[id,{id,schemaVersion:'graphic-package.v1',mode:'pdf',status:'active',revision:1,pages:{}}]]),objects=new Map();
 const missing=()=>{throw Object.assign(new Error('missing'),{storageStatus:404})},conflict=()=>{throw Object.assign(new Error('exists'),{storageStatus:409})};
 const d={ensureBucket:async()=>{},getRecord:async id=>copy(records.get(id)||missing()),putRecord:async v=>records.set(v.id,copy(v)),readJson:async k=>copy(objects.get(k)||missing()),writeJson:async(k,v,upsert=true)=>{if(!upsert&&objects.has(k))conflict();objects.set(k,copy(v));},readBytes:async k=>Buffer.from(objects.get(k)||missing()),writeBytes:async(k,v,upsert=false)=>{if(!upsert&&objects.has(k))conflict();objects.set(k,Buffer.from(v));},list:async prefix=>Array.from(objects.keys()).filter(k=>k.startsWith(prefix)).map(k=>({name:k.slice(prefix.length)})),storePreview:async()=>({id:randomUUID()}),validateThumbnail:value=>value,sign:async path=>'https://storage.example/'+path};
 return {id,d,records,objects,call:body=>op({packageId:id,...body},d)};
}
function bytes(n=128){const b=Buffer.alloc(n,32);b.write('%PDF-1.7\n');b.write('\n%%EOF',n-6);return b;}
async function start(f,b,kind='background',extra={}){return f.call({operation:'pdf-start',fileName:'배경.pdf',byteSize:b.length,sha256:sha(b),kind,pages:[{widthPt:737,heightPt:510}],...extra}).then(x=>x.document);}
async function chunk(f,m,b,index=0){const part=b.subarray(index*model.CHUNK_BYTES,(index+1)*model.CHUNK_BYTES);return f.call({operation:'pdf-chunk',documentId:m.id,index,data:part.toString('base64'),sha256:sha(part)});}
async function complete(f,m,revision=1){return f.call({operation:'pdf-complete',documentId:m.id,expectedRevision:revision});}
test('large PDF originals bypass image limits without losing any byte; completion is idempotent',async()=>{
 const f=fixture(),b=bytes(26*1048576+17),m=await start(f,b);for(let i=0;i<m.chunkCount;i++)await chunk(f,m,b,i);
 const result=await complete(f,m);assert.equal(result.package.pdfDocuments.length,1);assert.equal(result.document.sha256,sha(b));assert.ok(result.document.verifiedAt);
 const source=await f.call({operation:'pdf-source',documentId:m.id});const restored=Buffer.concat(source.chunks.map(c=>f.objects.get(c.url.replace('https://storage.example/',''))));assert.equal(sha(restored),sha(b));assert.equal(restored.length,b.length);
 assert.equal((await complete(f,m)).package.revision,2);await assert.rejects(()=>chunk(f,m,b),e=>e.code==='PDF_SOURCE_IMMUTABLE');
});
test('interrupted uploads resume only identical file/package/kind and preserve confirmed chunks',async()=>{
 const f=fixture(),b=bytes(1048576+24),m=await start(f,b);await chunk(f,m,b);await chunk(f,m,b);
 const status=await f.call({operation:'pdf-status',documentId:m.id});assert.deepEqual(status.uploaded,[0]);assert.equal((await start(f,b,'background',{resumeId:m.id})).id,m.id);
 await assert.rejects(()=>start(f,b,'reference',{resumeId:m.id}),e=>e.code==='PDF_RESUME_MISMATCH');await chunk(f,m,b,1);await complete(f,m);
});
test('missing, replaced and corrupted chunks cannot be marked verified',async()=>{
 const f=fixture(),b=bytes(1048576+24),m=await start(f,b);await chunk(f,m,b);await assert.rejects(()=>complete(f,m));
 const changed=Buffer.from(b);changed[100]=65;await assert.rejects(()=>chunk(f,m,changed),e=>e.code==='PDF_CHUNK_IMMUTABLE');await chunk(f,m,b,1);
 f.objects.get(`graphics-pdf-sources/${m.id}/chunk-0.bin`)[100]=77;await assert.rejects(()=>complete(f,m),e=>e.code==='PDF_CHUNK_HASH_MISMATCH');
});
test('sample PDF never becomes a page background and original filenames/metadata stay intact',async()=>{
 const f=fixture(),b=bytes(),m=await start(f,b,'reference',{fileName:'샘플 시안.pdf'});await chunk(f,m,b);const saved=await complete(f,m);assert.equal(saved.package.referencePdfId,m.id);assert.deepEqual(saved.package.pages,{});
 await assert.rejects(()=>f.call({operation:'pdf-assign',documentId:m.id,pageNumber:1,slot:'cover',expectedRevision:2}),e=>e.code==='INVALID_PDF_PAGE_ASSIGNMENT');
});
test('background assignment keeps PDF source and image preview separate, immutable and revision guarded',async()=>{
 const f=fixture(),b=bytes(),m=await start(f,b);await chunk(f,m,b);await complete(f,m);
 const preview=await f.call({operation:'pdf-preview',documentId:m.id,pageNumber:1,width:1300,height:900,dataUrl:'data:image/webp;base64,UklGRg==',thumbnailDataUrl:'thumbnail'});
 const result=await f.call({operation:'pdf-assign',documentId:m.id,pageNumber:1,slot:'month-back-01',expectedRevision:2});assert.equal(result.graphic.originalAssetId,null);assert.equal(result.graphic.previewAssetId,preview.preview.previewAssetId);assert.equal(result.graphic.pdfSource.sha256,sha(b));assert.equal(result.package.pages['month-back-01'].pdfSource.pageNumber,1);
 await assert.rejects(()=>f.call({operation:'pdf-assign',documentId:m.id,pageNumber:1,slot:'month-back-02',expectedRevision:2}),e=>e.code==='GRAPHIC_PACKAGE_CONFLICT');
});
test('metadata and cross-package operations reject invalid size, pages, kind, hashes and paths',async()=>{
 for(const change of [{byteSize:model.MAX_BYTES+1},{pages:[]},{pages:[{widthPt:0,heightPt:1}]},{sha256:'bad'},{kind:'other'},{fileName:'x.exe'}])assert.throws(()=>model.uploadMetadata({fileName:'x.pdf',byteSize:128,sha256:'a'.repeat(64),kind:'background',pages:[{widthPt:100,heightPt:100}],...change}));
 const f=fixture(),m=await start(f,bytes());await assert.rejects(()=>f.call({operation:'pdf-status',documentId:m.id,packageId:randomUUID()}),e=>e.code==='INVALID_PDF_PACKAGE');await assert.rejects(()=>f.call({operation:'pdf-source',documentId:'../bad'}),e=>e.code==='INVALID_PDF_ID');
});

test('deferred registration checks receipts without rereading original bytes, then verifies explicitly',async()=>{
 const f=fixture(),b=bytes(1048576+64),m=await start(f,b,'background',{pages:[],deferredProcessing:true});await chunk(f,m,b,0);
 await assert.rejects(()=>f.call({operation:'pdf-register',documentId:m.id,expectedRevision:1}));await chunk(f,m,b,1);
 const read=f.d.readBytes;let reads=0;f.d.readBytes=async k=>{reads++;return read(k)};
 const registered=await f.call({operation:'pdf-register',documentId:m.id,expectedRevision:1});assert.equal(reads,0);assert.ok(registered.document.uploadedAt);assert.equal(registered.document.verifiedAt,undefined);assert.equal(registered.package.pdfDocuments[0].processingStatus,'pending');
 assert.equal((await f.call({operation:'pdf-document',documentId:m.id})).document.pages.length,0);
 await assert.rejects(()=>f.call({operation:'pdf-source',documentId:m.id}),e=>e.code==='PDF_NOT_REGISTERED');await assert.rejects(()=>chunk(f,m,b),e=>e.code==='PDF_SOURCE_IMMUTABLE');
 const verified=await complete(f,m,2);assert.equal(reads,2);assert.ok(verified.document.verifiedAt);assert.equal(verified.package.pdfDocuments.length,1);
 await f.call({operation:'pdf-pages',documentId:m.id,pages:[{widthPt:737,heightPt:510}]});assert.equal((await f.call({operation:'pdf-document',documentId:m.id})).document.pages.length,1);
});
test('old interrupted uploads can be registered and resumed without original replacement',async()=>{
 const f=fixture(),b=bytes(),m=await start(f,b);await chunk(f,m,b);await f.call({operation:'pdf-register',documentId:m.id,expectedRevision:1});assert.equal((await start(f,b,'background',{resumeId:m.id})).id,m.id);await complete(f,m,2);assert.equal(f.records.get(f.id).pdfDocuments.length,1);
});

test('registered originals can be prepared from storage before full verification without enabling print source',async()=>{const f=fixture(),b=bytes(),m=await start(f,b,'background',{pages:[],deferredProcessing:true});await chunk(f,m,b);await assert.rejects(()=>f.call({operation:'pdf-uploaded-source',documentId:m.id}));await f.call({operation:'pdf-register',documentId:m.id,expectedRevision:1});const source=await f.call({operation:'pdf-uploaded-source',documentId:m.id});assert.equal(source.sha256,sha(b));assert.equal(source.chunks.length,1);await assert.rejects(()=>f.call({operation:'pdf-source',documentId:m.id}));});

test('whole-source verification reads bounded parallel batches and keeps byte order',async()=>{const f=fixture(),b=bytes(10*1048576+17),m=await start(f,b);for(let i=0;i<m.chunkCount;i++)await chunk(f,m,b,i);const read=f.d.readBytes;let active=0,peak=0;f.d.readBytes=async k=>{active++;peak=Math.max(peak,active);await new Promise(r=>setTimeout(r,1));const bytes=await read(k);active--;return bytes};const result=await complete(f,m);assert.ok(peak>1);assert.ok(peak<=8);assert.equal(result.document.sha256,sha(b));assert.ok(result.document.verifiedAt);});
