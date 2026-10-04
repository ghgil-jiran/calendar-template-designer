import {assertInternalAccess,sendError,sendJson,supabaseRequest} from '../server/template-persistence.js';
import {uuid} from '../server/production-corrections.js';
import {prepareProductionPrintPreflight} from '../server/production-print-preflight.js';
import {productionIdentity,productionJobs,requestProductionJob,publicProductionJob} from '../server/production-print-package.js';
import {storage} from '../server/production-correction-assets.js';
export const config={maxDuration:300};
export default async function handler(request,response){try{
 const admin=await assertInternalAccess(request);response.setHeader('Cache-Control','no-store');
 if(request.method!=='POST'){response.setHeader('Allow','POST');return sendJson(response,405,{message:'저장 버전의 검사 요청만 가능합니다.'});}
 const {requestId,revisionId,documentHash,action='inspect',jobId,force=false,quickInspection,warningsAccepted=false}=request.body||{};
 if(!uuid(requestId)||!uuid(revisionId)||!/^[a-f0-9]{64}$/.test(documentHash||''))return sendJson(response,400,{message:'접수 건·교정 버전·문서 해시를 확인해 주세요.'});
 const rows=await supabaseRequest(`calendar_production_revisions?request_id=eq.${requestId}&id=eq.${revisionId}&select=id,revision_number,document_hash,document&limit=1`);
 if(!rows[0])return sendJson(response,404,{message:'해당 접수 건의 저장 버전을 찾지 못했습니다.'});
 const inspection=prepareProductionPrintPreflight(requestId,rows[0],documentHash);
 if(action==='inspect')return sendJson(response,200,{inspection});
 if(!['status','request','download'].includes(action))return sendJson(response,400,{message:'검사 작업을 확인해 주세요.'});
 const identity=productionIdentity(requestId,rows[0]);
 if(action==='request'){
  if(!quickInspection||quickInspection.revisionId!==revisionId||quickInspection.documentHash!==documentHash||quickInspection.errors!==0||!Number.isInteger(quickInspection.warnings)||quickInspection.warnings<0||quickInspection.warnings>0&&warningsAccepted!==true)return sendJson(response,409,{message:'이 저장 버전의 빠른 검사를 완료하고 경고를 확인한 뒤 요청하세요.'});
  const receipts=await supabaseRequest(`calendar_production_requests?id=eq.${requestId}&select=id,owner_id,school_name,status,snapshot&limit=1`),receipt=receipts[0];
  if(!receipt||!['reviewing','changes'].includes(receipt.status))return sendJson(response,409,{message:'검수 중인 접수 건에서 인쇄 검사를 요청하세요.'});
  const origin=request.headers?.origin;
  let parsed;try{parsed=new URL(origin);}catch{return sendJson(response,400,{message:'검수 화면 주소를 확인할 수 없습니다.'});}
  const host=request.headers?.host;
  if(parsed.host!==host||!(parsed.protocol==='https:'||parsed.protocol==='http:'&&['localhost','127.0.0.1'].includes(parsed.hostname)))return sendJson(response,400,{message:'현재 검수 화면에서 검사를 요청하세요.'});
  const job=await requestProductionJob(receipt,rows[0],admin.id,parsed.origin,{force:force===true,quickInspection:{...quickInspection,warningsAccepted:warningsAccepted===true,confirmedBy:admin.id,confirmedAt:new Date().toISOString(),provenance:'administrator-submitted-quick-inspection'}});
  return sendJson(response,job.status==='queued'?202:200,{identity,job:publicProductionJob(job)});
 }
 const jobs=(await productionJobs(identity)).filter(job=>Object.keys(identity).every(key=>job.payload?.production?.[key]===identity[key]));
 if(action==='status')return sendJson(response,200,{identity,jobs:jobs.map(publicProductionJob)});
 const job=jobs.find(item=>item.id===jobId);
 if(!job||job.status!=='done'||!job.file_path)return sendJson(response,409,{message:'이 교정 버전의 완료된 PDF가 없습니다.'});
 const signed=await (await storage(`object/sign/print-pdfs/${job.file_path.split('/').map(encodeURIComponent).join('/')}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({expiresIn:300})})).json();
 const signedPath=signed.signedURL||signed.signedUrl;if(!signedPath)throw Error('PDF 다운로드 주소를 만들지 못했습니다.');
 const base=process.env.SUPABASE_URL.replace(/\/$/,'');
 return sendJson(response,200,{identity,jobId:job.id,downloadUrl:signedPath.startsWith('http')?signedPath:`${base}${signedPath.startsWith('/storage/v1/')?'':'/storage/v1'}${signedPath}`});
 }catch(error){return sendError(response,error);}}
