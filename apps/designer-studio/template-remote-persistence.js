(function(root){
 const signedToMarker=new Map();
 const isRemote=()=>!['localhost','127.0.0.1',''].includes(root.location?.hostname||'');
 const accessToken=()=>root.ACDLAdminAuth?.accessToken?.()||'';
 async function request(path,options={}){
  if(!isRemote())throw Object.assign(new Error('로컬 환경에서는 브라우저 저장을 사용합니다.'),{code:'REMOTE_DISABLED'});
  const token=accessToken();if(!token)throw Object.assign(new Error('Master Admin 로그인이 필요합니다.'),{code:'AUTH_REQUIRED'});
  const response=await root.fetch(path,{...options,headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`,...options.headers}}),body=await response.json().catch(()=>({}));
  if(!response.ok){if(response.status===401)root.ACDLAdminAuth?.signOut?.();throw Object.assign(new Error(response.status===401?'로그인이 만료되었습니다. 다시 로그인해주세요.':response.status===403?'Master Admin 권한이 필요합니다.':response.status===503?'원격 저장 환경 설정이 필요합니다.':'원격 저장 요청에 실패했습니다.'),{code:body.error||'REMOTE_REQUEST_FAILED',status:response.status})}
  return body;
 }
 function record(item){return {id:item.id,remoteId:item.id,stableKey:item.stableKey,name:item.name,description:item.description,edition:item.edition,state:item.state,isStandard:item.isStandard===true,type:item.productType,template:item.templateKey,version:item.latestVersionNumber,updatedAt:item.updatedAt,storage:'supabase',source:'local'}}
 function visit(value,callback){if(typeof value==='string'){callback(value);return}if(Array.isArray(value)){value.forEach(item=>visit(item,callback));return}if(value&&typeof value==='object')Object.values(value).forEach(item=>visit(item,callback))}
 function replace(value,replacements){if(typeof value==='string')return replacements.get(value)||value;if(Array.isArray(value))return value.map(item=>replace(item,replacements));if(value&&typeof value==='object'){for(const key of Object.keys(value))value[key]=replace(value[key],replacements);return value}return value}
 async function prepareProjectData(projectData){
  const copy=structuredClone(projectData),images=new Set();visit(copy,value=>{if(value.startsWith('data:image/'))images.add(value)});const replacements=new Map(signedToMarker);
  for(const dataUrl of images){const result=await request('/api/template-assets',{method:'POST',body:JSON.stringify({dataUrl})});replacements.set(dataUrl,`acdl-asset://${result.asset.id}`)}
  return replace(copy,replacements);
 }
 async function hydrateProjectData(projectData){
  const copy=structuredClone(projectData),ids=new Set();visit(copy,value=>{const match=value.match(/^acdl-asset:\/\/([0-9a-f-]{36})$/i);if(match)ids.add(match[1])});if(!ids.size)return copy;
  const result=await request(`/api/template-assets?ids=${encodeURIComponent([...ids].join(','))}`),replacements=new Map();
  (result.assets||[]).forEach(asset=>{const marker=`acdl-asset://${asset.id}`;replacements.set(marker,asset.url);signedToMarker.set(asset.url,marker)});return replace(copy,replacements);
 }
 async function list(){const body=await request('/api/templates');return (body.templates||[]).map(record)}
 async function load(id){const result=await request(`/api/templates?id=${encodeURIComponent(id)}`);if(result?.version?.projectData)result.version.projectData=await hydrateProjectData(result.version.projectData);return result}
 async function save(input){const projectData=await prepareProjectData(input.projectData);return request('/api/templates',{method:'POST',body:JSON.stringify({...input,projectData})})}
 async function saveDraft(input){const projectData=await prepareProjectData(input.projectData);return request('/api/template-drafts',{method:'PUT',body:JSON.stringify({...input,projectData})})}
 async function versions(templateId){return request(`/api/template-versions?templateId=${encodeURIComponent(templateId)}`)}
 async function hydrateVersion(version){return version?.projectData?{...version,projectData:await hydrateProjectData(version.projectData)}:version}
 async function restore(templateId,versionId,saveNote){return request('/api/template-restore',{method:'POST',body:JSON.stringify({templateId,versionId,saveNote})})}
 async function packagePreflight(templateId){return request(`/api/template-package-preflight?templateId=${encodeURIComponent(templateId)}`)}
 root.ACDLTemplateRemotePersistence=Object.freeze({isRemote,hasSession:()=>Boolean(accessToken()),accessToken,list,load,save,saveDraft,versions,hydrateVersion,restore,packagePreflight,toLibraryRecord:record,prepareProjectData,hydrateProjectData});
})(window);
