import {assertInternalAccess,sendError,sendJson,supabaseRequest} from '../server/template-persistence.js';
import {uuid} from '../server/production-corrections.js';
import {inspectProductionPrintReadiness} from '../server/production-print-readiness.js';
export default async function handler(request,response){try{
 await assertInternalAccess(request);response.setHeader('Cache-Control','no-store');
 if(request.method!=='GET'){response.setHeader('Allow','GET');return sendJson(response,405,{message:'조회만 가능합니다.'});}
 const {requestId,revisionId}=request.query||{};if(!uuid(requestId)||!uuid(revisionId))return sendJson(response,400,{message:'접수 건과 교정 버전을 확인해 주세요.'});
 const rows=await supabaseRequest(`calendar_production_revisions?request_id=eq.${requestId}&id=eq.${revisionId}&select=id,revision_number,document_hash,document&limit=1`);
 if(!rows[0])return sendJson(response,404,{message:'해당 접수 건의 교정 버전을 찾지 못했습니다.'});
 return sendJson(response,200,{report:inspectProductionPrintReadiness(rows[0])});
 }catch(error){return sendError(response,error);}}
