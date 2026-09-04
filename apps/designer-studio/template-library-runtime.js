(()=>{
 const el=id=>document.getElementById(id);
 const catalog=window.ACDL_TEMPLATE_CATALOG||{types:[],templates:[]};
 const typeKey='acdl.calendarTypeDefinitions.v37';
 const validStates=new Set(['draft','ready','published','archived']);
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
 const versionHistoryCache=new Map();

 function escape(value){return typeof v21Escape==='function'?v21Escape(value):String(value??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]))}
 function readCustomTypes(){try{const value=JSON.parse(localStorage.getItem(typeKey)||'null');return Array.isArray(value)?value:[]}catch{return[]}}
 function allTypes(){
  const map=new Map((catalog.types||[]).map(type=>[type.id,{...type}]));
  readCustomTypes().forEach(type=>{if(type?.id&&!map.has(type.id))map.set(type.id,{id:type.id,label:type.name||type.id,description:type.description||`${type.name||type.id} 유형 템플릿`,icon:'▦',enabled:true,sortOrder:100,baseType:type.baseType||'desk',custom:true,...type})});
  return [...map.values()].sort((a,b)=>(a.sortOrder??999)-(b.sortOrder??999)||String(a.label).localeCompare(String(b.label),'ko'));
 }
 function typeMeta(type){return allTypes().find(item=>item.id===type)||{id:type,label:type,description:'등록된 유형 설명이 없습니다.',enabled:true,sortOrder:999,baseType:type}}
 function stateOf(record){const state=record?.status||record?.state;return validStates.has(state)?state:'draft'}
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
  const map=new Map((catalog.templates||[]).map(record=>[record.id,normalize(record,'catalog')]));
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
 function internalVersionLabel(record){return record.canonicalPackage&&record.packageVersion?`Package ${record.template}@${record.packageVersion}`:`내부 버전 v${record.version}`}
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
 function cardMarkup(record){
  const meta=typeMeta(record.type);
  const features=record.features?.length?record.features.map(item=>`<span>${escape(item)}</span>`).join(''):`<span>${escape(meta.description)}</span>`;
  const kindLabel=record.source==='local'?'내 템플릿':'시스템 베이스';
  const kindClass=record.source==='local'?'custom-template':'base-template';
  const remoteStored=record.storage==='supabase';
  const storageBadge=record.source==='local'?`<span class="${remoteStored?'storage-remote':'storage-local'}">${remoteStored?'Supabase 원격 저장':'브라우저 저장 · 원격 저장 필요'}</span>`:'';
  const remoteHistory=remoteStored?`<button data-library-history="${escape(record.id)}" aria-expanded="false">버전 이력</button>`:'';
  const qualityCheck='<button type="button" data-library-quality-check disabled title="인쇄·출력 품질 검사는 추후 제공할 예정입니다.">인쇄·출력 품질 검사 · 준비 중</button>';
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
  if(!host||host.dataset.rendered==='true')return;
  const navigation=window.ACDLProjectNavigation;
  const transitionId=navigation?.current?.();
  let original=null;
  try{
   original={project,selectedPageId,selectedElementId,selectedElementScope,calendarEditing,history,future};
   let source=await loadTemplateProjectData(record.id);
   if(!host.isConnected||(navigation&&!navigation.isCurrent(transitionId)))return;
   const uploaded=source?.template?.thumbnail?.kind==='upload'?source.template.thumbnail:record.thumbnail?.kind==='upload'?record.thumbnail:null;
   if(uploaded?.dataUrl){host.innerHTML=`<img class="library-uploaded-thumbnail" src="${uploaded.dataUrl}" alt="${escape(record.name)} 대표 이미지">`;host.dataset.rendered='true';return}
   if(!source){const preset=(SIZE_PRESETS[record.type]||SIZE_PRESETS.desk||[]).find(item=>item.recommended)||(SIZE_PRESETS[record.type]||SIZE_PRESETS.desk||[])[0];source=makeProject({type:record.type,year:record.edition,startMonth:3,template:record.packageVersion?'school-basic':record.template,frontInsertCount:record.packageVersion?0:1,rearInsertCount:0,calendarRows:record.packageVersion?5:6,weekStart:'sunday',showAdjacentMiniCalendars:true,posterColumns:4,sizePresetId:preset?.id});if(record.packageVersion)source=await window.ACDLPackageProjectAdapter.loadAndApply(source,record.packageBase)}
   project=structuredClone(source);const pages=project.book.pageInstances||[],preferred=record.type==='poster'?pages.find(page=>page.role==='poster-annual'):pages.find(page=>page.role==='cover-front');selectedPageId=preferred?.id||pages[0]?.id||null;selectedElementId=null;selectedElementScope=null;calendarEditing=false;history=[];future=[];render();window.ACDLEditorPageFit?.fit?.();
   const page=el('page');if(!page)return;mountCoverSnapshot(record,host,page);host.dataset.rendered='true';
  }catch(error){host.innerHTML='<span class="thumbnail-placeholder">미리보기를 만들 수 없습니다.</span>';console.warn('Template thumbnail failed',record.id,error)}
  finally{if(original&&(!navigation||navigation.isCurrent(transitionId))){project=original.project;selectedPageId=original.selectedPageId;selectedElementId=original.selectedElementId;selectedElementScope=original.selectedElementScope;calendarEditing=original.calendarEditing;history=original.history;future=original.future;if(project)render()}}
 }
 function renderActualThumbnail(record,host){const key=`${record.id}:${record.version}:${record.updatedAt}`,cached=thumbnailMarkupCache.get(key);if(cached&&host){host.innerHTML=cached;host.dataset.rendered='true';return Promise.resolve()}thumbnailQueue=thumbnailQueue.then(()=>renderActualThumbnailNow(record,host)).catch(error=>console.warn('Template thumbnail queue failed',record.id,error));return thumbnailQueue}
 function hydrateThumbnails(list){list.forEach(record=>{const host=document.querySelector(`[data-library-thumbnail="${CSS.escape(record.id)}"]`);renderActualThumbnail(record,host)})}
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
 async function projectForRecord(record){
  let source=await loadTemplateProjectData(record.id);
  if(source)return structuredClone(source);
  const preset=(SIZE_PRESETS[record.type]||SIZE_PRESETS.desk||[]).find(item=>item.recommended)||(SIZE_PRESETS[record.type]||SIZE_PRESETS.desk||[])[0];
  source=makeProject({type:record.type,year:record.edition,startMonth:3,template:record.packageVersion?'school-basic':record.template,frontInsertCount:record.packageVersion?0:1,rearInsertCount:0,calendarRows:record.packageVersion?5:6,weekStart:'sunday',showAdjacentMiniCalendars:true,posterColumns:4,sizePresetId:preset?.id});
  return record.packageVersion?await window.ACDLPackageProjectAdapter.loadAndApply(source,record.packageBase):source;
 }
 async function startNewFrom(record){
  if(!record)return;
  const source=await projectForRecord(record);window.ACDLNewTemplateBaseProject=source;window.ACDLNewTemplateBaseRecord=record;
  el('templateLibraryModal').classList.add('hidden');el('setup').classList.remove('hidden');el('setupType').value=record.type;el('setupType').dispatchEvent(new Event('change'));el('setupType').disabled=true;el('setupYear').value=record.edition;el('setupMonth').value=source.settings?.startMonth||3;el('setupCalendarRows').value=String(source.settings?.calendarRows||6);el('setupWeekStart').value=source.settings?.weekStart||'sunday';el('setupAdjacentMiniCalendars').checked=source.settings?.showAdjacentMiniCalendars!==false;el('setupFrontInserts').value=String(source.settings?.frontInsertCount||0);el('setupRearInserts').value=String(source.settings?.rearInsertCount||0);el('setupSize').value=source.settings?.sizePreset?.id||el('setupSize').value;el('setupTemplate').value=source.template?.preset||record.template||'school-basic';window.ACDLTemplateTypeRules?.applySetupTypeRules?.();showEditorToast(`${record.name}을 기준으로 새 템플릿 설정을 시작합니다.`)
 }
 function openSettings(record){
  if(!record)return;const dialog=el('templateSaveDialog');dialog.dataset.mode='settings';dialog.dataset.recordId=record.id;el('templateSaveDialogTitle').textContent='템플릿 설정';el('templateSaveDialogHelp').textContent='디자인은 변경하지 않고 라이브러리 관리 정보만 저장합니다.';el('saveTemplateName').value=record.name;el('saveTemplateDescription').value=record.description||'';el('saveTemplateEdition').value=record.edition;el('saveTemplateState').value=record.state;el('saveTemplateStandard').checked=record.isStandard===true;el('templateSaveFeedback').className='save-feedback hidden';dialog.classList.remove('hidden')
 }
 function installTemplateSaveProgress(){
  const dialog=el('templateSaveDialog'),confirmButton=el('confirmTemplateSaveBtn'),cancelButton=el('cancelTemplateSaveBtn'),feedback=el('templateSaveFeedback');
  if(!dialog||!confirmButton||!cancelButton||!feedback)return;
  const idleLabel=confirmButton.textContent;
  const style=document.createElement('style');style.textContent='.save-feedback.info{display:flex;align-items:center;gap:8px;background:#eef5ff;color:#245d9b}.save-feedback.info::before{content:"";width:12px;height:12px;border:2px solid #b8cdf0;border-top-color:#2865d8;border-radius:50%;animation:acdlSaveSpin .75s linear infinite}.template-save-dialog[aria-busy="true"] .template-save-card{cursor:progress}.template-save-dialog[aria-busy="true"] button:disabled{cursor:wait;opacity:.68}@keyframes acdlSaveSpin{to{transform:rotate(360deg)}}';document.head.appendChild(style);
  const finish=()=>{confirmButton.disabled=false;cancelButton.disabled=false;confirmButton.textContent=idleLabel;dialog.removeAttribute('aria-busy')};
  confirmButton.addEventListener('click',()=>setTimeout(()=>{if(dialog.classList.contains('hidden'))return;feedback.className='save-feedback info';feedback.textContent='라이브러리에 저장하는 중입니다. 잠시만 기다려 주세요.';confirmButton.disabled=true;cancelButton.disabled=true;confirmButton.textContent='저장 중…';dialog.setAttribute('aria-busy','true')},0),true);
  new MutationObserver(()=>{if(dialog.classList.contains('hidden')||feedback.classList.contains('error'))finish()}).observe(dialog,{attributes:true,subtree:true,attributeFilter:['class']});
 }
 async function saveSettings(recordId,values){
  const record=records().find(item=>item.id===recordId);if(!record)throw new Error('설정할 템플릿을 찾지 못했습니다.');const projectData=await projectForRecord(record);projectData.template||={};projectData.template.metadata={...(projectData.template.metadata||{}),...values};
  const remote=window.ACDLTemplateRemotePersistence;let saved={...record,...values,status:values.state,updatedAt:new Date().toISOString(),source:'local',libraryOverride:true};
  if(remote?.isRemote?.()){const result=await remote.save({templateId:record.remoteId||(/^[0-9a-f-]{36}$/i.test(String(record.id))?record.id:null),stableKey:record.stableKey||record.catalogId||record.id,name:values.name||record.name,description:values.description||'',edition:Number(values.edition)||record.edition,state:values.state,isStandard:values.isStandard===true,productType:record.type,templateKey:record.template,saveKind:values.state==='published'?'publish':'manual',saveNote:'라이브러리 설정 변경',schemaVersion:'2.0',projectData});saved=normalize({...record,...result.template,id:result.template.id,remoteId:result.template.id,stableKey:result.template.stableKey,name:result.template.name,description:result.template.description,edition:result.template.edition,state:result.template.state,status:result.template.state,isStandard:result.template.isStandard,type:result.template.productType,template:result.template.templateKey,version:result.template.latestVersionNumber,storage:'supabase',source:'local',catalogId:record.catalogId||record.id},'local');await saveTemplateProjectData(saved.id,projectData)}else await saveTemplateProjectData(saved.id,projectData);
  const list=oldLibrary().filter(item=>item.id!==record.id&&item.id!==saved.id&&item.stableKey!==saved.stableKey);saveRecords([saved,...list]);renderLibrary(activeLibraryState);renderUserChoices();showEditorToast('템플릿 설정을 저장했습니다.');return saved
 }
 window.ACDLTemplateLibrarySettings=Object.freeze({open:openSettings,save:saveSettings,startNewFrom});
 function filterActive(record){
  if(activeLibraryScope==='base'&&record.source!=='catalog')return false;
  if(activeLibraryScope==='custom'&&record.source!=='local')return false;
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
  const list=records().filter(filterActive);
  const grid=el('templateLibraryGrid');if(!grid)return;
  if(!list.length && activeLibraryScope==='custom'){
    grid.innerHTML=`<div class="library-empty-state user-empty"><strong>등록된 템플릿이 없습니다.</strong><p>새 템플릿을 만들어 이 영역에 저장하세요.</p><button class="primary" id="createCustomTemplateBtn">새 템플릿 만들기</button></div>`;
    const button=el('createCustomTemplateBtn');if(button)button.addEventListener('click',()=>{closeTemplateLibrary();enterDesigner();});
  } else {
    grid.innerHTML=list.length?list.map(cardMarkup).join(''):`<div class="library-empty-state"><strong>${activeTypeFilter==='all'?'등록된 템플릿이 없습니다.':`${escape(label(activeTypeFilter))}에 등록된 템플릿이 없습니다.`}</strong><p>새 템플릿을 만들어 보세요.</p></div>`;
    grid.querySelectorAll('[data-library-use]').forEach(button=>button.addEventListener('click',()=>startNewFrom(records().find(record=>record.id===button.dataset.libraryUse)).catch(error=>showEditorToast(error?.message||'새 템플릿 설정을 시작하지 못했습니다.'))));
    grid.querySelectorAll('[data-library-edit]').forEach(button=>button.addEventListener('click',()=>{const source=records().find(record=>record.id===button.dataset.libraryEdit);if(source&&!source.isStandard)openDesignerProjectFromRecord(source)}));
    grid.querySelectorAll('[data-library-settings]').forEach(button=>button.addEventListener('click',()=>openSettings(records().find(record=>record.id===button.dataset.librarySettings))));
    grid.querySelectorAll('[data-library-history]').forEach(button=>button.addEventListener('click',()=>toggleVersionHistory(button)));
    hydrateThumbnails(list);
  }
  updateLibrarySummary(list.length);
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
 ensureTypeOptions();renderTypeChoices();renderTypeFilters();renderUserChoices();installTemplateSaveProgress();
 document.querySelectorAll('[data-library-state]').forEach(button=>button.addEventListener('click',()=>{document.querySelectorAll('[data-library-state]').forEach(x=>x.classList.toggle('active',x===button));activeLibraryState=button.dataset.libraryState;setTimeout(()=>renderLibrary(button.dataset.libraryState),0)}));
 el('libraryStandardFilter')?.addEventListener('click',event=>{activeStandardOnly=!activeStandardOnly;event.currentTarget.classList.toggle('active',activeStandardOnly);event.currentTarget.setAttribute('aria-pressed',String(activeStandardOnly));renderLibrary(activeLibraryState)});
 document.querySelectorAll('[data-library-scope]').forEach(button=>button.addEventListener('click',()=>{document.querySelectorAll('[data-library-scope]').forEach(x=>x.classList.toggle('active',x===button));activeLibraryScope=button.dataset.libraryScope;setTimeout(()=>renderLibrary(activeLibraryState),0)}));
 el('libraryEditionFilter')?.addEventListener('change',()=>renderLibrary(activeLibraryState));
 document.querySelectorAll('#designerHomeLibrary,#libraryBtn').forEach(button=>button.addEventListener('click',()=>setTimeout(()=>renderLibrary('all'),0)));
 document.querySelector('#saveTemplateState')?.replaceChildren(...['draft','ready','published','archived'].map(state=>Object.assign(document.createElement('option'),{value:state,textContent:state==='published'?'게시됨':state==='archived'?'보관됨':state==='ready'?'검토 완료':'초안'})));
 document.querySelector('#closeTemplateLibraryBtn')?.addEventListener('click',()=>setTimeout(()=>{renderTypeChoices();renderUserChoices()},0));
})();
