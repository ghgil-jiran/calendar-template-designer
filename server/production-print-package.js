import {createHash,randomBytes,timingSafeEqual} from 'node:crypto';
import {supabaseRequest} from './template-persistence.js';
import {storage,inspectRaster} from './production-correction-assets.js';
import {loadProductionEditorSource} from './production-editor-source.js';
import {productionImagePlan,readProductionImage} from './production-print-images.js';

export const PRINT_CONTRACT='production-existing-pdf-worker.v1';
export const EXPECTED_PIPELINE_VERSION='2026-09-21-page-cmyk-k100-checkpoint-v1';
const digest=value=>createHash('sha256').update(value).digest('hex');
const path=value=>value.split('/').map(encodeURIComponent).join('/');
const conflict=message=>Object.assign(Error(message),{statusCode:409});
export function productionIdentity(requestId,revision){
 const plan=productionImagePlan(revision);
 return {requestId,revisionId:revision.id,revisionNumber:revision.revision_number,documentHash:revision.document_hash,contentHash:plan.contentHash,contract:PRINT_CONTRACT,pipelineVersion:EXPECTED_PIPELINE_VERSION};
}
export function checkRenderAccess(job,token){
 if(!job.payload?.production)return;
 const expected=job.payload.renderAccessToken;
 if(typeof expected!=='string'||typeof token!=='string'||! /^[a-f0-9]{64}$/.test(token)||token.length!==expected.length||!timingSafeEqual(Buffer.from(token),Buffer.from(expected)))throw Object.assign(Error('인쇄 Worker의 원본 접근 권한이 필요합니다.'),{statusCode:401,code:'PRINT_WORKER_ACCESS_REQUIRED'});
}
export function publicProductionJob(job){
 if(!job)return null;
 return {id:job.id,status:job.status,report:job.report||null,error:job.error||null,createdAt:job.created_at,completedAt:job.completed_at,identity:job.payload?.production||null};
}
async function existingPackage(identity){
 const rows=await supabaseRequest(`template_packages?template_id=eq.production-${identity.revisionId}&version=eq.1.0.0&select=*&limit=1`);
 const row=rows[0];if(!row)return null;
 if(row.status!=='draft'||JSON.stringify(row.publishing_contract?.production)!==JSON.stringify(identity)){
  // jsonb key order is not meaningful.
  if(row.status!=='draft'||Object.keys(identity).some(key=>row.publishing_contract?.production?.[key]!==identity[key]))throw conflict('검사용 입력의 교정 버전 또는 출력 계약이 다릅니다.');
 }
 return row;
}
export async function freezeProductionPackage(receipt,revision){
 const identity=productionIdentity(receipt.id,revision),existing=await existingPackage(identity);
 if(existing)return existing;
 if(!revision.document.editorProject)throw conflict('이 교정 버전에는 에디터 프로젝트가 없습니다. 3단계에서 새 버전을 저장하세요.');
 const bucket=await (await storage('bucket/template-packages')).json();
 if(bucket.public!==false)throw conflict('검사용 패키지는 비공개 보관소가 필요합니다.');
 const source=await loadProductionEditorSource(receipt.snapshot,{includeBundle:true,signAssets:false}),project=structuredClone(revision.document.editorProject),references=new Set();
 function collect(value){if(typeof value==='string'&&/^(package|production)-asset:\/\//.test(value))references.add(value);else if(Array.isArray(value))value.forEach(collect);else if(value&&typeof value==='object')Object.values(value).forEach(collect);}
 collect(project);for(const asset of source.bundle.assets||[])references.add(`package-asset://${asset.id}`);
 const id=`production-${revision.id}`,version='1.0.0',assets=[],markers=new Map();
 for(const reference of [...references].sort()){
  const assetId=reference.split('://')[1];let bytes,info;
  if(reference.startsWith('package-asset://')){
   const asset=source.bundle.assets?.find(item=>item.id===assetId||item.packagePath===assetId);if(!asset||!asset.storagePath?.startsWith(`${source.identity.templateId}/${source.identity.version}/assets/`))throw conflict('템플릿 원본 연결을 확인할 수 없습니다.');
   bytes=Buffer.from(await (await storage(`object/template-packages/${path(asset.storagePath)}`)).arrayBuffer());
   if(bytes.length!==asset.byteLength||digest(bytes)!==asset.sha256)throw conflict('템플릿 원본 바이트가 보관 기록과 다릅니다.');
   info={mimeType:asset.mimeType,kind:asset.kind||'image',...(asset.packagePath?{packagePath:asset.packagePath}:{})};
  }else{
   let asset=receipt.snapshot.assets?.find(item=>item.id===assetId),bucket='calendar-production-assets';
   if(asset){if(asset.path!==`${receipt.owner_id}/${receipt.id}/${assetId}`)throw conflict('접수 원본 경로가 일치하지 않습니다.');}
   else{const rows=await supabaseRequest(`calendar_production_correction_assets?request_id=eq.${receipt.id}&id=eq.${assetId}&status=eq.ready&select=*&limit=1`);asset=rows[0];bucket='calendar-correction-assets';if(!asset||asset.path!==`${receipt.id}/${assetId}`)throw conflict('보관 완료된 교정 원본을 찾지 못했습니다.');}
   bytes=await readProductionImage(asset,bucket);const raster=inspectRaster(bytes);
   if(bytes.length!==Number(asset.byte_size??asset.byteSize)||raster.mimeType!==(asset.mime_type??asset.mimeType)||asset.content_hash&&asset.content_hash!==raster.contentHash)throw conflict('사용 원본 바이트가 보관 기록과 다릅니다.');
   info={mimeType:raster.mimeType,kind:'image'};
  }
  const sha256=digest(bytes),chars=sha256.slice(0,32).split('');chars[12]='4';chars[16]='a';const uuid=`${chars.slice(0,8).join('')}-${chars.slice(8,12).join('')}-${chars.slice(12,16).join('')}-${chars.slice(16,20).join('')}-${chars.slice(20).join('')}`;
  markers.set(reference,`package-asset://${uuid}`);if(reference.startsWith('package-asset://')){markers.set(assetId,uuid);const original=source.bundle.assets.find(item=>item.id===assetId||item.packagePath===assetId);if(original?.packagePath){markers.set(original.packagePath,uuid);markers.set(`package-asset://${original.packagePath}`,`package-asset://${uuid}`);}}
  if(assets.some(asset=>asset.id===uuid))continue;
  const storagePath=`${id}/${version}/assets/${uuid}`;
  // Identical concurrent preparation may already have stored this content-addressed file.
  try{await storage(`object/template-packages/${path(storagePath)}`,{method:'POST',headers:{'Content-Type':info.mimeType,'x-upsert':'false'},body:bytes});}
  catch(error){const found=Buffer.from(await (await storage(`object/template-packages/${path(storagePath)}`)).arrayBuffer());if(digest(found)!==sha256)throw error;}
  assets.push({id:uuid,...info,storagePath,byteLength:bytes.length,sha256});
 }
 function resolve(value){if(typeof value==='string')return markers.get(value)||value;if(Array.isArray(value))return value.map(resolve);if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([key,item])=>[key,resolve(item)]));return value;}
 const frozen=resolve(project);frozen.template.publishing={};frozen.productionCorrection.savedRevisionId=revision.id;frozen.productionCorrection.savedDocumentHash=revision.document_hash;
 const bundle=structuredClone(source.bundle);
 for(const key of ['manifest','template','bindings','print','parity','publishing']){bundle[key]||={};bundle[key].templateId=id;bundle[key].version=version;}
 bundle.bindings.templateVersion=version;bundle.parity={schemaVersion:bundle.parity.schemaVersion,templateId:id,version,status:'pending',sourceSurfaceCount:frozen.book.pageInstances.length};delete bundle.print.nativeCompilation;delete bundle.print.nativeRuntimeTemplate;bundle.manifest.releaseContract={status:'draft',immutableAfterPublish:true};
 bundle.manifest.name=`${receipt.school_name} · 교정 v${revision.revision_number}`;bundle.manifest.status='draft';bundle.manifest.publishable=false;delete bundle.manifest.representativePreview;delete bundle.manifest.pagePreviews;
 bundle.template.projectData=frozen;bundle.assets=assets;
 bundle.publishing={schemaVersion:'production-print-package.v1',templateId:id,version,production:identity,consumerSnapshot:false,lifecycle:{currentStatus:'draft',userServiceVisible:false}};
 bundle.print={...bundle.print,production:identity,pdfStandard:'PDF/X-4',outputConditionIdentifier:'Japan Color 2011 Coated',cropMarkWidthPt:0.540};
 const bytes=Buffer.from(JSON.stringify(bundle)),sha256=digest(bytes),storagePath=`${id}/${version}/production/package.json`;
 try{await storage(`object/template-packages/${path(storagePath)}`,{method:'POST',headers:{'Content-Type':'application/json','x-upsert':'false'},body:bytes});}
 catch(error){const found=Buffer.from(await (await storage(`object/template-packages/${path(storagePath)}`)).arrayBuffer());if(digest(found)!==sha256)throw error;}
 const row={template_id:id,version,name:bundle.manifest.name,product_type:bundle.manifest.productType,status:'draft',schema_version:bundle.manifest.schemaVersion,runtime_range:bundle.manifest.compatibility.runtime,dataset_schema_range:bundle.manifest.compatibility.datasetSchema,template_schema_range:bundle.manifest.compatibility.templateSchema,manifest:{...bundle.manifest,assets},publishing_contract:bundle.publishing,package_storage_path:storagePath,preview_storage_path:null,package_sha256:sha256,published_at:null};
 try{const inserted=await supabaseRequest('template_packages',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify(row)});return inserted[0]||row;}catch(error){const stored=await existingPackage(identity);if(stored?.package_sha256===sha256)return stored;throw error;}
}
export async function productionJobs(identity){
 return supabaseRequest(`template_print_preflight_jobs?template_id=eq.production-${identity.revisionId}&template_version=eq.1.0.0&select=*&order=created_at.desc&limit=20`);
}
export async function requestProductionJob(receipt,revision,adminId,origin,{force=false,quickInspection=null}={}){
 const identity=productionIdentity(receipt.id,revision),pkg=await freezeProductionPackage(receipt,revision),jobs=await productionJobs(identity);
 const same=jobs.filter(job=>job.package_sha256===pkg.package_sha256&&job.payload?.editorPrintOrigin===origin&&Object.keys(identity).every(key=>job.payload?.production?.[key]===identity[key]));
 const active=same.find(job=>['queued','processing'].includes(job.status));if(active)return active;
 const done=same.find(job=>job.status==='done'&&job.file_path&&job.report?.verified===true&&job.report.pipelineVersion===identity.pipelineVersion&&Object.keys(identity).every(key=>job.report.production?.[key]===identity[key]));
 if(done&&!force){try{await storage(`object/info/authenticated/print-pdfs/${path(done.file_path)}`);return done;}catch{/* Missing artifact requires a new job; never mark a missing PDF as reusable. */}}
 const serial=same.length,seed=digest(`${pkg.package_sha256}:${origin}:${serial}`),id=`${seed.slice(0,8)}-${seed.slice(8,12)}-4${seed.slice(13,16)}-a${seed.slice(17,20)}-${seed.slice(20,32)}`;
 const job={id,template_id:pkg.template_id,template_version:pkg.version,package_sha256:pkg.package_sha256,package_storage_path:pkg.package_storage_path,requested_by:adminId,payload:{kind:'template-print-preflight',editorPrintOrigin:origin,rendererId:'template-editor-review-dom.v1',packageSha256:pkg.package_sha256,production:identity,quickInspection,renderAccessToken:randomBytes(32).toString('hex')}};
 try{const rows=await supabaseRequest('template_print_preflight_jobs',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify(job)});return rows[0];}catch(error){const rows=await productionJobs(identity),existing=rows.find(item=>item.id===id);if(existing)return existing;throw error;}
}
