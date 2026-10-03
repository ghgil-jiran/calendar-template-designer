import { assertInternalAccess, sendError, sendJson, supabaseRequest } from '../server/template-persistence.js';

export default async function handler(request,response){
 try{
  await assertInternalAccess(request);
  response.setHeader('Cache-Control','no-store');
  if(request.method==='PATCH'){
   const body=typeof request.body==='string'?JSON.parse(request.body):request.body;
   const requestId=String(body?.id||'');
   if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(requestId)||body?.action!=='start-review')return sendJson(response,400,{error:'INVALID_REVIEW_ACTION',message:'검수 시작 요청을 확인해 주세요.'});
   const fields='id,receipt_number,school_name,status,created_at';
   const changed=await supabaseRequest(`calendar_production_requests?id=eq.${encodeURIComponent(requestId)}&status=eq.received&select=${fields}`,{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify({status:'reviewing'})});
   if(changed?.[0])return sendJson(response,200,{receipt:changed[0]});
   const rows=await supabaseRequest(`calendar_production_requests?id=eq.${encodeURIComponent(requestId)}&select=${fields}&limit=1`);
   if(!rows[0])return sendJson(response,404,{error:'REQUEST_NOT_FOUND',message:'접수 건을 찾지 못했습니다.'});
   if(rows[0].status==='reviewing')return sendJson(response,200,{receipt:rows[0]});
   return sendJson(response,409,{error:'REVIEW_STATE_CHANGED',message:'접수 상태가 변경되어 검수를 시작할 수 없습니다. 팝업을 다시 열어 주세요.'});
  }
  if(request.method!=='GET'){response.setHeader('Allow','GET, PATCH');return sendJson(response,405,{error:'METHOD_NOT_ALLOWED'})}
  const id=String(request.query?.id||'');
  if(id){
   if(!/^[0-9a-f-]{36}$/i.test(id))return sendJson(response,400,{error:'INVALID_REQUEST_ID'});
   const rows=await supabaseRequest(`calendar_production_requests?select=*&id=eq.${encodeURIComponent(id)}&limit=1`),receipt=rows[0];
   if(!receipt)return sendJson(response,404,{error:'REQUEST_NOT_FOUND'});
   const url=process.env.SUPABASE_URL?.replace(/\/$/,''),key=process.env.SUPABASE_SERVICE_ROLE_KEY;
   const assets=await Promise.all((receipt.snapshot?.assets||[]).map(async asset=>{
    if(!String(asset.path).startsWith(`${receipt.owner_id}/${receipt.id}/`))throw new Error('Invalid receipt asset path');
    const result=await fetch(`${url}/storage/v1/object/sign/calendar-production-assets/${asset.path}`,{method:'POST',headers:{apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify({expiresIn:3600})});
    if(!result.ok)throw Object.assign(new Error('접수 원본을 열지 못했습니다.'),{statusCode:502,code:'RECEIPT_ASSET_FAILED'});
    const signed=await result.json(),path=signed.signedURL||signed.signedUrl;
    return {...asset,url:path.startsWith('http')?path:`${url}${path.startsWith("/storage/v1/")?"":"/storage/v1"}${path}`};
   }));
   return sendJson(response,200,{receipt,assets});
  }
  const query=String(request.query?.search||'').trim().slice(0,100),status=String(request.query?.status||'all'),offset=Math.max(0,Math.floor(Number(request.query?.offset)||0));
  let filter='';
  if(query){const safe=query.replace(/[,*().]/g,'');filter+=/^\d+$/.test(safe)?`&receipt_number=eq.${safe}`:`&school_name=ilike.${encodeURIComponent(`*${safe}*`)}`}
  if(['received','reviewing','changes','approved','sent'].includes(status))filter+=`&status=eq.${status}`;
  const receipts=await supabaseRequest(`calendar_production_requests?select=id,receipt_number,school_name,status,created_at,snapshot_hash,template_id:snapshot->doc->meta->>templateId,template_version:snapshot->doc->meta->>templateVersion&order=created_at.desc&limit=50&offset=${offset}${filter}`);
  return sendJson(response,200,{receipts,hasMore:receipts.length===50});
 }catch(error){return sendError(response,error)}
}
