import {assertInternalAccess,sendError,sendJson,supabaseRequest} from '../server/template-persistence.js';import {uuid} from '../server/production-corrections.js';import {validateJobInspection,publicImageJob} from '../server/production-image-jobs.js';
export default async function handler(request,response){try{
 const admin=await assertInternalAccess(request);response.setHeader('Cache-Control','no-store');
 if(!['GET','POST'].includes(request.method))return sendJson(response,405,{message:'조회·이미지 준비 요청만 가능합니다.'});
 const input=request.method==='POST'?request.body:request.query;const {requestId,revisionId}=input||{};
 if(!uuid(requestId)||!uuid(revisionId))return sendJson(response,400,{message:'접수와 저장 버전을 확인해 주세요.'});
 const revisions=await supabaseRequest(`calendar_production_revisions?request_id=eq.${requestId}&id=eq.${revisionId}&select=id,document_hash,document,revision_number&limit=1`);if(!revisions[0])return sendJson(response,404,{message:'저장 버전을 찾지 못했습니다.'});
 if(request.method==='GET'){const rows=await supabaseRequest(`calendar_production_image_jobs?request_id=eq.${requestId}&revision_id=eq.${revisionId}&order=created_at.desc&limit=10`);return sendJson(response,200,{jobs:rows.map(publicImageJob)});}
 if(!uuid(input.id))return sendJson(response,400,{message:'작업 식별자가 필요합니다.'});
 let inspection;try{inspection=validateJobInspection(revisions[0],requestId,input.inspection);}catch(error){return sendJson(response,409,{message:error.message});}
 const rows=await supabaseRequest('rpc/enqueue_calendar_production_image_job',{method:'POST',body:JSON.stringify({p_id:input.id,p_request_id:requestId,p_revision_id:revisionId,p_document_hash:revisions[0].document_hash,p_content_hash:inspection.plan.contentHash,p_inspection:inspection,p_created_by:admin.id})});
 return sendJson(response,202,{job:publicImageJob(rows[0])});
 }catch(error){return sendError(response,error);}}
