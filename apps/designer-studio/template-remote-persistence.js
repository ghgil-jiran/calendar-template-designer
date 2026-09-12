(function(root){
 const signedToMarker=new Map();
 let deletedCatalogKeys=[];
 const isRemote=()=>root.ACDL_LOCAL_API_PROXY===true||!['localhost','127.0.0.1',''].includes(root.location?.hostname||'');
 const accessToken=()=>root.ACDLAdminAuth?.accessToken?.()||'';
 async function request(path,options={}){
  if(!isRemote())throw Object.assign(new Error('로컬 환경에서는 브라우저 저장을 사용합니다.'),{code:'REMOTE_DISABLED'});
  const token=accessToken();if(!token)throw Object.assign(new Error('Master Admin 로그인이 필요합니다.'),{code:'AUTH_REQUIRED'});
  const response=await root.fetch(path,{...options,headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`,...options.headers}}),body=await response.json().catch(()=>({}));
  if(!response.ok){if(response.status===401)root.ACDLAdminAuth?.signOut?.();throw Object.assign(new Error(response.status===401?'로그인이 만료되었습니다. 다시 로그인해주세요.':response.status===403?'Master Admin 권한이 필요합니다.':response.status===503?'원격 저장 환경 설정이 필요합니다.':'원격 저장 요청에 실패했습니다.'),{code:body.error||'REMOTE_REQUEST_FAILED',status:response.status})}
  return body;
 }
 async function assetObjectUrl(id){
  const token=accessToken(),response=await root.fetch(`/api/template-assets?content=${encodeURIComponent(id)}`,{headers:{Authorization:`Bearer ${token}`}});
  if(!response.ok)throw Object.assign(new Error('저장된 이미지 자산을 불러오지 못했습니다.'),{code:'TEMPLATE_ASSET_DOWNLOAD_FAILED',status:response.status});
  return root.URL.createObjectURL(await response.blob())
 }
 function record(item){return {id:item.id,remoteId:item.id,stableKey:item.stableKey,name:item.name,description:item.description,edition:item.edition,state:item.state,isStandard:item.isStandard===true,type:item.productType,template:item.templateKey,version:item.latestVersionNumber,updatedAt:item.updatedAt,storage:'supabase',source:'local'}}
 function visit(value,callback){if(typeof value==='string'){callback(value);return}if(Array.isArray(value)){value.forEach(item=>visit(item,callback));return}if(value&&typeof value==='object')Object.values(value).forEach(item=>visit(item,callback))}
 function replace(value,replacements){if(typeof value==='string')return replacements.get(value)||value;if(Array.isArray(value))return value.map(item=>replace(item,replacements));if(value&&typeof value==='object'){for(const key of Object.keys(value))value[key]=replace(value[key],replacements);return value}return value}
 function legacyStoragePath(value){
  if(typeof value!=='string'||!value.includes('/storage/v1/object/sign/template-assets/'))return null;
  try{const path=new URL(value).pathname,prefix='/storage/v1/object/sign/template-assets/';if(!path.startsWith(prefix))return null;return path.slice(prefix.length).split('/').map(decodeURIComponent).join('/')}catch(_){return null}
 }
 function materializeAIDesignBackgrounds(projectData){
  root.ACDLProjectAssetResolver?.normalize?.(projectData);const store=projectData?.template?.resources||{},resources=[...(store.assets||[]),...(store.aiDesignAssets||[])],byId=new Map(resources.map(item=>[item.id,item.src]));
  Object.values(projectData?.book?.elementsByPage||{}).flat().filter(item=>item?.role==='ai-design-background').forEach(item=>{const resourceId=item.assetId||item.aiDesign?.resourceId;if(!item.src&&resourceId&&byId.get(resourceId))item.src=byId.get(resourceId)});
  return projectData
 }
 function aiDesignIntegrity(projectData){
  root.ACDLProjectAssetResolver?.normalize?.(projectData);const store=projectData?.template?.resources||{},resources=[...(store.assets||[]),...(store.aiDesignAssets||[])],backgrounds=Object.values(projectData?.book?.elementsByPage||{}).flat().filter(item=>item?.role==='ai-design-background'),byId=new Map(resources.map(item=>[item.id,item]));
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
 async function hydrateProjectData(projectData,{onProgress}={}){
  onProgress?.({phase:'asset-scan',completed:0,total:1});
  const copy=structuredClone(projectData),ids=new Set(),legacyUrls=new Map();visit(copy,value=>{const match=value.match(/^acdl-asset:\/\/([0-9a-f-]{36})$/i);if(match)ids.add(match[1]);else{const path=legacyStoragePath(value);if(path)legacyUrls.set(value,path)}});if(!ids.size&&!legacyUrls.size){onProgress?.({phase:'asset-resolve',completed:0,total:0});return assertAIDesignIntegrity(materializeAIDesignBackgrounds(copy))}
  onProgress?.({phase:'asset-resolve',completed:0,total:ids.size+legacyUrls.size});
  const result=ids.size?await request(`/api/template-assets?ids=${encodeURIComponent([...ids].join(','))}`):{assets:[]},replacements=new Map();
  await Promise.all((result.assets||[]).map(async asset=>{const marker=`acdl-asset://${asset.id}`,url=await assetObjectUrl(asset.id);replacements.set(marker,url);signedToMarker.set(url,marker)}));
  if(legacyUrls.size){const paths=[...new Set(legacyUrls.values())],legacy=await request(`/api/template-assets?paths=${paths.map(encodeURIComponent).join(',')}`),byPath=new Map((legacy.assets||[]).map(asset=>[asset.storagePath,asset]));await Promise.all([...legacyUrls].map(async([oldUrl,path])=>{const asset=byPath.get(path);if(!asset)return;const marker=`acdl-asset://${asset.id}`,url=await assetObjectUrl(asset.id);replacements.set(oldUrl,url);signedToMarker.set(url,marker)}))}
  const missing=[...ids].filter(id=>!replacements.has(`acdl-asset://${id}`)),missingLegacy=[...legacyUrls].filter(([url])=>!replacements.has(url));if(missing.length||missingLegacy.length)throw Object.assign(new Error(`저장된 이미지 자산 ${missing.length+missingLegacy.length}개를 불러오지 못했습니다.`),{code:'TEMPLATE_ASSETS_MISSING',missingAssetIds:missing,missingStoragePaths:missingLegacy.map(([,path])=>path)});
  const hydrated=materializeAIDesignBackgrounds(replace(copy,replacements));onProgress?.({phase:'asset-resolve',completed:ids.size+legacyUrls.size,total:ids.size+legacyUrls.size});return assertAIDesignIntegrity(hydrated);
 }
 async function list(){const body=await request('/api/templates');deletedCatalogKeys=Array.isArray(body.deletedCatalogKeys)?body.deletedCatalogKeys:[];return (body.templates||[]).map(record)}
 async function load(id,{onProgress,deferAssets=false}={}){onProgress?.({phase:'remote',completed:0,total:1});const result=await request(`/api/templates?id=${encodeURIComponent(id)}`);onProgress?.({phase:'remote',completed:1,total:1});if(result?.version?.projectData){const storedProjectData=structuredClone(result.version.projectData);result.version.storedProjectData=storedProjectData;if(!deferAssets)result.version.projectData=await hydrateProjectData(storedProjectData,{onProgress})}return result}
 async function save(input,options={}){const projectData=await prepareProjectData(input.projectData,options);options.onProgress?.({phase:'version',completed:1,total:1});const result=await request('/api/templates',{method:'POST',body:JSON.stringify({...input,projectData})});options.onProgress?.({phase:'complete',completed:1,total:1});return result}
 async function saveDraft(input){const projectData=await prepareProjectData(input.projectData);return request('/api/template-drafts',{method:'PUT',body:JSON.stringify({...input,projectData})})}
 async function versions(templateId){return request(`/api/template-versions?templateId=${encodeURIComponent(templateId)}`)}
 async function hydrateVersion(version){return version?.projectData?{...version,projectData:await hydrateProjectData(version.projectData)}:version}
 async function restore(templateId,versionId,saveNote){return request('/api/template-restore',{method:'POST',body:JSON.stringify({templateId,versionId,saveNote})})}
 async function packagePreflight(templateId){return request(`/api/template-package-preflight?templateId=${encodeURIComponent(templateId)}`)}
 async function packageCandidate(templateId,packageId,packageVersion){return request(`/api/template-package-preflight?action=candidate&templateId=${encodeURIComponent(templateId)}&packageId=${encodeURIComponent(packageId)}&packageVersion=${encodeURIComponent(packageVersion)}`)}
 async function registerReviewPackage(templateId,packageId,packageVersion){return request('/api/template-package-preflight',{method:'POST',body:JSON.stringify({templateId,packageId,packageVersion})})}
 async function remove({templateId=null,stableKey,hideCatalog=false}){return request('/api/templates',{method:'DELETE',body:JSON.stringify({templateId,stableKey,hideCatalog})})}
 root.ACDLTemplateRemotePersistence=Object.freeze({isRemote,hasSession:()=>Boolean(accessToken()),accessToken,list,load,save,saveDraft,versions,hydrateVersion,restore,packagePreflight,packageCandidate,registerReviewPackage,remove,deletedCatalogKeys:()=>[...deletedCatalogKeys],toLibraryRecord:record,materializeAIDesignBackgrounds,aiDesignIntegrity,assertAIDesignIntegrity,prepareProjectData,hydrateProjectData,assetObjectUrl,legacyStoragePath});
})(window);
