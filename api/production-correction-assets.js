import { randomUUID } from 'node:crypto';
import { assertInternalAccess,sendError,sendJson,supabaseRequest } from '../server/template-persistence.js';
import { uuid } from '../server/production-corrections.js';
import { BUCKET,MAX_BYTES,validateUpload,inspectRaster,storage,signedAsset } from '../server/production-correction-assets.js';
export default async function handler(request,response){
 try{
  const admin=await assertInternalAccess(request);response.setHeader('Cache-Control','no-store');
  if(request.method!=='POST'){response.setHeader('Allow','POST');return sendJson(response,405,{error:'METHOD_NOT_ALLOWED'});}
  const body=typeof request.body==='string'?JSON.parse(request.body):request.body;
  if(!uuid(body?.requestId)||!['prepare','finalize'].includes(body.action))return sendJson(response,400,{message:'이미지 업로드 요청을 확인해 주세요.'});
  const rows=await supabaseRequest(`calendar_production_requests?id=eq.${body.requestId}&select=id,status&limit=1`);
  if(!rows[0])return sendJson(response,404,{message:'접수 건을 찾지 못했습니다.'});
  if(!['reviewing','changes'].includes(rows[0].status))return sendJson(response,409,{message:'검수 중인 접수 건에만 교정 이미지를 업로드할 수 있습니다.'});
  if(body.action==='prepare'){
   try{validateUpload(body);}catch(e){return sendJson(response,400,{message:e.message});}
   const id=randomUUID(),path=`${body.requestId}/${id}`;
   await supabaseRequest('calendar_production_correction_assets',{method:'POST',body:JSON.stringify({id,request_id:body.requestId,path,name:body.name.trim(),mime_type:body.mimeType,byte_size:body.byteSize,created_by:admin.id,status:'pending'})});
   const signed=await storage(`object/upload/sign/${BUCKET}/${path}`,{method:'POST',headers:{'Content-Type':'application/json','x-upsert':'false'},body:'{}'}),value=await signed.json();
   const base=`${process.env.SUPABASE_URL.replace(/\/$/,'')}/storage/v1`,uploadUrl=new URL(`${base}${value.url}`);
   if(uploadUrl.origin!==new URL(base).origin||!uploadUrl.pathname.startsWith(`/storage/v1/object/upload/sign/${BUCKET}/${path}`)||!uploadUrl.searchParams.has('token'))throw new Error('Invalid signed upload URL');
   return sendJson(response,200,{id,uploadUrl:uploadUrl.href});
  }
  if(!uuid(body.assetId))return sendJson(response,400,{message:'업로드 파일 번호를 확인해 주세요.'});
  const assets=await supabaseRequest(`calendar_production_correction_assets?id=eq.${body.assetId}&request_id=eq.${body.requestId}&select=*&limit=1`),asset=assets[0];
  if(!asset)return sendJson(response,404,{message:'업로드 기록을 찾지 못했습니다.'});
  if(asset.status==='ready')return sendJson(response,200,{asset:await signedAsset(asset)});
  if(asset.path!==`${body.requestId}/${body.assetId}`)throw new Error('Invalid correction asset path');
  const file=await storage(`object/${BUCKET}/${asset.path}`),chunks=[];let total=0;
  for await(const chunk of file.body){total+=chunk.length;if(total>MAX_BYTES){await file.body.cancel?.().catch(()=>{});return sendJson(response,413,{message:'파일은 최대 25MB까지 업로드할 수 있습니다.'});}chunks.push(Buffer.from(chunk));}
  if(total!==Number(asset.byte_size))return sendJson(response,400,{message:'업로드 파일 크기가 일치하지 않습니다. 다시 업로드해 주세요.'});
  let info;try{info=inspectRaster(Buffer.concat(chunks));if(info.mimeType!==asset.mime_type)throw new Error('이미지 형식이 일치하지 않습니다.');}catch(e){return sendJson(response,400,{message:e.message});}
  const updated=await supabaseRequest(`calendar_production_correction_assets?id=eq.${body.assetId}&request_id=eq.${body.requestId}&status=eq.pending`,{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify({status:'ready',width:info.width,height:info.height,content_hash:info.contentHash})});
  let saved=updated[0];if(!saved){const ready=await supabaseRequest(`calendar_production_correction_assets?id=eq.${body.assetId}&request_id=eq.${body.requestId}&status=eq.ready&select=*&limit=1`);saved=ready[0];}if(!saved)return sendJson(response,409,{message:'업로드 완료 기록을 확인하지 못했습니다. 팝업을 다시 열어 주세요.'});
  return sendJson(response,200,{asset:await signedAsset(saved)});
 }catch(error){if(/calendar_production_correction_assets/.test(error.message||''))return sendJson(response,503,{message:'교정 이미지 업로드용 새 SQL(202610040001)을 적용한 뒤 다시 열어 주세요.'});return sendError(response,error);}
}
