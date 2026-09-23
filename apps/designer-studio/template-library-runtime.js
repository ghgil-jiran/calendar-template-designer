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
 const thumbnailGenerations=new WeakMap();
 const thumbnailMarkupCache=new Map();
 const thumbnailObjectUrls=new WeakMap();
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

  return `<article class="library-template-card ${kindClass}" data-template-id="${escape(record.id)}" data-library-state="${record.state}" data-library-type="${escape(record.type)}"><div class="library-thumb library-first-page-thumb" data-library-thumbnail="${escape(record.id)}"><span class="thumbnail-placeholder">첫 페이지를 불러오는 중입니다.</span></div><div class="library-card-body"><div class="library-card-badges"><span class="state-badge state-${record.state}">${escape(cardStateLabel(record))}</span>${record.isStandard?'<span class="standard-badge">표준</span>':''}</div><div class="library-meta-line"><h3>${escape(record.name)}</h3><span class="edition-badge">${record.edition} Edition</span></div><small class="library-card-version">${escape(internalVersionLabel(record))}</small><p>${escape(record.description)}</p><div class="library-card-meta"><span class="badge-base">${escape(kindLabel)}</span>${storageBadge}<span>${escape(meta.label)}</span><span>${escape(record.size?.label||`${record.size?.width||'-'} × ${record.size?.height||'-'} ${record.size?.unit||'mm'}`)}</span></div><div class="template-tags catalog-card-features">${features}</div><small>수정 ${escape(String(record.updatedAt).slice(0,10))}</small><div class="library-card-actions"><button class="primary" data-library-use="${escape(record.id)}">이 템플릿으로 새로 만들기</button>${editAction}<button data-library-settings="${escape(record.id)}">설정</button>${remoteHistory}${qualityCheck}</div><div class="library-version-history hidden" data-library-history-panel="${escape(record.id)}"></div></div></article>`;
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
 function releaseThumbnailObjectUrls(container){thumbnailObjectUrls.get(container)?.forEach(url=>URL.revokeObjectURL?.(url));thumbnailObjectUrls.set(container,new Set())}
 async function hydrateThumbnails(list,container){if(!container)return;const generation=(thumbnailGenerations.get(container)||0)+1;thumbnailGenerations.set(container,generation);releaseThumbnailObjectUrls(container);const markers=[],pending=[];list.forEach(record=>{const host=container.querySelector(`[data-library-thumbnail="${CSS.escape(record.id)}"]`);if(!host)return;const uploaded=record.thumbnail?.kind==='upload'?record.thumbnail:null,src=uploaded?.dataUrl||'',match=String(src).match(/^acdl-asset:\/\/([0-9a-f-]{36})$/i);if(match){markers.push(match[1]);pending.push({record,host,assetId:match[1]});return}if(src){host.innerHTML=`<img class="library-uploaded-thumbnail" src="${src}" alt="${escape(record.name)} 대표 이미지">`;host.dataset.rendered='true';return}if(record.source==='catalog'){renderActualThumbnail(record,host);return}host.innerHTML='<span class="thumbnail-placeholder">대표 이미지 저장 필요</span>';host.dataset.rendered='missing'});if(!markers.length)return;try{const result=await window.ACDLTemplateRemotePersistence?.assetObjectUrls?.(markers)||{urls:{},failures:[]},urls=result.urls||{};if(generation!==thumbnailGenerations.get(container)){Object.values(urls).forEach(url=>URL.revokeObjectURL(url));return}pending.forEach(({record,host,assetId})=>{const src=urls[assetId];if(generation!==thumbnailGenerations.get(container)||!host.isConnected)return;if(src){thumbnailObjectUrls.get(container).add(src);host.innerHTML=`<img class="library-uploaded-thumbnail" src="${src}" alt="${escape(record.name)} 대표 이미지">`;host.dataset.rendered='true'}else{host.innerHTML='<span class="thumbnail-placeholder">대표 이미지 파일을 불러오지 못했습니다.</span>';host.dataset.rendered='failed'}});if(result.failures?.length)console.warn('Template thumbnail assets failed',result.failures.map(item=>({id:item.id,status:item.error?.status,code:item.error?.code})))}catch(error){pending.forEach(({host})=>{if(generation===thumbnailGenerations.get(container)&&host.isConnected){host.innerHTML='<span class="thumbnail-placeholder">대표 이미지 파일을 불러오지 못했습니다.</span>';host.dataset.rendered='failed'}});console.warn('Template thumbnail batch failed',error)}}
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
  window.ACDLTemplateSaveProgress?.({phase:'publishing',stage:'prepare',detail:'첫 페이지를 라이브러리 대표 이미지로 생성하고 있습니다.'});if(!window.ACDLRepresentativePreview?.refresh)throw new Error('첫 페이지 대표 이미지 생성기를 불러오지 못했습니다.');await window.ACDLRepresentativePreview.refresh(projectData,{fileName:`${record.stableKey||record.id}-${Date.now()}-page-1.png`});
  window.ACDLNativePrintPackageCompiler?.assertLifecycleReady?.(projectData,values.state);
  const nextScope=values.state==='ready'||values.state==='published'?'base':values.state==='draft'?'custom':scopeOf(record);projectData.template.libraryScope=nextScope;
  const remote=window.ACDLTemplateRemotePersistence;let saved={...record,...values,status:values.state,libraryScope:nextScope,updatedAt:new Date().toISOString(),source:'local',libraryOverride:true},publicationResult=null;
  if(values.state==='published'){publicationResult=await window.ACDLTemplatePublishing.publish({record,projectData,name:values.name||record.name,productType:record.type});values.name=publicationResult.name||values.name;projectData.template.metadata.name=values.name;saved={...saved,name:values.name}}
  else if(record.state==='published')await window.ACDLTemplatePublishing.withdraw(projectData);
  if(remote?.isRemote?.()){const result=await remote.save({templateId:record.remoteId||(/^[0-9a-f-]{36}$/i.test(String(record.id))?record.id:null),stableKey:record.stableKey||record.catalogId||record.id,name:values.name||record.name,description:values.description||'',edition:Number(values.edition)||record.edition,state:values.state,isStandard:values.isStandard===true,productType:record.type,templateKey:record.template,saveKind:values.state==='published'?'publish':'manual',saveNote:'라이브러리 설정 변경',schemaVersion:'2.0',projectData},{onProgress:window.ACDLTemplateSaveProgress,verifyThumbnail:true});const persistedThumbnail=result.version?.projectData?.template?.thumbnail||projectData.template.thumbnail;saved=normalize({...record,...result.template,id:result.template.id,remoteId:result.template.id,stableKey:result.template.stableKey,name:result.template.name,description:result.template.description,edition:result.template.edition,state:result.template.state,status:result.template.state,isStandard:result.template.isStandard,libraryScope:nextScope,type:result.template.productType,template:result.template.templateKey,thumbnail:persistedThumbnail,version:result.template.latestVersionNumber,storage:'supabase',source:'local',catalogId:record.catalogId||record.id},'local');projectData.template.thumbnail=window.ACDLPersistenceProject.clone(persistedThumbnail);await saveTemplateProjectData(saved.id,projectData);if(values.state==='published'){window.ACDLTemplateSaveProgress?.({phase:'publishing',stage:'cleanup',detail:'사용자 서비스의 활성 템플릿 목록을 동기화하고 있습니다.'});await window.ACDLTemplatePublishing.synchronizeCatalog()}}else await saveTemplateProjectData(saved.id,projectData);
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
    hydrateThumbnails(list,grid);
  }
  updateLibrarySummary(list.length);
 }
 let preflightRecord=null,preflightProject=null,preflightRuntimeDocument=null,preflightRenderParity=undefined,preflightIdentity=null,preflightHistory=[];
 let preflightReport=null,preflightArtifact=null,preflightFilter='all',preflightActiveGate=null,preflightStatusMessage='',preflightPollTimer=null;
 function preflightCount(entries){return Object.entries(entries||{}).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).map(([name,count])=>`<span><b>${escape(name)}</b> ${count}</span>`).join('')||'<span>사용 항목 없음</span>'}
 function preflightIssueGate(item){const code=String(item?.code||'');if(code.startsWith('AI_IMAGE_'))return 3;if(code.startsWith('RENDER_')||code.startsWith('RGB_')||(code.startsWith('PRINT_')&&!code.includes('ARTIFACT')))return 1;if(code.startsWith('PDF_')||code.includes('ARTIFACT'))return 2;return 0}
 function renderPreflightIssues(){const host=el('templatePreflightIssues');if(!host||!preflightReport)return;const gateGroups=(preflightReport.issueGroups||[]).filter(item=>preflightIssueGate(item)===preflightActiveGate),groups=gateGroups.filter(item=>preflightFilter==='all'||item.severity===preflightFilter);host.innerHTML=groups.length?groups.map(item=>`<article class="${item.severity}"><i>${item.severity==='error'?'!':'△'}</i><div><strong>${escape(item.message)}${item.count>1?`<span class="issue-count">${item.count}곳</span>`:''}</strong><small>${escape(item.code)}</small>${item.paths?.length?`<details><summary>영향 위치 ${item.count}곳 중 ${item.paths.length}곳 보기</summary>${item.paths.map(path=>`<code>${escape(path)}</code>`).join('')}</details>`:''}</div></article>`).join(''):`<p class="template-preflight-empty ${gateGroups.length?'':'success'}">${gateGroups.length?'선택한 항목이 없습니다.':preflightActiveGate===3?'AI 생성 기준과 검사 로직을 연결한 뒤 결과를 판정합니다.':preflightActiveGate===4?'에디터 내부 인쇄 품질 검사가 완료되었습니다. 외부 Preflight와 대표 실물 출력은 대량 생산 전 후속 권장 절차입니다.':'현재 단계에서 발견된 오류나 경고가 없습니다.'}</p>`}
 function renderPreflightStages(report){const labels={passed:'완료',review:'확인 필요',blocked:'수정 필요',pending:'미진행'},gates=report.gates||[];el('templatePreflightStages').innerHTML=gates.map((stage,index)=>{const locked=stage.access==='locked',label=locked?`${stage.blockedBy}단계 완료 후 진행`:stage.disposition==='not_applicable'?'검사 제외 · 완료':labels[stage.status];return `<button type="button" data-preflight-gate="${index}" class="${stage.status} ${locked?'locked':''} ${index===preflightActiveGate?'active':''}" aria-current="${index===preflightActiveGate?'step':'false'}" aria-disabled="${locked?'true':'false'}" ${locked?'disabled':''}><span>${index+1}단계</span><strong>${escape(stage.name)}</strong><small>${label}${stage.errors||stage.warnings?` · 오류 ${stage.errors} / 경고 ${stage.warnings}`:''}</small></button>`}).join('')}
 function downloadPreflightReport(){if(!preflightReport)return;const blob=new Blob([JSON.stringify(preflightReport,null,2)],{type:'application/json'}),link=document.createElement('a');link.href=URL.createObjectURL(blob);link.download=`template-preflight-${preflightReport.identity.templateId||'report'}-${Date.now()}.json`;link.click();setTimeout(()=>URL.revokeObjectURL(link.href),0)}
 function formatArtifactBytes(value){const bytes=Number(value)||0;if(!bytes)return '-';return bytes>=1024*1024?`${(bytes/1024/1024).toFixed(2)}MB`:`${Math.ceil(bytes/1024)}KB`}
 function formatArtifactTime(value){if(!value)return '-';const date=new Date(value);return Number.isNaN(date.getTime())?String(value):date.toLocaleString('ko-KR',{hour12:false})}
 function formatElapsed(startedAt){const started=new Date(startedAt).getTime();if(!Number.isFinite(started))return '-';const seconds=Math.max(0,Math.round((Date.now()-started)/1000)),minutes=Math.floor(seconds/60);return minutes?`${minutes}분 ${seconds%60}초`:`${seconds}초`}
 function progressMarkup(artifact){const progress=artifact?.progress;if(!progress||!['queued','processing'].includes(artifact?.status))return '';const current=Number(progress.current)||0,total=Number(progress.total)||0,percent=total>0?Math.min(100,Math.round(current/total*100)):null,eta=current>0&&total>current?Math.max(0,Math.round((Date.now()-new Date(progress.startedAt).getTime())/current*(total-current)/1000)):null;return `<div class="template-preflight-artifact-grid"><div class="pending"><span>현재 작업</span><strong>${escape(progress.label||progress.stage||'처리 중')}</strong><small>${total>0?`${current}/${total}${percent!==null?` · ${percent}%`:''}`:'단계 준비 중'} · 경과 ${formatElapsed(progress.startedAt)}${eta!==null?` · 이 단계 예상 잔여 ${Math.floor(eta/60)}분 ${eta%60}초`:''}</small>${progress.fileName?`<small>${escape(progress.fileName)}${Number(progress.fileSizeBytes)>0?` · ${formatArtifactBytes(progress.fileSizeBytes)}`:''}</small>`:''}</div></div>`}
 function artifactValue(artifact,...keys){for(const key of keys){const value=key.split('.').reduce((current,part)=>current?.[part],artifact);if(value!==undefined&&value!==null&&value!=='')return value}return null}
  function artifactCheck(artifact,key){const checks=artifact?.checks||artifact?.preflight?.checks||artifact?.details||{},aliases={pdfx4:['pdfx4','pdfX4','pdfStandard'],outputIntent:['outputIntent','icc','colorProfile'],cmyk:['cmyk','colorMode'],k100:['k100','black'],trimBox:['trimBox','trimbox'],bleedBox:['bleedBox','bleedbox'],fontOutline:['fontOutline','fontOutlined','fontsOutlined','outline']}[key]||[key];let value=null;for(const name of aliases){value=checks[name]??artifact?.[name];if(value!==undefined&&value!==null)break}if(value&&typeof value==='object'){const status=String(value.status||'').toLowerCase();return {status:status||((value.passed===true||value.valid===true)?'passed':(value.passed===false||value.valid===false)?'failed':'not_run'),message:value.message||value.reason||'',evidence:value.evidence||value.metrics||null,reviewedAt:value.reviewedAt||null,reviewType:value.reviewType||null,approvalLevel:value.approvalLevel||null}}if(value===undefined||value===null)return {status:'not_run',message:'검사 기록 없음',evidence:null,reviewedAt:null,reviewType:null,approvalLevel:null};const passed=value===true||value==='passed'||value==='valid'||value==='PDF/X-4'||value==='CMYK'||value==='K100'||value==='outline';return {status:passed?'passed':'failed',message:'',evidence:null,reviewedAt:null,reviewType:null,approvalLevel:null}}
 function artifactFilename(identity){const source=identity?.name||identity?.displayName||identity?.templateName||identity?.templateId||'template',safe=String(source).trim().replace(/[<>:"/\\|?*\u0000-\u001f]/g,'-').replace(/\s+/g,'-').replace(/-{2,}/g,'-').replace(/^-|-$/g,'');return `${safe}-CMYK-draft.pdf`}
 function artifactDownloadUrl(value){const direct=artifactValue(value,'downloadUrl','signedUrl','url','artifact.downloadUrl','artifact.signedUrl'),filePath=artifactValue(value,'filePath','artifact.filePath');return direct||(/^https?:\/\//.test(String(filePath||''))?filePath:null)}
 function workerPowerShellCommand(artifact){const origin=String(artifact?.editorPrintOrigin||location.origin).replace(/\/$/,'').replace(/"/g,'`"'),jobId=String(artifact?.id||artifact?.jobId||''),mode=artifact?.status==='error'?'--resume-job':'--job';return `$env:TEMPLATE_EDITOR_PRINT_ORIGIN="${origin}"\r\nnpm.cmd run pdf:worker -- ${mode} "${jobId}" --once`}
 function workerCommandMarkup(artifact){const active=['queued','processing'].includes(artifact?.status),resumable=artifact?.status==='error'&&artifact?.superseded!==true&&artifact?.cancelled!==true;if(!active&&!resumable)return '';const title=resumable?'실패 단계부터 재개':'이 잡만 실행',note=resumable?'로컬 산출물에서 가장 최근의 안전한 체크포인트를 찾아 이어서 처리합니다. 체크포인트가 없으면 새 검사를 요청해야 합니다.':'사용자 서비스 서버를 먼저 실행한 뒤, 사용자 서비스 폴더의 다른 PowerShell 창에서 붙여넣으세요.';return `<h4>${title}</h4><div class="template-preflight-artifact-summary"><code>${escape(workerPowerShellCommand(artifact))}</code><button id="copyTemplateWorkerCommandBtn" type="button">PowerShell 명령어 복사</button></div><p class="template-preflight-artifact-wait">${note}</p>`}
 async function copyWorkerPowerShellCommand(artifact){const command=workerPowerShellCommand(artifact),label=artifact?.status==='error'?'실패 단계 재개':'이 잡 전용';try{await navigator.clipboard.writeText(command);showEditorToast(`${label} PowerShell 명령어를 복사했습니다.`)}catch{const area=document.createElement('textarea');area.value=command;area.style.position='fixed';area.style.opacity='0';document.body.appendChild(area);area.select();document.execCommand('copy');area.remove();showEditorToast(`${label} PowerShell 명령어를 복사했습니다.`)}}

 function renderPreflightArtifact(identity,artifact){
  const host=el('templatePreflightArtifact'),button=el('downloadTemplatePrintPdfBtn');preflightArtifact=artifact||null;if(button)button.disabled=!artifact||artifact.status!=='done';if(!host)return;
  if(!artifact){host.innerHTML='<h3>최종 PDF 자동검사</h3><p>아직 생성된 CMYK PDF가 없습니다. 선행 단계 통과 후 최종 PDF 생성·검사를 실행하세요.</p>';return}
  const groups=[
   {scope:'core',label:'핵심 자동검사',checks:[['PDF/X-4','pdfx4'],['ICC·OutputIntent','outputIntent'],['CMYK','cmyk'],['K100','k100'],['TrimBox','trimBox'],['BleedBox','bleedBox'],['서체 아웃라인','fontOutline'],['벡터·래스터 구조','vectorContentPreserved']]},
   {scope:'follow-up',label:'완료 근거',checks:[['재단영역 내용 동등성','trimContentParity']]}
  ];
  const results=groups.flatMap(group=>group.checks.map(([label,key])=>({label,key,scope:group.scope,result:artifactCheck(artifact,key)})));
  const core=results.filter(item=>item.scope==='core'),coreFailed=core.filter(item=>item.result.status==='failed'),coreNotRun=core.filter(item=>!['passed','failed'].includes(item.result.status)),followUpOpen=results.filter(item=>item.scope==='follow-up'&&item.result.status!=='passed');
   const summary=artifact.status==='queued'?'운영 PDF 워커 처리 대기':artifact.status==='processing'?'최종 PDF 생성·검사 중':artifact.status==='error'?'PDF 작업 실패 · 체크포인트 재개 가능':coreFailed.length?'핵심 자동검사 실패':coreNotRun.length?'핵심 자동검사 확인 필요':followUpOpen.length?'핵심 자동검사 완료 · 재단 비교 필요':'핵심 자동검사 완료';
   const card=item=>{const {label,key,scope,result}=item,state=result.status==='passed'?'passed':scope==='core'&&result.status==='failed'?'blocked':'pending',manual=result?.evidence&&artifactValue(result,'evidence.sourceArtifact','evidence.targetArtifact'),conditional=result.approvalLevel==='conditional',title=scope==='runtime'?'사용자 서비스에서 검사':result.status==='passed'?(scope==='core'?'통과':conditional?'조건부 완료':manual?'통과 · 수동 비교':'완료'):scope==='follow-up'?'후속 확인':result.status==='failed'?'실패':'검사 전';return `<div class="${state}"><span>${label}</span><strong>${title}</strong>${result.message?`<small>${escape(result.message)}</small>`:''}${manual?`<small>${escape(artifactValue(result,'evidence.sourceArtifact'))} ↔ ${escape(artifactValue(result,'evidence.targetArtifact'))} · ${escape(formatArtifactTime(artifactValue(result,'reviewedAt')))}</small>`:''}${conditional&&Array.isArray(result.evidence?.findings)?result.evidence.findings.map(finding=>`<small>· ${escape(finding)}</small>`).join(''):''}</div>`};
   const trimReview=artifactCheck(artifact,'trimContentParity'),canRecordTrim=artifact.status==='done'&&trimReview.status!=='passed';
   host.innerHTML=`<h3>핵심 자동검사</h3><div class="template-preflight-artifact-summary"><strong>${summary}</strong><div><span>${escape(artifactFilename(identity,artifact))}</span><small>잡 ${escape(artifact.id||artifact.jobId||'-')} · ${formatArtifactTime(artifactValue(artifact,'completedAt','finishedAt','updatedAt','createdAt'))}</small></div></div><p class="template-preflight-artifact-wait">핵심 자동검사 8개와 재단영역 비교가 3단계 완료 판정을 결정합니다. AI 생성 이미지와 사용자 서비스 이미지는 별도 단계와 범위에서 검사합니다.</p>${['queued','processing'].includes(artifact.status)?'<p class="template-preflight-artifact-wait">워커 처리가 완료되면 아래 자동검사 결과가 자동으로 갱신됩니다.</p>':''}${workerCommandMarkup(artifact)}${progressMarkup(artifact)}${groups.map(group=>`<h4>${group.label}</h4><div class="template-preflight-artifact-grid">${results.filter(item=>item.scope===group.scope).map(card).join('')}</div>`).join('')}${canRecordTrim?'<div class="template-preflight-actions"><button id="recordTrimContentParityBtn" type="button">재단영역 수동 비교 결과 기록</button></div>':''}<div class="template-preflight-artifact-grid"><div class="${Number(artifactValue(artifact,'pageCount','pages'))>0?'passed':'pending'}"><span>페이지 수</span><strong>${escape(artifactValue(artifact,'pageCount','pages')||'-')}면</strong></div><div class="${Number(artifactValue(artifact,'fileSize','fileSizeBytes','byteLength','size'))>0?'passed':'pending'}"><span>파일 크기</span><strong>${formatArtifactBytes(artifactValue(artifact,'fileSize','fileSizeBytes','byteLength','size'))}</strong></div></div>`;
   el('copyTemplateWorkerCommandBtn')?.addEventListener('click',()=>copyWorkerPowerShellCommand(artifact));el('recordTrimContentParityBtn')?.addEventListener('click',recordTrimContentParityReview);
  }
 function aiInspectionAssets(project){
  const resources=project?.template?.resources||{},qualityPages=Array.isArray(project?.template?.aiDesignDraft?.quality?.pages)?project.template.aiDesignDraft.quality.pages:[],byAsset=new Map(qualityPages.map(page=>[String(page?.assetId||''),page]));
  return (Array.isArray(resources.aiDesignAssets)?resources.aiDesignAssets:[]).filter(asset=>asset?.src).map((asset,index)=>{const page=byAsset.get(String(asset.id||''))||{};return {id:String(asset.id||`ai-image-${index+1}`),src:asset.src,pageId:page.pageId||asset.pageId||null,role:page.generatedRole||asset.role||asset.generation?.role||null}});
 }
 async function recordAiImageCriterion(key,status){
  const artifact=preflightArtifact,report=preflightReport,inspection=report?.aiImageInspection||{},manualKeys=new Set(['placementIntegrity','visualArtifacts','contentLegibility']);
  if(!artifact?.id||artifact.status!=='done'){showEditorToast('완료된 최종 PDF 검사 Job이 있어야 AI 이미지 검사 결과를 저장할 수 있습니다.');return}
  if(!manualKeys.has(key)||!['passed','failed'].includes(status))return;
  const assets=aiInspectionAssets(preflightProject),criteria=Array.isArray(inspection.criteria)?inspection.criteria:[],automatic=criteria.filter(item=>!manualKeys.has(item.key));
  if(automatic.length!==3||automatic.some(item=>item.status!=='passed')){showEditorToast('자동검사 3개 항목이 모두 통과한 뒤 육안검사 결과를 기록할 수 있습니다.');return}
  const labels={placementIntegrity:'원본 확대 선명도·색상 계조',visualArtifacts:'흐림·노이즈·반복 패턴·비정상 형상',contentLegibility:'원치 않는 문자·숫자·가짜 기능 요소'},next=criteria.map(item=>item.key===key?{...item,status,message:status==='passed'?`${labels[key]} 육안검사를 통과했습니다.`:`${labels[key]} 육안검사에서 개선이 필요한 이미지를 확인했습니다.`,evidence:{reviewType:'manual-visual-inspection',imageCount:assets.length}}:item);
  if(next.length!==6||!assets.length){showEditorToast('AI 생성 이미지와 6개 검사 기준을 모두 불러온 뒤 다시 시도해 주세요.');return}
  const button=el(`recordAiImage-${key}-${status}`);if(button)button.disabled=true;
  try{
   const updated=await window.ACDLTemplatePublishing.recordAiImagePrintQualityReview(artifact.id,{criteriaVersion:'ai-image-print-quality.v1@0.1.0',imageCount:assets.length,imageIds:assets.map(asset=>asset.id),criteria:next.map(item=>({key:item.key,status:item.status==='not_run'?'review':item.status,message:item.message||`${item.label} 검사 결과`,evidence:item.evidence||{reviewType:manualKeys.has(item.key)?'manual-visual-inspection':'automatic-generation-evidence'}}))});
   preflightArtifact=normalizedArtifact(updated);await loadPreflightHistory();renderCurrentPreflight(`${labels[key]} 항목을 ${status==='passed'?'통과':'실패'}로 기록했습니다.`);
  }catch(error){showEditorToast(error?.message||'AI 이미지 검사 결과를 기록하지 못했습니다.');if(button)button.disabled=false}
 }
 function renderAiImageInspection(report){
  const host=el('templatePreflightArtifact'),inspection=report?.aiImageInspection||{},criteria=Array.isArray(inspection.criteria)?inspection.criteria:[],assets=aiInspectionAssets(preflightProject);if(!host)return;
  const summary=inspection.criteriaSummary||{},manualKeys=new Set(['placementIntegrity','visualArtifacts','contentLegibility']),recorded=criteria.filter(item=>item.source==='ai-image-print-quality'&&item.status!=='not_run').length,title=inspection.status==='passed'?'검사 완료':inspection.status==='blocked'?'개선 필요':'검사 진행 중',countText=`통과 ${summary.passed||0} · 확인 필요 ${summary.review||0} · 실패 ${summary.failed||0} · 검사 전 ${summary.notRun||0}`;
  const card=item=>{const cardState=item.status==='passed'?'passed':item.status==='failed'?'blocked':'pending',automatic=!manualKeys.has(item.key),labels={passed:'통과',failed:'실패',review:'확인 필요',not_run:'검사 전'};return `<div class="${cardState}"><span>${automatic?'자동검사':'육안검사'}</span><strong>${labels[item.status]||'검사 전'}</strong><small>${escape(item.label||item.key)}</small>${item.message?`<small>${escape(item.message)}</small>`:''}${automatic?'':`<div class="ai-image-inspection-actions"><button id="recordAiImage-${item.key}-passed" type="button">통과 기록</button><button id="recordAiImage-${item.key}-failed" type="button">실패 기록</button></div>`}</div>`};
  const thumbnails=assets.map((asset,index)=>`<button type="button" class="ai-image-inspection-thumb" data-ai-inspection-image="${index}" title="원본 크게 보기"><img src="${escape(asset.src)}" alt="${escape(asset.pageId||asset.role||`AI 이미지 ${index+1}`)}"><span>${String(index+1).padStart(2,'0')} · ${escape(asset.pageId||asset.role||asset.id)}</span></button>`).join('');
  host.innerHTML=`<h3>AI 생성 이미지 검사</h3><div class="template-preflight-artifact-summary"><strong>${title}</strong><div><span>AI 생성 이미지 ${assets.length||inspection.imageCount||0}개 · 검사 ${summary.passed||0}/6 통과</span><small>${inspection.criteriaComplete?'자동 3개·육안 3개 검사가 모두 저장되었습니다.':`${countText} · 모든 항목이 통과해야 4단계를 완료합니다.`}</small></div></div><p class="template-preflight-artifact-wait">이 화면에서 AI 원본을 직접 확대 검토하고 결과를 기록합니다. 별도 ‘AI 생성 이미지 검토용 PDF’는 선택적인 보조 자료이며 4단계 완료 조건이 아닙니다.</p><h4>검사 기준</h4><div class="template-preflight-artifact-grid ai-image-criteria-grid">${criteria.map(card).join('')}</div><h4>AI 원본 이미지 · 선택하면 원본 크기로 열립니다.</h4><div class="ai-image-inspection-gallery">${thumbnails||'<p>AI 생성 이미지를 불러오지 못했습니다.</p>'}</div>`;
  criteria.filter(item=>manualKeys.has(item.key)).forEach(item=>['passed','failed'].forEach(status=>el(`recordAiImage-${item.key}-${status}`)?.addEventListener('click',()=>recordAiImageCriterion(item.key,status))));
  host.querySelectorAll('[data-ai-inspection-image]').forEach(button=>button.addEventListener('click',()=>{const asset=assets[Number(button.dataset.aiInspectionImage)];if(asset?.src)window.open(asset.src,'_blank','noopener,noreferrer')}));
 }
 function renderPreflightHistory(history,identity,artifact){
  const host=el('templatePreflightHistory');if(!host)return;const items=Array.isArray(history)?history:Array.isArray(history?.jobs)?history.jobs:Array.isArray(history?.history)?history.history:artifact?[artifact]:[],currentId=String(artifact?.id||artifact?.jobId||'');
  const actions=item=>item.status==='queued'?`<button type="button" data-preflight-cancel="${escape(item.id)}">대기 취소</button>`:['done','error'].includes(item.status)?`<button type="button" data-preflight-delete="${escape(item.id)}">기록 삭제</button>`:'';
  host.innerHTML=`<h3>최근 산출물과 검사 이력</h3>${items.length?`<div class="template-preflight-history-list">${items.slice(0,8).map(item=>{const current=String(item.id||item.jobId||'')===currentId;return `<article><strong>${escape(artifactFilename(identity,item))}${current?' · 현재':''}</strong><span>${escape(item?.report?.superseded?'완료본 재사용으로 종료':item.status||'-')}</span><span>${formatArtifactBytes(artifactValue(item,'fileSize','fileSizeBytes','byteLength','size'))}</span><small>${formatArtifactTime(artifactValue(item,'completedAt','finishedAt','updatedAt','createdAt'))}</small>${actions(item)}</article>`}).join('')}</div>`:'<p>저장된 검사 이력이 없습니다.</p>'}`;
  host.querySelectorAll('[data-preflight-cancel]').forEach(button=>button.addEventListener('click',()=>cancelQueuedPreflight(button.dataset.preflightCancel)));
  host.querySelectorAll('[data-preflight-delete]').forEach(button=>button.addEventListener('click',()=>deleteFinishedPreflight(button.dataset.preflightDelete)));
 }
 async function cancelQueuedPreflight(id){
  if(!id||!window.confirm('이 대기 작업을 취소할까요? 아직 워커가 시작하지 않은 잡만 취소됩니다.'))return;
  try{await window.ACDLTemplatePublishing.cancelPrintPreflight(id);await loadPreflightHistory();preflightActiveGate=suggestedPreflightGate(composePreflightReport());renderCurrentPreflight('선택한 대기 작업을 취소했습니다.')}catch(error){showEditorToast(error?.message||'대기 작업을 취소하지 못했습니다.')}
 }
 async function deleteFinishedPreflight(id){
  if(!id||!window.confirm('이 검사 기록과 저장된 CMYK PDF를 삭제할까요? 삭제 후에는 복구할 수 없습니다.'))return;
  try{await window.ACDLTemplatePublishing.deletePrintPreflight(id);await loadPreflightHistory();preflightActiveGate=suggestedPreflightGate(composePreflightReport());renderCurrentPreflight('선택한 종료 작업과 PDF를 삭제했습니다.')}catch(error){showEditorToast(error?.message||'검사 기록을 삭제하지 못했습니다.')}
 }
  async function downloadPrintPdf(){const artifact=preflightArtifact,identity={...(preflightReport?.identity||{}),name:preflightRecord?.name||preflightReport?.identity?.name};if(!artifact||artifact.status!=='done')return;const button=el('downloadTemplatePrintPdfBtn'),oldText=button?.textContent;if(button){button.disabled=true;button.textContent='PDF 준비 중'}try{let url=artifactDownloadUrl(artifact);if(!url){const result=await window.ACDLTemplatePublishing.printPreflightDownload(artifact.id||artifact.jobId);url=artifactDownloadUrl(result);if(!url)throw new Error('PDF 다운로드 주소를 받지 못했습니다.')}const response=await fetch(url);if(!response.ok)throw new Error(`PDF 다운로드에 실패했습니다. (${response.status})`);const blob=await response.blob(),link=document.createElement('a');link.href=URL.createObjectURL(blob);link.download=artifactFilename(identity,artifact);link.click();setTimeout(()=>URL.revokeObjectURL(link.href),1000)}catch(error){showEditorToast(error?.message||'PDF를 다운로드하지 못했습니다.')}finally{if(button){button.disabled=false;button.textContent=oldText}}}
  async function recordTrimContentParityReview(){
   const artifact=preflightArtifact,button=el('recordTrimContentParityBtn');if(!artifact||artifact.status!=='done'||!artifact.id)return;
   const pageCount=Number(artifactValue(artifact,'pageCount','pages'));if(!(pageCount>0)){showEditorToast('비교 페이지 수를 확인할 수 없습니다.');return}
   if(!window.confirm(`확인한 merged_rgb.pdf와 final_cmyk.pdf의 TrimBox 기준 ${pageCount}면 비교 결과를 이 Job에 기록할까요?`))return;
   setPreflightBusy('recordTrimContentParityBtn',true,'기록 중…');
   try{const updated=await window.ACDLTemplatePublishing.recordTrimContentParityReview(artifact.id,{pageCount,sourceArtifact:'merged_rgb.pdf',targetArtifact:'final_cmyk.pdf',structuralDifferences:0,colorDifferenceNote:'RGB→CMYK 변환에 따른 정상적인 색상 차이만 확인됨'});preflightArtifact=normalizedArtifact(updated);await loadPreflightHistory();renderCurrentPreflight(`재단영역 ${pageCount}면 수동 비교 결과를 기록했습니다.`)}catch(error){showEditorToast(error?.message||'수동 비교 결과를 기록하지 못했습니다.');if(button)setPreflightBusy('recordTrimContentParityBtn',false,'재단영역 수동 비교 결과 기록')}
  }
  async function recordTemplateImageReview(){
   const artifact=preflightArtifact,button=el('recordTemplateImageReviewBtn'),pageCount=Number(artifactValue(artifact,'pageCount','pages'));if(!artifact||artifact.status!=='done'||!artifact.id||!(pageCount>0))return;
   if(!window.confirm('템플릿 이미지 배치는 통과로, AI 생성 이미지의 인쇄 품질 개선은 미완료 잔여 과제로 기록할까요?'))return;
   setPreflightBusy('recordTemplateImageReviewBtn',true,'기록 중…');
   try{const updated=await window.ACDLTemplatePublishing.recordTemplateImageReview(artifact.id,{pageCount,imagePageCount:14,verdict:'conditional',findings:['템플릿 이미지의 배치 누락·깨짐·프레임 이탈은 확인되지 않음','AI 생성 이미지의 인쇄용 생성 해상도와 실배치 크기 기준 개선 필요','확대 선명도와 CMYK 변환 후 색상·계조 품질 재검증 필요','흐림·노이즈·인공 흔적·반복 이미지의 상업 인쇄 품질 개선 필요']});preflightArtifact=normalizedArtifact(updated);await loadPreflightHistory();renderCurrentPreflight('이미지 배치는 통과했으며 AI 생성 이미지 인쇄 품질은 잔여 과제로 기록했습니다.')}catch(error){showEditorToast(error?.message||'이미지 조건부 검토 결과를 기록하지 못했습니다.');if(button)setPreflightBusy('recordTemplateImageReviewBtn',false,'이미지 배치·AI 이미지 조건부 검토 기록')}
  }
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
 function historyItems(history){return Array.isArray(history)?history:Array.isArray(history?.jobs)?history.jobs:Array.isArray(history?.history)?history.history:[]}
 function normalizedArtifact(job){return job?.report?{...job.report,id:job.id||job.report.id,status:job.status,filePath:job.filePath,error:job.error,editorPrintOrigin:job.editorPrintOrigin||job.report.editorPrintOrigin,downloadUrl:job.downloadUrl||job.report.downloadUrl}:job||null}
 function latestPreflightArtifact(history){const items=historyItems(history).map(normalizedArtifact).sort((a,b)=>String(artifactValue(b,'completedAt','finishedAt','updatedAt','createdAt')||'').localeCompare(String(artifactValue(a,'completedAt','finishedAt','updatedAt','createdAt')||'')));return items.find(item=>item?.superseded!==true&&item?.cancelled!==true)||items[0]||null}
 function setPreflightButtonLabel(buttonId,text){const button=el(buttonId);if(!button)return;button.dataset.idleText=text;button.textContent=text}
 function setPreflightBusy(buttonId,busy,text){const button=el(buttonId);if(!button)return;if(!button.dataset.idleText)button.dataset.idleText=button.textContent;button.disabled=busy;button.classList.toggle('is-busy',busy);button.textContent=busy?(text||'처리 중…'):button.dataset.idleText}
 function composePreflightReport(){
  const printOutput=window.ACDLPrintOutputPreflight?.inspect?.(preflightProject,{artifact:preflightArtifact})||null;
  return window.ACDLTemplatePrintPreflight.analyze(preflightProject,{templateId:preflightIdentity?.templateId||preflightRecord?.stableKey||preflightRecord?.id,version:preflightIdentity?.version||preflightRecord?.packageVersion||preflightRecord?.version,runtimeDocument:preflightRuntimeDocument,renderParity:preflightRenderParity,printOutput});
 }
 function suggestedPreflightGate(report){const gates=report.gates||[];if(preflightArtifact&&['queued','processing'].includes(preflightArtifact.status))return 2;const blocked=gates.findIndex(item=>item.status==='blocked');if(blocked>=0)return blocked;const next=gates.findIndex(item=>item.status!=='passed');return next>=0?next:4}
 function renderCurrentPreflight(message){
  const report=composePreflightReport(),status=el('templatePreflightStatus'),download=el('downloadTemplatePreflightBtn');preflightReport=report;download&&(download.disabled=false);
  if(preflightActiveGate===null)preflightActiveGate=suggestedPreflightGate(report);preflightStatusMessage=message||preflightStatusMessage;
  const gate=report.gates?.[preflightActiveGate]||{name:'검사 준비',status:'pending'},badgeLabels={passed:'완료',review:'확인 필요',blocked:'수정 필요',pending:'미진행'},defaultMessages=['Package·페이지·Runtime 계약을 검사합니다.','전체 페이지의 Print Document와 화면·RGB 결과를 비교합니다.','최종 CMYK PDF의 핵심 자동검사와 재단영역 비교 결과를 확인합니다.','AI 생성 기준 반영 후 배경·일러스트의 인쇄 품질을 검사합니다.','Acrobat 외부 Preflight와 대표 실물 인쇄 승인을 확인합니다.'];el('templatePreflightCurrentStep').textContent=`${preflightActiveGate+1}단계`;el('templatePreflightCurrentTitle').textContent=gate.name;const badge=el('templatePreflightCurrentBadge');badge.className=gate.status;badge.textContent=preflightActiveGate===2&&preflightArtifact?.status==='queued'?'처리 대기':preflightActiveGate===2&&preflightArtifact?.status==='processing'?'처리 중':badgeLabels[gate.status];status.className=`template-preflight-status ${gate.status==='blocked'?'blocked':gate.status==='passed'?'passed':gate.status==='review'?'review':'working'}`;status.innerHTML=`<strong>${escape(preflightStatusMessage||defaultMessages[preflightActiveGate])}</strong><span>${escape(defaultMessages[preflightActiveGate])}</span>`;
  if(preflightActiveGate===4&&gate.status==='passed')status.innerHTML='<strong>에디터 내부 인쇄 품질 검사가 완료되었습니다.</strong><span>외부 Preflight와 대표 실물 출력은 대량 생산 전 후속 권장 절차이며 별도 저장 대상이 아닙니다.</span>';
  renderPreflightStages(report);el('templatePreflightMetrics').innerHTML=[['원본 페이지',report.summary.pages],['Runtime 페이지',report.runtime?.pages||0],['화면 확인',report.renderParity?.pages||'미실행'],['최종 PDF',preflightArtifact?.status||'미생성'],['오류',report.summary.errors],['경고',report.summary.warnings],['잔여 개선',report.summary.remainingImprovements||0],['후속 검사',report.summary.followUpChecks||0]].map(([name,value])=>`<div><strong>${escape(value)}</strong><span>${name}</span></div>`).join('');renderPreflightIssues();if(preflightActiveGate===3)renderAiImageInspection(report);else renderPreflightArtifact(preflightIdentity,preflightArtifact);renderPreflightHistory(preflightHistory,preflightIdentity,preflightArtifact);
  const pp=report.printOutput?.profile||{},mapping=pp.coordinateMapping||{};el('templatePreflightInventory').innerHTML=`<h4>CMYK·PDF/X-4 준비 상태</h4><div><span>계약 <b>${report.printOutput?.contractReady?'준비 완료':'수정 필요'}</b></span><span>실제 PDF <b>${report.printOutput?.artifactVerified?'검증 완료':preflightArtifact?.status==='processing'?'생성 중':preflightArtifact?.status==='queued'?'대기열 등록':'미검증'}</b></span><span><b>${escape(pp.pdfStandard||'-')}</b></span><span><b>${escape(pp.colorProfile||'-')}</b></span><span>제작·MediaBox <b>${pp.productionSize?.width||0}×${pp.productionSize?.height||0}mm</b></span><span>완성·TrimBox <b>${pp.trimSize?.width||0}×${pp.trimSize?.height||0}mm</b></span><span>도련 <b>사방 ${pp.bleed?.top||0}mm</b></span><span>좌표 매핑 <b>${mapping.mode==='translate-no-scale'?`+${mapping.offsetX||0}mm 이동 · 확대 없음`:'확인 필요'}</b></span><span>검정 <b>${escape(pp.blackRule||'-')}</b></span><span>서체 <b>${escape(pp.fontHandling||'-')}</b></span></div><h4>화면·RGB PDF 결과</h4><div><span>화면 개체 <b>${report.renderParity?.screenObjects||'미실행'}</b></span><span>RGB PDF 개체 <b>${report.renderParity?.rgbObjects||'미실행'}</b></span></div><h4>Runtime 결과</h4><div><span><b>${escape(report.runtime?.version||'미생성')}</b></span><span>진단 <b>${report.runtime?.diagnostics||0}</b></span></div><h4>페이지 역할</h4><div>${preflightCount(report.inventory.pageRoles)}</div><h4>개체 종류</h4><div>${preflightCount(report.inventory.elementTypes)}</div><h4>스타일 속성</h4><div>${preflightCount(report.inventory.styleKeys)}</div>`;
  ['runTemplateQuickPreflightBtn','runTemplateRenderCheckBtn','runTemplateFinalPreflightBtn','rerunTemplatePreflightBtn'].forEach((id,index)=>el(id)?.classList.toggle('hidden',preflightActiveGate!==Math.min(index,2)));if(preflightActiveGate===2)el('rerunTemplatePreflightBtn')?.classList.remove('hidden');el('templatePreflightArtifact')?.classList.toggle('hidden',![2,3].includes(preflightActiveGate));setPreflightButtonLabel('runTemplateFinalPreflightBtn',preflightArtifact?.status==='done'?'검사 완료 · 다시 검사':['queued','processing'].includes(preflightArtifact?.status)?'중단하고 다시 검사':'최종 PDF 생성·검사');el('runTemplateFinalPreflightBtn').disabled=false;preflightRecord.preflightReport=report;
 }
 async function loadPreflightHistory(){
  if(!preflightIdentity?.templateId||!preflightIdentity?.version||!preflightIdentity?.sha256){preflightHistory=[];preflightArtifact=null;return}
  try{const history=await window.ACDLTemplatePublishing.printPreflightHistory(preflightIdentity),artifact=latestPreflightArtifact(history);preflightHistory=history;preflightArtifact=artifact;return artifact}catch(error){console.info('print preflight history is not available yet',error);throw error}
 }
 function stopPreflightPolling(){if(preflightPollTimer){clearInterval(preflightPollTimer);preflightPollTimer=null}}
 function syncPreflightPolling(){
  stopPreflightPolling();
  if(!['queued','processing'].includes(preflightArtifact?.status))return;
  preflightPollTimer=setInterval(async()=>{
   if(el('templatePreflightDialog')?.classList.contains('hidden')){stopPreflightPolling();return}
   try{await loadPreflightHistory();preflightActiveGate=2;renderCurrentPreflight(preflightArtifact?.status==='done'?'최종 PDF 생성과 핵심 자동검사가 완료되었습니다.':'워커 진행 상태를 자동으로 갱신했습니다.');if(!['queued','processing'].includes(preflightArtifact?.status))stopPreflightPolling()}catch(error){console.info('print preflight polling failed',error);preflightActiveGate=2;renderCurrentPreflight(error?.status===401||error?.status===403||error?.code==='master_admin_required'?'관리자 인증이 만료되어 상태 갱신을 잠시 중단했습니다. 다시 로그인하면 동일 Job을 이어서 확인합니다.':'상태 갱신에 실패했습니다. 마지막으로 확인된 Job 상태를 유지합니다.')}
  },5000)
 }
 function printInspectionPackage(project){
  const publishing=project?.template?.publishing||{},published=project?.template?.metadata?.state==='published';
  return published?publishing.lastReviewPackage:(publishing.lastPrintInspectionPackage||publishing.lastReviewPackage)
 }
 async function prepareDraftPrintInspectionPackage(){
  const publishing=window.ACDLTemplatePublishing,remote=window.ACDLTemplateRemotePersistence;
  if(!publishing?.preparePrintInspection)throw new Error('인쇄검사용 Package 준비 기능을 불러오지 못했습니다.');
  if(!remote?.isRemote?.())throw new Error('초안 인쇄검사 식별 정보를 저장하려면 원격 저장 연결이 필요합니다.');
  const candidate=window.ACDLPersistenceProject.clone(preflightProject),record=preflightRecord,state=record.state||candidate?.template?.metadata?.state||'draft';
  if(state==='published')return printInspectionPackage(candidate);
  const result=await publishing.preparePrintInspection({record:{id:record.id,stableKey:record.stableKey,packageVersion:record.packageVersion,editorRevision:record.version,type:record.type},projectData:candidate,name:record.name,productType:record.type});
  const identity=candidate?.template?.publishing?.lastPrintInspectionPackage;
  if(!identity?.templateId||!identity?.version||!identity?.sha256)throw new Error('인쇄검사용 Package 식별 정보를 만들지 못했습니다.');
  const saved=await remote.save({templateId:candidate.template.remoteId||record.remoteId||record.id,stableKey:candidate.template.remoteStableKey||record.stableKey,name:record.name,description:record.description||'',edition:Number(record.edition)||2027,state,isStandard:record.isStandard===true,productType:record.type,templateKey:record.template||candidate.template?.preset||candidate.settings?.template||'school-basic',saveKind:'manual',saveNote:`${record.name} 인쇄검사용 Package 저장`,schemaVersion:'2.0',projectData:candidate},{onProgress:window.ACDLTemplateSaveProgress});
  const savedId=saved.template.id,versionNumber=Number(saved.version?.versionNumber)||Number(record.version)||1;
  candidate.template.id=savedId;candidate.template.remoteId=savedId;candidate.template.remoteStableKey=saved.template.stableKey;candidate.template.remoteVersionNumber=versionNumber;
  await saveTemplateProjectData(savedId,window.ACDLPersistenceProject.clone(candidate));
  const updated={...record,id:savedId,remoteId:savedId,stableKey:saved.template.stableKey||record.stableKey,version:versionNumber,packageVersion:identity.version,lastPrintInspectionPackage:identity,thumbnail:candidate.template.thumbnail||record.thumbnail,updatedAt:new Date().toISOString(),storage:'supabase'};
  const list=records().filter(item=>item.id!==record.id&&item.id!==savedId&&(!updated.stableKey||item.stableKey!==updated.stableKey));list.unshift(updated);saveRecords(list);
  preflightRecord=updated;preflightProject=candidate;publishing.completePublication?.(result.templateId,result.version);
  return identity
 }
async function runQuickPreflight(){
  if(!preflightRecord)return;preflightActiveGate=0;const status=el('templatePreflightStatus');setPreflightBusy('runTemplateQuickPreflightBtn',true,'검사 중…');status.className='template-preflight-status working';status.innerHTML='<strong>생성 준비 검사 중</strong><span>Package·페이지·Runtime 계약을 확인합니다. PDF 작업은 만들지 않습니다.</span>';
  try{preflightProject=preflightProject||await projectForRecord(preflightRecord);preflightRuntimeDocument=window.ACDLRuntimeBridge?.resolve?.(preflightProject)||null;const packageIdentity=printInspectionPackage(preflightProject);preflightIdentity=packageIdentity?{...packageIdentity,name:preflightRecord.name||preflightProject?.template?.metadata?.name}:null;await loadPreflightHistory();renderCurrentPreflight('생성 준비 검사를 완료했습니다.')}catch(error){status.className='template-preflight-status blocked';status.innerHTML=`<strong>검사 중단</strong><span>${escape(error?.message||'템플릿을 불러오지 못했습니다.')}</span>`}finally{setPreflightBusy('runTemplateQuickPreflightBtn',false);setPreflightButtonLabel('runTemplateQuickPreflightBtn','검사 완료 · 다시 검사')}
 }
async function runRenderPreflight(){
  if(!preflightProject)await runQuickPreflight();if(!preflightProject)return;preflightActiveGate=1;const status=el('templatePreflightStatus');setPreflightBusy('runTemplateRenderCheckBtn',true,'검사 중…');status.className='template-preflight-status working';status.innerHTML='<strong>Print Document·화면 검사 중</strong><span>전체 페이지를 화면과 RGB PDF 경로로 비교합니다. 최종 CMYK PDF는 만들지 않습니다.</span>';
  try{preflightRenderParity=await captureRenderParity(preflightProject);renderCurrentPreflight(preflightRenderParity?.generated?'Print Document·화면 검사를 완료했습니다.':'Print Document·화면 검사 결과를 확인해 주세요.')}finally{setPreflightBusy('runTemplateRenderCheckBtn',false);setPreflightButtonLabel('runTemplateRenderCheckBtn','검사 완료 · 다시 검사')}
 }
async function runFinalPreflight(){
  if(!preflightProject)await runQuickPreflight();if(!preflightProject)return;if(preflightRenderParity===undefined)await runRenderPreflight();preflightActiveGate=2;const status=el('templatePreflightStatus'),draft=(preflightRecord.state||preflightProject?.template?.metadata?.state||'draft')!=='published';if(draft||!preflightIdentity?.templateId||!preflightIdentity?.version||!preflightIdentity?.sha256){setPreflightBusy('runTemplateFinalPreflightBtn',true,'Package 준비 중…');status.className='template-preflight-status working';status.innerHTML='<strong>초안 인쇄검사용 Package 준비 중</strong><span>현재 저장본과 동일한 새 Package를 만들며 게시 상태는 변경하지 않습니다.</span>';try{const identity=await prepareDraftPrintInspectionPackage();preflightIdentity={...identity,name:preflightRecord.name||preflightProject?.template?.metadata?.name};preflightRuntimeDocument=window.ACDLRuntimeBridge?.resolve?.(preflightProject)||null;preflightRenderParity=await captureRenderParity(preflightProject);await loadPreflightHistory()}catch(error){status.className='template-preflight-status blocked';status.innerHTML=`<strong>검사용 Package 준비 실패</strong><span>${escape(error?.message||'인쇄검사용 Package를 준비하지 못했습니다.')}</span>`;setPreflightBusy('runTemplateFinalPreflightBtn',false);return}}
  setPreflightBusy('runTemplateFinalPreflightBtn',true,'요청 중…');status.className='template-preflight-status working';status.innerHTML='<strong>최종 PDF 검사 요청 중</strong><span>기존 검사 결과는 이력으로 보존하고 새 최종 PDF 작업을 요청합니다.</span>';
  try{const requestedArtifact=normalizedArtifact(await window.ACDLTemplatePublishing.ensurePrintPreflight(preflightIdentity,{force:true}));await loadPreflightHistory();preflightArtifact=latestPreflightArtifact(preflightHistory)||requestedArtifact;renderCurrentPreflight(preflightArtifact?.status==='done'?'완료된 최종 PDF 검사 결과를 불러왔습니다.':'최종 PDF 작업이 대기열에 등록됐습니다.');syncPreflightPolling()}catch(error){status.className='template-preflight-status blocked';status.innerHTML=`<strong>요청 실패</strong><span>${escape(error?.message||'최종 PDF 검사를 요청하지 못했습니다.')}</span>`}finally{setPreflightBusy('runTemplateFinalPreflightBtn',false);setPreflightButtonLabel('runTemplateFinalPreflightBtn',preflightArtifact?.status==='done'?'검사 완료 · 다시 검사':['queued','processing'].includes(preflightArtifact?.status)?'중단하고 다시 검사':'최종 PDF 생성·검사');el('runTemplateFinalPreflightBtn').disabled=false}
 }
async function refreshPreflightResult(){
  if(!preflightProject)return;preflightActiveGate=2;setPreflightBusy('rerunTemplatePreflightBtn',true,'확인 중…');try{await loadPreflightHistory();renderCurrentPreflight(preflightArtifact?.status==='done'?'완료 결과를 불러왔습니다.':'현재 작업 상태를 갱신했습니다. 새 작업은 만들지 않았습니다.');syncPreflightPolling()}finally{setPreflightBusy('rerunTemplatePreflightBtn',false)}
 }
 async function openPrintPreflight(record){
  if(!record)return;preflightRecord=record;preflightProject=null;preflightRuntimeDocument=null;preflightRenderParity=undefined;preflightIdentity=null;preflightHistory=[];preflightReport=null;preflightArtifact=null;preflightFilter='all';preflightActiveGate=null;preflightStatusMessage='';stopPreflightPolling();const dialog=el('templatePreflightDialog'),download=el('downloadTemplatePreflightBtn'),pdfDownload=el('downloadTemplatePrintPdfBtn');dialog.classList.remove('hidden');download&&(download.disabled=true);pdfDownload&&(pdfDownload.disabled=true);dialog.querySelectorAll('[data-preflight-filter]').forEach(button=>button.classList.toggle('active',button.dataset.preflightFilter==='all'));el('templatePreflightTitle').textContent=`${record.name} · 인쇄 품질 검사`;el('templatePreflightDescription').textContent=`${record.type} · ${record.edition} Edition · ${internalVersionLabel(record)}`;el('templatePreflightStages').innerHTML='<button class="active pending"><span>1단계</span><strong>생성 준비</strong><small>검사 준비</small></button><button class="pending"><span>2단계</span><strong>Print Document·화면</strong><small>미진행</small></button><button class="pending"><span>3단계</span><strong>핵심 자동검사</strong><small>미진행</small></button><button class="pending"><span>4단계</span><strong>AI 생성 이미지 검사</strong><small>미진행</small></button><button class="pending"><span>5단계</span><strong>외부·실물 승인</strong><small>미진행</small></button>';el('templatePreflightMetrics').innerHTML='';el('templatePreflightIssues').innerHTML='<p class="template-preflight-empty">생성 준비 검사를 시작합니다.</p>';el('templatePreflightInventory').innerHTML='';el('templatePreflightArtifact').classList.add('hidden');el('templatePreflightHistory').innerHTML='<h3>최근 산출물과 검사 이력</h3><p>이력을 확인합니다.</p>';await runQuickPreflight();preflightActiveGate=suggestedPreflightGate(preflightReport||composePreflightReport());renderCurrentPreflight(preflightArtifact?.status==='done'?'저장된 최종 PDF 검사 결과를 불러왔습니다.':'현재 검사 상태를 불러왔습니다.');syncPreflightPolling()
 }
 function renderUserChoices(){
  const grid=el('userTemplateChoiceGrid');if(!grid)return;const selectedType=selectedCalendarType;const list=records().filter(record=>record.type===selectedType&&record.state==='published').sort((a,b)=>String(b.updatedAt).localeCompare(String(a.updatedAt)));
  grid.innerHTML=list.length?list.map(record=>`<button type="button" class="template-choice" data-user-library-id="${escape(record.id)}" data-user-template="${escape(record.template)}" data-user-type="${escape(record.type)}" data-state="published"><div class="template-preview" data-library-thumbnail="${escape(record.id)}"><span class="thumbnail-placeholder">템플릿 미리보기</span></div><div class="template-card-topline"><strong>${escape(record.name)}</strong><span class="edition-badge">${record.edition} Edition</span></div><small class="template-description">${escape(record.description)}</small><div class="template-tags"><span>${escape(label(record.type))}</span>${(record.features||[]).slice(0,2).map(item=>`<span>${escape(item)}</span>`).join('')}</div></button>`).join(''):`<div class="library-empty-state user-empty"><strong>현재 준비 중인 유형입니다.</strong><p>게시된 템플릿이 없습니다.</p></div>`;
  grid.querySelectorAll('[data-user-template]').forEach(button=>button.addEventListener('click',()=>{grid.querySelectorAll('[data-user-template]').forEach(item=>item.classList.remove('selected'));button.classList.add('selected');selectedUserTemplate={template:button.dataset.userTemplate,type:button.dataset.userType,libraryId:button.dataset.userLibraryId};renderUserSizeOptions();wizardStateApi?.persistWizardState?.({selectedType:selectedCalendarType,template:selectedUserTemplate.template,step:userWizardStep});updateWizardActions()}));
  updateWizardActions();
  hydrateThumbnails(list,grid);
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
 ['closeTemplatePreflightBtn','closeTemplatePreflightFooterBtn'].forEach(id=>el(id)?.addEventListener('click',()=>{stopPreflightPolling();el('templatePreflightDialog')?.classList.add('hidden')}));el('runTemplateQuickPreflightBtn')?.addEventListener('click',runQuickPreflight);el('runTemplateRenderCheckBtn')?.addEventListener('click',runRenderPreflight);el('runTemplateFinalPreflightBtn')?.addEventListener('click',runFinalPreflight);el('rerunTemplatePreflightBtn')?.addEventListener('click',refreshPreflightResult);
 el('templatePreflightStages')?.addEventListener('click',event=>{const button=event.target.closest('[data-preflight-gate]');if(!button||!preflightReport)return;const next=Number(button.dataset.preflightGate),gate=preflightReport.gates?.[next];if(gate?.access==='locked'){showEditorToast(`${gate.blockedBy}단계를 완료한 뒤 진행할 수 있습니다.`);return}preflightActiveGate=next;preflightStatusMessage='';renderCurrentPreflight()});
 el('downloadTemplatePrintPdfBtn')?.addEventListener('click',downloadPrintPdf);el('downloadTemplatePreflightBtn')?.addEventListener('click',downloadPreflightReport);el('templatePreflightFilters')?.addEventListener('click',event=>{const button=event.target.closest('[data-preflight-filter]');if(!button)return;preflightFilter=button.dataset.preflightFilter;el('templatePreflightFilters').querySelectorAll('button').forEach(item=>item.classList.toggle('active',item===button));renderPreflightIssues()});
 document.querySelector('#closeTemplateLibraryBtn')?.addEventListener('click',()=>setTimeout(()=>{renderTypeChoices();renderUserChoices()},0));
})();
