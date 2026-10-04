import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {uuid} from '../../server/production-corrections.js';
import {supabaseRequest} from '../../server/template-persistence.js';
import {productionImagePlan,applyProductionImageLayouts,inspectProductionImageBytes,readProductionImage} from '../../server/production-print-images.js';

// Runs only in the trusted Worker environment, never in browser/Vercel requests.
export async function collectProductionWorkerInput({requestId,revisionId,documentHash,contentHash,outputDir,inspection,onProgress=()=>{},query=supabaseRequest,readImage=readProductionImage}){
 if(!uuid(requestId)||!uuid(revisionId)||!/^[a-f0-9]{64}$/.test(documentHash||'')||!/^[a-f0-9]{64}$/.test(contentHash||''))throw Error('접수·버전·문서 해시를 지정해 주세요.');
 const rows=await query(`calendar_production_revisions?request_id=eq.${requestId}&id=eq.${revisionId}&select=id,revision_number,document_hash,document&limit=1`),revision=rows[0];
 if(!revision||revision.document_hash!==documentHash)throw Error('지정한 접수의 교정 버전과 문서 해시가 일치하지 않습니다.');
 let plan=productionImagePlan(revision);
 if(plan.contentHash!==contentHash)throw Error('Worker 입력의 문서 내용 해시가 일치하지 않습니다.');
 if(inspection){
  if(inspection.schemaVersion!=='production-image-inspection.v1'||inspection.requestId!==requestId||inspection.revisionId!==revisionId||inspection.documentHash!==documentHash||inspection.plan?.contentHash!==contentHash)throw Error('이미지 영역 검사 기록이 지정한 교정 버전과 다릅니다.');
  const layouts=(inspection.plan.uses||[]).filter(use=>use.layoutBasis==='common-editor-dom.v1').map(use=>({pageId:use.pageId,objectId:use.objectId,source:use.source,basis:use.layoutBasis,frameMm:use.frameMm,fit:use.fit,scale:use.scale}));
  if(layouts.length)plan=applyProductionImageLayouts(plan,layouts);
 }
 if(plan.sources.some(source=>!/^production-asset:\/\/[a-f0-9-]{36}$/i.test(source)))throw Error('보관 원본이 연결되지 않은 이미지가 있습니다.');
 const receipts=await query(`calendar_production_requests?id=eq.${requestId}&select=id,owner_id,snapshot&limit=1`),receipt=receipts[0];if(!receipt)throw Error('접수 원본 기록이 없습니다.');
 const corrections=await query(`calendar_production_correction_assets?request_id=eq.${requestId}&status=eq.ready&select=*`);
 const root=path.resolve(outputDir);await mkdir(root);await mkdir(path.join(root,'originals'));
 await writeFile(path.join(root,'pending.json'),JSON.stringify({requestId,revisionId,contentHash}),{flag:'wx'});
 const results=[];
 try{
  for(const source of plan.sources){
   const id=source.slice(19);let asset=receipt.snapshot?.assets?.find(a=>a.id===id),bucket='calendar-production-assets';
   if(asset){if(asset.path!==`${receipt.owner_id}/${requestId}/${id}`)throw Error('접수 원본 경로가 일치하지 않습니다.');}
   else{asset=corrections.find(a=>a.id===id&&a.request_id===requestId&&a.status==='ready');bucket='calendar-correction-assets';if(!asset||asset.path!==`${requestId}/${id}`)throw Error('사용된 교정 원본의 보관 완료 기록이 없습니다.');}
   onProgress({completed:results.length,total:plan.sources.length,source});
   const bytes=await readImage(asset,bucket),report=inspectProductionImageBytes(plan,source,asset,bytes);
   if(inspection){const previous=inspection.results?.filter(r=>r.source===source)||[];if(previous.length!==1||previous[0].sourceHash!==report.sourceHash||previous[0].byteSize!==report.byteSize)throw Error('관리자 검사 이후 원본 바이트가 변경되었습니다.');}
   await writeFile(path.join(root,'originals',id),bytes,{flag:'wx'});results.push(report);
  }
  // Publish the consumable inspection only after every original has been verified.
  const record={schemaVersion:'production-image-inspection.v1',requestId,revisionId,documentHash,generatedAt:new Date().toISOString(),plan,results,finalApproved:false};
  await writeFile(path.join(root,'document.json'),JSON.stringify(revision.document),{flag:'wx'});
  await writeFile(path.join(root,'inspection.json'),JSON.stringify(record,null,2),{flag:'wx'});
  return {inspection:record,document:revision.document,sourceDir:path.join(root,'originals')};
 }catch(error){await writeFile(path.join(root,'failure.json'),JSON.stringify({requestId,revisionId,contentHash,completed:results.length,total:plan.sources.length,status:'failed',finalApproved:false,message:error.message}),{flag:'wx'});throw error;}
}
