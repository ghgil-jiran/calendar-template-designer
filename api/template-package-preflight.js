import { assertInternalAccess, getTemplate, sendError, sendJson } from '../server/template-persistence.js';
import { inspectTemplatePackage } from '../server/template-package-preflight.js';
import { buildTemplatePackageCandidate } from '../server/template-package-candidate.js';

export default async function handler(request,response){
  try{
    await assertInternalAccess(request);
    if(!['GET','POST'].includes(request.method)){
      response.setHeader('Allow','GET, POST');
      return sendJson(response,405,{error:'METHOD_NOT_ALLOWED'});
    }
    const query=new URL(request.url,'http://localhost').searchParams;
    const body=typeof request.body==='string'?JSON.parse(request.body):request.body||{};
    const templateId=request.method==='POST'?body.templateId:query.get('templateId');
    const {template,version}=await getTemplate(templateId);
    if(request.method==='GET'&&query.get('action')==='candidate'){
      return sendJson(response,200,buildTemplatePackageCandidate({template,version,packageId:query.get('packageId'),packageVersion:query.get('packageVersion')}));
    }
    if(request.method==='POST'){
      const origin=process.env.USER_SERVICE_ORIGIN?.replace(/\/$/,'');
      if(!origin)throw Object.assign(new Error('USER_SERVICE_ORIGIN is not configured'),{statusCode:503,code:'USER_SERVICE_NOT_CONFIGURED'});
      const candidate=buildTemplatePackageCandidate({template,version,packageId:body.packageId,packageVersion:body.packageVersion});
      const authorization=request.headers.authorization||request.headers.Authorization;
      const target=await fetch(`${origin}/api/template-packages/review`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:authorization},body:JSON.stringify({sha256:candidate.sha256,packageBundle:candidate.packageBundle})});
      const result=await target.json().catch(()=>({}));
      if(!target.ok)throw Object.assign(new Error(result.message||result.error||'User Service review registration failed'),{statusCode:target.status,code:'USER_SERVICE_REVIEW_REGISTRATION_FAILED'});
      return sendJson(response,201,{...result,sourceVersion:candidate.source,classification:candidate.classification});
    }
    return sendJson(response,200,inspectTemplatePackage(template,version));
  }catch(error){return sendError(response,error)}
}
