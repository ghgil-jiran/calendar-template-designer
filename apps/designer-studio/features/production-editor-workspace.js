(()=>{
 const requestId=new URLSearchParams(location.search).get('productionRequest');
 if(!requestId)return;
 const auth=window.ACDLAdminAuth,adapter=window.ACDLProductionEditorAdapter,$=id=>document.getElementById(id);
 let state=null,busy=false,starting=false,saved='',pendingId=null,pendingFingerprint=null,assets=[],urls=new Map(),markers=new Map(),lastDirty=false;
 const normalizer=normalizeElementData;normalizeElementData=function(){if(project?.productionCorrection){project.book.elementsByPage||={};project.template.masterElements||={};return;}return normalizer();};
 const geometrySync=syncMonthlyGeometry;syncMonthlyGeometry=function(item){return project?.productionCorrection?0:geometrySync(item);};
 const visibleElements=allVisibleElements;allVisibleElements=function(){const items=visibleElements();return project?.productionCorrection?items.filter(item=>!['calendar','calendar-grid'].includes(item.type)):items;};
 const pageRenderer=renderPage;renderPage=function(){const page=project?.productionCorrection?selectedPage():null;if(page?.productionCalendarMaster)project.template.masters.calendar=page.productionCalendarMaster;return pageRenderer();};
 const bar=document.createElement('section');bar.className='production-editor-toolbar';bar.setAttribute('aria-label','접수본 교정');
 const title=document.createElement('strong'),status=document.createElement('span');status.setAttribute('role','status');
 const note=document.createElement('input');note.placeholder='교정 이유와 변경 내용';note.maxLength=2000;note.setAttribute('aria-label','교정 변경 기록');
 const save=document.createElement('button');save.textContent='새 교정 버전 저장';save.type='button';save.className='review-button';
 const inspect=document.createElement('button');inspect.textContent='저장 버전 인쇄 품질 검사';inspect.type='button';inspect.className='review-button';
 const readinessButton=document.createElement('button');readinessButton.type='button';readinessButton.className='review-button';readinessButton.textContent='출력 준비 확인';
 const back=document.createElement('a');back.href='./production-review.html';back.textContent='제작 검수로 돌아가기';
 bar.append(title,status,note,save,readinessButton,inspect,back);document.body.prepend(bar);const sizeWorkspace=()=>{const workspace=document.querySelector('.workspace');if(workspace)document.body.style.setProperty('--production-workspace-height',`${Math.max(400,innerHeight-(workspace.getBoundingClientRect().top+scrollY))}px`);};new ResizeObserver(sizeWorkspace).observe(bar);window.addEventListener('resize',sizeWorkspace);document.body.classList.add('production-correction-mode');
 function map(value,direction){if(typeof value==='string')return (direction==='open'?urls:markers).get(value)||value;if(Array.isArray(value))return value.map(v=>map(v,direction));if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,map(v,direction)]));return value;}
 function canonical(){const value=map(project,'save');if(value?.productionCorrection?.baseCalendarMaster)value.template.masters.calendar=value.productionCorrection.baseCalendarMaster;return value;}
 function dirty(){return state&&JSON.stringify(canonical())!==saved;}
 async function api(path,method='GET',body){const response=await auth.authorizedFetch(path,{method,...(body?{headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{})});const result=await response.json();if(!response.ok)throw Error(result.message||result.error||'교정 작업을 완료하지 못했습니다.');return result;}
 function register(marker,url){urls.set(marker,url);markers.set(url,marker);}
 function setStatus(message){status.textContent=message;}
 function sync(){save.disabled=busy||!state||!auth.isSignedIn()||!dirty();inspect.disabled=busy||!state?.revision||!auth.isSignedIn()||dirty();readinessButton.disabled=busy||!state?.revision||dirty();note.disabled=busy;}
 async function load(){
  if(starting||state)return;if(!auth.isSignedIn()){setStatus('관리자 로그인 후 접수본을 불러옵니다.');return;}
  starting=true;busy=true;setStatus('접수 당시 템플릿과 최신 교정 버전을 불러오는 중…');sync();
  try{
   const receipt=await api(`/api/production-requests?id=${encodeURIComponent(requestId)}`),data=await api(`/api/production-corrections?requestId=${encodeURIComponent(requestId)}&editor=1`);
   if(!auth.isSignedIn())throw Error('관리자 로그인이 필요합니다.');
   if(!['reviewing','changes'].includes(receipt.receipt.status))throw Error('제작 검수 1단계에서 검수를 시작한 뒤 교정할 수 있습니다.');
   assets=[...receipt.assets,...data.assets];for(const a of assets)register(`production-asset://${a.id}`,a.url);for(const a of data.editorSource.assets)register(a.marker,a.url);
   const revision=data.revisions[0]||null,runtimeDocument=revision?.document||receipt.receipt.snapshot.document;
   const raw=runtimeDocument.editorProject||adapter.createProject(data.editorSource.projectData,runtimeDocument,requestId);
   project=map(raw,'open');state={receipt:receipt.receipt,revision,identity:data.editorSource.identity,printInspection:data.printInspection,uploadAvailable:data.uploadAvailable};
   beginProjectTransition({clearProject:false});appMode='designer';selectedPageId=project.book.pageInstances[0]?.id;selectedElementId=null;selectedElementScope=null;history=[];future=[];calendarEditing=false;preview=false;previewType=null;
   for(const id of ['entryScreen','designerHome','setup','userSetup','templateLibraryModal'])$(id)?.classList.add('hidden');
   document.body.classList.remove('user-mode');setEditorContext('접수본 교정');render();stable();saved=JSON.stringify(canonical());
   title.textContent=`CAL-${String(state.receipt.receipt_number).padStart(6,'0')} · ${state.receipt.school_name} · ${revision?'교정 v'+revision.revision_number:'접수본'}`;
   $('saveBtn').textContent='교정 버전 저장';$('templateMode').textContent='접수본 교정';$('modeHelp').textContent='면을 선택하고 기존 개체를 직접 수정하세요. 원본 템플릿과 접수본은 보존됩니다.';
   const remote=window.ACDLTemplateRemotePersistence;if(remote)window.ACDLTemplateRemotePersistence={...remote,save:async()=>{throw Error('교정 내용은 상단 새 교정 버전 저장으로 저장해 주세요.');},saveDraft:async()=>{throw Error('교정 내용은 접수 건의 교정 버전으로 저장해야 합니다.');}};
   setStatus('접수본을 복원했습니다. 수정 후 변경 기록과 함께 저장하세요.');
  }catch(error){setStatus(error.message);}finally{starting=false;busy=false;sync();}
 }
 async function persist(){
  if(busy||!state||!dirty())return;if(!note.value.trim()){setStatus('교정 이유와 변경 내용을 입력해 주세요.');note.focus();return;}
  busy=true;sync();setStatus('새 교정 버전 저장 중…');
  try{
   const input=canonical();adapter.toDocument(input);const fingerprint=JSON.stringify(input)+note.value.trim();if(fingerprint!==pendingFingerprint){pendingId=crypto.randomUUID();pendingFingerprint=fingerprint;}
   const result=await api('/api/production-corrections','POST',{requestId,id:pendingId,baseRevisionId:state.revision?.id||null,note:note.value.trim(),editorProject:input});
   state.revision=result.revision;state.printInspection=null;project=map(result.revision.document.editorProject,'open');pendingId=null;pendingFingerprint=null;note.value='';render();stable();saved=JSON.stringify(canonical());lastDirty=false;
   title.textContent=`CAL-${String(state.receipt.receipt_number).padStart(6,'0')} · ${state.receipt.school_name} · 교정 v${result.revision.revision_number}`;setStatus('새 교정 버전을 저장했습니다. 이 버전의 인쇄 검사를 진행할 수 있습니다.');
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
 window.addEventListener('beforeunload',event=>{if(dirty()||busy){event.preventDefault();event.returnValue='';}});
 back.onclick=event=>{if((dirty()||busy)&&!confirm('저장하지 않은 교정 내용이 있습니다. 제작 검수로 돌아갈까요?'))event.preventDefault();};
 auth.onChange(()=>{if(!auth.isSignedIn()){state=null;urls.clear();markers.clear();saved='';project=null;showEntry();title.textContent='접수본 교정';setStatus('관리자 로그인이 필요합니다.');}else load();sync();});
 readinessButton.onclick=async()=>{if(busy||!state?.revision||dirty())return;busy=true;sync();try{const report=await window.ACDLProductionEditor.inspectNativeReadiness(),dialog=document.createElement('dialog');dialog.className='production-print-readiness';const heading=document.createElement('h2');heading.textContent=`교정 v${report.revisionNumber} · 출력 준비 확인`;const close=document.createElement('button');close.textContent='닫기';close.onclick=()=>dialog.close();const summary=document.createElement('p');summary.textContent=`개체 ${report.counts.objects}개 · 준비 ${report.counts.ready}개 · 보관 대기 ${report.counts.pending}개 · 해결 필요 ${report.counts.blocked}개. 최종 PDF 검사나 인쇄 승인이 아닙니다.`;dialog.append(heading,summary);for(const item of report.blockers){const p=document.createElement('p');p.textContent=item.message;dialog.append(p);}const table=document.createElement('table');const head=document.createElement('tr');for(const label of ['면','개체','해결할 항목']){const cell=document.createElement('th');cell.textContent=label;head.append(cell);}table.append(head);for(const item of report.items){const row=document.createElement('tr');for(const value of [item.pageNumber||item.pageId,`${item.role||item.type} · ${item.objectId}`,item.message+(item.effectiveDpi!=null?` · ${item.effectiveDpi} DPI / 기준 ${item.minimumDpi}`:'')]){const cell=document.createElement('td');cell.textContent=value;row.append(cell);}table.append(row);}dialog.append(table,close);dialog.onclose=()=>dialog.remove();document.body.append(dialog);dialog.showModal();}catch(error){setStatus(error.message);}finally{busy=false;sync();}};
 window.ACDLProductionEditor={inlinePrintAssets,inspectNativeReadiness:async()=>{const result=await api(`/api/production-print-readiness?requestId=${encodeURIComponent(requestId)}&revisionId=${encodeURIComponent(state.revision.id)}`);if(result.report.documentHash!==state.revision.document_hash)throw Error('검사 버전이 저장본과 일치하지 않습니다. 다시 열어 주세요.');return result.report;}};
 setInterval(()=>{if(state){sync();const changed=dirty();if(changed&&!lastDirty&&!busy)status.textContent='저장하지 않은 교정 내용이 있습니다. 인쇄 검사는 저장 후 진행하세요.';lastDirty=changed;}},1000);
 auth.ensureSession().then(load);
})();
