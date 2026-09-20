import { assertInternalAccess, deleteTemplate, getTemplate, listDeletedCatalogKeys, listTemplates, readJson, saveVersion, sendError, sendJson, supabaseRequest } from '../server/template-persistence.js';
import { forwardReviewPackage } from '../server/user-service-review-publisher.js';

const UUID=/^[0-9a-f-]{36}$/i,SHA=/^[0-9a-f]{64}$/i;
function env(name){const value=process.env[name]?.trim();if(!value)throw Object.assign(new Error(`Missing ${name}`),{statusCode:503,code:'SERVER_NOT_CONFIGURED'});return value}
function record(value){return value&&typeof value==='object'&&!Array.isArray(value)?value:null}
async function storage(path,options={}){const url=env('SUPABASE_URL').replace(/\/$/,''),key=env('SUPABASE_SERVICE_ROLE_KEY'),result=await fetch(`${url}/storage/v1/${path}`,{...options,headers:{apikey:key,Authorization:`Bearer ${key}`,...options.headers}});if(!result.ok){const detail=await result.text().catch(()=>"");console.error('[editor-print-storage]',{status:result.status,path,detail:detail.slice(0,300)});throw Object.assign(new Error(`Storage request failed: ${result.status} · ${path}`),{statusCode:502,code:'STORAGE_FAILED'})}return result}
async function signedAsset(path){const result=await storage(`object/sign/template-packages/${path.split('/').map(encodeURIComponent).join('/')}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({expiresIn:3600})}),body=await result.json(),signed=body.signedURL||body.signedUrl;if(!signed)throw new Error('Signed asset URL missing');return signed.startsWith('http')?signed:`${env('SUPABASE_URL').replace(/\/$/,'')}${signed}`}
function resolveAssets(value,urls){if(typeof value==='string'&&value.startsWith('package-asset://'))return urls[value.slice(16)]||value;if(Array.isArray(value))return value.map(item=>resolveAssets(item,urls));const object=record(value);return object?Object.fromEntries(Object.entries(object).map(([key,item])=>[key,resolveAssets(item,urls)])):value}
async function printRenderSource(url){const query=new URL(url,'http://localhost').searchParams,jobId=query.get('printRenderJob')||'',sha256=query.get('sha256')||'';if(!UUID.test(jobId)||!SHA.test(sha256))throw Object.assign(new Error('Invalid render source identity'),{statusCode:400,code:'INVALID_RENDER_SOURCE_IDENTITY'});const jobs=await supabaseRequest(`template_print_preflight_jobs?select=id,template_id,template_version,package_sha256,package_storage_path,payload&id=eq.${encodeURIComponent(jobId)}&limit=1`),job=jobs[0];if(!job||job.package_sha256!==sha256)throw Object.assign(new Error('Render source not found'),{statusCode:404,code:'RENDER_SOURCE_NOT_FOUND'});const artifact=await storage(`object/template-packages/${String(job.package_storage_path).split('/').map(encodeURIComponent).join('/')}`),bundle=JSON.parse(await artifact.text()),urls={};for(const asset of Array.isArray(bundle.assets)?bundle.assets:[]){if(asset?.id&&asset?.storagePath)urls[asset.id]=await signedAsset(asset.storagePath)}const projectData=resolveAssets(bundle?.template?.projectData,urls);if(!projectData?.book?.pageInstances?.length)throw Object.assign(new Error('Package project data missing'),{statusCode:409,code:'PROJECT_DATA_MISSING'});return {schemaVersion:'editor-print-render-source.v1',rendererId:'template-editor-review-dom.v1',jobId,templateId:job.template_id,version:job.template_version,sha256,projectData}}

export default async function handler(request, response) {
  try {
    if (request.method === 'POST') {
      const body=await readJson(request);
      if(body?.operation==='publish-review'){
        const authorization=String(request.headers?.authorization||request.headers?.Authorization||'');
        return sendJson(response,200,await forwardReviewPackage({authorization,body:body.reviewBody}));
      }
      await assertInternalAccess(request);
      return sendJson(response, 201, await saveVersion(body));
    }
    if (request.method === 'GET') {
      const query=new URL(request.url,'http://localhost').searchParams;
      if(query.has('printRenderJob'))return sendJson(response,200,await printRenderSource(request.url));
      await assertInternalAccess(request);
      const templateId = query.get('id');
      if(templateId)return sendJson(response,200,await getTemplate(templateId));
      const startedAt=Date.now(),[templates,deletedCatalogKeys]=await Promise.all([listTemplates(),listDeletedCatalogKeys()]);
      console.log('[template-library] remote list loaded',{templateCount:templates.length,deletedCatalogKeyCount:deletedCatalogKeys.length,durationMs:Date.now()-startedAt});
      return sendJson(response,200,{templates,deletedCatalogKeys});
    }
    await assertInternalAccess(request);
    if (request.method === 'DELETE') return sendJson(response, 200, await deleteTemplate(await readJson(request)));
    response.setHeader('Allow', 'GET, POST, DELETE');
    return sendJson(response, 405, { error: 'METHOD_NOT_ALLOWED' });
  } catch (error) { return sendError(response, error); }
}
