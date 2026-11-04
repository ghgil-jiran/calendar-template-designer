import {createHash,randomUUID} from 'node:crypto';
import '../apps/designer-studio/graphic-pdf-package-model.js';
const model=globalThis.ACDLGraphicPdfPackageModel,UUID=/^[a-f0-9-]{36}$/i,ROOT='graphics-pdf-sources';
const fail=(code,statusCode=400,message=code)=>{throw Object.assign(new Error(message),{code,statusCode})};
const idOf=id=>{if(!UUID.test(String(id)))fail('INVALID_PDF_ID');return id};
const key=(id,file)=>`${ROOT}/${idOf(id)}/${file}`;
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
async function manifest(d,id){const m=await d.readJson(key(id,'manifest.json'));if(m.schemaVersion!=='graphic-pdf-document.v1')fail('INVALID_PDF_DOCUMENT');return m;}
async function packageOf(d,id,expected){const p=await d.getRecord(idOf(id));if(p.schemaVersion!=='graphic-package.v1'||p.mode!=='pdf'||p.status!=='active')fail('INVALID_PDF_PACKAGE');if(expected!==undefined&&p.revision!==expected)fail('GRAPHIC_PACKAGE_CONFLICT',409);return p;}
function publicDocument(m){const {schemaVersion,id,packageId,fileName,byteSize,sha256,kind,chunkCount,pages,createdAt,verifiedAt,uploadedAt}=m;return {schemaVersion,id,packageId,fileName,byteSize,sha256,kind,chunkCount,pages,createdAt,verifiedAt,uploadedAt};}
async function linked(d,body){const p=await packageOf(d,body.packageId),m=await manifest(d,body.documentId);if(m.packageId!==p.id||!p.pdfDocuments?.some(x=>x.id===m.id)||!m.verifiedAt)fail('PDF_NOT_REGISTERED');return {p,m};}
export async function pdfPackageOperation(body,d){
 const op=body.operation;
 if(op==='pdf-start'){
  await d.ensureBucket();const p=await packageOf(d,body.packageId);let meta;try{meta=model.uploadMetadata(body)}catch(e){fail('INVALID_PDF_UPLOAD',400,e.message)}
  if(body.resumeId){const m=await manifest(d,body.resumeId);if(m.packageId!==p.id||m.sha256!==meta.sha256||m.byteSize!==meta.byteSize||m.kind!==meta.kind)fail('PDF_RESUME_MISMATCH');return {document:publicDocument(m)};}
  const m={schemaVersion:'graphic-pdf-document.v1',id:randomUUID(),packageId:p.id,...meta,createdAt:new Date().toISOString()};await d.writeJson(key(m.id,'manifest.json'),m,false);return {document:publicDocument(m)};
 }
 if(op==='pdf-status'){
  const m=await manifest(d,body.documentId);if(m.packageId!==body.packageId)fail('INVALID_PDF_PACKAGE');await packageOf(d,body.packageId);
  const names=await d.list(key(m.id,''));const uploaded=names.map(x=>String(x.name||'').match(/^chunk-(\d+)\.json$/)).filter(Boolean).map(x=>Number(x[1])).filter(x=>x<m.chunkCount);return {document:publicDocument(m),uploaded};
 }
 if(op==='pdf-chunk'){
  const m=await manifest(d,body.documentId);if(m.packageId!==body.packageId)fail('INVALID_PDF_PACKAGE');await packageOf(d,body.packageId);if(m.verifiedAt||m.uploadedAt)fail('PDF_SOURCE_IMMUTABLE',409);
  const index=body.index;if(!Number.isInteger(index)||index<0||index>=m.chunkCount||typeof body.data!=='string'||body.data.length>Math.ceil(model.CHUNK_BYTES/3)*4||!/^[A-Za-z0-9+/]+={0,2}$/.test(body.data))fail('INVALID_PDF_CHUNK');
  const bytes=Buffer.from(body.data,'base64'),expected=index===m.chunkCount-1?m.byteSize-index*model.CHUNK_BYTES:model.CHUNK_BYTES;if(bytes.length!==expected||digest(bytes)!==body.sha256)fail('PDF_CHUNK_HASH_MISMATCH');if(index===0&&!bytes.subarray(0,1024).includes(Buffer.from('%PDF-')))fail('INVALID_PDF_HEADER');
  try{await d.writeBytes(key(m.id,`chunk-${index}.bin`),bytes,false)}catch(error){if(![400,409].includes(error.storageStatus))throw error;const previous=await d.readBytes(key(m.id,`chunk-${index}.bin`));if(previous.length!==bytes.length||digest(previous)!==body.sha256)fail('PDF_CHUNK_IMMUTABLE',409);}
  const info={index,byteSize:bytes.length,sha256:body.sha256};try{await d.writeJson(key(m.id,`chunk-${index}.json`),info,false)}catch(error){if(![400,409].includes(error.storageStatus))throw error;const previous=await d.readJson(key(m.id,`chunk-${index}.json`));if(previous.sha256!==info.sha256||previous.byteSize!==info.byteSize)fail('PDF_CHUNK_IMMUTABLE',409);}return {index};
 }
 if(op==='pdf-register'){
  let m=await manifest(d,body.documentId);if(m.packageId!==body.packageId)fail('INVALID_PDF_PACKAGE');let p=await packageOf(d,body.packageId);if(p.pdfDocuments?.some(x=>x.id===m.id))return {document:publicDocument(m),package:p};await packageOf(d,body.packageId,body.expectedRevision);
  // Only small receipt metadata is read here. Full source verification is explicit later.
  const receipts=await Promise.all(Array.from({length:m.chunkCount},(_,i)=>d.readJson(key(m.id,`chunk-${i}.json`))));
  if(receipts.some((x,i)=>x.index!==i||x.byteSize!==(i===m.chunkCount-1?m.byteSize-i*model.CHUNK_BYTES:model.CHUNK_BYTES)))fail('PDF_UPLOAD_INCOMPLETE');
  m={...m,uploadedAt:new Date().toISOString()};await d.writeJson(key(m.id,'manifest.json'),m);p=await packageOf(d,body.packageId,body.expectedRevision);
  const updated={...p,pdfDocuments:[...(p.pdfDocuments||[]),{id:m.id,fileName:m.fileName,kind:m.kind,byteSize:m.byteSize,pageCount:m.pages.length,sha256:m.sha256,processingStatus:m.verifiedAt?'verified':'pending'}],...(m.kind==='reference'?{referencePdfId:m.id}:{}),revision:p.revision+1,updatedAt:new Date().toISOString()};await d.putRecord(updated);return {document:publicDocument(m),package:updated};
 }
 if(op==='pdf-pages'){
  const {m}=await linked(d,body);let meta;try{meta=model.uploadMetadata({...m,pages:body.pages})}catch(e){fail('INVALID_PDF_UPLOAD',400,e.message)}
  if(m.pages.length&&JSON.stringify(m.pages)!==JSON.stringify(meta.pages))fail('PDF_PAGE_METADATA_IMMUTABLE',409);
  await d.writeJson(key(m.id,'manifest.json'),{...m,pages:meta.pages});return {document:publicDocument({...m,pages:meta.pages})};
 }
 if(op==='pdf-complete'){
  let m=await manifest(d,body.documentId);if(m.packageId!==body.packageId)fail('INVALID_PDF_PACKAGE');let p=await packageOf(d,body.packageId);if(m.verifiedAt&&p.pdfDocuments?.some(x=>x.id===m.id))return {document:publicDocument(m),package:p};
  await packageOf(d,body.packageId,body.expectedRevision);
  if(!m.verifiedAt){const hash=createHash('sha256');let size=0,last;
   for(let i=0;i<m.chunkCount;i++){const info=await d.readJson(key(m.id,`chunk-${i}.json`)),bytes=await d.readBytes(key(m.id,`chunk-${i}.bin`));if(info.index!==i||digest(bytes)!==info.sha256||bytes.length!==info.byteSize)fail('PDF_CHUNK_HASH_MISMATCH');if(i===0&&!bytes.subarray(0,1024).includes(Buffer.from('%PDF-')))fail('INVALID_PDF_HEADER');hash.update(bytes);size+=bytes.length;last=bytes;}
   if(size!==m.byteSize||hash.digest('hex')!==m.sha256)fail('PDF_SOURCE_HASH_MISMATCH');if(!last.subarray(-2048).includes(Buffer.from('%%EOF')))fail('INVALID_PDF_TRAILER');m={...m,verifiedAt:new Date().toISOString()};await d.writeJson(key(m.id,'manifest.json'),m);
  }
  p=await packageOf(d,body.packageId,body.expectedRevision);const summary={id:m.id,fileName:m.fileName,kind:m.kind,byteSize:m.byteSize,pageCount:m.pages.length,sha256:m.sha256};const updated={...p,pdfDocuments:[...(p.pdfDocuments||[]).filter(x=>x.id!==m.id),{...summary,processingStatus:'verified'}],...(m.kind==='reference'?{referencePdfId:m.id}:{}),revision:p.revision+1,updatedAt:new Date().toISOString()};await d.putRecord(updated);return {document:publicDocument(m),package:updated};
 }
 if(op==='pdf-preview'){
  const {m}=await linked(d,body),page=m.pages[body.pageNumber-1];if(!Number.isInteger(body.pageNumber)||!page)fail('INVALID_PDF_PAGE');
  if(!/^data:image\/(webp|png);base64,/.test(body.dataUrl||'')||String(body.dataUrl).length>3*1024*1024)fail('INVALID_PDF_PREVIEW');const width=Number(body.width),height=Number(body.height);if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||width>2400||height>2400||Math.abs(width/height-page.widthPt/page.heightPt)>.02)fail('INVALID_PDF_PREVIEW_SIZE');
  const asset=await d.storePreview(body.dataUrl),preview={pageNumber:page.pageNumber,previewAssetId:asset.id,width,height,thumbnailDataUrl:d.validateThumbnail(body.thumbnailDataUrl)};await d.writeJson(key(m.id,`preview-${page.pageNumber}.json`),preview);return {preview};
 }
 if(op==='pdf-document'){
  const p=await packageOf(d,body.packageId),m=await manifest(d,body.documentId);if(m.packageId!==p.id||!p.pdfDocuments?.some(x=>x.id===m.id))fail('PDF_NOT_REGISTERED');const previews={};await Promise.all(m.pages.map(async p=>{try{previews[p.pageNumber]=await d.readJson(key(m.id,`preview-${p.pageNumber}.json`))}catch(e){if(e.storageStatus!==404&&e.storageStatus!==400)throw e;}}));return {document:{...publicDocument(m),pages:m.pages.map(p=>({...p,...previews[p.pageNumber]}))}};
 }
 if(op==='pdf-source'){
  const {m}=await linked(d,body);const chunks=[];for(let i=0;i<m.chunkCount;i++)chunks.push({index:i,url:await d.sign(key(m.id,`chunk-${i}.bin`))});return {fileName:m.fileName,sha256:m.sha256,byteSize:m.byteSize,chunks};
 }
 if(op==='pdf-assign'){
  const {m}=await linked(d,body);if(m.kind!=='background'||!model.pageKey(body.slot)||!Number.isInteger(body.pageNumber)||!m.pages[body.pageNumber-1])fail('INVALID_PDF_PAGE_ASSIGNMENT');const p=await packageOf(d,body.packageId,body.expectedRevision),preview=await d.readJson(key(m.id,`preview-${body.pageNumber}.json`));const pdfSource=model.sourceRef(m,body.pageNumber),now=new Date().toISOString();
  const graphic={schemaVersion:'graphic-library.v1',id:randomUUID(),name:(m.fileName.replace(/\.pdf$/i,'')+' · '+body.pageNumber+'면').slice(0,120),category:'background',width:preview.width,height:preview.height,tags:p.tags||'',source:m.fileName,mimeType:'application/pdf',originalAssetId:null,previewAssetId:preview.previewAssetId,thumbnailDataUrl:preview.thumbnailDataUrl,pdfSource,registrationMethod:'package-pdf',ownership:{kind:'background-package',id:p.id},physicalSizeMm:{width:pdfSource.widthPt*25.4/72,height:pdfSource.heightPt*25.4/72},status:'active',revision:1,createdAt:now,updatedAt:now};
  await d.putRecord(graphic);const latest=await packageOf(d,body.packageId,body.expectedRevision),updated={...latest,pages:{...latest.pages,[body.slot]:{graphicId:graphic.id,pdfSource,updatedAt:now}},thumbnailDataUrl:body.slot==='cover'?preview.thumbnailDataUrl:latest.thumbnailDataUrl,revision:latest.revision+1,updatedAt:now};await d.putRecord(updated);return {graphic,package:updated};
 }
 fail('INVALID_PDF_OPERATION');
}
