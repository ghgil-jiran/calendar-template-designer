import { assertInternalAccess, getTemplate, sendError, sendJson } from '../server/template-persistence.js';
import { buildTemplatePackageCandidate } from '../server/template-package-candidate.js';

export default async function handler(request,response){
 try{
  await assertInternalAccess(request);
  if(request.method!=='GET'){response.setHeader('Allow','GET');return sendJson(response,405,{error:'METHOD_NOT_ALLOWED'})}
  const query=new URL(request.url,'http://localhost').searchParams,templateId=query.get('templateId'),packageId=query.get('packageId'),packageVersion=query.get('packageVersion'),{template,version}=await getTemplate(templateId);
  return sendJson(response,200,buildTemplatePackageCandidate({template,version,packageId,packageVersion}));
 }catch(error){return sendError(response,error)}
}
