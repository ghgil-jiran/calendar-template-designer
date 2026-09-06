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
 function materializeAIDesignBackgrounds(projectData){
  const resources=projectData?.template?.resources?.aiDesignAssets||[],byId=new Map(resources.map(item=>[item.id,item.src]));
  Object.values(projectData?.book?.elementsByPage||{}).flat().filter(item=>item?.role==='ai-design-background').forEach(item=>{const resourceId=item.assetId||item.aiDesign?.resourceId;if(!item.src&&resourceId&&byId.get(resourceId))item.src=byId.get(resourceId)});
  return projectData
 }
 function aiDesignIntegrity(projectData){
  const resources=projectData?.template?.resources?.aiDesignAssets||[],backgrounds=Object.values(projectData?.book?.elementsByPage||{}).flat().filter(item=>item?.role==='ai-design-background'),byId=new Map(resources.map(item=>[item.id,item]));
  const unresolved=backgrounds.filter(item=>{const resourceId=item.assetId||item.aiDesign?.resourceId;return !item.src&&!(resourceId&&byId.get(resourceId)?.src)});
  const draftStatus=String(projectData?.template?.aiDesignDraft?.status||''),expectsBackgrounds=Boolean(resources.length||draftStatus.includes('applied')||draftStatus.includes('complete'));
  return {expectsBackgrounds,resourceCount:resources.length,backgroundCount:backgrounds.length,resolvedBackgroundCount:backgrounds.length-unresolved.length,unresolvedBackgroundIds:unresolved.map(item=>item.id||'(unknown)')}
 }
 function assertAIDesignIntegrity(projectData){const integrity=aiDesignIntegrity(projectData);if(integrity.expectsBackgrounds&&(!integrity.resourceCount||!integrity.backgroundCount||integrity.resolvedBackgroundCount!==integrity.backgroundCount))throw Object.assign(new Error('AI 디자인 배경이 완전하지 않아 템플릿을 저장하거나 열 수 없습니다.'),{code:'AI_DESIGN_INCOMPLETE',integrity});return projectData}
 async function prepareProjectData(projectData,{onProgress,concurrency=4}={}){
  const copy=assertAIDesignIntegrity(materializeAIDesignBackgrounds(structuredClone(projectData))),images=new Set();visit(copy,value=>{if(value.startsWith('data:image/'))images.add(value)});const replacements=new Map(signedToMarker);
  const pending=[...images],total=pending.length;let completed=0,next=0;onProgress?.({phase:'assets',completed,total});
  const worker=async()=>{while(next<total){const index=next++,dataUrl=pending[index],result=await request('/api/template-assets',{method:'POST',body:JSON.stringify({dataUrl})});replacements.set(dataUrl,`acdl-asset://${result.asset.id}`);completed+=1;onProgress?.({phase:'assets',completed,total})}};
  await Promise.all(Array.from({length:Math.min(Math.max(1,Number(concurrency)||1),total||1)},worker));
  return assertAIDesignIntegrity(replace(copy,replacements));
 }
 async function hydrateProjectData(projectData){
  const copy=structuredClone(projectData),ids=new Set();visit(copy,value=>{const match=value.match(/^acdl-asset:\/\/([0-9a-f-]{36})$/i);if(match)ids.add(match[1])});if(!ids.size)return assertAIDesignIntegrity(materializeAIDesignBackgrounds(copy));
  const result=await request(`/api/template-assets?ids=${encodeURIComponent([...ids].join(','))}`),replacements=new Map();
  (result.assets||[]).forEach(asset=>{const marker=`acdl-asset://${asset.id}`;replacements.set(marker,asset.url);signedToMarker.set(asset.url,marker)});
  const missing=[...ids].filter(id=>!replacements.has(`acdl-asset://${id}`));if(missing.length)throw Object.assign(new Error(`저장된 이미지 자산 ${missing.length}개를 불러오지 못했습니다.`),{code:'TEMPLATE_ASSETS_MISSING',missingAssetIds:missing});
  const hydrated=materializeAIDesignBackgrounds(replace(copy,replacements));return assertAIDesignIntegrity(hydrated);
 }
 async function list(){const body=await request('/api/templates');return (body.templates||[]).map(record)}
 async function load(id){const result=await request(`/api/templates?id=${encodeURIComponent(id)}`);if(result?.version?.projectData)result.version.projectData=await hydrateProjectData(result.version.projectData);return result}
 async function save(input,options={}){const projectData=await prepareProjectData(input.projectData,options);options.onProgress?.({phase:'version',completed:1,total:1});const result=await request('/api/templates',{method:'POST',body:JSON.stringify({...input,projectData})});options.onProgress?.({phase:'complete',completed:1,total:1});return result}
 async function saveDraft(input){const projectData=await prepareProjectData(input.projectData);return request('/api/template-drafts',{method:'PUT',body:JSON.stringify({...input,projectData})})}
 async function versions(templateId){return request(`/api/template-versions?templateId=${encodeURIComponent(templateId)}`)}
 async function hydrateVersion(version){return version?.projectData?{...version,projectData:await hydrateProjectData(version.projectData)}:version}
 async function restore(templateId,versionId,saveNote){return request('/api/template-restore',{method:'POST',body:JSON.stringify({templateId,versionId,saveNote})})}
 async function packagePreflight(templateId){return request(`/api/template-package-preflight?templateId=${encodeURIComponent(templateId)}`)}
 root.ACDLTemplateRemotePersistence=Object.freeze({isRemote,hasSession:()=>Boolean(accessToken()),accessToken,list,load,save,saveDraft,versions,hydrateVersion,restore,packagePreflight,toLibraryRecord:record,materializeAIDesignBackgrounds,aiDesignIntegrity,assertAIDesignIntegrity,prepareProjectData,hydrateProjectData});
})(window);
