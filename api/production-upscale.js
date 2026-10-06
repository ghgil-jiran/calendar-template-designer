import {assertInternalAccess,sendError,sendJson,supabaseRequest} from '../server/template-persistence.js';
import {uuid} from '../server/production-corrections.js';
import {requestUpscale,upscaleJobs,applyUpscale} from '../server/production-upscale.js';
import {signedAsset,correctionAssets} from '../server/production-correction-assets.js';
import {publicProductionJob} from '../server/production-print-package.js';
export const config={maxDuration:300};
export default async function handler(request,response){try{
 const admin=await assertInternalAccess(request);response.setHeader('Cache-Control','no-store');if(request.method!=='POST')return sendJson(response,405,{message:'POST 요청만 지원합니다.'});
 const input=request.body||{},{requestId,revisionId,documentHash,action}=input;if(!uuid(requestId)||!uuid(revisionId)||!['request','status','apply'].includes(action))return sendJson(response,400,{message:'접수 건·저장 버전·작업을 확인하세요.'});
 const revisions=await supabaseRequest(`calendar_production_revisions?request_id=eq.${requestId}&select=*&order=revision_number.desc&limit=1`),revision=revisions[0];if(!revision||revision.id!==revisionId||revision.document_hash!==documentHash)return sendJson(response,409,{message:'최신 교정 버전으로 다시 검사하세요.'});
 const receipts=await supabaseRequest(`calendar_production_requests?id=eq.${requestId}&select=*&limit=1`),receipt=receipts[0];if(!receipt||!['reviewing','changes'].includes(receipt.status))return sendJson(response,409,{message:'검수 중인 접수 건에서 실행하세요.'});
 if(action==='request'){
  let origin;try{origin=new URL(request.headers.origin);}catch{return sendJson(response,400,{message:'검수 화면 주소를 확인하세요.'});}if(origin.host!==request.headers.host||!(origin.protocol==='https:'||origin.protocol==='http:'&&['localhost','127.0.0.1'].includes(origin.hostname)))return sendJson(response,400,{message:'현재 검수 화면에서 요청하세요.'});
  const job=await requestUpscale(receipt,revision,admin.id,origin.origin,input.imageLayouts);return sendJson(response,202,{job:publicProductionJob(job)});
 }
 const jobs=await upscaleJobs(requestId,revisionId);
 if(action==='apply'){if(!uuid(input.id))return sendJson(response,400,{message:'저장 작업 번호를 확인하세요.'});const job=jobs.find(j=>j.id===input.jobId);if(!job)return sendJson(response,404,{message:'보정 작업을 찾지 못했습니다.'});return sendJson(response,201,{revision:await applyUpscale(receipt,revision,job,input.selectedSources,admin.id,input.id)});}
 const assets=await correctionAssets(requestId);const result=jobs.map(publicProductionJob);for(const job of result)if(job.report)for(const item of job.report.results||[]){const asset=assets.find(a=>a.id===item.assetId);if(asset)item.previewUrl=(await signedAsset(asset)).url;}return sendJson(response,200,{jobs:result});
 }catch(error){return sendError(response,error);}}
