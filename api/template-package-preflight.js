import { assertInternalAccess, getTemplate, sendError, sendJson } from '../server/template-persistence.js';
import { inspectTemplatePackage } from '../server/template-package-preflight.js';
import { buildTemplatePackageCandidate, deterministicJson } from '../server/template-package-candidate.js';

const REVIEW_CHUNK_BYTES=2*1024*1024;
async function postReview(origin,authorization,bypass,payload){
  const headers={'Content-Type':'application/json',Authorization:authorization};
  if(bypass)headers['x-vercel-protection-bypass']=bypass;
  const target=await fetch(`${origin}/api/template-packages/review`,{method:'POST',headers,body:JSON.stringify(payload)}),result=await target.json().catch(()=>({}));
  if(!target.ok)throw Object.assign(new Error(result.message||result.error||'User Service review registration failed'),{statusCode:target.status,code:'USER_SERVICE_REVIEW_REGISTRATION_FAILED'});
  return result;
}

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
      const bypass=process.env.USER_SERVICE_BYPASS_SECRET||'';
      const bytes=Buffer.from(deterministicJson(candidate.packageBundle),'utf8'),totalChunks=Math.ceil(bytes.length/REVIEW_CHUNK_BYTES);
      for(let index=0;index<totalChunks;index+=1){const chunk=bytes.subarray(index*REVIEW_CHUNK_BYTES,Math.min(bytes.length,(index+1)*REVIEW_CHUNK_BYTES));await postReview(origin,authorization,bypass,{mode:'chunk',sha256:candidate.sha256,index,totalChunks,data:chunk.toString('base64')})}
      const result=await postReview(origin,authorization,bypass,{mode:'finalize',sha256:candidate.sha256,totalChunks});
      return sendJson(response,201,{...result,sourceVersion:candidate.source,classification:candidate.classification});
    }
    return sendJson(response,200,inspectTemplatePackage(template,version));
  }catch(error){return sendError(response,error)}
}
