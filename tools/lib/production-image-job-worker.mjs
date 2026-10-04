import {supabaseRequest} from '../../server/template-persistence.js';
import {uuid} from '../../server/production-corrections.js';
export async function runProductionImageJob({id,execute,query=supabaseRequest}){
 if(!uuid(id))throw Error('유효한 이미지 준비 Job ID가 필요합니다.');
 const [job]=await query('rpc/claim_calendar_production_image_job',{method:'POST',body:JSON.stringify({p_id:id})});
 if(!job)throw Error('대기 또는 만료된 작업만 실행할 수 있습니다.');
 const update=async(status,progress,result=null,error=null)=>{const rows=await query('rpc/update_calendar_production_image_job',{method:'POST',body:JSON.stringify({p_id:id,p_token:job.worker_token,p_status:status,p_progress:progress,p_result:result,p_error:error})});if(!rows.length)throw Error('Worker 작업 소유권이 만료되거나 변경되었습니다.');};
 try{
  const result=await execute(job,p=>update('processing',p));
  if(result?.revisionId!==job.revision_id||result.documentHash!==job.document_hash||result.contentHash!==job.content_hash||result.finalApproved!==false||result.schemaVersion!=='production-cmyk-images.v1')throw Error('다른 버전의 결과를 작업에 저장할 수 없습니다.');
  await update('prepared',{stage:'prepared',completed:result.derived.length,total:result.derived.length},result);return result;
 }catch(error){try{await update('failed',{stage:'failed'},null,error.message);}catch{/* Lost owners must not change the current worker's record. */}throw error;}
}
