import { assertInternalAccess, readJson, readTemplateAsset, resolveTemplateAssets, resolveTemplateAssetsByPaths, sendError, sendJson, storeTemplateAsset } from '../server/template-persistence.js';

export default async function handler(request,response){
  try{
    await assertInternalAccess(request);
    if(request.method==='POST'){const body=await readJson(request);return sendJson(response,201,{asset:await storeTemplateAsset(body.dataUrl)})}
    if(request.method==='GET'){const params=new URL(request.url,'http://localhost').searchParams,contentId=params.get('content');if(contentId){const asset=await readTemplateAsset(contentId);response.statusCode=200;response.setHeader('Content-Type',asset.mimeType);response.setHeader('Content-Length',String(asset.bytes.length));response.setHeader('Cache-Control','private, max-age=300');return response.end(asset.bytes)}const paths=(params.get('paths')||'').split(',').map(value=>decodeURIComponent(value));if(paths.some(Boolean))return sendJson(response,200,{assets:await resolveTemplateAssetsByPaths(paths)});const ids=(params.get('ids')||'').split(',');return sendJson(response,200,{assets:await resolveTemplateAssets(ids)})}
    response.setHeader('Allow','GET, POST');return sendJson(response,405,{error:'METHOD_NOT_ALLOWED'});
  }catch(error){return sendError(response,error)}
}
