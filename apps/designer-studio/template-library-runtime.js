(()=>{
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
 let thumbnailQueue=Promise.resolve();

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
    type,
    state,
    status:state,
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
  oldLibrary().map(record=>normalize(record,'local')).forEach(record=>map.set(record.id,record));
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
  return `<article class="library-template-card ${kindClass}" data-template-id="${escape(record.id)}" data-library-state="${record.state}" data-library-type="${escape(record.type)}"><div class="library-thumb calendar-product-thumb calendar-product-${escape(record.type)}"><div class="calendar-product-shell"><span class="calendar-product-binding" aria-hidden="true"></span><div class="calendar-product-page" data-library-thumbnail="${escape(record.id)}"><span class="thumbnail-placeholder">템플릿 미리보기</span></div><span class="calendar-product-side" aria-hidden="true"></span><span class="calendar-product-stand" aria-hidden="true"></span></div></div><div class="library-card-body"><div class="library-meta-line"><h3>${escape(record.name)}</h3><span class="edition-badge">${record.edition} Edition</span>${record.version>1?`<span class="version-badge">v${escape(String(record.version))}</span>`:''}</div><div class="library-card-meta"><span class="badge-base">${escape(kindLabel)}</span><span>${escape(meta.label)}</span><span>${escape(record.size?.label||`${record.size?.width||'-'} × ${record.size?.height||'-'} ${record.size?.unit||'mm'}`)}</span></div><span class="state-badge state-${record.state}">${record.state==='published'?'게시됨':record.state==='archived'?'보관됨':record.state==='ready'?'검토 완료':'초안'}</span><p>${escape(record.description)}</p><small>${escape(record.pageSummary)} · 수정 ${escape(String(record.updatedAt).slice(0,10))}</small><div class="template-tags catalog-card-features">${features}</div><div class="library-card-actions"><button class="primary" data-library-use="${escape(record.id)}">이 템플릿 사용하기</button><button data-library-edit="${escape(record.id)}">편집</button><button data-library-copy="${escape(record.id)}">복제</button><button data-library-state-change="${escape(record.id)}">상태 변경</button></div></div></article>`;
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
   if(!source){const preset=(SIZE_PRESETS[record.type]||SIZE_PRESETS.desk||[]).find(item=>item.recommended)||(SIZE_PRESETS[record.type]||SIZE_PRESETS.desk||[])[0];source=makeProject({type:record.type,year:record.edition,startMonth:3,template:record.template,frontInsertCount:1,rearInsertCount:0,calendarRows:6,weekStart:'sunday',showAdjacentMiniCalendars:true,posterColumns:4,sizePresetId:preset?.id})}
   project=structuredClone(source);const pages=project.book.pageInstances||[],preferred=record.type==='poster'?pages.find(page=>page.role==='poster-annual'):pages.find(page=>page.role==='cover-front');selectedPageId=preferred?.id||pages[0]?.id||null;selectedElementId=null;selectedElementScope=null;calendarEditing=false;history=[];future=[];render();
   const page=el('page');if(!page)return;const clone=page.cloneNode(true);clone.removeAttribute('id');clone.classList.add('library-thumb-render');clone.querySelectorAll('.editor-only,.non-output,.s2-selection-toolbar,.s2-key-hint').forEach(node=>node.remove());host.innerHTML='';host.appendChild(clone);host.dataset.rendered='true';
  }catch(error){host.innerHTML='<span class="thumbnail-placeholder">미리보기를 만들 수 없습니다.</span>';console.warn('Template thumbnail failed',record.id,error)}
  finally{if(original&&(!navigation||navigation.isCurrent(transitionId))){project=original.project;selectedPageId=original.selectedPageId;selectedElementId=original.selectedElementId;selectedElementScope=original.selectedElementScope;calendarEditing=original.calendarEditing;history=original.history;future=original.future;if(project)render()}}
 }
 function renderActualThumbnail(record,host){thumbnailQueue=thumbnailQueue.then(()=>renderActualThumbnailNow(record,host)).catch(error=>console.warn('Template thumbnail queue failed',record.id,error));return thumbnailQueue}
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
 function filterActive(record){
  if(activeLibraryScope==='base'&&record.source!=='catalog')return false;
  if(activeLibraryScope==='custom'&&record.source!=='local')return false;
  if(activeLibraryState!=='all'&&record.state!==activeLibraryState)return false;
  if(activeTypeFilter!=='all'&&record.type!==activeTypeFilter)return false;
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
    grid.querySelectorAll('[data-library-edit],[data-library-use]').forEach(button=>button.addEventListener('click',()=>openDesignerProjectFromRecord(records().find(record=>record.id===button.dataset.libraryEdit||record.id===button.dataset.libraryUse))));
    grid.querySelectorAll('[data-library-copy]').forEach(button=>button.addEventListener('click',()=>{const source=records().find(record=>record.id===button.dataset.libraryCopy);if(!source)return;saveRecords([...records(),{...source,id:`tpl-${Date.now()}`,name:`${source.name} 복사본`,state:'draft',status:'draft',updatedAt:new Date().toISOString()}]);renderLibrary(filter)}));
    grid.querySelectorAll('[data-library-state-change]').forEach(button=>button.addEventListener('click',()=>{const list=records(),record=list.find(item=>item.id===button.dataset.libraryStateChange);if(!record)return;const seq=['draft','ready','published','archived'];record.state=seq[(seq.indexOf(record.state)+1)%seq.length];record.status=record.state;record.updatedAt=new Date().toISOString();saveRecords(list);renderLibrary(filter);renderUserTemplateChoices()}));
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
 ensureTypeOptions();renderTypeChoices();renderTypeFilters();renderUserChoices();
 document.querySelectorAll('[data-library-state]').forEach(button=>button.addEventListener('click',()=>{document.querySelectorAll('[data-library-state]').forEach(x=>x.classList.toggle('active',x===button));activeLibraryState=button.dataset.libraryState;setTimeout(()=>renderLibrary(button.dataset.libraryState),0)}));
 document.querySelectorAll('[data-library-scope]').forEach(button=>button.addEventListener('click',()=>{document.querySelectorAll('[data-library-scope]').forEach(x=>x.classList.toggle('active',x===button));activeLibraryScope=button.dataset.libraryScope;setTimeout(()=>renderLibrary(activeLibraryState),0)}));
 el('libraryEditionFilter')?.addEventListener('change',()=>renderLibrary(activeLibraryState));
 document.querySelectorAll('#designerHomeLibrary,#libraryBtn').forEach(button=>button.addEventListener('click',()=>setTimeout(()=>renderLibrary('all'),0)));
 document.querySelector('#saveTemplateState')?.replaceChildren(...['draft','published','archived'].map(state=>Object.assign(document.createElement('option'),{value:state,textContent:state==='published'?'게시됨':state==='archived'?'보관됨':'초안'})));
 document.querySelector('#closeTemplateLibraryBtn')?.addEventListener('click',()=>setTimeout(()=>{renderTypeChoices();renderUserChoices()},0));
})();
