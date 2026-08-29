import { assertInternalAccess, readJson, resolveTemplateAssets, sendError, sendJson, storeTemplateAsset } from '../server/template-persistence.js';

export default async function handler(request,response){
  try{
    assertInternalAccess(request);
    if(request.method==='POST'){const body=await readJson(request);return sendJson(response,201,{asset:await storeTemplateAsset(body.dataUrl)})}
    if(request.method==='GET'){const ids=(new URL(request.url,'http://localhost').searchParams.get('ids')||'').split(',');return sendJson(response,200,{assets:await resolveTemplateAssets(ids)})}
    response.setHeader('Allow','GET, POST');return sendJson(response,405,{error:'METHOD_NOT_ALLOWED'});
  }catch(error){return sendError(response,error)}
}
