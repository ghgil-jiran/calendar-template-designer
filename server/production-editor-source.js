import { createHash } from 'node:crypto';
import { supabaseRequest } from './template-persistence.js';

export async function loadProductionEditorSource(snapshot) {
  const id=snapshot?.doc?.meta?.templateId,version=snapshot?.doc?.meta?.templateVersion;
  if(!/^[a-z0-9][a-z0-9-]*$/.test(id||'')||!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(version||''))throw Object.assign(new Error('접수 당시 템플릿 ID와 버전을 확인할 수 없습니다.'),{statusCode:409});
  const rows=await supabaseRequest(`template_packages?template_id=eq.${encodeURIComponent(id)}&version=eq.${encodeURIComponent(version)}&select=package_storage_path,package_sha256&limit=1`),row=rows[0];
  if(!row?.package_storage_path?.startsWith(`${id}/${version}/`))throw Object.assign(new Error('접수 당시 정확한 템플릿 패키지를 찾지 못했습니다. 최신 템플릿으로 대체하지 않습니다.'),{statusCode:409});
  const base=process.env.SUPABASE_URL?.replace(/\/$/,''),key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  const response=await fetch(`${base}/storage/v1/object/template-packages/${row.package_storage_path.split('/').map(encodeURIComponent).join('/')}`,{headers:{apikey:key,Authorization:`Bearer ${key}`}});
  if(!response.ok)throw new Error('접수 템플릿 프로젝트를 읽지 못했습니다.');
  const bytes=Buffer.from(await response.arrayBuffer());
  if(createHash('sha256').update(bytes).digest('hex')!==row.package_sha256)throw new Error('접수 템플릿 패키지 해시가 일치하지 않습니다.');
  const bundle=JSON.parse(bytes.toString('utf8'));
  if(bundle.manifest?.templateId!==id||bundle.manifest?.version!==version||bundle.template?.kind!=='designer-project-snapshot'||bundle.template?.projectData?.format!=='acdl-project')throw Object.assign(new Error('이 템플릿은 에디터 프로젝트 교정을 지원하지 않습니다.'),{statusCode:409});
  const assets=await Promise.all((bundle.assets||[]).map(async asset=>{
    if(!asset.storagePath?.startsWith(`${id}/${version}/assets/`))throw new Error('패키지 원본 경로가 일치하지 않습니다.');
    const signed=await fetch(`${base}/storage/v1/object/sign/template-packages/${asset.storagePath.split('/').map(encodeURIComponent).join('/')}`,{method:'POST',headers:{apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify({expiresIn:3600})});
    if(!signed.ok)throw new Error('패키지 원본을 열지 못했습니다.');
    const data=await signed.json(),path=data.signedURL||data.signedUrl;
    if(!path)throw new Error('패키지 원본 주소가 없습니다.');
    return {marker:`package-asset://${asset.id}`,url:path.startsWith('http')?path:`${base}${path.startsWith('/storage/v1/')?'':'/storage/v1'}${path}`};
  }));
  return {projectData:bundle.template.projectData,identity:{templateId:id,version,sha256:row.package_sha256},assets};
}
