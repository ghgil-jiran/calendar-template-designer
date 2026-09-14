(function(root){
 const CHUNK_BYTES=1800*1024;
 const encoder=new TextEncoder();
 function stable(value){if(Array.isArray(value))return value.map(stable);if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).sort().map(key=>[key,stable(value[key])]));return value}
 function deterministic(value){return JSON.stringify(stable(value),null,2)+'\n'}
 function hex(bytes){return [...new Uint8Array(bytes)].map(value=>value.toString(16).padStart(2,'0')).join('')}
 async function sha256(bytes){return hex(await root.crypto.subtle.digest('SHA-256',bytes))}
 function packageId(input){const clean=String(input||'').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');return clean&&/^[a-z0-9]/.test(clean)?clean.slice(0,80):`template-${Date.now()}`}
 function publicationIdentity(project,currentName='',record={}){const existing=project?.template?.publishing?.packageId||project?.template?.package?.id||record.packageId,temporary=/^(?:\d{8}_\d+|새 템플릿|이름 없는 템플릿)$/.test(String(currentName).trim()),type=project?.productType?.category||record.type||'desk',size=project?.productType?.pageSize||{},spec=project?.template?.settings?.aiDesignSpec||{},style=spec.styleSnapshots?.find(item=>item.id===spec.styleId),serial=String(currentName).match(/(?:_|·\s*)(\d+)$/)?.[1]||'1',sequence=String(Number(serial)||1).padStart(2,'0'),typeName=type==='desk'?'탁상형':type==='wall'?'벽걸이형':type==='poster'?'연간 포스터형':type,width=Number(size.width)||0,height=Number(size.height)||0,front=Number(project?.settings?.frontInsertCount)||0,rear=Number(project?.settings?.rearInsertCount)||0,composition=front||rear?[front&&`앞간지 ${front*2}면`,rear&&`뒷간지 ${rear*2}면`].filter(Boolean).join(' · '):'기본 구성',name=temporary?`${typeName} ${width}×${height} · ${composition} · ${style?.name||'기본 디자인'} · ${sequence}`:currentName||record.name||'이름 없는 템플릿',id=existing||`${type}-${width}x${height}-${front||rear?'custom':'basic'}-${spec.styleId||'design'}-${sequence}`;return {name,id:packageId(id)}}
 function semver(input){return /^\d+\.\d+\.\d+$/.test(String(input||''))?String(input):'1.0.0'}
 async function request(body){
  const token=root.ACDLTemplateRemotePersistence?.accessToken?.()||root.ACDLAdminAuth?.accessToken?.();if(!token)throw new Error('게시하려면 Master Admin 로그인이 필요합니다.');
  const response=await root.fetch('/api/templates',{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({operation:'publish-review',reviewBody:body})}),result=await response.json().catch(()=>({}));
  if(!response.ok){const error=new Error(result.message||result.error||'사용자 서비스로 템플릿을 보내지 못했습니다.');error.code=result.error||'USER_SERVICE_REVIEW_FAILED';throw error}return result
 }
 function progress(stage,detail='',completed=0,total=1){root.ACDLTemplateSaveProgress?.({phase:'publishing',stage,detail,completed,total})}
 function confirmPublish({name,id,currentVersion,nextVersion}){
  return new Promise(resolve=>{
   let dialog=document.getElementById('templatePublishConfirmDialog');
   if(!dialog){dialog=document.createElement('div');dialog.id='templatePublishConfirmDialog';dialog.className='template-save-dialog hidden';dialog.innerHTML='<div class="template-save-card" role="alertdialog" aria-modal="true" aria-labelledby="templatePublishConfirmTitle"><h2 id="templatePublishConfirmTitle">사용자 서비스 게시</h2><p>새 검토 버전을 만든 뒤 같은 템플릿의 이전 버전을 사용자 서비스 목록에서 내리고 보관합니다.</p><div class="template-delete-target"><span>템플릿</span><strong data-publish-name></strong></div><div class="template-delete-target"><span>Package</span><strong data-publish-id></strong></div><div class="template-delete-target"><span>버전</span><strong data-publish-version></strong></div><p class="save-feedback info">새 버전이 완전히 검증되기 전에는 기존 버전이 유지됩니다. Production에는 게시하지 않습니다.</p><div class="template-save-actions"><button type="button" data-publish-cancel>취소</button><button type="button" class="primary" data-publish-confirm>게시 진행</button></div></div>';document.body.appendChild(dialog)}
   dialog.querySelector('[data-publish-name]').textContent=name;dialog.querySelector('[data-publish-id]').textContent=id;dialog.querySelector('[data-publish-version]').textContent=`${currentVersion} → ${nextVersion}`;dialog.classList.remove('hidden');
   const finish=value=>{dialog.classList.add('hidden');dialog.querySelector('[data-publish-cancel]').onclick=null;dialog.querySelector('[data-publish-confirm]').onclick=null;resolve(value)};dialog.querySelector('[data-publish-cancel]').onclick=()=>finish(false);dialog.querySelector('[data-publish-confirm]').onclick=()=>finish(true)
  })
 }
 async function inlineBlobUrls(value,cache=new Map()){
  if(typeof value==='string'&&value.startsWith('blob:')){
   if(cache.has(value))return cache.get(value);const blob=await root.fetch(value).then(response=>{if(!response.ok)throw new Error('게시 이미지 원본을 읽지 못했습니다.');return response.blob()}),dataUrl=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(new Error('게시 이미지를 변환하지 못했습니다.'));reader.readAsDataURL(blob)});cache.set(value,dataUrl);return dataUrl
  }
  if(Array.isArray(value))return Promise.all(value.map(item=>inlineBlobUrls(item,cache)));
  if(value&&typeof value==='object'){const output={};for(const [key,item] of Object.entries(value))output[key]=await inlineBlobUrls(item,cache);return output}
  return value
 }
 function dataUrlBytes(value){
  const match=/^data:(image\/[^;,]+)(;base64)?,([\s\S]*)$/.exec(value);if(!match)return null;
  const binary=match[2]?atob(match[3]):decodeURIComponent(match[3]),bytes=new Uint8Array(binary.length);for(let index=0;index<binary.length;index++)bytes[index]=binary.charCodeAt(index);return {mimeType:match[1],bytes}
 }
 function assetUuid(digest){const chars=digest.slice(0,32).split('');chars[12]='4';chars[16]=['8','9','a','b'][parseInt(chars[16],16)%4];return `${chars.slice(0,8).join('')}-${chars.slice(8,12).join('')}-${chars.slice(12,16).join('')}-${chars.slice(16,20).join('')}-${chars.slice(20,32).join('')}`}
 async function externalizeAssets(value,{templateId,version}){
  const byDigest=new Map(),assets=[];
  async function visit(item){
   if(typeof item==='string'&&item.startsWith('data:image/')){const parsed=dataUrlBytes(item);if(!parsed)return item;const digest=await sha256(parsed.bytes);let asset=byDigest.get(digest);if(!asset){const id=assetUuid(digest);asset={id,mimeType:parsed.mimeType,byteLength:parsed.bytes.byteLength,sha256:digest,storagePath:`${templateId}/${version}/assets/${id}`,bytes:parsed.bytes};byDigest.set(digest,asset);assets.push(asset)}return `package-asset://${asset.id}`}
   if(Array.isArray(item))return Promise.all(item.map(visit));
   if(item&&typeof item==='object'){const output={};for(const [key,child] of Object.entries(item))output[key]=await visit(child);return output}return item
  }
  const project=await visit(value);return {project,assets}
 }
 function bindings(project,id,version){const requirements=project?.template?.publishing?.dataRequirements||[];return {contractVersion:'2.0',templateId:id,templateVersion:version,bindings:requirements.map(item=>({path:item.path,required:item.stage==='project-create-required',status:'current',missing:item.stage==='project-create-required'?'error':item.fallback||'empty'}))}}
 function printProfile(project,id,version){const size=project?.productType?.pageSize||{},settings=project?.template?.resources?.exportSettings||{};return {schemaVersion:'print-profile.v1-draft',templateId:id,version,trimSize:{width:Number(size.width)||0,height:Number(size.height)||0,unit:size.unit||'mm'},bleed:{top:Number(settings.bleed)||0,right:Number(settings.bleed)||0,bottom:Number(settings.bleed)||0,left:Number(settings.bleed)||0,unit:'mm'},dpi:Number(settings.dpi)||300,colorMode:settings.colorMode||'cmyk',status:'review'}}
 function buildBundle(project,{id,version,name,productType,assets=[]}){const requirements=project?.template?.publishing?.dataRequirements||[],pages=project?.book?.pageInstances||[];return {schemaVersion:'template-package-bundle.v1',manifest:{schemaVersion:'template-package.v1-draft',templateId:id,version,name,productType,status:'review',publishable:false,pageComposition:{surfaceCount:pages.length,sheetCount:new Set(pages.map(page=>page.sheetId||page.sheetNumber)).size,monthCount:pages.filter(page=>page.role==='monthly-front').length,defaultStartMonth:Number(project?.settings?.startMonth)||1},compatibility:{runtime:'1.x',datasetSchema:'1.x',templateSchema:'2.x'},releaseContract:{status:'review',immutableAfterPublish:true}},template:{schemaVersion:'template.v2-draft',templateId:id,version,kind:'designer-project-snapshot',projectData:project},bindings:bindings(project,id,version),print:printProfile(project,id,version),parity:{schemaVersion:'snapshot-parity.v1',templateId:id,version,status:'review',sourceSurfaceCount:pages.length},publishing:{schemaVersion:'template-publishing.v1',templateId:id,version,contractStatus:'review',sourceOwner:'calendar-template-designer',consumerSnapshot:true,dataRequirements:requirements,lifecycle:{currentStatus:'review',immutableAfterPublish:true},releaseReadiness:{ready:false,blockers:['PREVIEW_VERIFICATION_REQUIRED']}},assets:assets.map(({bytes,...asset})=>asset)}}
 function base64(bytes){let output='';for(let index=0;index<bytes.length;index+=0x8000)output+=String.fromCharCode(...bytes.subarray(index,index+0x8000));return btoa(output)}
 async function publish({record={},projectData,name,productType}){
  let activeStage='버전 확인';const run=async(stage,action)=>{activeStage=stage;try{return await action()}catch(error){error.stage=stage;throw error}};
  const publishing=projectData.template.publishing||{},publication=publicationIdentity(projectData,name||record.name,record),id=publication.id,baseVersion=semver(projectData.template?.metadata?.version||record.packageVersion||'1.0.0');
  progress('version','새 버전 번호를 확인하고 있습니다.');const identity=await run('버전 확인',()=>request({mode:'next-version',packageId:id,baseVersion})),version=identity.version;
  if(!await confirmPublish({name:publication.name,id,currentVersion:publishing.lastReviewPackage?.version||baseVersion,nextVersion:version})){const error=new Error('게시가 취소되었습니다.');error.code='PUBLISH_CANCELLED';throw error}
  projectData.template.metadata={...(projectData.template.metadata||{}),name:publication.name};progress('prepare','템플릿과 이미지 원본을 준비하고 있습니다.');const inlined=await run('게시 자료 준비',()=>inlineBlobUrls(structuredClone(projectData))),externalized=await run('이미지 자산 분리',()=>externalizeAssets(inlined,{templateId:id,version})),project=externalized.project,bundle=buildBundle(project,{id,version,name:publication.name,productType:productType||record.type||project.productType?.category||'desk',assets:externalized.assets}),bytes=encoder.encode(deterministic(bundle)),digest=await sha256(bytes),totalChunks=Math.ceil(bytes.length/CHUNK_BYTES);
  if(totalChunks>100)throw new Error('템플릿 패키지가 검토 전송 한도를 초과했습니다. 이미지 크기를 줄여 주세요.');
  const assetChunkTotal=externalized.assets.reduce((sum,asset)=>sum+Math.ceil(asset.bytes.length/CHUNK_BYTES),0);let assetChunkDone=0;progress('asset-upload',`${externalized.assets.length}개 이미지 자산을 전송하고 있습니다.`,0,Math.max(assetChunkTotal,1));
  for(const asset of externalized.assets){const chunks=Math.ceil(asset.bytes.length/CHUNK_BYTES);if(chunks>100)throw new Error(`이미지 자산 ${asset.id}가 전송 한도를 초과했습니다.`);for(let index=0;index<chunks;index++){await run(`이미지 전송 ${assetChunkDone+1}/${assetChunkTotal}`,()=>request({mode:'asset-chunk',packageSha256:digest,assetSha256:asset.sha256,assetId:asset.id,index,totalChunks:chunks,data:base64(asset.bytes.subarray(index*CHUNK_BYTES,(index+1)*CHUNK_BYTES))}));assetChunkDone+=1;progress('asset-upload',`${externalized.assets.length}개 이미지 자산을 전송하고 있습니다.`,assetChunkDone,assetChunkTotal)}}
  progress('upload','패키지를 전송하고 있습니다.',0,totalChunks);
  for(let index=0;index<totalChunks;index++){await run(`패키지 전송 ${index+1}/${totalChunks}`,()=>request({mode:'chunk',sha256:digest,index,totalChunks,data:base64(bytes.subarray(index*CHUNK_BYTES,(index+1)*CHUNK_BYTES))}));progress('upload','패키지를 전송하고 있습니다.',index+1,totalChunks)}
  progress('validate','전송 결과와 패키지를 검증하고 있습니다.');const result=await run('패키지 검증',()=>request({mode:'finalize',sha256:digest,totalChunks}));
  progress('activate','새 버전을 노출하고 이전 버전을 보관하고 있습니다.');await run('새 버전 전환',()=>request({mode:'activate-review',templateId:id,version}));
  progress('cleanup','이전 기본 템플릿 목록을 정리하고 있습니다.');await run('이전 목록 정리',()=>reconcile());
  projectData.template.publishing={...(projectData.template.publishing||{}),packageId:id,lastReviewPackage:{templateId:id,version,sha256:digest,status:'review',transferredAt:new Date().toISOString()}};
  return {...result,templateId:id,version,sha256:digest,name:publication.name}
 }
 function publishedIdentity(project){const value=project?.template?.publishing?.lastReviewPackage;if(!value?.templateId||!value?.version)return null;return {templateId:value.templateId,version:value.version}}
 async function withdraw(project){const identity=publishedIdentity(project);if(!identity)return {withdrawn:[]};return request({mode:'withdraw',...identity})}
 async function reconcile(){return request({mode:'retire-packages',retirePackages:[{templateId:'desk-academic-standard',version:'1.4.0'},{templateId:'desk-academic-standard',version:'1.1.0'},{templateId:'wall-academic-standard',version:'0.3.0'}]})}
 root.ACDLTemplatePublishing=Object.freeze({publish,withdraw,reconcile,publishedIdentity,buildBundle,packageId,publicationIdentity,deterministic,confirmPublish,externalizeAssets});
})(window);
