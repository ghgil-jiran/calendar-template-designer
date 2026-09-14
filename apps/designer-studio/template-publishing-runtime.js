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
 function buildBundle(project,{id,version,name,productType,assets=[],sourceEditorRevision=null,representativeAsset=null}){const requirements=project?.template?.publishing?.dataRequirements||[],pages=project?.book?.pageInstances||[],representativePage=pages.find(page=>page.role==='cover-front')||pages[0]||null;return {schemaVersion:'template-package-bundle.v1',manifest:{schemaVersion:'template-package.v1-draft',templateId:id,version,name,productType,status:'review',publishable:false,pageComposition:{surfaceCount:pages.length,sheetCount:new Set(pages.map(page=>page.sheetId||page.sheetNumber)).size,monthCount:pages.filter(page=>page.role==='monthly-front').length,defaultStartMonth:Number(project?.settings?.startMonth)||1},compatibility:{runtime:'1.x',datasetSchema:'1.x',templateSchema:'2.x'},releaseContract:{status:'review',immutableAfterPublish:true},sourceEditorRevision:Number.isInteger(sourceEditorRevision)&&sourceEditorRevision>0?sourceEditorRevision:null,representativePreview:{mode:'cover-page',pageId:representativePage?.id||null,role:representativePage?.role||null,assetId:representativeAsset?.id||null,storagePath:representativeAsset?.storagePath||null,mimeType:representativeAsset?.mimeType||null}},template:{schemaVersion:'template.v2-draft',templateId:id,version,kind:'designer-project-snapshot',projectData:project},bindings:bindings(project,id,version),print:printProfile(project,id,version),parity:{schemaVersion:'snapshot-parity.v1',templateId:id,version,status:'review',sourceSurfaceCount:pages.length},publishing:{schemaVersion:'template-publishing.v1',templateId:id,version,contractStatus:'review',sourceOwner:'calendar-template-designer',consumerSnapshot:true,sourceEditorRevision:Number.isInteger(sourceEditorRevision)&&sourceEditorRevision>0?sourceEditorRevision:null,dataRequirements:requirements,lifecycle:{currentStatus:'review',immutableAfterPublish:true},releaseReadiness:{ready:false,blockers:['PREVIEW_VERIFICATION_REQUIRED']}},assets:assets.map(({bytes,...asset})=>asset)}}
 function base64(bytes){let output='';for(let index=0;index<bytes.length;index+=0x8000)output+=String.fromCharCode(...bytes.subarray(index,index+0x8000));return btoa(output)}
 async function publish({record={},projectData,name,productType}){
  let activeStage='버전 확인';const run=async(stage,action)=>{activeStage=stage;try{return await action()}catch(error){error.stage=stage;throw error}};
  const publishing=projectData.template.publishing||{},publication=publicationIdentity(projectData,name||record.name,record),id=publication.id,baseVersion=semver(projectData.template?.metadata?.version||record.packageVersion||'1.0.0'),sourceEditorRevision=Math.max(1,Number(projectData.template?.remoteVersionNumber||record.editorRevision||0)+1);
  progress('version','새 버전 번호를 확인하고 있습니다.');const identity=await run('버전 확인',()=>request({mode:'next-version',packageId:id,baseVersion})),version=identity.version;
  if(!await confirmPublish({name:publication.name,id,currentVersion:publishing.lastReviewPackage?.version||baseVersion,nextVersion:version})){const error=new Error('게시가 취소되었습니다.');error.code='PUBLISH_CANCELLED';throw error}
  projectData.template.metadata={...(projectData.template.metadata||{}),name:publication.name};progress('prepare','표지를 대표 이미지로 만들고 게시 자료를 준비하고 있습니다.');const uploaded=projectData.template?.thumbnail?.kind==='upload'?projectData.template.thumbnail.dataUrl:null,representativeDataUrl=uploaded||await run('대표 이미지 생성',()=>root.ACDLRepresentativePreview?.capture?.(projectData));if(!representativeDataUrl)throw new Error('표지 대표 이미지를 생성하지 못했습니다.');const inlined=await run('게시 자료 준비',()=>inlineBlobUrls(structuredClone(projectData))),externalized=await run('이미지 자산 분리',()=>externalizeAssets({project:inlined,representativePreview:representativeDataUrl},{templateId:id,version})),project=externalized.project.project,previewMarker=externalized.project.representativePreview,representativeAsset=externalized.assets.find(asset=>`package-asset://${asset.id}`===previewMarker)||null,bundle=buildBundle(project,{id,version,name:publication.name,productType:productType||record.type||project.productType?.category||'desk',assets:externalized.assets,sourceEditorRevision,representativeAsset}),bytes=encoder.encode(deterministic(bundle)),digest=await sha256(bytes),totalChunks=Math.ceil(bytes.length/CHUNK_BYTES);
  if(totalChunks>100)throw new Error('템플릿 패키지가 검토 전송 한도를 초과했습니다. 이미지 크기를 줄여 주세요.');
  const assetChunkTotal=externalized.assets.reduce((sum,asset)=>sum+Math.ceil(asset.bytes.length/CHUNK_BYTES),0);let assetChunkDone=0;progress('asset-upload',`${externalized.assets.length}개 이미지 자산을 전송하고 있습니다.`,0,Math.max(assetChunkTotal,1));
  for(const asset of externalized.assets){const chunks=Math.ceil(asset.bytes.length/CHUNK_BYTES);if(chunks>100)throw new Error(`이미지 자산 ${asset.id}가 전송 한도를 초과했습니다.`);for(let index=0;index<chunks;index++){await run(`이미지 전송 ${assetChunkDone+1}/${assetChunkTotal}`,()=>request({mode:'asset-chunk',packageSha256:digest,assetSha256:asset.sha256,assetId:asset.id,index,totalChunks:chunks,data:base64(asset.bytes.subarray(index*CHUNK_BYTES,(index+1)*CHUNK_BYTES))}));assetChunkDone+=1;progress('asset-upload',`${externalized.assets.length}개 이미지 자산을 전송하고 있습니다.`,assetChunkDone,assetChunkTotal)}}
  progress('upload','패키지를 전송하고 있습니다.',0,totalChunks);
  for(let index=0;index<totalChunks;index++){await run(`패키지 전송 ${index+1}/${totalChunks}`,()=>request({mode:'chunk',sha256:digest,index,totalChunks,data:base64(bytes.subarray(index*CHUNK_BYTES,(index+1)*CHUNK_BYTES))}));progress('upload','패키지를 전송하고 있습니다.',index+1,totalChunks)}
  progress('validate','전송 결과와 패키지를 검증하고 있습니다.');const result=await run('패키지 검증',()=>request({mode:'finalize',sha256:digest,totalChunks}));
  progress('activate','새 버전을 노출하고 이전 버전을 보관하고 있습니다.');await run('새 버전 전환',()=>request({mode:'activate-review',templateId:id,version}));
  let cleanupWarning=null;
  projectData.template.publishing={...(projectData.template.publishing||{}),packageId:id,lastReviewPackage:{templateId:id,version,sha256:digest,status:'review',sourceEditorRevision,transferredAt:new Date().toISOString()}};
  return {...result,templateId:id,version,sha256:digest,name:publication.name,cleanupWarning}
 }
 function publishedIdentity(project){const value=project?.template?.publishing?.lastReviewPackage;if(!value?.templateId||!value?.version)return null;return {templateId:value.templateId,version:value.version}}
 async function withdraw(project){const identity=publishedIdentity(project);if(!identity)return {withdrawn:[]};return request({mode:'withdraw',...identity})}
 async function editorCatalog({strict=false}={}){
  const remote=root.ACDLTemplateRemotePersistence;if(!remote?.isRemote?.())return [];
  const records=(await remote.list()).filter(item=>item.state==='published'),items=[];
  for(const record of records){
   const loaded=await remote.load(record.id,{deferAssets:true}),identity=publishedIdentity(loaded?.version?.projectData);
   if(!identity){if(strict)throw new Error(`게시 템플릿의 Package 정보를 찾지 못했습니다: ${record.name||record.id}`);items.push({name:record.name||record.id,editorRevision:Number(loaded?.version?.versionNumber||record.version||0),templateId:null,version:null,error:'Package 정보 누락'});continue}
   items.push({name:record.name||loaded?.template?.name||identity.templateId,editorRevision:Number(loaded?.version?.versionNumber||record.version||0),...identity});
  }
  return items
 }
 function compareCatalogs(editor,service){
  const editorById=new Map(editor.filter(item=>item.templateId).map(item=>[item.templateId,item])),serviceById=new Map(service.map(item=>[item.templateId,item])),ids=new Set([...editorById.keys(),...serviceById.keys()]),rows=[];
  for(const id of ids){const left=editorById.get(id),right=serviceById.get(id),state=!left?'service-only':!right?'editor-only':left.version===right.version?'matched':'version-mismatch';rows.push({templateId:id,name:left?.name||right?.name||id,editorRevision:left?.editorRevision||null,editorVersion:left?.version||null,serviceVersion:right?.version||null,serviceEditorRevision:right?.sourceEditorRevision||null,state})}
  for(const item of editor.filter(entry=>!entry.templateId))rows.push({...item,state:'invalid-editor'});
  return rows.sort((a,b)=>String(a.name).localeCompare(String(b.name),'ko'))
 }
 async function inspectCatalog(){
  const editor=await editorCatalog(),serviceResult=await request({mode:'inspect-review-catalog'}),service=serviceResult.packages||[];
  return {editor,service,rows:compareCatalogs(editor,service)}
 }
 async function synchronizeCatalog(){
  const remote=root.ACDLTemplateRemotePersistence;if(!remote?.isRemote?.())return {requested:[],packages:[],deactivated:[]};
  progress('cleanup','시스템 베이스와 사용자 서비스 목록을 동기화하고 있습니다.');
  const editor=await editorCatalog({strict:true}),active=editor.map(({templateId,version,editorRevision})=>({templateId,version,sourceEditorRevision:editorRevision>0?editorRevision:null}));
  return request({mode:'sync-review-catalog',activePackages:active});
 }
 function syncStateLabel(state){return ({matched:'일치','editor-only':'등록 필요','service-only':'내림 대상','version-mismatch':'버전 불일치','invalid-editor':'Package 정보 누락'})[state]||state}
 function renderSyncResult(result){
  const body=document.getElementById('templateSyncRows'),summary=document.getElementById('templateSyncSummary');if(!body||!summary)return;
  const rows=result.rows||[],matched=rows.filter(row=>row.state==='matched').length,issues=rows.length-matched;
  summary.className=`template-sync-summary ${issues?'warning':'success'}`;summary.textContent=issues?`${rows.length}개 중 ${matched}개 일치 · ${issues}개 확인 필요`:`${rows.length}개 템플릿이 모두 일치합니다.`;
  body.innerHTML=rows.length?rows.map(row=>`<tr data-sync-state="${row.state}"><td><strong>${String(row.name||'').replace(/[&<>"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[char]))}</strong><small>${row.templateId||'Package ID 없음'}</small></td><td>${row.editorRevision?`편집 이력 v${row.editorRevision}`:'—'}<small>${row.editorVersion?`Package ${row.editorVersion}`:'—'}</small></td><td>${row.serviceVersion?`Package ${row.serviceVersion}`:'—'}<small>${row.serviceEditorRevision?`편집 원본 v${row.serviceEditorRevision}`:'편집 원본 미기록'}</small></td><td><span class="template-sync-state ${row.state}">${syncStateLabel(row.state)}</span></td></tr>`).join(''):'<tr><td colspan="4" class="template-sync-empty">비교할 템플릿이 없습니다.</td></tr>'
 }
 function syncStatus(stage,message,type='working'){const status=document.getElementById('templateSyncStatus');if(!status)return;status.className=`template-sync-status ${type}`;status.innerHTML=`<strong>${stage}</strong><span>${message}</span>`}
 async function openSyncDialog(){
  const dialog=document.getElementById('templateSyncDialog');if(!dialog)return;dialog.classList.remove('hidden');syncStatus('목록 조회','양쪽 서비스의 현재 목록을 불러오고 있습니다.');
  try{const result=await inspectCatalog();renderSyncResult(result);syncStatus('비교 완료','아직 변경하지 않았습니다. 결과를 확인한 뒤 동기화를 실행하세요.','ready');document.getElementById('runTemplateSyncBtn').disabled=false}catch(error){syncStatus('조회 실패',error?.message||String(error),'error')}
 }
 async function runSyncDialog(){
  const button=document.getElementById('runTemplateSyncBtn');if(button)button.disabled=true;syncStatus('1/4 · 동기화 준비','시스템 베이스의 Package와 편집 이력을 정리하고 있습니다.');
  try{syncStatus('2/4 · 사용자 서비스 반영','활성 Package와 편집 원본 버전을 사용자 서비스 Preview에 적용하고 있습니다.');const changed=await synchronizeCatalog();syncStatus('3/4 · 결과 재조회',`활성 ${changed.packages?.length||0}개 · 내림 ${changed.deactivated?.length||0}개 · 누락 ${changed.missing?.length||0}개`);const result=await inspectCatalog();renderSyncResult(result);const issues=result.rows.filter(row=>row.state!=='matched').length;syncStatus(issues?'4/4 · 동기화 확인 필요':'4/4 · 동기화 완료',issues?`${issues}개 항목이 일치하지 않습니다. 아래 결과를 확인하세요.`:`변경 ${Number(changed.activated?.length||0)+Number(changed.deactivated?.length||0)}건 · ${result.rows.length}개 템플릿의 Package와 편집 이력이 일치합니다.`,issues?'error':'success')}catch(error){syncStatus('동기화 실패',error?.message||String(error),'error')}finally{if(button)button.disabled=false}
 }
 function installSyncDialog(){
  document.getElementById('openTemplateSyncBtn')?.addEventListener('click',openSyncDialog);document.getElementById('closeTemplateSyncBtn')?.addEventListener('click',()=>document.getElementById('templateSyncDialog')?.classList.add('hidden'));document.getElementById('runTemplateSyncBtn')?.addEventListener('click',runSyncDialog);document.getElementById('refreshTemplateSyncBtn')?.addEventListener('click',openSyncDialog)
 }
 if(typeof document!=='undefined')installSyncDialog();
 async function reconcile(){return synchronizeCatalog()}
 root.ACDLTemplatePublishing=Object.freeze({publish,withdraw,reconcile,synchronizeCatalog,inspectCatalog,compareCatalogs,publishedIdentity,buildBundle,packageId,publicationIdentity,deterministic,confirmPublish,externalizeAssets});
})(window);
