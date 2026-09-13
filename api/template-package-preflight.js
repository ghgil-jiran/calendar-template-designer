import { createHash } from 'node:crypto';
import { assertInternalAccess, getTemplate, readTemplateAsset, sendError, sendJson } from '../server/template-persistence.js';
import { inspectTemplatePackage } from '../server/template-package-preflight.js';
import { buildTemplatePackageCandidate, deterministicJson } from '../server/template-package-candidate.js';

const REVIEW_CHUNK_BYTES=2*1024*1024;
const ASSET_MARKER=/^acdl-asset:\/\/([0-9a-f-]{36})$/i;
function collectAssetIds(value,ids=new Set()){
  if(typeof value==='string'){const match=value.match(ASSET_MARKER);if(match)ids.add(match[1]);return ids}
  if(Array.isArray(value)){for(const item of value)collectAssetIds(item,ids);return ids}
  if(value&&typeof value==='object')for(const item of Object.values(value))collectAssetIds(item,ids);
  return ids;
}
function replaceAssetMarkers(value){
  if(typeof value==='string'){const match=value.match(ASSET_MARKER);return match?`package-asset://${match[1]}`:value}
  if(Array.isArray(value))return value.map(replaceAssetMarkers);
  if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([key,item])=>[key,replaceAssetMarkers(item)]));
  return value;
}
async function packageCandidateAssets(candidate){
  const ids=[...collectAssetIds(candidate.packageBundle.template.projectData)].sort(),assets=[];
  for(const id of ids){
    const asset=await readTemplateAsset(id),sha256=createHash('sha256').update(asset.bytes).digest('hex');
    assets.push({id,mimeType:asset.mimeType,byteLength:asset.bytes.length,sha256,storagePath:`${candidate.templateId}/${candidate.version}/review/assets/${id}`,_bytes:asset.bytes});
  }
  const packageBundle=replaceAssetMarkers(candidate.packageBundle);
  packageBundle.assets=assets.map(({_bytes,...descriptor})=>descriptor);
  packageBundle.manifest.assets=packageBundle.assets;
  const bytes=Buffer.from(deterministicJson(packageBundle),'utf8'),sha256=createHash('sha256').update(bytes).digest('hex');
  return {...candidate,packageBundle,sha256,byteLength:bytes.length,assets};
}
async function postReview(origin,authorization,bypass,payload){
  const headers={'Content-Type':'application/json',Authorization:authorization};
  if(bypass)headers['x-vercel-protection-bypass']=bypass;
  const target=await fetch(`${origin}/api/template-packages/review`,{method:'POST',headers,body:JSON.stringify(payload)}),result=await target.json().catch(()=>({}));
  if(!target.ok)throw Object.assign(new Error(result.message||result.error||'User Service review registration failed'),{statusCode:target.status,code:'USER_SERVICE_REVIEW_REGISTRATION_FAILED',details:{upstreamStatus:target.status,upstreamError:result.error||null,upstreamMessage:result.message||null}});
  return result;
}
async function nextReviewVersion(origin,authorization,bypass,packageId,baseVersion){return (await postReview(origin,authorization,bypass,{mode:'next-version',packageId,baseVersion})).version}

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
    if(request.method==='GET'&&query.get('action')==='identity'){
      const classification=version?.projectData?.template?.classification||null;
      return sendJson(response,200,{classification,packageId:classification?.packageId||null,packageVersion:version?.projectData?.template?.publishing?.packageVersion||'1.0.0',sourceVersion:{templateId:template.id,versionId:version.id,versionNumber:version.versionNumber}});
    }
    if(request.method==='GET'&&query.get('action')==='candidate'){
      const origin=process.env.USER_SERVICE_ORIGIN?.replace(/\/$/,'');if(!origin)throw Object.assign(new Error('USER_SERVICE_ORIGIN is not configured'),{statusCode:503,code:'USER_SERVICE_NOT_CONFIGURED'});
      const packageId=query.get('packageId'),baseVersion=query.get('packageVersion'),authorization=request.headers.authorization||request.headers.Authorization,bypass=process.env.USER_SERVICE_BYPASS_SECRET||'',packageVersion=await nextReviewVersion(origin,authorization,bypass,packageId,baseVersion);
      return sendJson(response,200,buildTemplatePackageCandidate({template,version,packageId,packageVersion}));
    }
    if(request.method==='POST'){
      const origin=process.env.USER_SERVICE_ORIGIN?.replace(/\/$/,'');
      if(!origin)throw Object.assign(new Error('USER_SERVICE_ORIGIN is not configured'),{statusCode:503,code:'USER_SERVICE_NOT_CONFIGURED'});
      const authorization=request.headers.authorization||request.headers.Authorization;
      const bypass=process.env.USER_SERVICE_BYPASS_SECRET||'';
      const packageVersion=await nextReviewVersion(origin,authorization,bypass,body.packageId,body.packageVersion),candidate=await packageCandidateAssets(buildTemplatePackageCandidate({template,version,packageId:body.packageId,packageVersion}));
      const bytes=Buffer.from(deterministicJson(candidate.packageBundle),'utf8'),totalChunks=Math.ceil(bytes.length/REVIEW_CHUNK_BYTES);
      await Promise.all(Array.from({length:totalChunks},(_,index)=>{const chunk=bytes.subarray(index*REVIEW_CHUNK_BYTES,Math.min(bytes.length,(index+1)*REVIEW_CHUNK_BYTES));return postReview(origin,authorization,bypass,{mode:'chunk',sha256:candidate.sha256,index,totalChunks,data:chunk.toString('base64')})}));
      for(const asset of candidate.assets){
        const assetChunks=Math.ceil(asset._bytes.length/REVIEW_CHUNK_BYTES);
        for(let index=0;index<assetChunks;index+=1){const chunk=asset._bytes.subarray(index*REVIEW_CHUNK_BYTES,Math.min(asset._bytes.length,(index+1)*REVIEW_CHUNK_BYTES));await postReview(origin,authorization,bypass,{mode:'asset-chunk',packageSha256:candidate.sha256,assetId:asset.id,assetSha256:asset.sha256,mimeType:asset.mimeType,index,totalChunks:assetChunks,data:chunk.toString('base64')})}
      }
      const result=await postReview(origin,authorization,bypass,{mode:'finalize',sha256:candidate.sha256,totalChunks});
      return sendJson(response,201,{...result,sourceVersion:candidate.source,classification:candidate.classification});
    }
    return sendJson(response,200,inspectTemplatePackage(template,version));
  }catch(error){return sendError(response,error)}
}
