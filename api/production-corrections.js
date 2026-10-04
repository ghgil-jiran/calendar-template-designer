import { assertInternalAccess,sendError,sendJson,supabaseRequest } from '../server/template-persistence.js';
import { correctionAssets,signedAsset } from '../server/production-correction-assets.js';
import { uuid,applyCorrections,sealProductionDocument } from '../server/production-corrections.js';
import { loadProductionEditorSource } from '../server/production-editor-source.js';
import { validateEditorCorrection } from '../server/production-editor-corrections.js';
export default async function handler(request,response){
 try{
  const admin=await assertInternalAccess(request);response.setHeader('Cache-Control','no-store');
  if(!['GET','POST'].includes(request.method)){response.setHeader('Allow','GET, POST');return sendJson(response,405,{error:'METHOD_NOT_ALLOWED'});}
  const body=request.method==='POST'?(typeof request.body==='string'?JSON.parse(request.body):request.body):request.query;
  if(!uuid(body?.requestId))return sendJson(response,400,{message:'접수 번호를 확인해 주세요.'});
  const rows=await supabaseRequest(`calendar_production_requests?id=eq.${body.requestId}&select=id,status,snapshot&limit=1`),receipt=rows[0];
  if(!receipt)return sendJson(response,404,{message:'접수 건을 찾지 못했습니다.'});
  const revisions=await supabaseRequest(`calendar_production_revisions?request_id=eq.${body.requestId}&select=id,request_id,revision_number,base_revision_id,document_hash,note,created_by,created_at&order=revision_number.desc&limit=100`);
  if(revisions[0]){const latest=await supabaseRequest(`calendar_production_revisions?id=eq.${revisions[0].id}&request_id=eq.${body.requestId}&select=*&limit=1`);revisions[0]=latest[0]||revisions[0];}
  if(revisions[0]&&!revisions[0].document)throw new Error('최신 교정본을 읽지 못했습니다. 다시 열어 주세요.');
  let addedAssets=[],uploadAvailable=true;try{addedAssets=await correctionAssets(body.requestId);}catch(error){if(!/calendar_production_correction_assets/.test(error.message||''))throw error;uploadAvailable=false;}
  if(request.method==='GET'){
   const editorSource=body.editor==='1'?await loadProductionEditorSource(receipt.snapshot):undefined;
   let printInspection=null;
   if(editorSource&&revisions[0]){
    const packageId=`production-${revisions[0].id}`;
    const packages=await supabaseRequest(`template_packages?template_id=eq.${packageId}&select=template_id,version,package_sha256,publishing_contract&order=version.desc&limit=1`);
    if(packages[0])printInspection={templateId:packages[0].template_id,version:packages[0].version,sha256:packages[0].package_sha256};
   }
   return sendJson(response,200,{revisions,assets:await Promise.all(addedAssets.map(signedAsset)),uploadAvailable,...(editorSource?{editorSource,printInspection}:{})});
  }
  if(!['reviewing','changes'].includes(receipt.status))return sendJson(response,409,{message:'검수 중인 접수 건에서 교정본을 저장할 수 있습니다.'});
  if(!uuid(body.id)||body.baseRevisionId!=null&&!uuid(body.baseRevisionId)||typeof body.note!=='string'||!body.note.trim()||body.note.length>2000)return sendJson(response,400,{message:'교정 내용과 버전 정보를 확인해 주세요.'});
  const duplicate=revisions.find(r=>r.id===body.id);if(duplicate)return sendJson(response,200,{revision:duplicate});
  const latest=revisions[0];if((latest?.id||null)!==(body.baseRevisionId||null))return sendJson(response,409,{message:'다른 교정본이 저장되었습니다. 다시 불러온 뒤 작업해 주세요.'});
  let document;try{document=body.editorProject?await validateEditorCorrection(body.editorProject,latest?.document||receipt.snapshot.document,receipt.snapshot,body.requestId,[...(receipt.snapshot.assets||[]),...addedAssets]):applyCorrections(latest?.document||receipt.snapshot.document,body.patches,[...(receipt.snapshot.assets||[]),...addedAssets]);}catch(error){return sendJson(response,400,{message:error.message});}
  const hash=sealProductionDocument(document);
  const result=await supabaseRequest('rpc/save_calendar_production_revision',{method:'POST',body:JSON.stringify({p_id:body.id,p_request_id:body.requestId,p_base_revision_id:body.baseRevisionId||null,p_document:document,p_document_hash:hash,p_note:body.note.trim(),p_created_by:admin.id})});
  return sendJson(response,201,{revision:Array.isArray(result)?result[0]:result});
 }catch(error){if(/revision conflict/i.test(error.message||''))return sendJson(response,409,{message:'다른 교정본이 저장되었습니다. 팝업을 다시 열어 주세요.'});if(/calendar_production_revisions|save_calendar_production_revision/.test(error.message||''))return sendJson(response,503,{error:'CORRECTION_DATABASE_NOT_READY',message:'교정본 저장용 새 SQL(202610030002)을 Supabase에 적용한 뒤 팝업을 다시 열어 주세요.'});return sendError(response,error);}
}
