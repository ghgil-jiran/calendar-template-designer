(function(root){
 const CHUNK_BYTES=900*1024;
 const encoder=new TextEncoder();
 function stable(value){if(Array.isArray(value))return value.map(stable);if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).sort().map(key=>[key,stable(value[key])]));return value}
 function deterministic(value){return JSON.stringify(stable(value),null,2)+'\n'}
 function hex(bytes){return [...new Uint8Array(bytes)].map(value=>value.toString(16).padStart(2,'0')).join('')}
 async function sha256(bytes){return hex(await root.crypto.subtle.digest('SHA-256',bytes))}
 function packageId(input){const clean=String(input||'').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');return clean&&/^[a-z0-9]/.test(clean)?clean.slice(0,80):`template-${Date.now()}`}
 function semver(input){return /^\d+\.\d+\.\d+$/.test(String(input||''))?String(input):'1.0.0'}
 async function request(body){
  const token=root.ACDLTemplateRemotePersistence?.accessToken?.()||root.ACDLAdminAuth?.accessToken?.();if(!token)throw new Error('게시하려면 Master Admin 로그인이 필요합니다.');
  const response=await root.fetch('/api/template-publish-review',{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify(body)}),result=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(result.message||result.error||'사용자 서비스로 템플릿을 보내지 못했습니다.');return result
 }
 async function inlineBlobUrls(value,cache=new Map()){
  if(typeof value==='string'&&value.startsWith('blob:')){
   if(cache.has(value))return cache.get(value);const blob=await root.fetch(value).then(response=>{if(!response.ok)throw new Error('게시 이미지 원본을 읽지 못했습니다.');return response.blob()}),dataUrl=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(new Error('게시 이미지를 변환하지 못했습니다.'));reader.readAsDataURL(blob)});cache.set(value,dataUrl);return dataUrl
  }
  if(Array.isArray(value))return Promise.all(value.map(item=>inlineBlobUrls(item,cache)));
  if(value&&typeof value==='object'){const output={};for(const [key,item] of Object.entries(value))output[key]=await inlineBlobUrls(item,cache);return output}
  return value
 }
 function bindings(project,id,version){const requirements=project?.template?.publishing?.dataRequirements||[];return {contractVersion:'2.0',templateId:id,templateVersion:version,bindings:requirements.map(item=>({path:item.path,required:item.stage==='project-create-required',status:'current',missing:item.stage==='project-create-required'?'error':item.fallback||'empty'}))}}
 function printProfile(project,id,version){const size=project?.productType?.pageSize||{},settings=project?.template?.resources?.exportSettings||{};return {schemaVersion:'print-profile.v1-draft',templateId:id,version,trimSize:{width:Number(size.width)||0,height:Number(size.height)||0,unit:size.unit||'mm'},bleed:{top:Number(settings.bleed)||0,right:Number(settings.bleed)||0,bottom:Number(settings.bleed)||0,left:Number(settings.bleed)||0,unit:'mm'},dpi:Number(settings.dpi)||300,colorMode:settings.colorMode||'cmyk',status:'review'}}
 function buildBundle(project,{id,version,name,productType}){const requirements=project?.template?.publishing?.dataRequirements||[],pages=project?.book?.pageInstances||[];return {schemaVersion:'template-package-bundle.v1',manifest:{schemaVersion:'template-package.v1-draft',templateId:id,version,name,productType,status:'review',publishable:false,pageComposition:{surfaceCount:pages.length,sheetCount:new Set(pages.map(page=>page.sheetId||page.sheetNumber)).size,monthCount:pages.filter(page=>page.role==='monthly-front').length,defaultStartMonth:Number(project?.settings?.startMonth)||1},compatibility:{runtime:'1.x',datasetSchema:'1.x',templateSchema:'2.x'},releaseContract:{status:'review',immutableAfterPublish:true}},template:{schemaVersion:'template.v2-draft',templateId:id,version,kind:'designer-project-snapshot',projectData:project},bindings:bindings(project,id,version),print:printProfile(project,id,version),parity:{schemaVersion:'snapshot-parity.v1',templateId:id,version,status:'review',sourceSurfaceCount:pages.length},publishing:{schemaVersion:'template-publishing.v1',templateId:id,version,contractStatus:'review',sourceOwner:'calendar-template-designer',consumerSnapshot:true,dataRequirements:requirements,lifecycle:{currentStatus:'review',immutableAfterPublish:true},releaseReadiness:{ready:false,blockers:['PREVIEW_VERIFICATION_REQUIRED']}}}}
 function base64(bytes){let output='';for(let index=0;index<bytes.length;index+=0x8000)output+=String.fromCharCode(...bytes.subarray(index,index+0x8000));return btoa(output)}
 async function publish({record={},projectData,name,productType}){
  const project=await inlineBlobUrls(structuredClone(projectData)),publishing=project.template.publishing||{},id=packageId(publishing.packageId||project.template?.package?.id||record.packageId||record.stableKey||record.id||name),baseVersion=semver(project.template?.metadata?.version||record.packageVersion||'1.0.0');
  const identity=await request({mode:'next-version',packageId:id,baseVersion}),version=identity.version,bundle=buildBundle(project,{id,version,name:name||record.name||'이름 없는 템플릿',productType:productType||record.type||project.productType?.category||'desk'}),bytes=encoder.encode(deterministic(bundle)),digest=await sha256(bytes),totalChunks=Math.ceil(bytes.length/CHUNK_BYTES);
  if(totalChunks>100)throw new Error('템플릿 패키지가 검토 전송 한도를 초과했습니다. 이미지 크기를 줄여 주세요.');
  root.ACDLTemplateSaveProgress?.({phase:'publish',completed:0,total:totalChunks});
  for(let index=0;index<totalChunks;index++){await request({mode:'chunk',sha256:digest,index,totalChunks,data:base64(bytes.subarray(index*CHUNK_BYTES,(index+1)*CHUNK_BYTES))});root.ACDLTemplateSaveProgress?.({phase:'publish',completed:index+1,total:totalChunks})}
  const result=await request({mode:'finalize',sha256:digest,totalChunks});
  projectData.template.publishing={...(projectData.template.publishing||{}),packageId:id,lastReviewPackage:{templateId:id,version,sha256:digest,status:'review',transferredAt:new Date().toISOString()}};
  return {...result,templateId:id,version,sha256:digest}
 }
 root.ACDLTemplatePublishing=Object.freeze({publish,buildBundle,packageId,deterministic});
})(window);
