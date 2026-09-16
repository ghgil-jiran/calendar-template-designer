(()=>{
 const el=id=>document.getElementById(id);
 const catalog=window.ACDL_TEMPLATE_CATALOG||{types:[],templates:[]};
 const typeKey='acdl.calendarTypeDefinitions.v37';
 const validStates=new Set(['draft','ready','published','archived']);
 const stateLabels={draft:'초안',ready:'검토 완료',published:'게시됨',archived:'보관됨'};
 const scopeFilterStates={custom:['draft','archived'],base:['ready','published','archived']};
 const scopeSettingStates={custom:['draft','ready','archived'],base:['ready','published','archived']};
 const oldLibrary=typeof window.v22Library==='function'?window.v22Library:()=>[];
 const oldSaveLibrary=typeof window.v22SaveLibrary==='function'?window.v22SaveLibrary:()=>undefined;
 const oldRenderLibrary=typeof window.renderTemplateLibrary==='function'?window.renderTemplateLibrary:()=>{};
 const oldRenderUserChoices=typeof window.renderUserTemplateChoices==='function'?window.renderUserTemplateChoices:()=>{};
 const oldApplyType=typeof window.applyCalendarType==='function'?window.applyCalendarType:()=>undefined;
 let activeLibraryScope='base';
 let activeTypeFilter='all';
 let activeLibraryState='all';
 let activeStandardOnly=false;
 let thumbnailQueue=Promise.resolve();
 const thumbnailMarkupCache=new Map();
 const thumbnailObjectUrls=new Set();
 const versionHistoryCache=new Map();
 let pendingClone=null;
 const catalogDeletionStorageKey='acdl.deletedTemplateCatalogKeys.v1';
 function readCatalogDeletions(){try{const values=JSON.parse(localStorage.getItem(catalogDeletionStorageKey)||'[]');return new Set(Array.isArray(values)?values:[])}catch{return new Set()}}
 let deletedCatalogKeys=readCatalogDeletions();
 function replaceCatalogDeletions(values){deletedCatalogKeys=new Set((Array.isArray(values)?values:[]).filter(Boolean));localStorage.setItem(catalogDeletionStorageKey,JSON.stringify([...deletedCatalogKeys]))}
 function hideCatalogKey(value){if(!value)return;deletedCatalogKeys.add(value);localStorage.setItem(catalogDeletionStorageKey,JSON.stringify([...deletedCatalogKeys]))}
 window.ACDLTemplateCatalogDeletions=Object.freeze({replace:replaceCatalogDeletions,hide:hideCatalogKey,list:()=>[...deletedCatalogKeys]});

 function installTemplateOpenProgress(){
  const overlay=document.createElement('div');overlay.id='templateOpenProgress';overlay.className='template-open-progress hidden';overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-live','polite');overlay.innerHTML='<div class="template-open-progress-card"><div class="template-open-spinner" aria-hidden="true"></div><div><strong id="templateOpenProgressTitle">템플릿을 불러오고 있습니다.</strong><p id="templateOpenProgressMessage">저장 위치를 확인하고 있습니다.</p></div><span id="templateOpenProgressPercent">0%</span><div class="template-open-progress-track"><div id="templateOpenProgressBar"></div></div><ol id="templateOpenProgressSteps"><li data-open-step="local">브라우저 저장본 확인</li><li data-open-step="remote">원격 템플릿 다운로드</li><li data-open-step="asset-resolve">AI 이미지 자산 복원</li><li data-open-step="validate">문서 무결성 검사</li><li data-open-step="render">편집 화면 구성</li></ol></div>';document.body.appendChild(overlay);
  const weights={local:10,remote:35,'asset-scan':40,'asset-resolve':70,validate:85,recovery:75,document:70,render:95,complete:100},labels={local:'브라우저 저장본을 확인하고 있습니다.',remote:'원격 템플릿 문서를 다운로드하고 있습니다.','asset-scan':'저장된 AI 이미지 목록을 확인하고 있습니다.','asset-resolve':'AI 이미지 자산을 복원하고 있습니다.',validate:'페이지와 AI 디자인의 무결성을 검사하고 있습니다.',recovery:'브라우저 복구본을 확인하고 있습니다.',document:'복제할 템플릿 문서를 준비하고 있습니다.',render:'페이지와 편집 개체를 구성하고 있습니다.',complete:'편집 화면 준비가 완료되었습니다.'};
  let timer=0;
  const update=({phase='local',completed=0,total=1}={})=>{const base=weights[phase]??5,next=phase==='asset-resolve'&&total?40+(completed/total)*30:base,percent=Math.max(0,Math.min(100,Math.round(next)));el('templateOpenProgressMessage').textContent=labels[phase]||'템플릿을 준비하고 있습니다.';el('templateOpenProgressPercent').textContent=`${percent}%`;el('templateOpenProgressBar').style.width=`${percent}%`;overlay.querySelectorAll('[data-open-step]').forEach(step=>{const stepWeight=weights[step.dataset.openStep]||0;step.classList.toggle('done',stepWeight<percent);step.classList.toggle('active',step.dataset.openStep===phase)})};
  const start=(kind,name)=>{clearTimeout(timer);el('templateOpenProgressTitle').textContent=kind==='clone'?'새 템플릿의 기준을 불러오고 있습니다.':'템플릿 편집 화면을 준비하고 있습니다.';el('templateOpenProgressMessage').textContent=name?`${name} 저장 위치를 확인하고 있습니다.`:'저장 위치를 확인하고 있습니다.';overlay.classList.remove('hidden','error');update({phase:'local'})};
  const complete=()=>{update({phase:'complete',completed:1,total:1});timer=setTimeout(()=>overlay.classList.add('hidden'),350)};
  const fail=error=>{overlay.classList.add('error');el('templateOpenProgressTitle').textContent='템플릿을 열지 못했습니다.';el('templateOpenProgressMessage').textContent=error?.message||String(error);el('templateOpenProgressPercent').textContent='오류';timer=setTimeout(()=>overlay.classList.add('hidden'),3500)};
  window.ACDLTemplateOpenProgress=Object.freeze({start,update,complete,fail});
 }

 function escape(value){return typeof v21Escape==='function'?v21Escape(value):String(value??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]))}
 function readCustomTypes(){try{const value=JSON.parse(localStorage.getItem(typeKey)||'null');return Array.isArray(value)?value:[]}catch{return[]}}
 function allTypes(){
  const map=new Map((catalog.types||[]).map(type=>[type.id,{...type}]));
  readCustomTypes().forEach(type=>{if(type?.id&&!map.has(type.id))map.set(type.id,{id:type.id,label:type.name||type.id,description:type.description||`${type.name||type.id} 유형 템플릿`,icon:'▦',enabled:true,sortOrder:100,baseType:type.baseType||'desk',custom:true,...type})});
  return [...map.values()].sort((a,b)=>(a.sortOrder??999)-(b.sortOrder??999)||String(a.label).localeCompare(String(b.label),'ko'));
 }
 function typeMeta(type){return allTypes().find(item=>item.id===type)||{id:type,label:type,description:'등록된 유형 설명이 없습니다.',enabled:true,sortOrder:999,baseType:type}}
 function stateOf(record){const state=record?.status||record?.state;return validStates.has(state)?state:'draft'}
 function scopeOf(record){
  const state=stateOf(record);
  if(state==='ready'||state==='published')return 'base';
  if(state==='draft')return 'custom';
  return record?.libraryScope==='base'||record?.source==='catalog'?'base':'custom';
 }
 function configureStateOptions(scope,currentState){
  const select=el('saveTemplateState');if(!select)return;
  const allowed=scopeSettingStates[scope]||scopeSettingStates.custom;
  select.replaceChildren(...allowed.map(state=>Object.assign(document.createElement('option'),{value:state,textContent:stateLabels[state]})));
  select.value=allowed.includes(currentState)?currentState:allowed[0];
 }
 function sizeOf(record){
  const preset=(window.SIZE_PRESETS?.[record.type]||[]).find(item=>item.recommended)||(window.SIZE_PRESETS?.[record.type]||[])[0];
  return record.size|| (preset?{width:preset.width,height:preset.height,unit:'mm',label:preset.label}:{});
 }
 function normalize(record, source='catalog'){
  const type=record?.type?.category||record?.type||'desk';
  const meta=typeMeta(type);
  const state=stateOf(record);
  const updatedAt=record?.updatedAt||new Date().toISOString();
  const templateId=record?.template||'school-basic';
  const version=Number(record?.version)||1;
  const familyId=record?.familyId||`${templateId}-${type}`;
  const calendarYear=Number(record?.calendarYear||record?.edition||2027);
  const templateKind=record?.templateKind||record?.kind||type;
  const publishedAt=record?.publishedAt|| (state==='published'?updatedAt:null);
  const readyAt=record?.readyAt|| (state==='ready'?updatedAt:null);
  const archivedAt=record?.archivedAt|| (state==='archived'?updatedAt:null);
  return {...record,
    source:record?.source||source,
    stableKey:record?.stableKey||record?.id,
    type,
    state,
    status:state,
    isStandard:record?.isStandard===true,
    name:record?.name||'이름 없는 템플릿',
    description:record?.description||'',
    edition:Number(record?.edition)||2027,
    calendarYear,
    template:templateId,
    templateKind,
    familyId,
    features:record?.features||[],
    size:sizeOf({...record,type}),
    pageSummary:record?.pageSummary||`${meta.duplex?'앞면·뒷면':'단면'} · ${meta.monthlyCount||12}개월`,
    thumbnail:record?.thumbnail||{kind:'renderer',source:'templateData'},
    updatedAt,
    version,
    publishedAt,
    readyAt,
    archivedAt,
    templateData:record?.templateData||{preset:templateId}
  };
 }
 function records(){
  const remoteLibrary=window.ACDLTemplateRemotePersistence?.isRemote?.()&&window.ACDLTemplateRemotePersistence?.hasSession?.();
  const map=new Map((remoteLibrary?[]:(catalog.templates||[])).filter(record=>!deletedCatalogKeys.has(record.stableKey||record.id)).map(record=>[record.id,normalize(record,'catalog')]));
  oldLibrary().map(record=>normalize(record,'local')).forEach(record=>{
   const catalogMatch=[...map.values()].find(item=>item.source==='catalog'&&(item.id===record.stableKey||item.stableKey===record.stableKey));
   if(catalogMatch){map.delete(catalogMatch.id);map.set(record.id,normalize({...catalogMatch,...record,catalogId:catalogMatch.id,source:'catalog'},'catalog'));return}
   if(record.libraryOverride||!map.has(record.id))map.set(record.id,record)
  });
  return [...map.values()];
 }
 function saveRecords(list){oldSaveLibrary(list.map(record=>normalize(record,record?.source||'local')))}
 const TemplateLibraryRepository={
  list(){return records()},
  get(id){return records().find(record=>record.id===id)||null},
  async save(record){const normalized=normalize(record,record?.source||'local');const existing=records().filter(item=>item.id!==normalized.id);saveRecords([...existing,normalized]);return TemplateLibraryRepository.get(normalized.id)},
  remove(id){saveRecords(records().filter(record=>record.id!==id));},
  async loadProject(id){return typeof loadTemplateProjectData==='function'?await loadTemplateProjectData(id):null},
  async saveProject(id,data){return typeof saveTemplateProjectData==='function'?await saveTemplateProjectData(id,data):null}
 };
 window.TemplateLibraryRepository=TemplateLibraryRepository;
 function label(type){return typeMeta(type).label}
 function cardStateLabel(record){return record.state==='published'?'게시됨':record.state==='archived'?'보관됨':record.state==='ready'?'검토 완료':'초안'}
 function internalVersionLabel(record){const packageVersion=record.packageVersion||record.lastReviewPackage?.version;return packageVersion?`편집 이력 v${record.version} · Package ${packageVersion}`:`편집 이력 v${record.version}`}
 function publishedCount(type){return records().filter(record=>record.type===type&&record.state==='published').length}
 function typeOptions(){return allTypes().filter(type=>type.enabled!==false)}
 function ensureTypeOptions(){
  const select=el('setupType');if(!select)return;
  const current=select.value;select.innerHTML=typeOptions().map(type=>`<option value="${escape(type.id)}">${escape(label(type.id))}</option>`).join('');if(typeOptions().some(type=>type.id===current))select.value=current;
 }
 function renderTypeChoices(){
  const grid=document.querySelector('.calendar-type-grid');if(!grid)return;
  grid.innerHTML=typeOptions().map(type=>{const count=publishedCount(type.id);const selected=type.id===selectedCalendarType;return `<button type="button" class="calendar-type-choice ${selected?'selected':''}" data-calendar-type="${escape(type.id)}" aria-pressed="${selected}"><div class="type-icon">${type.icon||'▦'}</div><strong>${escape(type.label)}</strong><small>${escape(type.description)}</small><span class="catalog-type-count">게시 템플릿 ${count}개 · ${type.enabled===false?'사용 불가':'사용 가능'}</span></button>`}).join('');
  grid.querySelectorAll('[data-calendar-type]').forEach(button=>button.addEventListener('click',()=>applyCalendarType(button.dataset.calendarType)));
 }
 function renderTypeFilters(){
  const host=el('libraryTypeFilters');if(!host)return;
  host.innerHTML=[`<button class="library-type-filter ${activeTypeFilter==='all'?'active':''}" data-library-type="all">모든 유형</button>`,...typeOptions().map(type=>`<button class="library-type-filter ${activeTypeFilter===type.id?'active':''}" data-library-type="${escape(type.id)}">${escape(type.label)} <span>${publishedCount(type.id)}</span></button>`)].join('');
  host.querySelectorAll('[data-library-type]').forEach(button=>button.addEventListener('click',()=>{activeTypeFilter=button.dataset.libraryType;renderLibrary(activeLibraryState)}));
 }
 function renderStateFilters(){
  const host=el('libraryStateFilters');if(!host)return;
  const states=scopeFilterStates[activeLibraryScope]||scopeFilterStates.custom;
  if(activeLibraryState!=='all'&&!states.includes(activeLibraryState))activeLibraryState='all';
  host.replaceChildren(...['all',...states].map(state=>{
   const button=document.createElement('button');button.dataset.libraryState=state;button.textContent=state==='all'?'전체':stateLabels[state];button.classList.toggle('active',state===activeLibraryState);return button
  }));
  host.querySelectorAll('[data-library-state]').forEach(button=>button.addEventListener('click',()=>{activeLibraryState=button.dataset.libraryState;renderLibrary(activeLibraryState)}));
 }
 function cardMarkup(record){
  const meta=typeMeta(record.type);
  const features=record.features?.length?record.features.map(item=>`<span>${escape(item)}</span>`).join(''):`<span>${escape(meta.description)}</span>`;
  const displayScope=scopeOf(record);
  const kindLabel=displayScope==='custom'?'내 템플릿':'시스템 베이스';
  const kindClass=displayScope==='custom'?'custom-template':'base-template';
  const remoteStored=record.storage==='supabase';
  const storageBadge=record.source==='local'?`<span class="${remoteStored?'storage-remote':'storage-local'}">${remoteStored?'Supabase 원격 저장':'브라우저 저장 · 원격 저장 필요'}</span>`:'';
  const remoteHistory=remoteStored?`<button data-library-history="${escape(record.id)}" aria-expanded="false">버전 이력</button>`:'';
  const qualityCheck=`<button type="button" data-library-quality-check="${escape(record.id)}">인쇄·출력 품질 검사</button>`;
  const locked=record.isStandard===true;
  const editAction=locked?'':`<button data-library-edit="${escape(record.id)}">편집</button>`;
  const fallbackImage=record.template==='desk-sample-3'?'./assets/sample-three/school-building.webp':'./assets/sample-school/jiran-building.webp';
  return `<article class="library-template-card ${kindClass}" data-template-id="${escape(record.id)}" data-library-state="${record.state}" data-library-type="${escape(record.type)}"><div class="library-thumb calendar-product-thumb calendar-product-${escape(record.type)}"><div class="calendar-product-shell"><span class="calendar-product-binding" aria-hidden="true"></span><div class="calendar-product-page" data-library-thumbnail="${escape(record.id)}"><img class="library-thumbnail-fallback" src="${fallbackImage}" alt=""><span class="thumbnail-placeholder">표지를 불러오는 중입니다.</span></div><span class="calendar-product-side" aria-hidden="true"></span><span class="calendar-product-stand" aria-hidden="true"></span></div></div><div class="library-card-body"><div class="library-card-badges"><span class="state-badge state-${record.state}">${escape(cardStateLabel(record))}</span>${record.isStandard?'<span class="standard-badge">표준</span>':''}</div><div class="library-meta-line"><h3>${escape(record.name)}</h3><span class="edition-badge">${record.edition} Edition</span></div><small class="library-card-version">${escape(internalVersionLabel(record))}</small><p>${escape(record.description)}</p><div class="library-card-meta"><span class="badge-base">${escape(kindLabel)}</span>${storageBadge}<span>${escape(meta.label)}</span><span>${escape(record.size?.label||`${record.size?.width||'-'} × ${record.size?.height||'-'} ${record.size?.unit||'mm'}`)}</span></div><div class="template-tags catalog-card-features">${features}</div><small>수정 ${escape(String(record.updatedAt).slice(0,10))}</small><div class="library-card-actions"><button class="primary" data-library-use="${escape(record.id)}">이 템플릿으로 새로 만들기</button>${editAction}<button data-library-settings="${escape(record.id)}">설정</button>${remoteHistory}${qualityCheck}</div><div class="library-version-history hidden" data-library-history-panel="${escape(record.id)}"></div></div></article>`;
 }
 function versionStateLabel(state){return state==='published'?'게시됨':state==='archived'?'보관됨':state==='ready'?'검토 완료':'초안'}
 function versionKindLabel(kind){return kind==='restore'?'복원':kind==='publish'?'게시 저장':'직접 저장'}
 function versionDate(value){try{return new Intl.DateTimeFormat('ko-KR',{dateStyle:'medium',timeStyle:'short'}).format(new Date(value))}catch{return String(value||'-')}}
 function historyMarkup(templateId,versions,currentVersion){
  if(!versions.length)return '<p class="library-version-empty">저장된 버전이 없습니다.</p>';
  return versions.map(version=>`<div class="library-version-row ${Number(version.versionNumber)===Number(currentVersion)?'current':''}"><div class="library-version-summary"><strong>v${escape(String(version.versionNumber))}</strong><span>${escape(versionDate(version.createdAt))}</span><span>${escape(versionStateLabel(version.state))} · ${escape(versionKindLabel(version.saveKind))}</span>${version.saveNote?`<small>${escape(version.saveNote)}</small>`:''}</div><div class="library-version-actions">${Number(version.versionNumber)===Number(currentVersion)?'<span>현재 버전</span>':`<button data-version-restore="${escape(version.id)}" data-template-id="${escape(templateId)}">이 버전 복원</button>`}</div></div>`).join('');
 }
 async function restoreVersion(templateId,versionId){
  const remote=window.ACDLTemplateRemotePersistence,version=(versionHistoryCache.get(templateId)||[]).find(item=>item.id===versionId);if(!remote||!version)return;
  if(!confirm(`v${version.versionNumber}의 내용을 새 최신 버전으로 복원할까요?\n기존 버전은 그대로 보존됩니다.`))return;
  await remote.restore(templateId,versionId,`v${version.versionNumber}에서 복원`);versionHistoryCache.delete(templateId);await refreshRemoteTemplateLibrary();renderLibrary(activeLibraryState);showEditorToast(`v${version.versionNumber}의 내용을 새 버전으로 복원했습니다.`);
  const button=document.querySelector(`[data-library-history="${CSS.escape(templateId)}"]`);button?.click();
 }
 async function toggleVersionHistory(button){
  const templateId=button.dataset.libraryHistory,panel=document.querySelector(`[data-library-history-panel="${CSS.escape(templateId)}"]`),record=records().find(item=>item.id===templateId);if(!panel||!record)return;
  const opening=panel.classList.contains('hidden');panel.classList.toggle('hidden',!opening);button.setAttribute('aria-expanded',String(opening));if(!opening)return;
  panel.innerHTML='<p class="library-version-loading">버전 이력을 불러오는 중입니다.</p>';
  try{let versions=versionHistoryCache.get(templateId);if(!versions){const result=await window.ACDLTemplateRemotePersistence.versions(templateId);versions=result.versions||[];versionHistoryCache.set(templateId,versions)}panel.innerHTML=historyMarkup(templateId,versions,record.version);panel.querySelectorAll('[data-version-restore]').forEach(item=>item.addEventListener('click',()=>restoreVersion(templateId,item.dataset.versionRestore).catch(error=>showEditorToast(error?.message||'버전을 복원하지 못했습니다.'))))}catch(error){panel.innerHTML=`<p class="library-version-error">${escape(error?.message||'버전 이력을 불러오지 못했습니다.')}</p>`}
 }
 function mountCoverSnapshot(record,host,page){
  // The editor page is a fixed design surface with an outer display scale. A
  // thumbnail must start from that unscaled surface; getBoundingClientRect()
  // includes the editor scale and would make the clone scale twice.
  const designSize=window.ACDLEditorPageFit?.designSize?.();
  const sourceWidth=Math.max(1,Math.round(Number(designSize?.width)||page.offsetWidth||parseFloat(page.style.width)||850));
  const sourceHeight=Math.max(1,Math.round(Number(designSize?.height)||page.offsetHeight||parseFloat(page.style.height)||588));
  const clone=page.cloneNode(true);
  clone.removeAttribute('id');clone.classList.add('library-thumb-render','library-cover-snapshot');
  clone.querySelectorAll('.editor-only,.non-output,.s2-selection-toolbar,.s2-key-hint,.selected').forEach(node=>{node.classList.contains('selected')?node.classList.remove('selected'):node.remove()});
  clone.style.removeProperty('transform');clone.style.setProperty('transform-origin','top left','important');clone.style.setProperty('width',`${sourceWidth}px`,'important');clone.style.setProperty('height',`${sourceHeight}px`,'important');clone.style.setProperty('max-width','none','important');clone.style.setProperty('max-height','none','important');clone.style.setProperty('inset','auto','important');
  const fit=()=>{if(!host.isConnected)return;const scale=Math.min(host.clientWidth/sourceWidth,host.clientHeight/sourceHeight);clone.style.setProperty('left',`${Math.max(0,(host.clientWidth-sourceWidth*scale)/2)}px`,'important');clone.style.setProperty('top',`${Math.max(0,(host.clientHeight-sourceHeight*scale)/2)}px`,'important');clone.style.setProperty('transform',`scale(${scale})`,'important')};
  host.innerHTML='';host.appendChild(clone);fit();
  thumbnailMarkupCache.set(`${record.id}:${record.version}:${record.updatedAt}`,host.innerHTML);
  if(typeof ResizeObserver==='function'){const observer=new ResizeObserver(fit);observer.observe(host);host._thumbnailObserver?.disconnect?.();host._thumbnailObserver=observer}
 }
 async function renderActualThumbnailNow(record,host){
  if(!host||host.dataset.rendered==='true'||el('templateLibraryModal')?.classList.contains('hidden'))return;
  const navigation=window.ACDLProjectNavigation;
  const transitionId=navigation?.current?.();
  let original=null;
  try{
   original={project,selectedPageId,selectedElementId,selectedElementScope,calendarEditing,history,future};
   let source=await loadTemplateProjectData(record.id);
   if(!host.isConnected||el('templateLibraryModal')?.classList.contains('hidden')||(navigation&&!navigation.isCurrent(transitionId)))return;
   const uploaded=source?.template?.thumbnail?.kind==='upload'?source.template.thumbnail:record.thumbnail?.kind==='upload'?record.thumbnail:null;
   if(uploaded?.dataUrl){host.innerHTML=`<img class="library-uploaded-thumbnail" src="${uploaded.dataUrl}" alt="${escape(record.name)} 대표 이미지">`;host.dataset.rendered='true';return}
   if(!source){const preset=(SIZE_PRESETS[record.type]||SIZE_PRESETS.desk||[]).find(item=>item.recommended)||(SIZE_PRESETS[record.type]||SIZE_PRESETS.desk||[])[0];source=makeProject({type:record.type,year:record.edition,startMonth:3,template:record.packageVersion?'school-basic':record.template,frontInsertCount:record.packageVersion?0:1,rearInsertCount:0,calendarRows:record.packageVersion?5:6,weekStart:'sunday',showAdjacentMiniCalendars:true,posterColumns:4,sizePresetId:preset?.id});if(record.packageVersion)source=await window.ACDLPackageProjectAdapter.loadAndApply(source,record.packageBase)}
   project=structuredClone(source);const pages=project.book.pageInstances||[],preferred=record.type==='poster'?pages.find(page=>page.role==='poster-annual'):pages.find(page=>page.role==='cover-front');selectedPageId=preferred?.id||pages[0]?.id||null;selectedElementId=null;selectedElementScope=null;calendarEditing=false;history=[];future=[];render();window.ACDLEditorPageFit?.fit?.();
   const page=el('page');if(!page)return;mountCoverSnapshot(record,host,page);host.dataset.rendered='true';
  }catch(error){host.innerHTML='<span class="thumbnail-placeholder">미리보기를 만들 수 없습니다.</span>';console.warn('Template thumbnail failed',record.id,error)}
  finally{if(original&&(!navigation||navigation.isCurrent(transitionId))){project=original.project;selectedPageId=original.selectedPageId;selectedElementId=original.selectedElementId;selectedElementScope=original.selectedElementScope;calendarEditing=original.calendarEditing;history=original.history;future=original.future;if(project)render()}}
 }
 function renderActualThumbnail(record,host){const key=`${record.id}:${record.version}:${record.updatedAt}`,cached=thumbnailMarkupCache.get(key);if(cached&&host){host.innerHTML=cached;host.dataset.rendered='true';return Promise.resolve()}thumbnailQueue=thumbnailQueue.then(()=>renderActualThumbnailNow(record,host)).catch(error=>console.warn('Template thumbnail queue failed',record.id,error));return thumbnailQueue}
 function releaseThumbnailObjectUrls(){thumbnailObjectUrls.forEach(url=>URL.revokeObjectURL?.(url));thumbnailObjectUrls.clear()}
 async function hydrateThumbnails(list){releaseThumbnailObjectUrls();const markers=[],pending=[];list.forEach(record=>{const host=document.querySelector(`[data-library-thumbnail="${CSS.escape(record.id)}"]`);if(!host)return;const uploaded=record.thumbnail?.kind==='upload'?record.thumbnail:null,src=uploaded?.dataUrl||'',match=String(src).match(/^acdl-asset:\/\/([0-9a-f-]{36})$/i);if(match){markers.push(match[1]);pending.push({record,host,assetId:match[1]});return}if(src){host.innerHTML=`<img class="library-uploaded-thumbnail" src="${src}" alt="${escape(record.name)} 대표 이미지">`;host.dataset.rendered='true';return}if(record.source==='catalog'){renderActualThumbnail(record,host);return}host.innerHTML='<span class="thumbnail-placeholder">대표 이미지 저장 필요</span>';host.dataset.rendered='missing'});if(!markers.length)return;try{const result=await window.ACDLTemplateRemotePersistence?.assetObjectUrls?.(markers)||{urls:{},failures:[]},urls=result.urls||{};pending.forEach(({record,host,assetId})=>{const src=urls[assetId];if(src)thumbnailObjectUrls.add(src);if(!host.isConnected)return;if(src){host.innerHTML=`<img class="library-uploaded-thumbnail" src="${src}" alt="${escape(record.name)} 대표 이미지">`;host.dataset.rendered='true'}else{host.innerHTML='<span class="thumbnail-placeholder">대표 이미지 파일을 불러오지 못했습니다.</span>';host.dataset.rendered='failed'}});if(result.failures?.length)console.warn('Template thumbnail assets failed',result.failures.map(item=>({id:item.id,status:item.error?.status,code:item.error?.code})))}catch(error){pending.forEach(({host})=>{if(host.isConnected){host.innerHTML='<span class="thumbnail-placeholder">대표 이미지 파일을 불러오지 못했습니다.</span>';host.dataset.rendered='failed'}});console.warn('Template thumbnail batch failed',error)}}
 function editionOptions(){
  return [...new Set(records().map(record=>Number(record.edition)))].filter(Number).sort((a,b)=>b-a);
 }
 function renderEditionOptions(){
  const select=el('libraryEditionFilter');
  if(!select)return;
  const current=select.value||'all';
  select.innerHTML=[`<option value="all">모든 Edition</option>`,...editionOptions().map(edition=>`<option value="${edition}">${edition} Edition</option>`)];
  if([...select.options].some(option=>option.value===current))select.value=current;
 }
 function scopeLabel(scope){return scope==='custom'?'내 템플릿':'시스템 베이스';}
 function updateLibrarySummary(listCount){
  const summary=el('templateLibrarySummary');
  if(!summary)return;
  const scopeText=scopeLabel(activeLibraryScope);
  const countText=listCount==null?records().filter(filterActive).length:listCount;
  summary.textContent=`${scopeText} · ${countText}개 템플릿 · Edition ${el('libraryEditionFilter')?.value||'all'}`;
 }
 async function projectForRecord(record,{onProgress}={}){
  let source=await loadTemplateProjectData(record.id,{onProgress});
  if(source)return structuredClone(source);
  const preset=(SIZE_PRESETS[record.type]||SIZE_PRESETS.desk||[]).find(item=>item.recommended)||(SIZE_PRESETS[record.type]||SIZE_PRESETS.desk||[])[0];
  source=makeProject({type:record.type,year:record.edition,startMonth:3,template:record.packageVersion?'school-basic':record.template,frontInsertCount:record.packageVersion?0:1,rearInsertCount:0,calendarRows:record.packageVersion?5:6,weekStart:'sunday',showAdjacentMiniCalendars:true,posterColumns:4,sizePresetId:preset?.id});
  return record.packageVersion?await window.ACDLPackageProjectAdapter.loadAndApply(source,record.packageBase):source;
 }
 async function startNewFrom(record){
  if(!record)return;
  const progress=window.ACDLTemplateOpenProgress;progress?.start?.('clone',record.name);
  let source;try{source=await projectForRecord(record,{onProgress:detail=>progress?.update?.(detail)});progress?.update?.({phase:'validate',completed:1,total:1})}catch(error){progress?.fail?.(error);throw error}pendingClone={record,source};
  el('cloneTemplateName').value=`${record.name} 복사본`;el('cloneTemplateDescription').value=record.description||'';el('cloneTemplateEdition').value=record.edition;el('cloneTemplateStartMonth').value=source.settings?.startMonth||3;
  el('templateLibraryModal').classList.add('hidden');el('templateCloneDialog').classList.remove('hidden');progress?.complete?.()
 }
 function clonedProject(source,record,values){
  const copy=structuredClone(source);copy.template||={};copy.template.id=null;delete copy.template.remoteId;delete copy.template.remoteStableKey;delete copy.template.remoteVersionNumber;copy.template.librarySource='local';copy.template.libraryScope='custom';copy.template.derivedFromTemplateId=record.id;copy.template.cloneProvenance={sourceTemplateId:record.id,sourceVersion:Number(record.version)||null,clonedAt:new Date().toISOString(),designPreserved:true};copy.template.metadata={...(copy.template.metadata||{}),name:values.name,description:values.description,edition:values.edition,state:'draft',isStandard:false};
  if(copy.template.aiDesignDraft){const draft=copy.template.aiDesignDraft;delete draft.session;delete draft.selectedVariant;draft.cloneState='applied-design-preserved';draft.clonedFrom={templateId:record.id,version:Number(record.version)||null}}
  window.ACDLTemplateYearSynchronizer.synchronize(copy,{year:values.edition,startMonth:values.startMonth});return copy
 }
 function installCloneDialog(){
  const dialog=document.createElement('div');dialog.id='templateCloneDialog';dialog.className='template-save-dialog hidden';dialog.innerHTML='<div class="template-save-card"><h2>이 템플릿으로 새로 만들기</h2><p>현재 디자인·페이지·Master·편집 개체·AI 이미지를 그대로 복제합니다.</p><label>새 템플릿 이름<input id="cloneTemplateName"></label><label>설명<textarea id="cloneTemplateDescription" rows="3"></textarea></label><label>Edition 및 달력 연도<input id="cloneTemplateEdition" type="number" min="2000" max="2200"></label><label>시작월<select id="cloneTemplateStartMonth"></select></label><div class="template-save-actions"><button id="cancelTemplateCloneBtn">취소</button><button id="confirmTemplateCloneBtn" class="primary">복제하여 편집 시작</button></div></div>';document.body.appendChild(dialog);el('cloneTemplateStartMonth').innerHTML=Array.from({length:12},(_,index)=>`<option value="${index+1}">${index+1}월</option>`).join('');
  el('cancelTemplateCloneBtn').onclick=()=>{pendingClone=null;dialog.classList.add('hidden');el('templateLibraryModal').classList.remove('hidden')};
  el('confirmTemplateCloneBtn').onclick=async()=>{if(!pendingClone)return;const {record,source}=pendingClone,name=el('cloneTemplateName').value.trim()||`${record.name} 복사본`,description=el('cloneTemplateDescription').value.trim(),edition=Number(el('cloneTemplateEdition').value)||record.edition,startMonth=Number(el('cloneTemplateStartMonth').value)||source.settings?.startMonth||3,copy=clonedProject(source,record,{name,description,edition,startMonth});pendingClone=null;dialog.classList.add('hidden');await openDesignerProjectFromRecord({...record,id:null,remoteId:null,stableKey:null,source:'local',name,description,edition,state:'draft',isStandard:false,projectData:copy});window.ACDLResetAIDesignCloneRuntime?.();window.render?.();showEditorToast(`${record.name}의 디자인을 보존한 새 템플릿을 만들었습니다.`)}
 }
 function openSettings(record){
  if(!record)return;const dialog=el('templateSaveDialog');dialog.dataset.mode='settings';dialog.dataset.recordId=record.id;el('templateSaveDialogTitle').textContent='템플릿 설정';el('templateSaveDialogHelp').textContent='디자인은 변경하지 않고 라이브러리 관리 정보만 저장합니다.';el('saveTemplateName').value=record.name;el('saveTemplateDescription').value=record.description||'';el('saveTemplateEdition').value=record.edition;configureStateOptions(scopeOf(record),record.state);el('saveTemplateStandard').checked=record.isStandard===true;el('templateSaveFeedback').className='save-feedback hidden';el('deleteTemplatePermanentlyBtn')?.classList.remove('hidden');dialog.classList.remove('hidden')
 }
 function installPermanentDeleteDialog(){
  const button=el('deleteTemplatePermanentlyBtn');if(!button)return;
  const dialog=document.createElement('div');dialog.id='templatePermanentDeleteDialog';dialog.className='template-save-dialog hidden';dialog.innerHTML='<div class="template-save-card template-delete-card" role="alertdialog" aria-modal="true" aria-labelledby="templateDeleteTitle" aria-describedby="templateDeleteDescription"><h2 id="templateDeleteTitle">템플릿을 완전히 삭제할까요?</h2><p id="templateDeleteDescription">이 템플릿과 모든 버전 이력은 복구할 수 없습니다. 다른 템플릿에서 사용하지 않는 전용 이미지도 함께 삭제됩니다.</p><div class="template-delete-target"><span>삭제 대상</span><strong id="templateDeleteTarget"></strong></div><div id="templateDeleteFeedback" class="save-feedback hidden"></div><div class="template-save-actions"><button id="cancelTemplateDeleteBtn" type="button">취소</button><button id="confirmTemplateDeleteBtn" class="danger" type="button">완전히 삭제</button></div></div>';document.body.appendChild(dialog);
  let target=null;
  const close=()=>{if(dialog.getAttribute('aria-busy')==='true')return;dialog.classList.add('hidden');target=null};
  button.onclick=()=>{const record=records().find(item=>item.id===el('templateSaveDialog')?.dataset.recordId);if(!record)return;target=record;el('templateDeleteTarget').textContent=record.name;el('templateDeleteFeedback').className='save-feedback hidden';el('templateSaveDialog').classList.add('hidden');dialog.classList.remove('hidden');el('cancelTemplateDeleteBtn').focus()};
  el('cancelTemplateDeleteBtn').onclick=()=>{close();el('templateSaveDialog').classList.remove('hidden')};
  el('confirmTemplateDeleteBtn').onclick=async()=>{
   if(!target)return;const confirmButton=el('confirmTemplateDeleteBtn'),cancelButton=el('cancelTemplateDeleteBtn'),feedback=el('templateDeleteFeedback'),remote=window.ACDLTemplateRemotePersistence,hideCatalog=target.source==='catalog'||Boolean(target.catalogId),remoteId=target.remoteId||(/^[0-9a-f-]{36}$/i.test(String(target.id))?target.id:null);
   dialog.setAttribute('aria-busy','true');confirmButton.disabled=true;cancelButton.disabled=true;confirmButton.textContent='삭제 중…';feedback.className='save-feedback info';feedback.textContent='템플릿과 버전 이력을 삭제하고 있습니다.';
   try{
    if(remote?.isRemote?.())await remote.remove({templateId:remoteId,stableKey:target.stableKey||target.catalogId||target.id,hideCatalog});
    if(hideCatalog)hideCatalogKey(target.stableKey||target.catalogId||target.id);
    await deleteTemplateProjectData(target.id);if(remoteId&&remoteId!==target.id)await deleteTemplateProjectData(remoteId);
    const remaining=oldLibrary().filter(item=>item.id!==target.id&&item.id!==remoteId&&item.stableKey!==(target.stableKey||target.id));saveRecords(remaining);versionHistoryCache.delete(target.id);if(remoteId)versionHistoryCache.delete(remoteId);
    dialog.classList.add('hidden');el('templateSaveDialog').classList.add('hidden');target=null;renderLibrary(activeLibraryState);renderUserChoices();showEditorToast('템플릿을 완전히 삭제했습니다.');
   }catch(error){feedback.className='save-feedback error';feedback.textContent=error?.message||'템플릿을 삭제하지 못했습니다.'}
   finally{dialog.removeAttribute('aria-busy');confirmButton.disabled=false;cancelButton.disabled=false;confirmButton.textContent='완전히 삭제'}
  };
 }
 function installTemplateSaveProgress(){
  const dialog=el('templateSaveDialog'),jobDialog=el('templateSaveJobDialog'),confirmButton=el('confirmTemplateSaveBtn'),cancelButton=el('cancelTemplateSaveBtn'),stepsNode=el('templateSaveJobSteps'),summary=el('templateSaveJobSummary'),percent=el('templateSaveJobPercent'),errorNode=el('templateSaveJobError'),retryButton=el('retryTemplateSaveJobBtn'),closeButton=el('closeTemplateSaveJobBtn');
  if(!dialog||!jobDialog||!confirmButton||!cancelButton||!stepsNode||!summary||!percent||!errorNode||!retryButton||!closeButton)return;
  const steps=[['prepare','저장 준비','템플릿 정보와 새 버전을 확인합니다.'],['representative','대표 이미지','표지를 PNG 대표 이미지로 생성합니다.'],['assets','이미지 전송','템플릿 이미지 자산을 청크로 전송합니다.'],['package','패키지 전송','전체 템플릿 구조를 전송합니다.'],['validate','패키지 검증','누락·해시·구조 무결성을 검사합니다.'],['activate','버전 전환','새 버전을 활성화하고 이전 버전을 보관합니다.'],['library','라이브러리 저장','편집 원본과 관리 정보를 저장합니다.'],['synchronize','목록 동기화','사용자 서비스 노출 목록을 맞춥니다.']];
  let states={},active='prepare',retryAction=null,jobId='';
  const escape=value=>String(value||'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  function render(){const activeIndex=Math.max(0,steps.findIndex(([id])=>id===active)),done=steps.filter(([id])=>states[id]==='done').length,ratio=states.synchronize==='done'?100:Math.round((done+(states[active]==='active'?.35:0))/steps.length*100);percent.textContent=`${ratio}%`;stepsNode.innerHTML=steps.map(([id,title,help],index)=>{const state=states[id]||(index<activeIndex?'done':index===activeIndex?'active':'pending'),mark=state==='done'?'✓':state==='failed'?'!':String(index+1).padStart(2,'0'),label=state==='done'?'완료':state==='failed'?'중단':state==='active'?'진행 중':'대기';return `<div class="template-save-job-step ${state}"><i>${mark}</i><div><strong>${title}</strong><small>${help}</small></div><em>${label}</em></div>`}).join('')}
  function begin({retry=false}={}){jobId=jobId||`save-${Date.now().toString(36)}`;if(!retry){states={prepare:'active'};active='prepare'}else{states[active]='active'};errorNode.classList.add('hidden');retryButton.classList.add('hidden');closeButton.disabled=true;summary.textContent=retry?'중단된 단계부터 저장을 다시 진행합니다.':`작업 ID ${jobId} · 창을 닫지 않아도 각 단계가 자동으로 이어집니다.`;dialog.classList.add('hidden');jobDialog.classList.remove('hidden');render()}
  function stageOf({phase,stage}){if(phase==='publishing'){if(stage==='version')return'prepare';if(stage==='prepare')return'representative';if(['asset-upload','recover-assets'].includes(stage))return'assets';if(['upload','recover-package'].includes(stage))return'package';if(['validate','recover'].includes(stage))return'validate';if(stage==='activate')return'activate';if(stage==='cleanup')return'synchronize'}if(['prepare','assets','publish','version','save-record'].includes(phase))return'library';if(phase==='complete')return'synchronize';return active}
  function update(event={}){const next=stageOf(event),nextIndex=steps.findIndex(([id])=>id===next),activeIndex=steps.findIndex(([id])=>id===active);if(nextIndex>activeIndex)for(let index=0;index<nextIndex;index++)states[steps[index][0]]='done';active=next;states[active]='active';summary.textContent=event.detail||steps[nextIndex]?.[2]||'저장 중입니다.';render()}
  function fail(error,retry){states[active]='failed';retryAction=retry;confirmButton.disabled=false;summary.textContent=`${steps.find(([id])=>id===active)?.[1]||'저장'} 단계에서 중단되었습니다.`;errorNode.classList.remove('hidden');errorNode.innerHTML=`<strong>${escape(error?.message||'저장 중 오류가 발생했습니다.')}</strong><code>작업 ID ${escape(jobId)}${error?.code?` · ${escape(error.code)}`:''}</code>`;retryButton.classList.remove('hidden');closeButton.disabled=false;render()}
  function complete(detail='템플릿 저장과 사용자 서비스 목록 동기화가 완료되었습니다.'){for(const [id]of steps)states[id]='done';active='synchronize';confirmButton.disabled=false;cancelButton.disabled=false;summary.textContent=detail;retryAction=null;retryButton.classList.add('hidden');closeButton.disabled=false;render()}
  window.ACDLTemplateSaveProgress=update;
  window.ACDLTemplateSaveJob=Object.freeze({begin,fail,complete,progress:update});
  confirmButton.addEventListener('click',()=>{if(dialog.classList.contains('hidden'))return;begin();confirmButton.disabled=true;cancelButton.disabled=true},true);
  retryButton.addEventListener('click',()=>{if(!retryAction)return;begin({retry:true});retryAction()});
  closeButton.addEventListener('click',()=>jobDialog.classList.add('hidden'));
 }
 async function saveSettings(recordId,values){
  const record=records().find(item=>item.id===recordId);if(!record)throw new Error('설정할 템플릿을 찾지 못했습니다.');const sourceProject=await projectForRecord(record),projectData=window.ACDLPersistenceProject.clone(sourceProject);projectData.template||={};projectData.template.metadata={...(projectData.template.metadata||{}),...values};
  window.ACDLTemplateYearSynchronizer.synchronize(projectData,{year:Number(values.edition)||record.edition,startMonth:projectData.settings?.startMonth||3});
  const nextScope=values.state==='ready'||values.state==='published'?'base':values.state==='draft'?'custom':scopeOf(record);projectData.template.libraryScope=nextScope;
  const remote=window.ACDLTemplateRemotePersistence;let saved={...record,...values,status:values.state,libraryScope:nextScope,updatedAt:new Date().toISOString(),source:'local',libraryOverride:true},publicationResult=null;
  if(values.state==='published'){publicationResult=await window.ACDLTemplatePublishing.publish({record,projectData,name:values.name||record.name,productType:record.type});values.name=publicationResult.name||values.name;projectData.template.metadata.name=values.name;saved={...saved,name:values.name}}
  else if(record.state==='published')await window.ACDLTemplatePublishing.withdraw(projectData);
  if(remote?.isRemote?.()){const result=await remote.save({templateId:record.remoteId||(/^[0-9a-f-]{36}$/i.test(String(record.id))?record.id:null),stableKey:record.stableKey||record.catalogId||record.id,name:values.name||record.name,description:values.description||'',edition:Number(values.edition)||record.edition,state:values.state,isStandard:values.isStandard===true,productType:record.type,templateKey:record.template,saveKind:values.state==='published'?'publish':'manual',saveNote:'라이브러리 설정 변경',schemaVersion:'2.0',projectData},{onProgress:window.ACDLTemplateSaveProgress});saved=normalize({...record,...result.template,id:result.template.id,remoteId:result.template.id,stableKey:result.template.stableKey,name:result.template.name,description:result.template.description,edition:result.template.edition,state:result.template.state,status:result.template.state,isStandard:result.template.isStandard,libraryScope:nextScope,type:result.template.productType,template:result.template.templateKey,version:result.template.latestVersionNumber,storage:'supabase',source:'local',catalogId:record.catalogId||record.id},'local');await saveTemplateProjectData(saved.id,projectData);if(values.state==='published'){window.ACDLTemplateSaveProgress?.({phase:'publishing',stage:'cleanup',detail:'사용자 서비스의 활성 템플릿 목록을 동기화하고 있습니다.'});await window.ACDLTemplatePublishing.synchronizeCatalog()}}else await saveTemplateProjectData(saved.id,projectData);
  const list=oldLibrary().filter(item=>item.id!==record.id&&item.id!==saved.id&&item.stableKey!==saved.stableKey),updated=[saved,...list];saveRecords(updated);
  if(publicationResult)window.ACDLTemplatePublishing.completePublication?.(publicationResult.templateId,publicationResult.version);renderLibrary(activeLibraryState);renderUserChoices();showEditorToast('템플릿 설정과 사용자 서비스 게시 목록을 동기화했습니다.');return saved
 }
 window.ACDLTemplateLibrarySettings=Object.freeze({open:openSettings,save:saveSettings,startNewFrom,clonedProject,scopeOf,configureStateOptions});
 function filterActive(record){
  if(scopeOf(record)!==activeLibraryScope)return false;
  if(activeLibraryState==='all'&&record.state==='archived')return false;
  if(activeLibraryState!=='all'&&record.state!==activeLibraryState)return false;
  if(activeTypeFilter!=='all'&&record.type!==activeTypeFilter)return false;
  if(activeStandardOnly&&!record.isStandard)return false;
  const edition=el('libraryEditionFilter')?.value||'all';
  if(edition!=='all'&&String(record.edition)!==edition)return false;
  return true;
 }
 function renderLibrary(filter='all'){
  ensureTypeOptions();renderTypeFilters();renderEditionOptions();
  activeLibraryState=filter||activeLibraryState;
  renderStateFilters();
  const list=records().filter(filterActive);
  const grid=el('templateLibraryGrid');if(!grid)return;
  if(!list.length && activeLibraryScope==='custom'){
    grid.innerHTML=`<div class="library-empty-state user-empty"><strong>등록된 템플릿이 없습니다.</strong><p>새 템플릿을 만들어 이 영역에 저장하세요.</p><button class="primary" id="createCustomTemplateBtn">새 템플릿 만들기</button></div>`;
    const button=el('createCustomTemplateBtn');if(button)button.addEventListener('click',()=>{closeTemplateLibrary();enterDesigner();});
  } else {
    grid.innerHTML=list.length?list.map(cardMarkup).join(''):`<div class="library-empty-state"><strong>${activeTypeFilter==='all'?'등록된 템플릿이 없습니다.':`${escape(label(activeTypeFilter))}에 등록된 템플릿이 없습니다.`}</strong><p>새 템플릿을 만들어 보세요.</p></div>`;
    grid.querySelectorAll('[data-library-use]').forEach(button=>button.addEventListener('click',()=>startNewFrom(records().find(record=>record.id===button.dataset.libraryUse)).catch(error=>showEditorToast(error?.message||'새 템플릿 설정을 시작하지 못했습니다.'))));
    grid.querySelectorAll('[data-library-edit]').forEach(button=>button.addEventListener('click',()=>{const source=records().find(record=>record.id===button.dataset.libraryEdit);if(source&&!source.isStandard)openDesignerProjectFromRecord(source).catch(error=>showEditorToast(error?.message||'템플릿 편집 화면을 열지 못했습니다.'))}));
    grid.querySelectorAll('[data-library-settings]').forEach(button=>button.addEventListener('click',()=>openSettings(records().find(record=>record.id===button.dataset.librarySettings))));
    grid.querySelectorAll('[data-library-history]').forEach(button=>button.addEventListener('click',()=>toggleVersionHistory(button)));
    grid.querySelectorAll('[data-library-quality-check]').forEach(button=>button.addEventListener('click',()=>openPrintPreflight(records().find(record=>record.id===button.dataset.libraryQualityCheck))));
    hydrateThumbnails(list);
  }
  updateLibrarySummary(list.length);
 }
 let preflightRecord=null;
 let preflightReport=null,preflightArtifact=null,preflightFilter='all';
 function preflightCount(entries){return Object.entries(entries||{}).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).map(([name,count])=>`<span><b>${escape(name)}</b> ${count}</span>`).join('')||'<span>사용 항목 없음</span>'}
 function renderPreflightIssues(){const host=el('templatePreflightIssues');if(!host||!preflightReport)return;const groups=(preflightReport.issueGroups||[]).filter(item=>preflightFilter==='all'||item.severity===preflightFilter);host.innerHTML=groups.length?groups.map(item=>`<article class="${item.severity}"><i>${item.severity==='error'?'!':'△'}</i><div><strong>${escape(item.message)}${item.count>1?`<span class="issue-count">${item.count}곳</span>`:''}</strong><small>${escape(item.code)}</small>${item.paths?.length?`<details><summary>영향 위치 ${item.count}곳 중 ${item.paths.length}곳 보기</summary>${item.paths.map(path=>`<code>${escape(path)}</code>`).join('')}</details>`:''}</div></article>`).join(''):`<p class="template-preflight-empty ${preflightReport.issues.length?'':'success'}">${preflightReport.issues.length?'선택한 항목이 없습니다.':'페이지 구조와 지원 기능 기본 검사를 통과했습니다.'}</p>`}
 function renderPreflightStages(report){const labels={passed:'통과',review:'확인',blocked:'중단',pending:'예정'};el('templatePreflightStages').innerHTML=(report.stages||[]).map((stage,index)=>`<div class="${stage.status}"><span>${index+1}단계</span><strong>${escape(stage.name)}</strong><small>${labels[stage.status]}${stage.errors||stage.warnings?` · 오류 ${stage.errors} / 경고 ${stage.warnings}`:''}</small></div>`).join('')}
 function downloadPreflightReport(){if(!preflightReport)return;const blob=new Blob([JSON.stringify(preflightReport,null,2)],{type:'application/json'}),link=document.createElement('a');link.href=URL.createObjectURL(blob);link.download=`template-preflight-${preflightReport.identity.templateId||'report'}-${Date.now()}.json`;link.click();setTimeout(()=>URL.revokeObjectURL(link.href),0)}
 function formatArtifactBytes(value){const bytes=Number(value)||0;if(!bytes)return '-';return bytes>=1024*1024?`${(bytes/1024/1024).toFixed(2)}MB`:`${Math.ceil(bytes/1024)}KB`}
 function formatArtifactTime(value){if(!value)return '-';const date=new Date(value);return Number.isNaN(date.getTime())?String(value):date.toLocaleString('ko-KR',{hour12:false})}
 function artifactValue(artifact,...keys){for(const key of keys){const value=key.split('.').reduce((current,part)=>current?.[part],artifact);if(value!==undefined&&value!==null&&value!=='')return value}return null}
 function artifactCheck(artifact,key){const checks=artifact?.checks||artifact?.preflight?.checks||artifact?.details||{},aliases={pdfx4:['pdfx4','pdfX4','pdfStandard'],outputIntent:['outputIntent','icc','colorProfile'],cmyk:['cmyk','colorMode'],k100:['k100','black'],trimBox:['trimBox','trimbox'],bleedBox:['bleedBox','bleedbox'],fontOutline:['fontOutline','fontsOutlined','outline']}[key]||[key];let value=null;for(const name of aliases){value=checks[name]??artifact?.[name];if(value!==undefined&&value!==null)break}if(value&&typeof value==='object')return value.passed??value.valid??value.status==='passed';if(value===undefined||value===null)return null;return value===true||value==='passed'||value==='valid'||value==='PDF/X-4'||value==='CMYK'||value==='K100'||value==='outline'}
 function artifactFilename(identity){const source=identity?.name||identity?.displayName||identity?.templateName||identity?.templateId||'template',safe=String(source).trim().replace(/[<>:"/\\|?*\u0000-\u001f]/g,'-').replace(/\s+/g,'-').replace(/-{2,}/g,'-').replace(/^-|-$/g,'');return `${safe}-CMYK-draft.pdf`}
 function artifactDownloadUrl(value){const direct=artifactValue(value,'downloadUrl','signedUrl','url','artifact.downloadUrl','artifact.signedUrl'),filePath=artifactValue(value,'filePath','artifact.filePath');return direct||(/^https?:\/\//.test(String(filePath||''))?filePath:null)}
 function renderPreflightArtifact(identity,artifact){const host=el('templatePreflightArtifact'),button=el('downloadTemplatePrintPdfBtn');preflightArtifact=artifact||null;if(button)button.disabled=!artifact||artifact.status!=='done'||artifact.verified!==true;if(!host)return;if(!artifact){host.innerHTML='<h3>최종 인쇄 PDF</h3><p>완료된 CMYK PDF 산출물이 없습니다.</p>';return}const checks=[['PDF/X-4','pdfx4'],['ICC·OutputIntent','outputIntent'],['CMYK','cmyk'],['K100','k100'],['TrimBox','trimBox'],['BleedBox','bleedBox'],['서체 아웃라인','fontOutline'],['벡터·래스터 구조','vectorContentPreserved'],['재단영역 내용 동등성','trimContentParity']];host.innerHTML=`<h3>최종 인쇄 PDF</h3><div class="template-preflight-artifact-summary"><strong>${artifact.verified===true?'자동검사 통과':artifact.status==='processing'?'생성 중':artifact.status==='queued'?'처리 대기':'검사 실패'}</strong><div><span>${escape(artifactFilename(identity,artifact))}</span><small>잡 ${escape(artifact.id||artifact.jobId||'-')} · ${formatArtifactTime(artifactValue(artifact,'completedAt','finishedAt','updatedAt'))}</small></div></div><div class="template-preflight-artifact-grid">${checks.map(([label,key])=>{const passed=artifactCheck(artifact,key),state=passed===null?'pending':passed?'passed':'blocked',result=passed===null?(key==='trimContentParity'?'동일 Dataset 비교 대기':'검사 기록 없음'):passed?'통과':'확인 필요';return `<div class="${state}"><span>${label}</span><strong>${result}</strong></div>`}).join('')}<div class="${Number(artifactValue(artifact,'pageCount','pages'))>0?'passed':'blocked'}"><span>페이지 수</span><strong>${escape(artifactValue(artifact,'pageCount','pages')||'-')}면</strong></div><div class="passed"><span>파일 크기</span><strong>${formatArtifactBytes(artifactValue(artifact,'fileSize','fileSizeBytes','byteLength','size'))}</strong></div></div>`}
 function renderPreflightHistory(history,identity,artifact){const host=el('templatePreflightHistory');if(!host)return;const items=Array.isArray(history)?history:Array.isArray(history?.jobs)?history.jobs:Array.isArray(history?.history)?history.history:artifact?[artifact]:[];host.innerHTML=`<h3>최근 산출물과 검사 이력</h3>${items.length?`<div class="template-preflight-history-list">${items.slice(0,8).map(item=>`<article><strong>${escape(artifactFilename(identity,item))}</strong><span>${escape(item.status||'-')}</span><span>${formatArtifactBytes(artifactValue(item,'fileSize','fileSizeBytes','byteLength','size'))}</span><small>${formatArtifactTime(artifactValue(item,'completedAt','finishedAt','updatedAt','createdAt'))}</small></article>`).join('')}</div>`:'<p>저장된 검사 이력이 없습니다.</p>'}`}
 async function downloadPrintPdf(){const artifact=preflightArtifact,identity={...(preflightReport?.identity||{}),name:preflightRecord?.name||preflightReport?.identity?.name};if(!artifact||artifact.status!=='done'||artifact.verified!==true)return;const button=el('downloadTemplatePrintPdfBtn'),oldText=button?.textContent;if(button){button.disabled=true;button.textContent='PDF 준비 중'}try{let url=artifactDownloadUrl(artifact);if(!url){const result=await window.ACDLTemplatePublishing.printPreflightDownload(artifact.id||artifact.jobId);url=artifactDownloadUrl(result);if(!url)throw new Error('PDF 다운로드 주소를 받지 못했습니다.')}const response=await fetch(url);if(!response.ok)throw new Error(`PDF 다운로드에 실패했습니다. (${response.status})`);const blob=await response.blob(),link=document.createElement('a');link.href=URL.createObjectURL(blob);link.download=artifactFilename(identity,artifact);link.click();setTimeout(()=>URL.revokeObjectURL(link.href),1000)}catch(error){showEditorToast(error?.message||'PDF를 다운로드하지 못했습니다.')}finally{if(button){button.disabled=false;button.textContent=oldText}}}
 async function captureRenderParity(candidate){
  const api=window.ACDLRenderParityPreflight;if(!api||!window.ACDLPreviewState)return {generated:false,pages:0,screenObjects:0,rgbObjects:0,issues:[{severity:'error',code:'RENDER_PARITY_API_MISSING',message:'화면·RGB PDF 비교 모듈을 불러오지 못했습니다.',path:'render.parity'}]};
  const savedProject=project,saved=window.ACDLPreviewState.capture({pageId:selectedPageId,elementId:selectedElementId,scope:selectedElementScope,calendarEditing,preview,previewType}),results=[],livePage=el('page'),savedPageSize={width:livePage?.style.width||'',height:livePage?.style.height||''};
  const outputRoot=document.createElement('main');outputRoot.className='review-pdf-root';outputRoot.style.cssText='position:fixed;left:-100000px;top:0;visibility:hidden;pointer-events:none';document.body.appendChild(outputRoot);
  try{
   project=candidate;selectedElementId=null;selectedElementScope=null;calendarEditing=false;preview=false;previewType=null;
   if(document.fonts?.ready)await document.fonts.ready;
   for(const [index,pageInfo] of window.ACDLPreviewState.pages(candidate).entries()){
    selectedPageId=pageInfo.id;renderPage();applyThemeTokens();
    const live=el('page');if(!live)throw new Error(`${pageInfo.id} 화면 렌더링 결과가 없습니다.`);
    if(!(live.offsetWidth>0&&live.offsetHeight>0)){const physical=candidate?.productType?.pageSize||{},width=pageInfo.role==='poster-annual'?720:960,height=pageInfo.role==='poster-annual'?1018:Math.round(width*(Number(physical.height)||180)/(Number(physical.width)||260));live.style.width=`${width}px`;live.style.height=`${height}px`}
    const imageReady=Promise.all([...live.querySelectorAll('img')].map(image=>image.complete?Promise.resolve():new Promise(resolve=>{image.addEventListener('load',resolve,{once:true});image.addEventListener('error',resolve,{once:true})})));
    await Promise.race([imageReady,new Promise(resolve=>setTimeout(resolve,8000))]);
    const clone=window.ACDLPreviewState.clonePage(live,pageInfo);clone.classList.add('review-pdf-page');outputRoot.appendChild(clone);
    results.push(api.auditPage(live,clone,pageInfo,index));clone.remove();
   }
   return api.aggregate(results);
  }catch(error){console.error('render parity preflight failed',error);return {generated:false,pages:results.length,screenObjects:0,rgbObjects:0,issues:[{severity:'error',code:'RENDER_PARITY_FAILED',message:error?.message||'화면·RGB PDF 비교에 실패했습니다.',path:'render.parity'}]};
  }finally{
   outputRoot.remove();if(livePage){livePage.style.width=savedPageSize.width;livePage.style.height=savedPageSize.height}project=savedProject;const restored=window.ACDLPreviewState.restore(savedProject,saved);selectedPageId=restored.pageId;selectedElementId=restored.elementId;selectedElementScope=restored.scope;calendarEditing=restored.calendarEditing;preview=restored.preview;previewType=restored.previewType;if(project)try{render()}catch(error){console.error('preflight editor restore failed',error)}
  }
 }
 async function openPrintPreflight(record){
  if(!record)return;preflightRecord=record;preflightReport=null;preflightArtifact=null;preflightFilter='all';const dialog=el('templatePreflightDialog'),status=el('templatePreflightStatus'),download=el('downloadTemplatePreflightBtn'),pdfDownload=el('downloadTemplatePrintPdfBtn');dialog.classList.remove('hidden');download&&(download.disabled=true);pdfDownload&&(pdfDownload.disabled=true);dialog.querySelectorAll('[data-preflight-filter]').forEach(button=>button.classList.toggle('active',button.dataset.preflightFilter==='all'));status.className='template-preflight-status working';status.innerHTML='<strong>검사 중</strong><span>저장된 템플릿의 전체 페이지와 개체를 Runtime 문서로 변환하고 있습니다.</span>';el('templatePreflightTitle').textContent=`${record.name} · 인쇄 품질 검사`;el('templatePreflightDescription').textContent=`${record.type} · ${record.edition} Edition · ${internalVersionLabel(record)}`;el('templatePreflightStages').innerHTML='';el('templatePreflightMetrics').innerHTML='';el('templatePreflightIssues').innerHTML='<p class="template-preflight-empty">검사 결과를 준비하고 있습니다.</p>';el('templatePreflightInventory').innerHTML='';el('templatePreflightArtifact').innerHTML='<h3>최종 인쇄 PDF</h3><p>완료된 산출물을 확인하고 있습니다.</p>';el('templatePreflightHistory').innerHTML='<h3>최근 산출물과 검사 이력</h3><p>이력을 확인하고 있습니다.</p>';
  try{
   const inspectedProject=await projectForRecord(record),runtimeDocument=window.ACDLRuntimeBridge?.resolve?.(inspectedProject)||null;
   status.innerHTML='<strong>3단계 검사 중</strong><span>전체 페이지를 화면과 RGB PDF 출력 경로로 렌더링하고 있습니다.</span>';
   const renderParity=await captureRenderParity(inspectedProject);
   status.innerHTML='<strong>4단계 검사 중</strong><span>동일 Package의 완료된 CMYK·PDF/X-4 산출물을 우선 확인하고 있습니다.</span>';
   const packageIdentity=inspectedProject?.template?.publishing?.lastReviewPackage,identity=packageIdentity?{...packageIdentity,name:record.name||inspectedProject?.template?.metadata?.name}:null;let artifact=null,history=[];
   if(identity?.templateId&&identity?.version&&identity?.sha256&&!renderParity?.issues?.some(item=>item.severity==='error')){
    const job=await window.ACDLTemplatePublishing.ensurePrintPreflight(identity);artifact=job.report?{...job.report,id:job.id||job.report.id,status:job.status,filePath:job.filePath,error:job.error,downloadUrl:job.downloadUrl||job.report.downloadUrl}:job;
    try{history=await window.ACDLTemplatePublishing.printPreflightHistory(identity)}catch(error){console.info('print preflight history is not available yet',error)}
   }
   const printOutput=window.ACDLPrintOutputPreflight?.inspect?.(inspectedProject,{artifact})||null,report=window.ACDLTemplatePrintPreflight.analyze(inspectedProject,{templateId:identity?.templateId||record.stableKey||record.id,version:identity?.version||record.packageVersion||record.version,runtimeDocument,renderParity,printOutput});preflightReport=report;download&&(download.disabled=false);
   const labels={passed:['검사 통과','Package부터 실제 CMYK·PDF/X-4 산출물까지 모든 검사를 통과했습니다.'],review:['인쇄 출력 확인 필요',report.printOutput?.contractReady&&!report.printOutput?.artifactVerified?(artifact?.status==='processing'?'운영 PDF 워커가 실제 CMYK PDF를 생성하고 있습니다. 완료 결과 새로고침으로 확인하세요.':artifact?.status==='queued'?'운영 PDF 워커 처리 대기열에 등록되어 있습니다. 새 작업은 만들지 않았습니다.':'인쇄 계약은 준비됐습니다. 완료된 실제 CMYK PDF가 필요합니다.'):`${report.summary.issueGroups}개 원인에서 ${report.summary.warnings}개 경고를 확인해 주세요.`],blocked:['수정 필요',`${report.summary.issueGroups}개 원인에서 ${report.summary.errors}개 오류가 발견됐습니다.`]},label=labels[report.status];status.className=`template-preflight-status ${report.status}`;status.innerHTML=`<strong>${label[0]}</strong><span>${label[1]}</span>`;renderPreflightStages(report);el('templatePreflightMetrics').innerHTML=[['원본 페이지',report.summary.pages],['Runtime 페이지',report.runtime?.pages||0],['화면 페이지',report.renderParity?.pages||0],['RGB PDF 페이지',report.renderParity?.pages||0],['오류',report.summary.errors],['경고',report.summary.warnings]].map(([name,value])=>`<div><strong>${value}</strong><span>${name}</span></div>`).join('');renderPreflightIssues();renderPreflightArtifact(identity,artifact);renderPreflightHistory(history,identity,artifact);
   const pp=report.printOutput?.profile||{},mapping=pp.coordinateMapping||{};el('templatePreflightInventory').innerHTML=`<h4>CMYK·PDF/X-4 준비 상태</h4><div><span>계약 <b>${report.printOutput?.contractReady?'준비 완료':'수정 필요'}</b></span><span>실제 PDF <b>${report.printOutput?.artifactVerified?'검증 완료':artifact?.status==='processing'?'생성 중':artifact?.status==='queued'?'대기열 등록':'검증 실패'}</b></span><span><b>${escape(pp.pdfStandard||'-')}</b></span><span><b>${escape(pp.colorProfile||'-')}</b></span><span>제작·MediaBox <b>${pp.productionSize?.width||0}×${pp.productionSize?.height||0}mm</b></span><span>완성·TrimBox <b>${pp.trimSize?.width||0}×${pp.trimSize?.height||0}mm</b></span><span>도련 <b>사방 ${pp.bleed?.top||0}mm</b></span><span>좌표 매핑 <b>${mapping.mode==='translate-no-scale'?`+${mapping.offsetX||0}mm 이동 · 확대 없음`:'확인 필요'}</b></span><span>동등성 비교 <b>동일 Dataset의 TrimBox 기준</b></span><span>검정 <b>${escape(pp.blackRule||'-')}</b></span><span>서체 <b>${escape(pp.fontHandling||'-')}</b></span></div><h4>화면·RGB PDF 결과</h4><div><span>화면 개체 <b>${report.renderParity?.screenObjects||0}</b></span><span>RGB PDF 개체 <b>${report.renderParity?.rgbObjects||0}</b></span></div><h4>Runtime 결과</h4><div><span><b>${escape(report.runtime?.version||'미생성')}</b></span><span>진단 <b>${report.runtime?.diagnostics||0}</b></span></div><h4>페이지 역할</h4><div>${preflightCount(report.inventory.pageRoles)}</div><h4>개체 종류</h4><div>${preflightCount(report.inventory.elementTypes)}</div><h4>스타일 속성</h4><div>${preflightCount(report.inventory.styleKeys)}</div>`;record.preflightReport=report
  }catch(error){status.className='template-preflight-status blocked';status.innerHTML=`<strong>검사 중단</strong><span>${escape(error?.message||'템플릿을 불러오지 못했습니다.')}</span>`}
 }
 function renderUserChoices(){
  const grid=el('userTemplateChoiceGrid');if(!grid)return;const selectedType=selectedCalendarType;const list=records().filter(record=>record.type===selectedType&&record.state==='published').sort((a,b)=>String(b.updatedAt).localeCompare(String(a.updatedAt)));
  grid.innerHTML=list.length?list.map(record=>`<button type="button" class="template-choice" data-user-library-id="${escape(record.id)}" data-user-template="${escape(record.template)}" data-user-type="${escape(record.type)}" data-state="published"><div class="template-preview" data-library-thumbnail="${escape(record.id)}"><span class="thumbnail-placeholder">템플릿 미리보기</span></div><div class="template-card-topline"><strong>${escape(record.name)}</strong><span class="edition-badge">${record.edition} Edition</span></div><small class="template-description">${escape(record.description)}</small><div class="template-tags"><span>${escape(label(record.type))}</span>${(record.features||[]).slice(0,2).map(item=>`<span>${escape(item)}</span>`).join('')}</div></button>`).join(''):`<div class="library-empty-state user-empty"><strong>현재 준비 중인 유형입니다.</strong><p>게시된 템플릿이 없습니다.</p></div>`;
  grid.querySelectorAll('[data-user-template]').forEach(button=>button.addEventListener('click',()=>{grid.querySelectorAll('[data-user-template]').forEach(item=>item.classList.remove('selected'));button.classList.add('selected');selectedUserTemplate={template:button.dataset.userTemplate,type:button.dataset.userType,libraryId:button.dataset.userLibraryId};renderUserSizeOptions();wizardStateApi?.persistWizardState?.({selectedType:selectedCalendarType,template:selectedUserTemplate.template,step:userWizardStep});updateWizardActions()}));
  updateWizardActions();
  hydrateThumbnails(list);
 }
  window.v22Library=()=>records();window.v22SaveLibrary=saveRecords;window.v22StateLabel=state=>state==='published'?'게시됨':state==='archived'?'보관됨':state==='ready'?'검토 완료':'초안';
 window.renderTemplateLibrary=renderLibrary;renderTemplateLibrary=renderLibrary;
 window.renderUserTemplateChoices=renderUserChoices;renderUserTemplateChoices=renderUserChoices;
 window.applyCalendarType=type=>{oldApplyType(type);selectedCalendarType=type;el('selectedTypeLabel')&&(el('selectedTypeLabel').textContent=label(type));renderTypeChoices();renderUserChoices()};applyCalendarType=window.applyCalendarType;
 window.ACDLTemplateCatalog={allTypes,records,typeMeta,renderTypeChoices,renderTypeFilters};
 ensureTypeOptions();renderTypeChoices();renderTypeFilters();renderUserChoices();installTemplateSaveProgress();installCloneDialog();installPermanentDeleteDialog();installTemplateOpenProgress();
 document.querySelectorAll('[data-library-state]').forEach(button=>button.addEventListener('click',()=>{document.querySelectorAll('[data-library-state]').forEach(x=>x.classList.toggle('active',x===button));activeLibraryState=button.dataset.libraryState;setTimeout(()=>renderLibrary(button.dataset.libraryState),0)}));
 el('libraryStandardFilter')?.addEventListener('click',event=>{activeStandardOnly=!activeStandardOnly;event.currentTarget.classList.toggle('active',activeStandardOnly);event.currentTarget.setAttribute('aria-pressed',String(activeStandardOnly));renderLibrary(activeLibraryState)});
 document.querySelectorAll('[data-library-scope]').forEach(button=>button.addEventListener('click',()=>{document.querySelectorAll('[data-library-scope]').forEach(x=>x.classList.toggle('active',x===button));activeLibraryScope=button.dataset.libraryScope;setTimeout(()=>renderLibrary(activeLibraryState),0)}));
 el('libraryEditionFilter')?.addEventListener('change',()=>renderLibrary(activeLibraryState));
 document.querySelectorAll('#designerHomeLibrary,#libraryBtn').forEach(button=>button.addEventListener('click',()=>setTimeout(()=>renderLibrary('all'),0)));
 configureStateOptions('custom','draft');
 ['closeTemplatePreflightBtn','closeTemplatePreflightFooterBtn'].forEach(id=>el(id)?.addEventListener('click',()=>el('templatePreflightDialog')?.classList.add('hidden')));el('rerunTemplatePreflightBtn')?.addEventListener('click',()=>preflightRecord&&openPrintPreflight(preflightRecord));
 el('downloadTemplatePrintPdfBtn')?.addEventListener('click',downloadPrintPdf);el('downloadTemplatePreflightBtn')?.addEventListener('click',downloadPreflightReport);el('templatePreflightFilters')?.addEventListener('click',event=>{const button=event.target.closest('[data-preflight-filter]');if(!button)return;preflightFilter=button.dataset.preflightFilter;el('templatePreflightFilters').querySelectorAll('button').forEach(item=>item.classList.toggle('active',item===button));renderPreflightIssues()});
 document.querySelector('#closeTemplateLibraryBtn')?.addEventListener('click',()=>setTimeout(()=>{renderTypeChoices();renderUserChoices()},0));
})();
