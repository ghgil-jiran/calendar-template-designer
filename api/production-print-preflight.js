import {assertInternalAccess,sendError,sendJson,supabaseRequest} from '../server/template-persistence.js';
import {uuid} from '../server/production-corrections.js';
import {prepareProductionPrintPreflight} from '../server/production-print-preflight.js';
export default async function handler(request,response){try{
 await assertInternalAccess(request);response.setHeader('Cache-Control','no-store');
 if(request.method!=='POST'){response.setHeader('Allow','POST');return sendJson(response,405,{message:'저장 버전의 검사 요청만 가능합니다.'});}
 const {requestId,revisionId,documentHash}=request.body||{};
 if(!uuid(requestId)||!uuid(revisionId)||!/^[a-f0-9]{64}$/.test(documentHash||''))return sendJson(response,400,{message:'접수 건·교정 버전·문서 해시를 확인해 주세요.'});
 const rows=await supabaseRequest(`calendar_production_revisions?request_id=eq.${requestId}&id=eq.${revisionId}&select=id,revision_number,document_hash,document&limit=1`);
 if(!rows[0])return sendJson(response,404,{message:'해당 접수 건의 저장 버전을 찾지 못했습니다.'});
 return sendJson(response,200,{inspection:prepareProductionPrintPreflight(requestId,rows[0],documentHash)});
 }catch(error){return sendError(response,error);}}
