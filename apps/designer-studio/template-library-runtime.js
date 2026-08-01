(()=>{
 const catalog=window.ACDL_TEMPLATE_CATALOG||{types:[],templates:[]};
 const typeKey='acdl.calendarTypeDefinitions.v37';
 const validStates=new Set(['draft','published','archived']);
 const oldLibrary=window.v22Library||v22Library;
 const oldSaveLibrary=window.v22SaveLibrary||v22SaveLibrary;
 const oldRenderLibrary=window.renderTemplateLibrary||renderTemplateLibrary;
 const oldRenderUserChoices=window.renderUserTemplateChoices||renderUserTemplateChoices;
 const oldApplyType=window.applyCalendarType||applyCalendarType;
 let activeTypeFilter='all';

 function escape(value){return typeof v21Escape==='function'?v21Escape(value):String(value??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]))}
 function readCustomTypes(){try{const value=JSON.parse(localStorage.getItem(typeKey)||'null');return Array.isArray(value)?value:[]}catch{return[]}}
 function allTypes(){
  const map=new Map((catalog.types||[]).map(type=>[type.id,{...type}]));
  readCustomTypes().forEach(type=>{if(type?.id&&!map.has(type.id))map.set(type.id,{id:type.id,label:type.name||type.id,description:type.description||`${type.name||type.id} 유형 템플릿`,icon:'▦',enabled:true,sortOrder:100,baseType:type.baseType||'desk',custom:true,...type})});
  return [...map.values()].sort((a,b)=>(a.sortOrder??999)-(b.sortOrder??999)||String(a.label).localeCompare(String(b.label),'ko'));
 }
 function typeMeta(type){return allTypes().find(item=>item.id===type)||{id:type,label:type,description:'등록된 유형 설명이 없습니다.',enabled:true,sortOrder:999,baseType:type}}
 function stateOf(record){const state=record?.status||record?.state;return state==='ready'?'draft':validStates.has(state)?state:'draft'}
 function sizeOf(record){
  const preset=(window.SIZE_PRESETS?.[record.type]||[]).find(item=>item.recommended)||(window.SIZE_PRESETS?.[record.type]||[])[0];
  return record.size|| (preset?{width:preset.width,height:preset.height,unit:'mm',label:preset.label}:{});
 }
 function normalize(record){
  const type=record?.type?.category||record?.type||'desk';
  const meta=typeMeta(type);
  const state=stateOf(record);
  const updatedAt=record?.updatedAt||new Date().toISOString();
  return {...record,type,state,status:state,name:record?.name||'이름 없는 템플릿',description:record?.description||'',edition:Number(record?.edition)||2027,template:record?.template||'school-basic',features:record?.features||[],size:sizeOf({...record,type}),pageSummary:record?.pageSummary||`${meta.duplex?'앞면·뒷면':'단면'} · ${meta.monthlyCount||12}개월`,thumbnail:record?.thumbnail||{kind:'renderer',source:'templateData'},updatedAt,version:Number(record?.version)||1,templateData:record?.templateData||{preset:record?.template||'school-basic'}};
 }
 function records(){
  const map=new Map((catalog.templates||[]).map(record=>[record.id,normalize(record)]));
  oldLibrary().map(normalize).forEach(record=>map.set(record.id,record));
  return [...map.values()];
 }
 function saveRecords(list){oldSaveLibrary(list.map(normalize))}
 function label(type){return typeMeta(type).label}
 function publishedCount(type){return records().filter(record=>record.type===type&&record.state==='published').length}
 function typeOptions(){return allTypes().filter(type=>type.enabled!==false)}
 function ensureTypeOptions(){
  const select=el('setupType');if(!select)return;
  const current=select.value;select.innerHTML=typeOptions().map(type=>`<option value="${escape(type.id)}">${escape(label(type.id))}</option>`).join('');if(typeOptions().some(type=>type.id===current))select.value=current;
 }
 function renderTypeChoices(){
  const grid=document.querySelector('.calendar-type-grid');if(!grid)return;
  grid.innerHTML=typeOptions().map(type=>{const count=publishedCount(type.id);return `<button class="calendar-type-choice ${type.id===selectedCalendarType?'selected':''}" data-calendar-type="${escape(type.id)}"><div class="type-icon">${type.icon||'▦'}</div><strong>${escape(type.label)}</strong><small>${escape(type.description)}</small><span class="catalog-type-count">게시 템플릿 ${count}개 · ${type.enabled===false?'사용 불가':'사용 가능'}</span></button>`}).join('');
  grid.querySelectorAll('[data-calendar-type]').forEach(button=>button.addEventListener('click',()=>applyCalendarType(button.dataset.calendarType)));
 }
 function renderTypeFilters(){
  const host=el('libraryTypeFilters');if(!host)return;
  host.innerHTML=[`<button class="library-type-filter ${activeTypeFilter==='all'?'active':''}" data-library-type="all">모든 유형</button>`,...typeOptions().map(type=>`<button class="library-type-filter ${activeTypeFilter===type.id?'active':''}" data-library-type="${escape(type.id)}">${escape(type.label)} <span>${publishedCount(type.id)}</span></button>`)].join('');
  host.querySelectorAll('[data-library-type]').forEach(button=>button.addEventListener('click',()=>{activeTypeFilter=button.dataset.libraryType;renderTemplateLibrary(document.querySelector('[data-library-filter].active')?.dataset.libraryFilter||'all')}));
 }
 function cardMarkup(record){
  const meta=typeMeta(record.type);const features=record.features?.length?record.features.map(item=>`<span>${escape(item)}</span>`).join(''):`<span>${escape(meta.description)}</span>`;
  return `<article class="library-template-card" data-template-id="${escape(record.id)}" data-library-state="${record.state}" data-library-type="${escape(record.type)}"><div class="library-thumb" data-library-thumbnail="${escape(record.id)}"><span class="thumbnail-placeholder">템플릿 미리보기</span></div><div class="library-card-body"><div class="library-meta-line"><h3>${escape(record.name)}</h3><span class="edition-badge">${record.edition} Edition</span></div><span class="state-badge state-${record.state}">${record.state==='published'?'게시됨':record.state==='archived'?'보관됨':'초안'}</span><p>${escape(record.description)}</p><small>${escape(meta.label)} · ${escape(record.size?.label||`${record.size?.width||'-'} × ${record.size?.height||'-'} ${record.size?.unit||'mm'}`)} · ${escape(record.pageSummary)} · 수정 ${escape(String(record.updatedAt).slice(0,10))}</small><div class="template-tags catalog-card-features">${features}</div><div class="library-card-actions"><button class="primary" data-library-use="${escape(record.id)}">이 템플릿 사용하기</button><button data-library-edit="${escape(record.id)}">편집</button><button data-library-copy="${escape(record.id)}">복제</button><button data-library-state-change="${escape(record.id)}">상태 변경</button></div></div></article>`;
 }
 async function renderActualThumbnail(record,host){
  if(!host||host.dataset.rendered==='true')return;
  let original=null;
  try{
   original={project,selectedPageId,selectedElementId,selectedElementScope,calendarEditing,history,future};
   let source=await loadTemplateProjectData(record.id);
   if(!source){const preset=(SIZE_PRESETS[record.type]||SIZE_PRESETS.desk||[]).find(item=>item.recommended)||(SIZE_PRESETS[record.type]||SIZE_PRESETS.desk||[])[0];source=makeProject({type:record.type,year:record.edition,startMonth:3,template:record.template,frontInsertCount:1,rearInsertCount:0,calendarRows:6,weekStart:'sunday',showAdjacentMiniCalendars:true,posterColumns:4,sizePresetId:preset?.id})}
   project=structuredClone(source);selectedPageId=project.book.pageInstances[0]?.id||null;selectedElementId=null;selectedElementScope=null;calendarEditing=false;history=[];future=[];render();
   const page=el('page');if(!page)return;const clone=page.cloneNode(true);clone.removeAttribute('id');clone.classList.add('library-thumb-render');clone.querySelectorAll('.editor-only,.non-output,.s2-selection-toolbar,.s2-key-hint').forEach(node=>node.remove());host.innerHTML='';host.appendChild(clone);host.dataset.rendered='true';
  }catch(error){host.innerHTML='<span class="thumbnail-placeholder">미리보기를 만들 수 없습니다.</span>';console.warn('Template thumbnail failed',record.id,error)}
  finally{if(original){project=original.project;selectedPageId=original.selectedPageId;selectedElementId=original.selectedElementId;selectedElementScope=original.selectedElementScope;calendarEditing=original.calendarEditing;history=original.history;future=original.future;if(project)render()}}
 }
 function hydrateThumbnails(list){list.forEach(record=>{const host=document.querySelector(`[data-library-thumbnail="${CSS.escape(record.id)}"]`);renderActualThumbnail(record,host)})}
 function renderLibrary(filter='all'){
  ensureTypeOptions();renderTypeFilters();
  const edition=el('libraryEditionFilter')?.value||'all';const list=records().filter(record=>(filter==='all'||record.state===filter)&&(activeTypeFilter==='all'||record.type===activeTypeFilter)&&(edition==='all'||String(record.edition)===edition));
  const grid=el('templateLibraryGrid');if(!grid)return;grid.innerHTML=list.length?list.map(cardMarkup).join(''):`<div class="library-empty-state"><strong>${activeTypeFilter==='all'?'등록된 템플릿이 없습니다.':`${escape(label(activeTypeFilter))}에 등록된 템플릿이 없습니다.`}</strong><p>새 템플릿을 만들어 보세요.</p></div>`;
  grid.querySelectorAll('[data-library-edit],[data-library-use]').forEach(button=>button.addEventListener('click',()=>openDesignerProjectFromRecord(records().find(record=>record.id===button.dataset.libraryEdit||record.id===button.dataset.libraryUse))));
  grid.querySelectorAll('[data-library-copy]').forEach(button=>button.addEventListener('click',()=>{const source=records().find(record=>record.id===button.dataset.libraryCopy);if(!source)return;saveRecords([...records(),{...source,id:`tpl-${Date.now()}`,name:`${source.name} 복사본`,state:'draft',status:'draft',updatedAt:new Date().toISOString()}]);renderLibrary(filter)}));
  grid.querySelectorAll('[data-library-state-change]').forEach(button=>button.addEventListener('click',()=>{const list=records(),record=list.find(item=>item.id===button.dataset.libraryStateChange);if(!record)return;const seq=['draft','published','archived'];record.state=seq[(seq.indexOf(record.state)+1)%seq.length];record.status=record.state;record.updatedAt=new Date().toISOString();saveRecords(list);renderLibrary(filter);renderUserTemplateChoices()}));
  hydrateThumbnails(list);
 }
 function renderUserChoices(){
  const grid=el('userTemplateChoiceGrid');if(!grid)return;const selectedType=selectedCalendarType;const list=records().filter(record=>record.type===selectedType&&record.state==='published').sort((a,b)=>String(b.updatedAt).localeCompare(String(a.updatedAt)));
  grid.innerHTML=list.length?list.map((record,index)=>`<button class="template-choice ${index===0?'selected':''}" data-user-library-id="${escape(record.id)}" data-user-template="${escape(record.template)}" data-user-type="${escape(record.type)}" data-state="published"><div class="template-preview" data-library-thumbnail="${escape(record.id)}"><span class="thumbnail-placeholder">템플릿 미리보기</span></div><div class="template-card-topline"><strong>${escape(record.name)}</strong><span class="edition-badge">${record.edition} Edition</span></div><small class="template-description">${escape(record.description)}</small><div class="template-tags"><span>${escape(label(record.type))}</span>${(record.features||[]).slice(0,2).map(item=>`<span>${escape(item)}</span>`).join('')}</div></button>`).join(''):`<div class="library-empty-state user-empty"><strong>현재 준비 중인 유형입니다.</strong><p>게시된 템플릿이 없습니다.</p></div>`;
  grid.querySelectorAll('[data-user-template]').forEach(button=>button.addEventListener('click',()=>{grid.querySelectorAll('[data-user-template]').forEach(item=>item.classList.remove('selected'));button.classList.add('selected');selectedUserTemplate={template:button.dataset.userTemplate,type:button.dataset.userType,libraryId:button.dataset.userLibraryId};renderUserSizeOptions()}));
  hydrateThumbnails(list);
 }
 window.v22Library=()=>records();window.v22SaveLibrary=saveRecords;window.v22StateLabel=state=>state==='published'?'게시됨':state==='archived'?'보관됨':'초안';
 window.renderTemplateLibrary=renderLibrary;renderTemplateLibrary=renderLibrary;
 window.renderUserTemplateChoices=renderUserChoices;renderUserTemplateChoices=renderUserChoices;
 window.applyCalendarType=type=>{oldApplyType(type);selectedCalendarType=type;el('selectedTypeLabel')&&(el('selectedTypeLabel').textContent=label(type));renderTypeChoices();renderUserChoices()};applyCalendarType=window.applyCalendarType;
 window.ACDLTemplateCatalog={allTypes,records,typeMeta,renderTypeChoices,renderTypeFilters};
 ensureTypeOptions();renderTypeChoices();renderTypeFilters();renderUserChoices();
 document.querySelectorAll('[data-library-filter]').forEach(button=>button.addEventListener('click',()=>setTimeout(()=>renderLibrary(button.dataset.libraryFilter),0)));
 el('libraryEditionFilter')?.addEventListener('change',()=>renderLibrary(document.querySelector('[data-library-filter].active')?.dataset.libraryFilter||'all'));
 document.querySelectorAll('#designerHomeLibrary,#libraryBtn').forEach(button=>button.addEventListener('click',()=>setTimeout(()=>renderLibrary('all'),0)));
 document.querySelector('#saveTemplateState')?.replaceChildren(...['draft','published','archived'].map(state=>Object.assign(document.createElement('option'),{value:state,textContent:state==='published'?'게시됨':state==='archived'?'보관됨':'초안'})));
 document.querySelector('#closeTemplateLibraryBtn')?.addEventListener('click',()=>setTimeout(()=>{renderTypeChoices();renderUserChoices()},0));
})();