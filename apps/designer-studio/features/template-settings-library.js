"use strict";

function calendarTypeDefinitionFor(type){return window.ACDLTemplateTypeRules?.definition?.(type)||({desk:{frontInsert:true,rearInsert:true},wall:{frontInsert:true,rearInsert:false},poster:{frontInsert:false,rearInsert:false},postcard:{frontInsert:true,rearInsert:true}}[type]||{})}
function fillInsertCountOptions(input,value){input.innerHTML=Array.from({length:6},(_,i)=>`<option value="${i}" ${Number(value)===i?"selected":""}>${i}장</option>`).join("")}
function applyResourceTypeRules(){const type=project?.productType?.category;if(!type)return;const d=calendarTypeDefinitionFor(type);[['resourceFrontInsertField','resourceFrontInserts',d.frontInsert!==false,'이 달력 유형은 앞 간지를 지원하지 않습니다.'],['resourceRearInsertField','resourceRearInserts',d.rearInsert!==false,'이 달력 유형은 뒤 간지를 지원하지 않습니다.']].forEach(([fieldId,inputId,enabled,message])=>{const field=el(fieldId),input=el(inputId);if(!field||!input)return;input.disabled=!enabled;if(!enabled)input.value='0';field.classList.toggle('type-rule-disabled',!enabled);const note=field.querySelector('.type-rule-note');if(note)note.textContent=enabled?'':message});el('resourceAdjacentMini').disabled=type==='poster';if(type==='poster')el('resourceAdjacentMini').checked=false}
function renderResourceThumbnailPreview(){const host=el('resourceThumbnailPreview'),thumb=project?.template?.thumbnail;if(!host)return;if(thumb?.kind==='upload'&&thumb.dataUrl){host.innerHTML=`<img src="${thumb.dataUrl}" alt="등록된 템플릿 대표 이미지">`}else host.innerHTML='등록된 대표 이미지가 없습니다.<br>표지 또는 전체 페이지를 자동 표시합니다.';el('removeResourceThumbnailBtn').disabled=!(thumb?.kind==='upload'&&thumb.dataUrl)}
const TEMPLATE_INPUT_DEFINITIONS=[
 {path:"school.name",label:"학교명",input:"text",defaultStage:"project-create-required"},
 {path:"calendar.year",label:"학사연도",input:"year",defaultStage:"project-create-required"},
 {path:"calendar.events",label:"학사일정",input:"schedule-import",defaultStage:"project-create-required"},
 {path:"school.profile.building",label:"표지·학교 전경 사진",input:"image",slot:"cover-photo",defaultStage:"project-create-required"},
 {path:"school.profile.logo",label:"교표",input:"image",slot:"school-symbol",defaultStage:"project-create-required"},
 {path:"school.contacts",label:"학교 연락처",input:"contact",defaultStage:"project-create-required"},
 {path:"school.profile.flower",label:"교화",input:"school-symbol",defaultStage:"optional"},
 {path:"school.profile.tree",label:"교목",input:"school-symbol",defaultStage:"optional"},
 {path:"school.profile.motto",label:"교훈",input:"text",defaultStage:"optional"},
 {path:"school.profile.song",label:"교가",input:"image",defaultStage:"optional"},
 {path:"monthlyImages",label:"월별 사진",input:"image-collection",slot:"monthly-photo",defaultStage:"optional"}
];
function defaultTemplateInputRequirements(){return TEMPLATE_INPUT_DEFINITIONS.map(item=>({path:item.path,stage:item.defaultStage,label:item.label,input:item.input,...(item.slot?{slot:item.slot}:{}),...(item.defaultStage==="optional"?{fallback:"sample"}:{})}))}
function inputRequirementStage(path){const item=(project.template.publishing?.dataRequirements||[]).find(candidate=>candidate.path===path);return item?.stage||"unused"}
function populateInputContractForm(){const grid=el("resourceInputContractGrid");if(!grid)return;grid.innerHTML=TEMPLATE_INPUT_DEFINITIONS.map(item=>{const stage=inputRequirementStage(item.path);return `<label class="input-contract-row"><span><strong>${item.label}</strong><code>${item.path}</code></span><select data-input-requirement-path="${item.path}"><option value="project-create-required" ${stage==="project-create-required"?"selected":""}>필수</option><option value="optional" ${stage==="optional"?"selected":""}>선택 · 샘플 유지</option><option value="unused" ${stage==="unused"?"selected":""}>사용 안 함</option></select></label>`}).join("")}
function collectInputContractRequirements(){return TEMPLATE_INPUT_DEFINITIONS.flatMap(item=>{const stage=document.querySelector(`[data-input-requirement-path="${item.path}"]`)?.value||"unused";if(stage==="unused")return [];return [{path:item.path,stage,label:item.label,input:item.input,...(item.slot?{slot:item.slot}:{}),...(stage==="optional"?{fallback:"sample"}:{})}]})}
function populateResourceBasicForm(){if(!project)return;normalizeElementData();const m=project.template.metadata;el("resourceTemplateName").value=m.name||"";el("resourceTemplateDescription").value=m.description||"";el("resourceTemplateAuthor").value=m.author||"";el("resourceTemplateVersion").value=m.version||"1.0.0";el("resourceTemplateLanguage").value=m.language||"ko-KR";el("resourceProductType").value=project.productType.category;el("resourceCalendarYear").value=project.settings.year;el("resourceWeekStart").value=project.settings.weekStart||"sunday";el("resourceCalendarRows").value=String(project.settings.calendarRows||6);el("resourcePageSize").value=`${project.productType.pageSize.width} × ${project.productType.pageSize.height} ${project.productType.pageSize.unit||"mm"}`;el("resourceStartMonth").innerHTML=Array.from({length:12},(_,i)=>`<option value="${i+1}" ${Number(project.settings.startMonth)===i+1?"selected":""}>${i+1}월</option>`).join("");fillInsertCountOptions(el('resourceFrontInserts'),project.settings.frontInsertCount||0);fillInsertCountOptions(el('resourceRearInserts'),project.settings.rearInsertCount||0);el('resourceAdjacentMini').checked=project.settings.showAdjacentMiniCalendars!==false;const calendarData=project.settings.calendarData||{};el('resourceIncludeHolidays').checked=calendarData.includeHolidays!==false;el('resourceIncludeAnniversaries').checked=calendarData.includeAnniversaries!==false;el('resourceIncludeSolarTerms').checked=calendarData.includeSolarTerms!==false;el('resourceIncludeLunar').checked=calendarData.includeLunar!==false;renderResourceThumbnailPreview();populateInputContractForm();applyResourceTypeRules()}
function pageTransferKey(page,index,monthlyIndexes){if(page.role?.startsWith('monthly-'))return `${page.role}:${monthlyIndexes.get(page.id)}`;return `${page.role}:${page.insertIndex||0}:${page.side||'front'}`}
function rebuildProjectFromBasicSettings(next){const previous=project,type=previous.productType.category,presetId=previous.settings.sizePreset?.id||(SIZE_PRESETS[type]||[])[0]?.id;const rebuilt=makeProject({type,year:next.year,startMonth:next.startMonth,template:previous.template?.preset||previous.settings.template||'school-basic',frontInsertCount:next.frontInsertCount,rearInsertCount:next.rearInsertCount,calendarRows:next.calendarRows,weekStart:next.weekStart,showAdjacentMiniCalendars:next.showAdjacentMiniCalendars,posterColumns:previous.settings.posterColumns||4,sizePresetId:presetId});const monthlyOrdinal=pages=>{const map=new Map(),counts={};pages.forEach(page=>{if(!page.role?.startsWith('monthly-'))return;const role=page.role;map.set(page.id,counts[role]||0);counts[role]=(counts[role]||0)+1});return map},oldOrd=monthlyOrdinal(previous.book.pageInstances||[]),newOrd=monthlyOrdinal(rebuilt.book.pageInstances||[]),oldByKey=new Map((previous.book.pageInstances||[]).map(page=>[pageTransferKey(page,0,oldOrd),page]));rebuilt.template=previous.template;rebuilt.mode=previous.mode;rebuilt.book.school=previous.book.school;rebuilt.book.events=previous.book.events;rebuilt.book.monthlyQuotes=structuredClone(previous.book.monthlyQuotes||{});rebuilt.book.scheduleImport=previous.book.scheduleImport;rebuilt.book.calendarReference=structuredClone(previous.book.calendarReference||{schemaVersion:'calendar-reference.v1',years:{}});rebuilt.settings.calendarData=structuredClone(next.calendarData||previous.settings.calendarData||{});rebuilt.book.elementsByPage={};rebuilt.book.pageInstances.forEach(page=>{const old=oldByKey.get(pageTransferKey(page,0,newOrd));if(!old)return;page.overrides=structuredClone(old.overrides||{});const elements=previous.book.elementsByPage?.[old.id];if(elements)rebuilt.book.elementsByPage[page.id]=structuredClone(elements)});rebuilt.book.coverElementsInitialized={};rebuilt.book.posterElementsInitialized={};project=rebuilt;selectedPageId=project.book.pageInstances[0]?.id||null;selectedElementId=null;selectedElementScope=null}
function populateSchoolResourceForm(){if(!project)return;ensureSchoolProfile();const school=project.book.school||{};el("resourceSchoolName").value=school.name||"";el("resourceSchoolEnglishName").value=school.englishName||"";el("resourceSchoolMotto").value=school.profile?.motto?.description||"";el("resourceSchoolSlogan").value=school.slogan||"";el("resourceSchoolAddress").value=school.address||"";el("resourceSchoolPhone").value=school.phone||"";el("resourceSchoolFax").value=school.fax||"";el("resourceSchoolWebsite").value=school.website||"";el("resourceSchoolSong").value=school.profile?.song?.description||""}

const FONT_OPTIONS=["Arial","Noto Sans KR","Pretendard","Nanum Gothic","Nanum Myeongjo","Malgun Gothic","Georgia","Times New Roman"];
function bindColorPair(colorId,textId){const c=el(colorId),t=el(textId);if(!c||!t)return;c.oninput=()=>t.value=c.value;t.oninput=()=>{if(/^#[0-9a-f]{6}$/i.test(t.value))c.value=t.value}}
function populateColorThemeForm(){ensureTemplateResources();const c=project.template.resources.colorTheme;[["Primary","primary"],["Secondary","secondary"],["Accent","accent"],["Holiday","holiday"],["Weekend","weekend"],["Background","background"],["Line","line"]].forEach(([id,k])=>{el(`themeColor${id}`).value=c[k];el(`themeColor${id}Text`).value=c[k];bindColorPair(`themeColor${id}`,`themeColor${id}Text`)})}
function populateFontThemeForm(){ensureTemplateResources();const f=project.template.resources.fontTheme;["Title","Body","Calendar","Event"].forEach(id=>{const sel=el(`themeFont${id}`);sel.innerHTML=FONT_OPTIONS.map(v=>`<option value="${v}">${v}</option>`).join("");sel.value=f[id.toLowerCase()]||"Arial"});el("themeFontFallback").value=f.fallback||'"Noto Sans KR", sans-serif';updateFontPreview()}
function updateFontPreview(){const box=el("fontThemePreview");if(!box)return;box.querySelector("strong").style.fontFamily=`${el("themeFontTitle").value}, ${el("themeFontFallback").value}`;box.querySelector("p").style.fontFamily=`${el("themeFontBody").value}, ${el("themeFontFallback").value}`}
function populateMasterManager(){ensureTemplateResources();const m=project.template.masters;el("masterSettingMonthTitle").value=m.calendar.monthTitleSize;el("masterSettingCoverTitle").value=m.cover.titleSize;el("masterSettingMaxEvents").value=m.calendar.eventMaxVisiblePerDay;el("masterSettingAdjacent").value=String(m.calendar.showAdjacentMonths!==false);el("masterSettingRange").value=String(m.calendar.rangeEventStyle?.enabled!==false);const roles=[['cover','표지 Master'],['front-insert','앞 간지 Master'],['monthly-front','월력 앞면 Master'],['monthly-back','월력 뒷면 Master'],['rear-insert','뒤 간지 Master'],['back-cover','뒷표지 Master'],['poster-annual','벽보 Master']];el("masterManagerList").innerHTML=roles.map(([key,label])=>{const pages=project.book.pageInstances.filter(p=>p.role.includes(key)||p.masterId?.includes(key));return `<div class="master-row"><div><strong>${label}</strong><small>${pages.length}개 페이지에서 사용</small></div><button class="secondary" data-open-master="${key}" ${pages.length?'':'disabled'}>편집 화면 열기</button></div>`}).join("");el("masterManagerList").querySelectorAll('[data-open-master]').forEach(b=>b.onclick=()=>{const key=b.dataset.openMaster,p=project.book.pageInstances.find(x=>x.role.includes(key)||x.masterId?.includes(key));if(p){selectedPageId=p.id;closeResourceModal();render();showEditorToast(`${b.parentElement.querySelector('strong').textContent} 페이지를 열었습니다.`)}})}
function populateEventCategories(){ensureTemplateResources();const list=el("eventCategoryList");list.innerHTML=project.template.resources.eventCategories.map((c,i)=>`<div class="category-row"><div class="category-edit-grid" style="grid-template-columns:1.2fr 70px 80px auto;width:100%"><label>분류명<input data-cat-name="${i}" value="${c.name}"></label><label>색상<input data-cat-color="${i}" type="color" value="${c.color}"></label><label>우선순위<input data-cat-priority="${i}" type="number" min="0" max="100" value="${c.priority||50}"></label><button class="danger" data-delete-category="${i}">삭제</button></div></div>`).join("");list.querySelectorAll('[data-delete-category]').forEach(b=>b.onclick=()=>{project.template.resources.eventCategories.splice(Number(b.dataset.deleteCategory),1);populateEventCategories()})}
function syncEventCategoryForm(){document.querySelectorAll('[data-cat-name]').forEach(n=>{const i=Number(n.dataset.catName),c=project.template.resources.eventCategories[i];if(c){c.name=n.value;c.color=document.querySelector(`[data-cat-color="${i}"]`).value;c.priority=Number(document.querySelector(`[data-cat-priority="${i}"]`).value)}})}
function populateExportSettings(){ensureTemplateResources();const e=project.template.resources.exportSettings;el("exportFormat").value=e.format;el("exportDpi").value=String(e.dpi);el("exportBleed").value=e.bleed;el("exportCropMarks").value=String(e.cropMarks);el("exportColorMode").value=e.colorMode;el("exportPageRange").value=e.pageRange;el("exportImageQuality").value=e.imageQuality;el("exportGuides").value=String(e.guides);updateExportSummary()}
function updateExportSummary(){const box=el("exportSettingsSummary");if(!box)return;box.innerHTML=`<strong>저장될 출력 프로필</strong><br>${el("exportFormat").value.toUpperCase()} · ${el("exportDpi").value} DPI · 도련 ${el("exportBleed").value}mm · 재단선 ${el("exportCropMarks").value==='true'?'표시':'숨김'} · ${el("exportColorMode").value.toUpperCase()} · ${el("exportPageRange").value==='all'?'전체 페이지':'현재 페이지'}`}
function closeResourceModal(){if(newTemplateSetupInProgress){returnToNewTemplateProductSetup();return}document.body.classList.remove("resource-modal-open");el("resourceModal").classList.add("hidden")}

const v22DefaultLibrary=[];
function normalizeLibraryRecord(t){
 const type=typeof t?.type==="string"?t.type:(t?.type?.category||"desk");
 return {...t,type,edition:Number(t?.edition)||2027,state:t?.state||"draft",template:t?.template||"school-basic"};
}
function v22Library(){
 let saved=[];
 try{const x=JSON.parse(localStorage.getItem("acdl-template-library-v22")||"[]");saved=Array.isArray(x)?x:[]}catch(_){saved=[]}
 const merged=new Map(v22DefaultLibrary.map(t=>[t.id,normalizeLibraryRecord(t)]));
 saved.map(normalizeLibraryRecord).forEach(t=>merged.set(t.id,t));
 return [...merged.values()];
}
function v22SaveLibrary(list){const metadata=list.map(t=>{const x=normalizeLibraryRecord(t);delete x.projectData;return x});localStorage.setItem("acdl-template-library-v22",JSON.stringify(metadata))}
const ACDL_DB_NAME="acdl-template-storage-v25",ACDL_STORE="templates";
const templateProjectDatabase=window.ACDLPersistenceIndexedDB.createDatabase(indexedDB,{databaseName:ACDL_DB_NAME,version:1,stores:{[ACDL_STORE]:{keyPath:"id"}}});
function openTemplateDb(){return templateProjectDatabase.open()}
async function saveTemplateProjectData(id,data){await templateProjectDatabase.put(ACDL_STORE,{id,data,updatedAt:new Date().toISOString()});return true}
async function loadTemplateProjectData(id,{onProgress}={}){
 if(id===undefined||id===null||id==='')return null;
 onProgress?.({phase:'local',completed:0,total:1});
 const local=(await templateProjectDatabase.get(ACDL_STORE,id))?.data,remote=window.ACDLTemplateRemotePersistence,isRemoteId=/^[0-9a-f-]{36}$/i.test(String(id));onProgress?.({phase:'local',completed:1,total:1});
 const loader=window.ACDLTemplateProjectLoader;
 const prepare=data=>loader.prepare(data,{hydrate:remote?.isRemote?.()?remote.hydrateProjectData:null,migrate:window.ACDLProjectDocument?.migrateProject,assertIntegrity:remote?.assertAIDesignIntegrity,onProgress});
 if(!remote?.isRemote?.()||!isRemoteId)return local?prepare(local):null;
 try{const result=await remote.load(id,{onProgress,deferAssets:true}),data=result?.version?.storedProjectData||result?.version?.projectData;if(!data)throw new Error("원격 템플릿에 저장된 문서가 없습니다.");onProgress?.({phase:'validate',completed:0,total:1});const prepared=await loader.prepare(data,{hydrate:remote.hydrateProjectData,migrate:window.ACDLProjectDocument?.migrateProject,assertIntegrity:remote.assertAIDesignIntegrity,onProgress,allowAssetFallback:true});await saveTemplateProjectData(id,data);onProgress?.({phase:'validate',completed:1,total:1});return prepared}catch(error){console.warn("원격 템플릿 불러오기 실패",error);if(local){try{onProgress?.({phase:'recovery',completed:0,total:1});const recovered=await loader.prepare(local,{hydrate:remote?.isRemote?.()?remote.hydrateProjectData:null,migrate:window.ACDLProjectDocument?.migrateProject,assertIntegrity:remote?.assertAIDesignIntegrity,onProgress,allowAssetFallback:true});onProgress?.({phase:'recovery',completed:1,total:1});showEditorToast?.("원격 저장본을 불러오지 못해 이 브라우저의 최근 복구본을 열었습니다.");return recovered}catch(localError){console.warn("로컬 템플릿 복구본도 불완전합니다.",localError)}}throw error}
}
async function refreshRemoteTemplateLibrary(){
 const remote=window.ACDLTemplateRemotePersistence;if(!remote?.isRemote?.())return false;
 try{const remoteRecords=await remote.list(),current=v22Library().filter(item=>item.source!=="catalog"),remoteIds=new Set(remoteRecords.map(item=>item.id)),remoteKeys=new Set(remoteRecords.map(item=>item.stableKey)),localOnly=current.filter(item=>!remoteIds.has(item.id)&&!remoteKeys.has(item.stableKey));v22SaveLibrary([...remoteRecords,...localOnly]);renderTemplateLibrary?.("all");return true}
 catch(error){console.warn("원격 템플릿 목록 동기화 실패",error);showEditorToast?.(error?.message||"원격 템플릿 목록을 불러오지 못했습니다.");return false}
}
window.refreshRemoteTemplateLibrary=refreshRemoteTemplateLibrary;
function v22StateLabel(state){return {draft:"초안",ready:"검토 완료",published:"배포중",archived:"종료"}[state]||state}
function updateRoleIndicator(){const box=el("roleIndicator"),text=el("roleIndicatorText");if(!box||!text)return;const user=appMode==="user";box.classList.toggle("user",user);text.textContent=user?"Calendar Workspace · 사용자 편집기":"Designer Studio · 디자이너 편집기"}

async function openDesignerProjectFromRecord(t){
 if(!t)return;
 const openProgress=window.ACDLTemplateOpenProgress;openProgress?.start?.('edit',t.name);
 const transitionId=beginProjectTransition({clearProject:false});
 appMode="designer";
 document.body.classList.remove("user-mode");
 el("entryScreen").classList.add("hidden");
 el("setup").classList.add("hidden");
 el("userSetup").classList.add("hidden");
 let nextProject=null;
 try{if(t.projectData){const data=typeof t.projectData==="string"?JSON.parse(t.projectData):t.projectData,remote=window.ACDLTemplateRemotePersistence;nextProject=await window.ACDLTemplateProjectLoader.prepare(data,{hydrate:remote?.isRemote?.()?remote.hydrateProjectData:null,migrate:window.ACDLProjectDocument?.migrateProject,assertIntegrity:remote?.assertAIDesignIntegrity,onProgress:detail=>openProgress?.update?.(detail)})}else if(t.id){const stored=await loadTemplateProjectData(t.id,{onProgress:detail=>openProgress?.update?.(detail)});if(stored)nextProject=structuredClone(stored)}else throw new Error('불러올 템플릿 식별자와 문서가 없습니다.')}catch(error){openProgress?.fail?.(error);throw error}
 if(!isCurrentProjectTransition(transitionId))return;
 project=nextProject;
 if(!project){
  const type=t.type||"desk",preset=(SIZE_PRESETS[type]||SIZE_PRESETS.desk).find(x=>x.recommended)||(SIZE_PRESETS[type]||SIZE_PRESETS.desk)[0];
  project=makeProject({type,year:Number(t.edition)||2027,startMonth:3,template:t.packageVersion?"school-basic":t.template||"school-basic",frontInsertCount:t.packageVersion?0:1,rearInsertCount:0,calendarRows:t.packageVersion?5:6,weekStart:"sunday",showAdjacentMiniCalendars:true,posterColumns:4,sizePresetId:preset.id});
  if(t.packageVersion){
   try{project=await window.ACDLPackageProjectAdapter.loadAndApply(project,t.packageBase)}catch(error){console.error("Template Package project load failed",error);project=null;showEditorToast(`${t.name} Package를 불러오지 못했습니다.`);return}
   if(!isCurrentProjectTransition(transitionId))return;
  }
 }
 project.template ||= {};
 project.template.id=t.id;
 if(t.remoteId||/^[0-9a-f-]{36}$/i.test(String(t.id))){
  project.template.remoteId=t.remoteId||t.id;
  project.template.remoteStableKey=t.stableKey||project.template.remoteStableKey||t.id;
  project.template.remoteVersionNumber=Number(t.version)||Number(project.template.remoteVersionNumber)||0;
 }
 project.template.librarySource=t.source||project.template.librarySource||"local";
 project.template.derivedFromPackage=t.derivedFromPackage||project.template.derivedFromPackage||null;
 project.template.preset=t.template||project.settings?.template||"school-basic";
 project.template.metadata={...(project.template.metadata||{}),name:t.name,description:t.description||"",edition:Number(t.edition)||2027,state:t.state||"draft"};
 selectedPageId=project.book.pageInstances[0]?.id||null;selectedElementId=null;selectedElementScope=null;history=[];future=[];
 el("appBrand").childNodes[0].nodeValue="우리학교인쇄 CALENDAR EDITOR ";el("newBtn").textContent="새 템플릿";el("saveBtn").textContent="템플릿 저장";el("templateMode").textContent="템플릿 설계";el("modeHelp").textContent="샘플 콘텐츠, 데이터 연결, 위치와 스타일을 한 화면에서 설계합니다.";
 el("templateLibraryModal").classList.add("hidden");
 openProgress?.update?.({phase:'render',completed:0,total:1});setEditorContext("템플릿 라이브러리");stable();render();updateRoleIndicator();
 if(project.template?.assetRecovery?.status==='pending')showEditorToast('페이지는 복원했습니다. AI 이미지는 다시 불러오는 중입니다.');
 const openedProject=project;
 requestAnimationFrame(()=>requestAnimationFrame(()=>{if(isCurrentProjectTransition(transitionId)&&project===openedProject)render()}));
 openProgress?.complete?.();showEditorToast(`${t.name} ${t.edition} Edition 편집을 시작했습니다.`);
}
function closeTemplateLibrary(){
 el("templateLibraryModal")?.classList.add("hidden");
 if(appMode!=="designer")return;
 el("entryScreen")?.classList.add("hidden");
 el("userSetup")?.classList.add("hidden");
 if(project){
  el("designerHome")?.classList.add("hidden");
  el("setup")?.classList.add("hidden");
  updateRoleIndicator();
  render();
 }else if(!el("setup")?.classList.contains("hidden")){
  el("designerHome")?.classList.add("hidden");
 }else{
  el("designerHome")?.classList.add("hidden");
  el("entryScreen")?.classList.remove("hidden");
 }
}

function ensureV22Metadata(){
 if(!project)return;
 project.template ||= {};
 project.template.metadata ||= {};
 project.template.metadata.edition ??= project.settings?.year || 2027;
 project.template.metadata.state ??= "draft";
 project.template.metadata.isStandard ??= false;
 project.template.metadata.name ??= "새 템플릿";
 project.template.metadata.description ??= "";
}

function renderUserTemplateChoices(){
 const grid=el("userTemplateChoiceGrid");if(!grid)return;
 const published=v22Library().filter(t=>t.state==="published").sort((a,b)=>Number(b.edition)-Number(a.edition));
 grid.innerHTML=published.map(t=>`<button type="button" class="template-choice ${t.type!==selectedCalendarType?"hidden-by-type":""}" data-user-library-id="${t.id}" data-user-template="${t.template}" data-user-type="${t.type}" data-state="${t.state}"><div class="template-preview"></div><div class="template-card-topline"><strong>${v21Escape(t.name)}</strong><span class="edition-badge">${t.edition} Edition</span></div><small class="template-description">${v21Escape(t.description||"")}</small><div class="template-tags"><span>${t.type==="desk"?"탁상형":t.type==="wall"?"벽걸이형":"포스터형"}</span><span>배포중</span></div></button>`).join("")||`<p>현재 배포중인 템플릿이 없습니다.</p>`;
 grid.querySelectorAll("[data-user-template]").forEach(btn=>btn.addEventListener("click",()=>{grid.querySelectorAll("[data-user-template]").forEach(x=>x.classList.remove("selected"));btn.classList.add("selected");selectedUserTemplate={template:btn.dataset.userTemplate,type:btn.dataset.userType,libraryId:btn.dataset.userLibraryId};renderUserSizeOptions();updateWizardActions()}));
 if(selectedCalendarType)applyCalendarType(selectedCalendarType);else updateWizardActions();
}
updateRoleIndicator();renderUserTemplateChoices();updateWizardActions();

// v23 school profile, schedule import and designer navigation enhancements
