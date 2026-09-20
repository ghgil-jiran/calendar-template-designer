import { sendError, sendJson, supabaseRequest } from '../server/template-persistence.js';

const UUID=/^[0-9a-f-]{36}$/i;
const SHA=/^[0-9a-f]{64}$/i;
function env(name){const value=process.env[name]?.trim();if(!value)throw Object.assign(new Error(`Missing ${name}`),{statusCode:503,code:'SERVER_NOT_CONFIGURED'});return value}
function record(value){return value&&typeof value==='object'&&!Array.isArray(value)?value:null}
async function storage(path,options={}){const url=env('SUPABASE_URL').replace(/\/$/,''),key=env('SUPABASE_SERVICE_ROLE_KEY'),response=await fetch(`${url}/storage/v1/${path}`,{...options,headers:{apikey:key,Authorization:`Bearer ${key}`,...options.headers}});if(!response.ok)throw Object.assign(new Error(`Storage request failed: ${response.status}`),{statusCode:502,code:'STORAGE_FAILED'});return response}
async function signedAsset(path){const response=await storage(`object/sign/template-assets/${path.split('/').map(encodeURIComponent).join('/')}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({expiresIn:3600})}),body=await response.json(),signed=body.signedURL||body.signedUrl;if(!signed)throw new Error('Signed asset URL missing');return signed.startsWith('http')?signed:`${env('SUPABASE_URL').replace(/\/$/,'')}${signed}`}
function resolveAssets(value,urls){if(typeof value==='string'&&value.startsWith('package-asset://'))return urls[value.slice(16)]||value;if(Array.isArray(value))return value.map(item=>resolveAssets(item,urls));const object=record(value);return object?Object.fromEntries(Object.entries(object).map(([key,item])=>[key,resolveAssets(item,urls)])):value}

export default async function handler(request,response){
 try{
  if(request.method!=='GET'){response.setHeader('Allow','GET');return sendJson(response,405,{error:'METHOD_NOT_ALLOWED'})}
  const query=new URL(request.url,'http://localhost').searchParams,jobId=query.get('jobId')||'',sha256=query.get('sha256')||'';
  if(!UUID.test(jobId)||!SHA.test(sha256))return sendJson(response,400,{error:'INVALID_RENDER_SOURCE_IDENTITY'});
  const jobs=await supabaseRequest(`template_print_preflight_jobs?select=id,template_id,template_version,package_sha256,package_storage_path,payload&id=eq.${encodeURIComponent(jobId)}&limit=1`),job=jobs[0];
  if(!job||job.package_sha256!==sha256)return sendJson(response,404,{error:'RENDER_SOURCE_NOT_FOUND'});
  const artifact=await storage(`object/template-packages/${String(job.package_storage_path).split('/').map(encodeURIComponent).join('/')}`),bundle=JSON.parse(await artifact.text()),urls={};
  for(const asset of Array.isArray(bundle.assets)?bundle.assets:[]){if(asset?.id&&asset?.storagePath)urls[asset.id]=await signedAsset(asset.storagePath)}
  const projectData=resolveAssets(bundle?.template?.projectData,urls);
  if(!projectData?.book?.pageInstances?.length)throw Object.assign(new Error('Package project data missing'),{statusCode:409,code:'PROJECT_DATA_MISSING'});
  return sendJson(response,200,{schemaVersion:'editor-print-render-source.v1',rendererId:'template-editor-review-dom.v1',jobId,templateId:job.template_id,version:job.template_version,sha256,projectData});
 }catch(error){return sendError(response,error)}
}
