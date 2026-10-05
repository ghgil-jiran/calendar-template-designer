(()=>{
 const requestId=new URLSearchParams(location.search).get('productionRequest');
 if(!requestId)return;
 const query=new URLSearchParams(location.search),inspectionMode=query.get('productionInspection')==='1';const embedded=query.get('productionEmbedded')==='1'&&window.parent!==window;let leaving=false,commandBusy=false,lastQuick=null;
 function launchUpdate(type,message,value){if(embedded)window.parent.postMessage({type:`calendar:production-editor-${type}`,requestId,message,value},location.origin);}
 function loadingError(message){launchUpdate('error',message);document.documentElement.classList.remove('production-editor-loading');}
 const auth=window.ACDLAdminAuth,adapter=window.ACDLProductionEditorAdapter,$=id=>document.getElementById(id);
 let state=null,busy=false,starting=false,saved='',pendingId=null,pendingFingerprint=null,assets=[],urls=new Map(),markers=new Map(),lastDirty=false;
 const bar=document.createElement('section');bar.className='production-editor-toolbar';bar.setAttribute('aria-label','접수본 교정');
 const title=document.createElement('strong'),status=document.createElement('span');status.setAttribute('role','status');
 const note=document.createElement('input');note.placeholder='교정 이유와 변경 내용';note.maxLength=2000;note.setAttribute('aria-label','교정 변경 기록');
 const save=document.createElement('button');save.textContent='새 교정 버전 저장';save.type='button';save.className='review-button';
 const inspect=document.createElement('button');inspect.textContent='저장 버전 인쇄 품질 검사';inspect.type='button';inspect.className='review-button';
 const back=document.createElement('a');back.href=`./production-review.html?productionRequest=${encodeURIComponent(requestId)}&reviewStep=3`;back.textContent='제작 검수로 돌아가기';
 const saveState=document.createElement('span');saveState.className='production-save-state';saveState.setAttribute('role','status');bar.append(title,saveState,status,note,save,back);document.body.prepend(bar);const sizeWorkspace=()=>{const workspace=document.querySelector('.workspace');if(workspace)document.body.style.setProperty('--production-workspace-height',`${Math.max(400,innerHeight-(workspace.getBoundingClientRect().top+scrollY))}px`);};new ResizeObserver(sizeWorkspace).observe(bar);window.addEventListener('resize',sizeWorkspace);document.body.classList.add('production-correction-mode');
 function map(value,direction){if(typeof value==='string')return (direction==='open'?urls:markers).get(value)||value;if(Array.isArray(value))return value.map(v=>map(v,direction));if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,map(v,direction)]));return value;}
 function canonical(){const value=map(project,'save');if(value?.productionCorrection?.baseCalendarMaster)value.template.masters.calendar=value.productionCorrection.baseCalendarMaster;return value;}
 function contentFingerprint(){return JSON.stringify(adapter.toDocument(canonical()));}
 function dirty(){if(!state)return false;try{return contentFingerprint()!==saved;}catch{return true;}}
 async function api(path,method='GET',body){const response=await auth.authorizedFetch(path,{method,...(body?{headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{})});const result=await response.json();if(!response.ok)throw Error(result.message||result.error||'교정 작업을 완료하지 못했습니다.');return result;}
 function register(marker,url){urls.set(marker,url);markers.set(url,marker);}
 function setStatus(message){status.textContent=message;if(inspectionMode&&embedded)window.parent.postMessage({type:'calendar:production-inspection-progress',requestId,revisionId:state?.revision?.id,message},location.origin);}
 function sync(){saveState.textContent=!state?'불러오는 중…':busy?'작업 중…':dirty()?'저장하지 않은 변경 있음':state.revision?`저장됨 · 교정 v${state.revision.revision_number}`:'접수본 · 첫 교정 버전 저장 전';save.disabled=busy||!state||!auth.isSignedIn()||!!state.revision&&!dirty();inspect.disabled=busy||!state?.revision||!auth.isSignedIn()||dirty();note.disabled=busy;}
 async function load(){
  if(starting||state)return;if(!auth.isSignedIn()){setStatus('관리자 로그인 후 접수본을 불러옵니다.');return;}
  starting=true;busy=true;launchUpdate('progress','접수 자료 확인 중…',25);setStatus('접수 당시 템플릿과 최신 교정 버전을 불러오는 중…');sync();
  try{
   const receipt=await api(`/api/production-requests?id=${encodeURIComponent(requestId)}`);launchUpdate('progress','템플릿과 최신 교정 버전 불러오는 중…',45);const data=await api(`/api/production-corrections?requestId=${encodeURIComponent(requestId)}&editor=1`);
   if(!auth.isSignedIn())throw Error('관리자 로그인이 필요합니다.');
   if(!['reviewing','changes'].includes(receipt.receipt.status))throw Error('제작 검수 1단계에서 검수를 시작한 뒤 교정할 수 있습니다.');
   assets=[...receipt.assets.map(a=>({...a,inspectionOrigin:"receipt"})),...data.assets.map(a=>({...a,inspectionOrigin:"correction"}))];for(const a of assets)register(`production-asset://${a.id}`,a.url);for(const a of data.editorSource.assets)register(a.marker,a.url);
   const revision=data.revisions[0]||null;if(inspectionMode&&(!revision||revision.id!==query.get('productionRevision')))throw Error('검사할 교정 버전이 변경되었습니다. 검수 화면에서 다시 선택해 주세요.');const runtimeDocument=revision?.document||receipt.receipt.snapshot.document;
   launchUpdate('progress','보관 이미지 연결·편집 화면 구성 중…',70);
   const raw=runtimeDocument.editorProject||adapter.createProject(data.editorSource.projectData,runtimeDocument,requestId);
   project=map(raw,'open');const importedBaseline=JSON.stringify(adapter.toDocument(canonical()));if(!inspectionMode)project=map(adapter.restoreImportedText(raw),'open');state={receipt:receipt.receipt,revision,identity:data.editorSource.identity,printInspection:data.printInspection,uploadAvailable:data.uploadAvailable};
   beginProjectTransition({clearProject:false});appMode='designer';selectedPageId=project.book.pageInstances[0]?.id;selectedElementId=null;selectedElementScope=null;history=[];future=[];calendarEditing=false;preview=false;previewType=null;
   for(const id of ['entryScreen','designerHome','setup','userSetup','templateLibraryModal'])$(id)?.classList.add('hidden');
   document.body.classList.remove('user-mode');setEditorContext('3단계 · 접수본 교정');render();stable();saved=importedBaseline;
   title.textContent=`CAL-${String(state.receipt.receipt_number).padStart(6,'0')} · ${state.receipt.school_name} · ${revision?'교정 v'+revision.revision_number:'접수본'}`;
   $('saveBtn').textContent='교정 버전 저장';$('templateMode').textContent='접수본 교정';$('modeHelp').textContent='면을 선택하고 기존 개체를 직접 수정하세요. 원본 템플릿과 접수본은 보존됩니다.';
   const remote=window.ACDLTemplateRemotePersistence;if(remote)window.ACDLTemplateRemotePersistence={...remote,save:async()=>{throw Error('교정 내용은 상단 새 교정 버전 저장으로 저장해 주세요.');},saveDraft:async()=>{throw Error('교정 내용은 접수 건의 교정 버전으로 저장해야 합니다.');}};
   launchUpdate('progress','편집 화면의 이미지 확인 중…',90);
   const images=[...($('page')?.querySelectorAll('img')||[])];for(const image of images)image.loading='eager';
   await Promise.all(images.map(image=>new Promise((resolve,reject)=>{if(image.complete)return image.naturalWidth?resolve():reject(Error('편집 화면의 이미지를 불러오지 못했습니다. 다시 열어 주세요.'));const timer=setTimeout(()=>{cleanup();reject(Error('이미지 불러오기 시간이 초과되었습니다. 다시 시도해 주세요.'));},30000);const cleanup=()=>{clearTimeout(timer);image.removeEventListener('load',done);image.removeEventListener('error',failed);};const done=()=>{cleanup();resolve();},failed=()=>{cleanup();reject(Error('편집 화면의 이미지를 불러오지 못했습니다. 다시 열어 주세요.'));};image.addEventListener('load',done);image.addEventListener('error',failed);})));
   if(!auth.isSignedIn()||!state)throw Error('관리자 세션을 확인하고 다시 열어 주세요.');
   if(document.fonts?.ready)await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('편집 글꼴 준비 시간이 초과되었습니다. 다시 열어 주세요.')),30000);document.fonts.ready.then(()=>{clearTimeout(timer);resolve();},error=>{clearTimeout(timer);reject(error);});});window.__acdlProductionEditorReady=true;document.documentElement.classList.remove('production-editor-loading');setStatus('3단계: 전체 면을 교정하고 변경 기록과 함께 새 버전을 저장한 뒤 제작 검수로 돌아가세요.');launchUpdate('ready','편집 화면 준비 완료',100);
  }catch(error){state=null;setStatus(error.message);loadingError(error.message);}finally{starting=false;busy=false;sync();}
 }
 async function persist(){
  if(busy||!state||state.revision&&!dirty())return;if(!note.value.trim()&&dirty()){setStatus('교정 이유와 변경 내용을 입력해 주세요.');note.focus();return;}
  busy=true;sync();setStatus('새 교정 버전 저장 중…');
  try{
   const input=canonical();adapter.toDocument(input);const saveNote=note.value.trim()||'접수본 확인 완료 · 수정 없음';const fingerprint=JSON.stringify(input)+saveNote;if(fingerprint!==pendingFingerprint){pendingId=crypto.randomUUID();pendingFingerprint=fingerprint;}
   const result=await api('/api/production-corrections','POST',{requestId,id:pendingId,baseRevisionId:state.revision?.id||null,note:saveNote,editorProject:input});
   state.revision=result.revision;state.printInspection=null;project=map(result.revision.document.editorProject,'open');pendingId=null;pendingFingerprint=null;note.value='';render();stable();saved=contentFingerprint();lastDirty=false;
   title.textContent=`CAL-${String(state.receipt.receipt_number).padStart(6,'0')} · ${state.receipt.school_name} · 교정 v${result.revision.revision_number}`;setStatus(`교정 v${result.revision.revision_number} 저장 완료. 제작 검수로 돌아가 저장 버전을 확인하세요.`);
  }catch(error){setStatus(error.message);}finally{busy=false;sync();}
 }
 save.onclick=persist;note.oninput=()=>{pendingId=null;};
 async function inlinePrintAssets(candidate){
  const cache=new Map();async function walk(value){
   if(typeof value==='string'&&markers.has(value)){
    if(!cache.has(value))cache.set(value,(async()=>{const response=await fetch(value);if(!response.ok)throw Error('인쇄에 사용할 보관 원본을 읽지 못했습니다. 다시 열어 주세요.');const blob=await response.blob();return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(blob);});})());return cache.get(value);
   }
   if(Array.isArray(value))return Promise.all(value.map(walk));if(value&&typeof value==='object'){const output={};for(const [k,v] of Object.entries(value))output[k]=await walk(v);return output;}return value;
  }
  const result=await walk(candidate);Object.assign(candidate,result);
 }
 inspect.onclick=async()=>{
  if(busy||!state?.revision||dirty())return;
  try{
   const candidate=map(state.revision.document.editorProject,'open');candidate.productionCorrection.savedRevisionId=state.revision.id;candidate.productionCorrection.savedDocumentHash=state.revision.document_hash;
   candidate.template.publishing={packageId:`production-${state.revision.id}`,...(state.printInspection?{lastPrintInspectionPackage:state.printInspection}:{})};
   await window.ACDLProductionPreflight.open({id:`production-${state.revision.id}`,name:`${state.receipt.school_name} · 교정 v${state.revision.revision_number}`,type:candidate.productType.category,edition:candidate.settings.year,state:'draft',version:state.revision.revision_number,productionProject:candidate});
  }catch(error){setStatus(error.message);}
 };
 document.addEventListener('click',event=>{
  if(!state)return;if(busy&&!bar.contains(event.target)){event.preventDefault();event.stopImmediatePropagation();return;}const target=event.target.closest('button,[data-menu-action]');if(!target)return;
  if(target.id==='saveBtn'||target.dataset.menuAction==='save'){event.preventDefault();event.stopImmediatePropagation();persist();return;}
  if(['newBtn','loadBtn','libraryBtn','publishBtn','returnHomeBtn','openCommonGraphicsBtn','openGraphicsSettingsBtn','duplicateElementBtn','openObjectDrawerBtn'].includes(target.id)||target.dataset.s2Action==='duplicate'||['new','open','publish','save-as','duplicate'].includes(target.dataset.menuAction)){event.preventDefault();event.stopImmediatePropagation();setStatus('접수본 교정 중입니다. 기존 개체를 수정하고 새 교정 버전으로 저장해 주세요.');}
 },true);
 document.addEventListener('change',async event=>{
  if(!state||!['frameImageInput','elementImageInput','semanticImageInput'].includes(event.target.id))return;
  event.stopImmediatePropagation();const file=event.target.files?.[0];event.target.value='';if(!file)return;
  const item=sourceElement();if(!item||!['image','image-frame','semantic-object'].includes(item.type)){setStatus('교체할 이미지 개체를 먼저 선택해 주세요.');return;}
  if(!state.uploadAvailable){setStatus('교정 원본 업로드 설정을 먼저 확인해 주세요.');return;}
  if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size<=0||file.size>25*1024*1024){setStatus('JPEG·PNG·WebP, 최대 25MiB 이미지를 선택해 주세요.');return;}
  busy=true;sync();setStatus('교정 원본 이미지 업로드 중…');
  try{
   const bitmap=await createImageBitmap(file);bitmap.close();const prepared=await api('/api/production-correction-assets','POST',{requestId,action:'prepare',name:file.name,mimeType:file.type,byteSize:file.size});
   const response=await fetch(prepared.uploadUrl,{method:'PUT',headers:{'Content-Type':file.type,'x-upsert':'false'},body:file});if(!response.ok)throw Error('교정 원본을 업로드하지 못했습니다.');
   const completed=await api('/api/production-correction-assets','POST',{requestId,action:'finalize',assetId:prepared.id});register(`production-asset://${completed.asset.id}`,completed.asset.url);assets.push(completed.asset);snapshot();
   if(item.type==='semantic-object'){item.sampleContent={...(item.sampleContent||{}),image:completed.asset.url};}else{item.src=completed.asset.url;item.image={...(item.image||{}),src:completed.asset.url,originalName:file.name,fit:item.image?.fit||'cover',scale:1,offsetX:0,offsetY:0};delete item.image.assetId;item.value={src:completed.asset.url,fit:item.image.fit};}
   delete item.printSource;delete item.printAsset;markDirty();pendingId=null;render();setStatus('새 원본으로 교체했습니다. 교정 버전을 저장하세요.');
  }catch(error){setStatus(error.message);}finally{busy=false;sync();}
 },true);
 window.addEventListener('beforeunload',event=>{if(!leaving&&(dirty()||busy)){event.preventDefault();event.returnValue='';}});
 back.onclick=event=>{if(busy){event.preventDefault();setStatus('진행 중인 작업이 끝난 뒤 제작 검수로 돌아가세요.');return;}if(dirty()&&!confirm('저장하지 않은 교정 내용이 있습니다. 제작 검수로 돌아갈까요?')){event.preventDefault();return;}if(embedded){event.preventDefault();leaving=true;launchUpdate('return','제작 검수로 복귀');}};
 window.addEventListener('message',event=>{if(embedded&&event.origin===location.origin&&event.source===window.parent&&event.data?.type==='calendar:production-editor-close'&&event.data.requestId===requestId)back.click();});
 auth.onChange(()=>{if(!auth.isSignedIn()){state=null;urls.clear();markers.clear();saved='';project=null;showEntry();title.textContent='접수본 교정';setStatus('관리자 로그인이 필요합니다.');loadingError('관리자 로그인이 필요합니다. 제작 검수에서 로그인 후 다시 열어 주세요.');}else load();sync();});
 const imageCheck=document.createElement('button');imageCheck.type='button';imageCheck.className='review-button';imageCheck.textContent='원본·배치 검사';// Inspection controls belong to production review, not stage 3 correction.
 const originalSync=sync;sync=function(){originalSync();imageCheck.disabled=busy||!state?.revision||!auth.isSignedIn()||dirty();};
 async function captureImageLayouts(plan,revision){
  const targets=plan.uses.filter(use=>!use.measurable&&['school-song','school-tree','school-flower'].includes(use.role)),layouts=[];
  if(!targets.length)return layouts;
  const originalProject=project,originalPage=selectedPageId,originalElement=selectedElementId,originalScope=selectedElementScope;
  try{
   project=map(revision.document.editorProject,'open');selectedElementId=null;selectedElementScope=null;
   for(const pageId of [...new Set(targets.map(use=>use.pageId))]){
    if(!auth.isSignedIn()||state?.revision?.id!==revision.id)throw Error('관리자 세션이나 교정 버전이 변경되었습니다.');
    selectedPageId=pageId;renderPage();
    await document.fonts?.ready;await Promise.race([new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))),new Promise(resolve=>setTimeout(resolve,100))]);
    for(const use of targets.filter(use=>use.pageId===pageId)){
     const box=[...document.querySelectorAll('.free-element[data-element-id]')].find(node=>node.dataset.elementId===use.objectId),image=box?.querySelector('.semantic-media img');
     try{if(image){image.loading='eager';await Promise.race([image.decode(),new Promise((_,reject)=>setTimeout(()=>reject(Error('이미지 읽기 시간이 초과되었습니다.')),30000))]);}layouts.push(window.ACDLPrintImageLayout.capture(use,box,{imageSource:markers.get(image?.currentSrc||image?.src),readStyle:getComputedStyle}));}catch(error){setStatus(`${use.role} 이미지 영역은 아직 미확정입니다: ${error.message}`);}
    }
   }
  }finally{const active=auth.isSignedIn()&&state?.revision?.id===revision.id;project=active?originalProject:null;selectedPageId=originalPage;selectedElementId=originalElement;selectedElementScope=originalScope;if(active){renderPage();renderInspector();}}
  return layouts;
 }
 async function inspectImages(){
  if(busy||!state?.revision||dirty())return;
  const revision=state.revision,query=`requestId=${encodeURIComponent(requestId)}&revisionId=${encodeURIComponent(revision.id)}`;
  busy=true;sync();setStatus('저장 버전의 사용 원본을 확인하는 중…');
  try{
   const {plan}=await api(`/api/production-print-images?${query}`);
   if(plan.documentHash!==revision.document_hash)throw Error('검사 버전이 저장본과 일치하지 않습니다. 다시 열어 주세요.');
   setStatus('공통 에디터 렌더러의 실제 이미지 영역을 확인하는 중…');
   const imageLayouts=await captureImageLayouts(plan,revision);
   const results=[];
   for(const [index,source] of plan.sources.entries()){
    setStatus(`원본 파일·배치 검사 중 · ${index+1}/${plan.sources.length}`);
    try{
     if(!/^(production|package)-asset:\/\//.test(source))throw Error('이 이미지의 보관 원본 연결이 필요합니다.');
     const layouts=imageLayouts.filter(layout=>layout.source===source);
     const imageUrl=urls.get(source);if(!imageUrl)throw Error('이미지 원본 주소를 확인할 수 없습니다.');const decoded=new Image();decoded.src=imageUrl;await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('원본 이미지 읽기 시간이 초과되었습니다.')),30000);decoded.decode().then(()=>{clearTimeout(timer);resolve();},()=>{clearTimeout(timer);reject(Error('원본 이미지를 읽을 수 없습니다.'));});});
     const sourceKey=source.startsWith('package-asset://')?'packageAssetId':'assetId',sourceId=source.split('://')[1];const {report}=layouts.length?await api('/api/production-print-images','POST',{requestId,revisionId:revision.id,[sourceKey]:sourceId,contentHash:plan.contentHash,imageLayouts:layouts}):await api(`/api/production-print-images?${query}&${sourceKey}=${encodeURIComponent(sourceId)}&contentHash=${encodeURIComponent(plan.contentHash)}`);
     if(report.documentHash!==plan.documentHash||report.contentHash!==plan.contentHash||report.source!==source)throw Error('원본 검사 결과가 저장 버전과 일치하지 않습니다.');
     results.push(report);
     for(const placement of report.placements){const index=plan.uses.findIndex(use=>use.pageId===placement.pageId&&use.objectId===placement.objectId&&use.source===placement.source);if(index>=0)plan.uses[index]={...placement};}
    }catch(error){results.push({source,status:'blocked',message:error.message});}
   }
   if(!auth.isSignedIn()||state?.revision?.id!==revision.id)throw Error('관리자 세션이나 교정 버전이 변경되었습니다. 다시 열어 주세요.');
   if(inspectionMode)return {schemaVersion:'production-image-inspection.v1',requestId,revisionId:revision.id,documentHash:plan.documentHash,plan,results,finalApproved:false};
   const dialog=document.createElement('dialog');dialog.className='production-print-readiness';
   const heading=document.createElement('h2');heading.textContent=`교정 v${plan.revisionNumber} · 원본·배치 검사`;
   const description=document.createElement('p');description.textContent=`사용 원본 ${plan.sources.length}개 · 이미지 사용 ${plan.uses.length}곳. 파일 크기·헤더·SHA-256과 실제 배치 해상도를 확인합니다. 완전한 이미지 디코딩·CMYK 생성·인쇄 승인은 포함하지 않습니다.`;
   const table=document.createElement('table'),head=document.createElement('tr');
   for(const label of ['면','개체','원본·배치 결과']){const th=document.createElement('th');th.textContent=label;head.append(th);}table.append(head);
   for(const use of plan.uses){const report=results.find(item=>item.source===use.source),placement=report?.placements?.find(item=>item.pageId===use.pageId&&item.objectId===use.objectId);
    const detail=report?.message||(!placement?'배치 검사 결과 없음':placement.status==='unresolved'?placement.reason:`${report.pixelWidth}×${report.pixelHeight}px · ${placement.effectiveDpi} DPI / 기준 ${plan.minimumDpi} · ${placement.status==='passed'?'기준 충족':placement.status==='blocked'?'기준 미달 · 원본 교체 필요':'보정 검토 대상 · 자동 보정 미수행'}`);
    const row=document.createElement('tr');for(const value of [use.pageNumber,`${use.role} · ${use.objectId}`,detail]){const td=document.createElement('td');td.textContent=value;row.append(td);}table.append(row);
   }
   const record=()=>({schemaVersion:'production-image-inspection.v1',requestId,revisionId:revision.id,documentHash:plan.documentHash,generatedAt:new Date().toISOString(),plan,results,finalApproved:false});
   const download=document.createElement('button');download.textContent='이 버전 검사 기록 다운로드';download.onclick=()=>downloadBlob(new Blob([JSON.stringify(record(),null,2)],{type:'application/json'}),`production-v${plan.revisionNumber}-image-inspection.json`);
   const close=document.createElement('button');close.textContent='닫기';close.onclick=()=>{if(!busy)dialog.close();};dialog.addEventListener('cancel',event=>{if(busy)event.preventDefault();});dialog.append(heading,description,table,download,close);dialog.onclose=()=>dialog.remove();document.body.append(dialog);dialog.showModal();
   setStatus(`교정 v${plan.revisionNumber} 원본·배치 검사를 마쳤습니다. 결과는 인쇄 승인이 아닙니다.`);
  }catch(error){setStatus(error.message);if(inspectionMode)throw error;}finally{busy=false;sync();}
 }
 imageCheck.onclick=inspectImages;
 window.ACDLProductionEditor={inlinePrintAssets,preparePrintPreflight:async()=>{if(!state?.revision||dirty())throw Error("저장한 교정 버전으로 검사해 주세요.");const revision=state.revision;const result=await api("/api/production-print-preflight","POST",{requestId,revisionId:revision.id,documentHash:revision.document_hash});if(state?.revision?.id!==revision.id||!auth.isSignedIn()||result.inspection.identity.revisionId!==revision.id||result.inspection.identity.documentHash!==revision.document_hash)throw Error("검사 버전이나 관리자 세션이 변경되었습니다. 다시 열어 주세요.");return result.inspection;}};
 setInterval(()=>{if(state){sync();const changed=dirty();if(changed&&!lastDirty&&!busy)status.textContent='저장하지 않은 교정 내용이 있습니다. 인쇄 검사는 저장 후 진행하세요.';lastDirty=changed;}},1000);
 if(inspectionMode){
  note.hidden=true;save.hidden=true;back.hidden=true;document.body.classList.add('production-inspection-mode');
  const reply=(action,result,error)=>window.parent.postMessage({type:'calendar:production-inspection-result',requestId,revisionId:state?.revision?.id,action,result,error},location.origin);
  window.addEventListener('message',async event=>{
   if(!embedded||event.source!==window.parent||event.origin!==location.origin||event.data?.type!=='calendar:production-inspection-command'||event.data.requestId!==requestId)return;
   const {action,revisionId,force,warningsAccepted}=event.data;
   if(commandBusy)return;
   if(!state?.revision||revisionId!==state.revision.id||!auth.isSignedIn())return reply(action,null,'검사할 교정 버전과 관리자 세션을 확인하세요.');
   commandBusy=true;
   try{
    let result;
    if(action==='quick'){
     const candidate=map(state.revision.document.editorProject,'open');candidate.template.publishing={};
     setStatus('기존 모듈로 문서·전체 면을 검사하는 중…');
     const report=await window.ACDLProductionPreflight.inspect({id:`production-${revisionId}`,name:`${state.receipt.school_name} · 교정 v${state.revision.revision_number}`,type:candidate.productType.category,edition:candidate.settings.year,state:'draft',version:state.revision.revision_number,productionProject:candidate});
     const images=await inspectImages();
     const errors=(report.issues||[]).filter(item=>item.severity==='error');const warnings=(report.issues||[]).filter(item=>item.severity==='warning');
     for(const item of images.results){if(item.status==='blocked')errors.push({message:item.message});for(const placement of item.placements||[])if(placement.status==='unresolved')errors.push({message:`${placement.pageNumber}면 · ${placement.role}: 배치 확인 불가`});else if(placement.status==='blocked')errors.push({code:'IMAGE_BELOW_ORDER_MINIMUM',message:`${placement.pageNumber}면 · ${placement.role}: ${placement.effectiveDpi} DPI · 최소 ${images.plan.imageQualityPolicy.orderMinimumDpi} DPI 미달. 원본 교체 또는 별도 제작 교정이 필요합니다.`});else if(placement.status==='warning')warnings.push({code:"IMAGE_LOW_DPI",source:item.source,origin:item.source.startsWith("package-asset://")?"template":assets.find(asset=>`production-asset://${asset.id}`===item.source)?.inspectionOrigin||"unknown",pageNumber:placement.pageNumber,role:placement.role,effectiveDpi:placement.effectiveDpi,minimumDpi:images.plan.minimumDpi,message:`${placement.pageNumber}면 · ${placement.role}: ${placement.effectiveDpi} DPI · 보정 검토 대상 (자동 보정 미수행)`});}
     lastQuick={revisionId,documentHash:state.revision.document_hash,errors:errors.length,warnings:warnings.length,completedAt:new Date().toISOString()};result={report,images,errors,warnings,identity:{revisionId,documentHash:state.revision.document_hash},finalApproved:false};
    }else if(action==='request'){
     if(!lastQuick||lastQuick.revisionId!==revisionId||lastQuick.errors)throw Error('빠른 검사를 완료하고 오류를 해결한 뒤 최종 생성을 요청하세요.');
     if(lastQuick.warnings&&!warningsAccepted)throw Error('경고 내용을 확인한 뒤 최종 생성을 요청하세요.');
     setStatus('저장 버전·원본 고정 후 기존 PDF Worker 작업을 요청하는 중…');
     result=await api('/api/production-print-preflight','POST',{requestId,revisionId,documentHash:state.revision.document_hash,action:'request',force:force===true,quickInspection:lastQuick,warningsAccepted:warningsAccepted===true});
    }else if(action==='status'||action==='download')result=await api('/api/production-print-preflight','POST',{requestId,revisionId,documentHash:state.revision.document_hash,action,jobId:event.data.jobId});
    else throw Error('알 수 없는 검사 작업입니다.');
    if(!auth.isSignedIn())throw Error('관리자 로그인이 만료되었습니다.');reply(action,result);
   }catch(error){reply(action,null,error.message);}finally{commandBusy=false;}
  });
 }
 launchUpdate('progress','관리자 세션 확인 중…',10);auth.ensureSession().then(()=>{if(!auth.isSignedIn()){loadingError('관리자 로그인이 필요합니다. 제작 검수에서 로그인 후 다시 열어 주세요.');return;}return load();}).catch(error=>loadingError(error.message));
})();
