import { assertInternalAccess, getTemplate, sendError, sendJson } from '../server/template-persistence.js';
import { inspectTemplatePackage } from '../server/template-package-preflight.js';

export default async function handler(request,response){
  try{
    await assertInternalAccess(request);
    if(request.method!=='GET'){
      response.setHeader('Allow','GET');
      return sendJson(response,405,{error:'METHOD_NOT_ALLOWED'});
    }
    const templateId=new URL(request.url,'http://localhost').searchParams.get('templateId');
    const {template,version}=await getTemplate(templateId);
    return sendJson(response,200,inspectTemplatePackage(template,version));
  }catch(error){return sendError(response,error)}
}
