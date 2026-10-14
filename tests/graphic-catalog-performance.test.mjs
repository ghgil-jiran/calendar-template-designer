import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {listGraphicRecords,compactGraphicCatalog} from '../server/graphic-library.js';

test('catalog index reads no unchanged metadata files and refreshes edits/deletions',async()=>{
 const originalFetch=globalThis.fetch,oldUrl=process.env.SUPABASE_URL,oldKey=process.env.SUPABASE_SERVICE_ROLE_KEY;
 process.env.SUPABASE_URL='https://catalog-index.test';process.env.SUPABASE_SERVICE_ROLE_KEY='test-only';
 const records=Array.from({length:120},()=>({schemaVersion:'graphic-library.v1',id:randomUUID(),name:'asset',createdAt:'2026-10-14',status:'active'}));
 const files=new Map(records.map(r=>[r.id+'.json',{record:r,revision:1}]));let index=null,reads=0,indexFail=false;
 globalThis.fetch=async(url,opt={})=>{
  const path=new URL(url).pathname;
  if(path.includes('/bucket/'))return new Response('{}');
  if(path.includes('/object/list/')){const {offset,limit}=JSON.parse(opt.body);return Response.json([...files].slice(offset,offset+limit).map(([name,f])=>({name,updated_at:String(f.revision),metadata:{size:100}})))}
  if(path.endsWith('/graphics-catalog/index-v1.json')){if(opt.method==='POST'){if(indexFail)return new Response('{}',{status:500});index=JSON.parse(opt.body);return new Response('{}')}return index?Response.json(index):new Response('{}',{status:404})}
  const file=files.get(path.split('/').at(-1));reads++;return file?Response.json(file.record):new Response('{}',{status:404});
 };
 try{
  assert.equal((await listGraphicRecords()).length,120);assert.equal(reads,120);
  reads=0;assert.equal((await listGraphicRecords()).length,120);assert.equal(reads,0);
  const edited=files.get(records[0].id+'.json');edited.record={...edited.record,name:'updated',status:'archived'};edited.revision++;
  files.delete(records[1].id+'.json');reads=0;const next=await listGraphicRecords();assert.equal(next.length,119);assert.equal(reads,1);assert.equal(next.find(r=>r.id===records[0].id).status,'archived');assert.ok(!next.some(r=>r.id===records[1].id));
  index={schemaVersion:'invalid'};indexFail=true;reads=0;assert.equal((await listGraphicRecords()).length,119);assert.equal(reads,119);
 }finally{globalThis.fetch=originalFetch;if(oldUrl===undefined)delete process.env.SUPABASE_URL;else process.env.SUPABASE_URL=oldUrl;if(oldKey===undefined)delete process.env.SUPABASE_SERVICE_ROLE_KEY;else process.env.SUPABASE_SERVICE_ROLE_KEY=oldKey}
});

test('catalog summary removes vector geometry while preserving asset identity and browsing fields',()=>{
 const graphic={id:randomUUID(),name:'vector',originalAssetId:randomUUID(),vectorObject:{parts:Array.from({length:1000},()=>({d:'M0 0 L100 100',fill:'#123456'}))},illustrationRecipe:{kind:'generated',subject:'책'},generationInfo:{engine:'imagegen'},thumbnailDataUrl:'data:image/webp;base64,x'};
 const catalog={graphics:[graphic],packages:[],themes:[]},small=compactGraphicCatalog(catalog);
 assert.equal(small.graphics[0].vectorObject,true);assert.equal(small.graphics[0].detailsPending,true);assert.equal(small.graphics[0].originalAssetId,graphic.originalAssetId);assert.ok(JSON.stringify(small).length<JSON.stringify(catalog).length/10);assert.equal(graphic.vectorObject.parts.length,1000);
});
