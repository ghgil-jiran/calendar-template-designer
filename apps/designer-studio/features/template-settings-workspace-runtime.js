(function(){
  const $=id=>document.getElementById(id);
  const clone=v=>typeof structuredClone==='function'?structuredClone(v):JSON.parse(JSON.stringify(v));
  let editingExistingCalendar=false;

  function isPosterUser(){return (window.selectedCalendarType||window.selectedUserTemplate?.type)==='poster'}
  function markPosterSpecificFields(){
    const ids=['userFrontInserts','userRearInserts','userAdjacentMini','userStartMonth'];
    ids.forEach(id=>{const node=$(id);if(node){const label=node.closest('label');if(label)label.dataset.posterIrrelevant='true'}});
  }
  function refreshUserOptionVisibility(){
    markPosterSpecificFields();
    document.querySelectorAll('#userSetup [data-poster-irrelevant="true"]').forEach(n=>n.classList.toggle('user-poster-hidden',isPosterUser()));
  }
  const oldApplyCalendarType=window.applyCalendarType;
  window.applyCalendarType=function(type){const r=oldApplyCalendarType?.apply(this,arguments);setTimeout(refreshUserOptionVisibility,0);return r};

  function emptyProfile(){return {school:{name:'',englishName:'',slogan:'',address:'',website:'',motto:'',song:'',contacts:[{label:'교무실',phone:'',fax:''},{label:'행정실',phone:'',fax:''}]},images:{building:'',logo:'',flower:'',tree:'',song:'',customAssets:[]}}}
  function readProfile(){try{return JSON.parse(localStorage.getItem('acdl.user.schoolProfile')||'null')}catch(_){return null}}
  function writeProfile(){
    try{
      const profile={school:{name:$('userSchoolName')?.value.trim()||'',englishName:$('userSchoolEnglishName')?.value.trim()||'',slogan:$('userSchoolSlogan')?.value.trim()||'',address:$('userSchoolAddress')?.value.trim()||'',website:$('userSchoolWebsite')?.value.trim()||'',motto:$('userSchoolMotto')?.value.trim()||'',song:$('userSchoolSong')?.value.trim()||'',contacts:typeof readContacts==='function'?readContacts($('userContactEditor')):[]},images:clone(window.userImages||{})};
      localStorage.setItem('acdl.user.schoolProfile',JSON.stringify(profile));
    }catch(err){console.warn('학교 프로필 저장 실패',err)}
  }
  function fillProfile(profile){
    profile=profile||emptyProfile();const s=profile.school||{};
    [['userSchoolName','name'],['userSchoolEnglishName','englishName'],['userSchoolSlogan','slogan'],['userSchoolAddress','address'],['userSchoolWebsite','website'],['userSchoolMotto','motto'],['userSchoolSong','song']].forEach(([id,k])=>{if($(id))$(id).value=s[k]||''});
    if(typeof fillContactEditor==='function'&&$('userContactEditor'))fillContactEditor($('userContactEditor'),s.contacts||emptyProfile().school.contacts);
    window.userImages=Object.assign({building:'',logo:'',flower:'',tree:'',song:'',customAssets:[]},clone(profile.images||{}));
    const previews={building:'userBuildingPreview',logo:'userLogoPreview',flower:'userFlowerPreview',tree:'userTreePreview',song:'userSongImagePreview'};
    Object.entries(previews).forEach(([k,id])=>{const n=$(id);if(n)n.innerHTML=window.userImages[k]?`<img src="${window.userImages[k]}" alt="${k}">`:'이미지 미등록'});
    window.renderUserCustomAssets?.();
  }
  function projectToProfile(){
    const s=project?.book?.school||{},p=s.profile||{};
    return {school:{name:s.name||'',englishName:s.englishName||'',slogan:s.slogan||'',address:s.address||'',website:s.website||'',motto:p.motto?.description||'',song:p.song?.description||'',contacts:clone(s.contacts||[])},images:{building:p.building?.image||'',logo:p.logo?.image||'',flower:p.flower?.image||'',tree:p.tree?.image||'',song:p.song?.image||'',customAssets:clone(s.customAssets||[])}};
  }
  const oldEnterUser=window.enterUser;
  window.enterUser=function(){const r=oldEnterUser?.apply(this,arguments);setTimeout(()=>{fillProfile(readProfile()||emptyProfile());refreshUserOptionVisibility()},0);return r};

  const scheduleCard=$('userScheduleInput')?.closest('.school-profile-section');
  if(scheduleCard&&!scheduleCard.querySelector('.schedule-sample-notice')){
    const n=document.createElement('div');n.className='schedule-sample-notice';n.innerHTML='<strong>일정을 입력하지 않으면 빈 일정으로 시작합니다.</strong><br>템플릿 선택 화면의 일정은 디자인 확인용 샘플이며 실제 달력에는 자동으로 포함되지 않습니다.';scheduleCard.insertBefore(n,scheduleCard.firstChild.nextSibling);
  }

  const oldApplyUserSchoolData=window.applyUserSchoolData;
  window.applyUserSchoolData=function(){
    oldApplyUserSchoolData?.apply(this,arguments);
    if(!project?.book)return;
    const imported=window.userScheduleImport?.events||[];
    project.book.events=imported.length?clone(imported):[];
    project.book.scheduleImport=window.userScheduleImport||null;
    writeProfile();
  };

  function syncWizardFromProject(){
    if(!project)return;
    selectedCalendarType=project.productType?.category||project.settings?.type||'desk';
    selectedUserTemplate={template:project.template?.id?.replace(/^template\./,'')||'school-basic',type:selectedCalendarType,libraryId:project.template?.sourceTemplateId||null};
    if($('userYear'))$('userYear').value=project.settings?.year||new Date().getFullYear();
    if($('userStartMonth'))$('userStartMonth').value=project.settings?.startMonth||1;
    if($('userCalendarRows'))$('userCalendarRows').value=project.settings?.calendarRows||6;
    if($('userWeekStart'))$('userWeekStart').value=project.settings?.weekStart||'sunday';
    if($('userAdjacentMini'))$('userAdjacentMini').checked=project.settings?.showAdjacentMiniCalendars!==false;
    fillProfile(projectToProfile());
    window.userScheduleImport=project.book.scheduleImport||null;
    applyCalendarType(selectedCalendarType);
    refreshUserOptionVisibility();
  }

  $('templateSettingsBtn')?.addEventListener('click',e=>{
    if(project?.mode!=='calendar-workspace')return;
    e.preventDefault();e.stopImmediatePropagation();
    editingExistingCalendar=true;syncWizardFromProject();
    $('userSetup')?.classList.remove('hidden');
    if(typeof setUserWizardStep==='function')setUserWizardStep(3);
    $('userCreateBtn').textContent='설정 적용';
  },true);

  const oldCreate=window.createCalendarV28||window.createUserCalendar;
  $('userCreateBtn')?.addEventListener('click',e=>{
    if(!editingExistingCalendar)return;
    e.preventDefault();e.stopImmediatePropagation();
    try{
      project.settings.year=Number($('userYear').value);
      project.settings.startMonth=isPosterUser()?1:Number($('userStartMonth').value||1);
      project.settings.calendarRows=Number($('userCalendarRows').value||6);
      project.settings.weekStart=$('userWeekStart').value;
      project.settings.showAdjacentMiniCalendars=isPosterUser()?false:$('userAdjacentMini').checked;
      if(typeof syncTemplateCalendarDates==='function')syncTemplateCalendarDates(project,project.settings.year,project.settings.startMonth);
      applyUserSchoolData();
      editingExistingCalendar=false;$('userCreateBtn').textContent='달력 만들기';$('userSetup').classList.add('hidden');
      selectedElementId=null;selectedElementScope=null;render();showEditorToast('달력 설정과 학교 정보를 적용했습니다.');
    }catch(err){console.error(err);alert('설정을 적용하지 못했습니다: '+(err.message||err))}
  },true);
  $('userCancelBtn')?.addEventListener('click',e=>{if(!editingExistingCalendar)return;e.preventDefault();e.stopImmediatePropagation();editingExistingCalendar=false;$('userCreateBtn').textContent='달력 만들기';$('userSetup').classList.add('hidden');render()},true);

  // Annual calendar shares event and holiday styling with monthly calendars.
  const oldRenderWidgetContent=window.renderWidgetContent;
  window.renderWidgetContent=function(view,p){
    if(view?.type!=='year-calendar')return oldRenderWidgetContent.apply(this,arguments);
    const cols=Number(view.columns||4),count=Number(view.monthCount||12),start=Number(view.startMonth||1),seq=monthSequence(p.calendarYear||project.settings.year,start).slice(0,count);
    const byDate={};(project.book.events||[]).forEach(ev=>{(byDate[ev.startDate]||=[]).push(ev)});
    const layout=['open-grid','individual-month-boxes','vertical-three-month-groups','horizontal-four-month-groups'].includes(view.layoutType)?view.layoutType:'individual-month-boxes',baseYear=seq[0]?.year,renderMonth=mm=>{const rows=yearCalendarRowCountFor(view,mm.year,mm.month),monthNames=['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'],transition=view.showTransitionYear!==false&&mm.year!==baseYear,yearMark=transition?`<small class="year-transition">${mm.year}</small>`:'',label=view.monthLabelStyle==='number-en'?`${mm.month} <small>${monthNames[mm.month-1]}${transition?` · ${mm.year}`:''}</small>`:`${yearMark}${mm.month}월`,weekdayRows=view.showWeekdayHeader===false?'':'auto ';let html=`<div class="year-month" data-month-key="${mm.year}-${String(mm.month).padStart(2,'0')}"><strong>${label}</strong><div class="year-month-grid" style="--year-calendar-rows:${rows};grid-template-rows:${weekdayRows}repeat(${rows},1fr)">`;if(view.showWeekdayHeader!==false)weekDayHeaders(true).forEach(x=>html+=`<span class="mh">${x}</span>`);calendarGridFor(mm.year,mm.month,rows).forEach(c=>{const date=`${c.year}-${String(c.month).padStart(2,'0')}-${String(c.day).padStart(2,'0')}`,evs=byDate[date]||[],holiday=evs.some(e=>e.category==='holiday'),dow=new Date(c.year,c.month-1,c.day).getDay(),cls=[c.month!==mm.month?'adj':'','year-day',dow===0?'sun':dow===6?'sat':'',holiday?'holiday':''].filter(Boolean).join(' '),dot=evs.length?`<i class="year-event-dot" style="--event-dot:${eventColor(evs[0])}" title="${evs.map(e=>v21Escape(e.title)).join(' · ')}"></i>${evs.length>1?`<b class="year-event-count">${evs.length}</b>`:''}`:'';html+=`<span class="${cls}">${c.day}${dot}</span>`});return html+'</div></div>'};
    let inner=`<div class="year-calendar-object annual-layout-${layout}" style="--year-cols:${cols};--year-rows:${Math.ceil(count/cols)}">`;if(layout==='vertical-three-month-groups'||layout==='horizontal-four-month-groups'){const size=layout==='vertical-three-month-groups'?3:4;for(let index=0;index<seq.length;index+=size)inner+=`<div class="year-calendar-group">${seq.slice(index,index+size).map(renderMonth).join('')}</div>`}else inner+=seq.map(renderMonth).join('');
    return inner+'</div>';
  };

  // Dedicated, non-destructive preview path with explicit poster dimensions.
  function cleanPreviewClone(live,pageInfo){
    return window.ACDLPreviewState.clonePage(live,pageInfo);
  }
  window.openFullPreview=function(){
    if(!project?.book?.pageInstances?.length){showEditorToast('미리보기할 페이지가 없습니다.');return}
    const saved=window.ACDLPreviewState.capture({pageId:selectedPageId,elementId:selectedElementId,scope:selectedElementScope,calendarEditing,preview,previewType});
    const grid=$('fullPreviewGrid');grid.innerHTML='';grid.style.setProperty('--preview-card-min',($('previewCardSize')?.value||410)+'px');selectedElementId=null;selectedElementScope=null;calendarEditing=false;preview=false;previewType=null;
    let failed=0;
    for(const pageInfo of project.book.pageInstances){
      try{
        selectedPageId=pageInfo.id;renderPage();applyThemeTokens();const live=$('page');if(!live)throw new Error('페이지 렌더링 결과가 없습니다.');const source=cleanPreviewClone(live,pageInfo);const card=document.createElement('section');card.className='full-preview-card';const title=document.createElement('div');title.className='full-preview-card-title';title.innerHTML=`<span>${roleLabel(pageInfo)}</span><small>${pageInfo.role==='poster-annual'?'연간 벽보 · 12개월':(pageInfo.calendarYear&&pageInfo.calendarMonth?`${pageInfo.calendarYear}.${String(pageInfo.calendarMonth).padStart(2,'0')}`:pageInfo.id)}</small><button type="button">원본 보기</button>`;const stage=document.createElement('div');stage.className='full-preview-stage'+(pageInfo.role==='poster-annual'?' poster-preview-stage':'');stage.appendChild(source);card.append(title,stage);grid.appendChild(card);title.querySelector('button').onclick=()=>openPreviewFocus(card);stage.ondblclick=()=>openPreviewFocus(card);
      }catch(err){failed++;console.error('preview failed',pageInfo.id,err);const card=document.createElement('section');card.className='full-preview-card preview-error-card';card.innerHTML=`<div class="full-preview-card-title"><span>${roleLabel(pageInfo)}</span><small>오류</small></div><div style="padding:24px">${v21Escape(err.message||String(err))}</div>`;grid.appendChild(card)}
    }
    const restored=window.ACDLPreviewState.restore(project,saved);selectedPageId=restored.pageId;selectedElementId=restored.elementId;selectedElementScope=restored.scope;calendarEditing=restored.calendarEditing;preview=restored.preview;previewType=restored.previewType;try{render()}catch(err){console.error(err)}
    preview=true;previewType='template';$('fullPreviewSummary').textContent=`${project.book.pageInstances.length}개 페이지${failed?` · ${failed}개 오류`:''} · 독립 렌더링 미리보기`;$('fullPreviewOverlay').classList.remove('hidden');requestAnimationFrame(()=>requestAnimationFrame(()=>grid.querySelectorAll('.full-preview-card:not(.preview-error-card)').forEach(card=>fitFullPreviewPage(card.querySelector('.preview-only-page'),card.querySelector('.full-preview-stage'),Number($('previewZoom')?.value||100)))));
  };
  setTimeout(()=>{markPosterSpecificFields();refreshUserOptionVisibility();if(project?.mode==='calendar-workspace')$('templateSettingsBtn').textContent='달력 설정'},0);
  const oldRender=window.render;window.render=function(){const r=oldRender.apply(this,arguments);if(project?.mode==='calendar-workspace')$('templateSettingsBtn').textContent='달력 설정';return r};
})();

(()=>{
  // Workspace users can add objects whenever the template/page permits editing.
  function restoreWorkspaceInsertTools(){
    if(project?.mode!=='calendar-workspace')return;
    document.querySelectorAll('.menu-root').forEach(root=>{
      const title=root.querySelector(':scope>button')?.textContent?.trim();
      if(title==='삽입')root.dataset.workspaceHidden='false';
    });
    document.querySelectorAll('[data-workspace-designer-tool]').forEach(btn=>delete btn.dataset.workspaceDesignerTool);
  }
  const priorRender=window.render;
  window.render=function(){const out=priorRender.apply(this,arguments);restoreWorkspaceInsertTools();return out};
  setTimeout(restoreWorkspaceInsertTools,0);

  // Poster wizard: hide only structurally irrelevant fields; keep 5×7/6×7 choice visible.
  function correctPosterWizard(){
    const poster=(window.selectedCalendarType||window.selectedUserTemplate?.type)==='poster';
    const hideIds=['userFrontInserts','userRearInserts','userAdjacentMini','userStartMonth'];
    hideIds.forEach(id=>document.getElementById(id)?.closest('label')?.classList.toggle('user-poster-hidden',poster));
    document.getElementById('userCalendarRows')?.closest('label')?.classList.remove('user-poster-hidden');
  }
  document.querySelectorAll('[data-calendar-type],[data-user-template]').forEach(n=>n.addEventListener('click',()=>setTimeout(correctPosterWizard,0)));
  setTimeout(correctPosterWizard,0);

  // Ensure all annual calendars inherit the selected grid rows after creation/template loading.
  const priorApplyCalendarType=window.applyCalendarType;
  if(priorApplyCalendarType)window.applyCalendarType=function(){const r=priorApplyCalendarType.apply(this,arguments);setTimeout(correctPosterWizard,0);return r};

  // Fit the full academic schedule by choosing columns first, then reducing type only to the configured minimum.
  function fitEventLists(root=document){
    root.querySelectorAll?.('.widget-event-list').forEach(widget=>{
      const list=widget.querySelector('.annual-event-items');if(!list)return;
      const count=list.querySelectorAll('.annual-event-item').length,requested=widget.dataset.eventColumns||'1';
      let cols=requested==='auto'?Math.max(1,Math.min(4,Math.ceil(count/Math.max(8,Math.floor(Number(widget.dataset.eventHeight||40)/3.2))))):Math.max(1,Math.min(4,Number(requested)||1));
      if(requested==='auto'&&Number(widget.dataset.eventWidth||20)<32)cols=Math.min(cols,2);
      let font=Math.max(5,Number(widget.dataset.eventFontSize||8)),minFont=Math.max(5,Math.min(font,Number(widget.dataset.eventMinFontSize||6)));
      widget.classList.remove('has-event-overflow');
      const layout=()=>{list.style.setProperty('--event-list-columns',String(cols));list.style.setProperty('--event-list-row-count',String(Math.max(1,Math.ceil(count/cols))));list.style.setProperty('--event-list-font-size',font+'px')};
      layout();
      if(requested==='auto')while(list.scrollHeight>list.clientHeight+1&&cols<4){cols++;layout()}
      if(widget.dataset.eventFit==='auto')while(list.scrollHeight>list.clientHeight+1&&font>minFont){font=Math.max(minFont,font-.5);layout()}
      const overflow=list.scrollHeight>list.clientHeight+1||list.scrollWidth>list.clientWidth+1;
      if(overflow){widget.classList.add('has-event-overflow');const warning=widget.querySelector('.event-list-overflow-warning');if(warning)warning.textContent=`전체 ${count}건 · 영역 초과`}
      widget.dataset.resolvedColumns=String(cols);widget.dataset.resolvedFontSize=String(font);
    });
  }
  const priorRenderPage=window.renderPage;
  window.renderPage=function(){const r=priorRenderPage.apply(this,arguments);fitEventLists(document);return r};
  const priorOpenFullPreview=window.openFullPreview;
  if(priorOpenFullPreview)window.openFullPreview=function(){const r=priorOpenFullPreview.apply(this,arguments);setTimeout(()=>fitEventLists(document.getElementById('fullPreviewGrid')),30);return r};
  document.addEventListener('change',event=>{if(event.target?.id==='eventListDisplayMode')document.getElementById('eventListMaxItemsField')?.classList.toggle('hidden',event.target.value!=='limit')});
})();

(()=>{
 const $=id=>document.getElementById(id);
 const monthlyImages={};
 const monthOrder=()=>{const y=Number($('userYear')?.value||2027),m=Number($('userStartMonth')?.value||1);return monthSequence(y,m)};
 function selectedTemplateKey(){return document.querySelector('[data-user-template].selected')?.dataset.userTemplate||window.selectedUserTemplate?.template||'school-basic'}
 function needsMonthlyImages(){return selectedTemplateKey()==='minimal'}
 function ensureDynamicInputSection(){
  const page=document.querySelector('[data-user-step="4"]');if(!page||$('v36DynamicInputs'))return;
  const sec=document.createElement('section');sec.id='v36DynamicInputs';sec.innerHTML=`<div class="school-profile-section"><h3>템플릿별 추가 입력</h3><div class="v36-schema-note">선택한 템플릿이 요구하는 입력 항목만 표시됩니다. 월별 이미지는 선택 사항이며 편집 화면에서도 교체할 수 있습니다.</div><div id="v36MonthImageGrid" class="v36-month-grid"></div></div>`;page.appendChild(sec);renderDynamicInputs();
 }
 function renderDynamicInputs(){
  const sec=$('v36DynamicInputs'),grid=$('v36MonthImageGrid');if(!sec||!grid)return;
  const show=needsMonthlyImages();sec.classList.toggle('hidden',!show);if(!show)return;
  grid.innerHTML=monthOrder().map(mm=>{const key=`${mm.year}-${String(mm.month).padStart(2,'0')}`,src=monthlyImages[key]||'';return `<div class="v36-month-card" data-month-key="${key}"><strong>${mm.year}년 ${mm.month}월 이미지</strong><div class="v36-month-preview">${src?`<img src="${src}" alt="${mm.month}월 이미지">`:'미등록'}</div><input type="file" accept="image/*" hidden><button type="button">${src?'교체':'이미지 선택'}</button></div>`}).join('');
  grid.querySelectorAll('.v36-month-card').forEach(card=>{const input=card.querySelector('input'),btn=card.querySelector('button');btn.onclick=()=>input.click();input.onchange=async()=>{const f=input.files?.[0];if(!f)return;btn.disabled=true;btn.textContent='최적화 중…';try{const stored=await window.ACDLAssetStore.storeImage(f,{previewMax:1100,previewQuality:.8});monthlyImages[card.dataset.monthKey]=stored.preview;window.__acdlMonthlyAssetRefs||={};window.__acdlMonthlyAssetRefs[card.dataset.monthKey]=stored.assetId;renderDynamicInputs();window.__acdlUpdateMemoryMonitor?.()}catch(err){alert(err?.message||'이미지를 처리하지 못했습니다.')}finally{btn.disabled=false}}})
 }
 function attachTemplateSchema(prj){
  if(!prj)return;prj.template||={};prj.template.inputRequirements=needsMonthlyImages()?[{key:'school.name',type:'text',label:'학교명',required:true},{key:'calendar.monthlyImages',type:'monthly-image-set',label:'월별 이미지',required:false,months:12}]:[{key:'school.name',type:'text',label:'학교명',required:true},{key:'school.profile.logo',type:'image',label:'교표',required:false},{key:'school.profile.building',type:'image',label:'학교 전경',required:false}];
  prj.book||={};prj.book.monthlyImages={...monthlyImages};prj.book.monthlyImageAssets={...(window.__acdlMonthlyAssetRefs||{})};prj.book.dataset={school:prj.book.school,schedule:prj.book.events||[],monthlyImages:prj.book.monthlyImages,monthlyImageAssets:prj.book.monthlyImageAssets,assets:prj.template.resources?.sampleAssets||[]};
 }
 document.querySelectorAll('[data-user-template],[data-calendar-type]').forEach(n=>n.addEventListener('click',()=>setTimeout(renderDynamicInputs,0)));
 $('userStartMonth')?.addEventListener('change',renderDynamicInputs);$('userYear')?.addEventListener('change',renderDynamicInputs);ensureDynamicInputSection();
 $('userCreateBtn')?.addEventListener('click',()=>setTimeout(()=>{attachTemplateSchema(window.project||project);try{render()}catch{}},0));

 // Poster calendars also support academic-year start months.
 function showPosterStartMonth(){const poster=(window.selectedCalendarType||window.selectedUserTemplate?.type)==='poster';$('userStartMonth')?.closest('label')?.classList.remove('user-poster-hidden');if(poster&&$('userStartMonth'))$('userStartMonth').disabled=false}
 document.querySelectorAll('[data-calendar-type],[data-user-template]').forEach(n=>n.addEventListener('click',()=>setTimeout(showPosterStartMonth,1)));setTimeout(showPosterStartMonth,20);

 // Semantic year/month objects.
 function addBoundText(binding,label,format){const scope=$('elementScope')?.value||'page',arr=scope==='master'?masterElements():pageElements(),elem={id:`element.text.${Date.now()}`,type:'text',binding,content:label,format,x:10,y:10,width:28,height:12,zIndex:maxZ(scope)+1,style:{fontSize:24,textAlign:'left',background:false,color:'#17202e'}};snapshot();arr.push(elem);selectedElementId=elem.id;selectedElementScope=scope;render()}
 const basicSection=document.querySelector('[data-library-section="basic"] .object-grid');if(basicSection&&!basicSection.querySelector('[data-v36-year]')){const y=document.createElement('button');y.className='object-card';y.dataset.v36Year='1';y.innerHTML='<strong>해당 연도</strong><span>프로젝트 연도 자동 연결</span>';const m=document.createElement('button');m.className='object-card';m.dataset.v36Month='1';m.innerHTML='<strong>해당 월</strong><span>현재 페이지 월 자동 연결</span>';basicSection.prepend(m);basicSection.prepend(y);y.onclick=()=>addBoundText('calendar.year','2027','year-plain');m.onclick=()=>addBoundText('calendar.month','3월','month-ko')}
 const oldResolve=window.resolveTextContent||resolveTextContent;window.resolveTextContent=resolveTextContent=function(view,p=selectedPage()){
  if(view.binding==='calendar.month'){const month=Number(p.calendarMonth||project.settings?.startMonth||1),year=Number(p.calendarYear||project.settings?.year||'');return view.format==='year-month-ko'?`${year}년 ${month}월`:view.format==='month-2'?String(month).padStart(2,'0'):`${month}월`}
  if(view.binding==='calendar.year'){const year=Number(p.calendarYear||project.settings?.year||view.content||'');if(!year)return view.content||'';if(view.format==='academic-year')return `${year}학년도`;if(view.format==='year-range')return `${year}–${year+1}`;if(view.format==='year-ko')return `${year}년`;return String(year)}
  return oldResolve(view,p)
 };

 // Make text color authoritative for every text role.
 function applyTextColors(){if(!project)return;document.querySelectorAll('.free-element[data-element-type="text"]').forEach(box=>{const arr=box.dataset.scope==='master'?masterElements():pageElements(),item=arr.find(x=>x.id===box.dataset.elementId),text=box.querySelector('.free-text');if(item&&text)text.style.setProperty('color',item.style?.color||'#17202e','important')})}
 const previousRender=window.render;window.render=function(){const r=previousRender.apply(this,arguments);applyTextColors();return r};const previousRenderPage=window.renderPage;window.renderPage=function(){const r=previousRenderPage.apply(this,arguments);applyTextColors();return r};

 // Frame bindings resolve school profile and monthly image data instead of only storing a path.
 function imageForBinding(binding,p=selectedPage()){
  if(!binding)return'';const school=project.book?.school||{};const map={'school.profile.building':school.profile?.building?.image,'school.profile.logo':school.profile?.logo?.image,'school.profile.flower':school.profile?.flower?.image,'school.profile.tree':school.profile?.tree?.image};if(map[binding])return map[binding];
  if(binding.startsWith('calendar.monthlyImages.')){const suffix=binding.split('.').pop(),month=Number(suffix),year=Number(p.calendarYear||project.settings?.year||2027);let key=`${year}-${String(month).padStart(2,'0')}`;let val=project.book?.monthlyImages?.[key];if(!val){const seq=monthSequence(project.settings?.year||year,project.settings?.startMonth||1),match=seq.find(x=>x.month===month);if(match)val=project.book?.monthlyImages?.[`${match.year}-${String(match.month).padStart(2,'0')}`]}return val||''}
  if(binding==='calendar.monthlyImages.current'){const year=Number(p.calendarYear||project.settings?.year||2027),month=Number(p.calendarMonth||project.settings?.startMonth||1);return project.book?.monthlyImages?.[`${year}-${String(month).padStart(2,'0')}`]||''}return''
 }
 const oldGraphicMarkup=window.graphicMarkup||graphicMarkup;window.graphicMarkup=graphicMarkup=function(view){if(view.type==='image-frame'){view=structuredClone(view);view.image||={};view.image.src=imageForBinding(view.image.binding)||view.image.src||''}return oldGraphicMarkup(view)};
 const oldInspector=window.renderInspector;window.renderInspector=function(){const r=oldInspector.apply(this,arguments);const item=sourceElement?.();if(item?.type==='image-frame'){const sel=$('frameBinding');if(sel){const current=item.image?.binding||'';const groups=[['calendar.monthlyImages.current','현재 페이지 월 이미지'],...monthOrder().map(mm=>[`calendar.monthlyImages.${mm.month}`,`${mm.month}월 이미지`])];groups.forEach(([v,l])=>{if(![...sel.options].some(o=>o.value===v)){const o=document.createElement('option');o.value=v;o.textContent=l;sel.appendChild(o)}});sel.value=current}}
  return r};

 // Persist full template records as a fallback alongside IndexedDB metadata.
 try{localStorage.removeItem('acdl-template-library-v36-full')}catch(_){}

 setTimeout(()=>{ensureDynamicInputSection();renderDynamicInputs();showPosterStartMonth();applyTextColors()},50);
})();

(()=>{
 const DB_NAME='acdl-v361-assets',DB_VERSION=1;
 const assetDatabase=window.ACDLPersistenceIndexedDB.createDatabase(indexedDB,{databaseName:DB_NAME,version:DB_VERSION,stores:{assets:{keyPath:'id'},recovery:{keyPath:'id'}}});
 function openDB(){return assetDatabase.open()}
 function txPut(store,value){return assetDatabase.put(store,value)}
 function canvasBlob(canvas,type,quality){return new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('이미지 압축에 실패했습니다.')),type,quality))}
 function fileToImage(file){return new Promise((resolve,reject)=>{const url=URL.createObjectURL(file),img=new Image();img.onload=()=>{URL.revokeObjectURL(url);resolve(img)};img.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('지원하지 않는 이미지 형식입니다.'))};img.src=url})}
 function blobToDataURL(blob){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result||''));r.onerror=()=>reject(r.error);r.readAsDataURL(blob)})}
 async function storeImage(file,opt={}){if(!file?.type?.startsWith('image/'))throw new Error('이미지 파일만 등록할 수 있습니다.');const img=await fileToImage(file),max=Number(opt.previewMax||900),scale=Math.min(1,max/Math.max(img.naturalWidth,img.naturalHeight)),canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(img.naturalWidth*scale));canvas.height=Math.max(1,Math.round(img.naturalHeight*scale));canvas.getContext('2d',{alpha:false}).drawImage(img,0,0,canvas.width,canvas.height);const type=file.type==='image/png'&&file.size<1500000?'image/png':'image/jpeg',previewBlob=await canvasBlob(canvas,type,type==='image/jpeg'?Number(opt.previewQuality||.78):undefined),preview=await blobToDataURL(previewBlob),assetId=`asset-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;await txPut('assets',{id:assetId,blob:file,previewBlob,name:file.name,mime:file.type,width:img.naturalWidth,height:img.naturalHeight,bytes:file.size,createdAt:new Date().toISOString()});canvas.width=1;canvas.height=1;return{assetId,preview,previewBytes:previewBlob.size,width:img.naturalWidth,height:img.naturalHeight}}
 function formatBytes(n){n=Number(n||0);if(n<1024)return `${n} B`;if(n<1048576)return `${(n/1024).toFixed(1)} KB`;return `${(n/1048576).toFixed(1)} MB`}
 window.ACDLAssetStore={storeImage,formatBytes,openDB};
 function roughSize(v){try{return new Blob([JSON.stringify(v,(_key,value)=>typeof value==='string'&&value.startsWith('data:')&&value.length>2048?`data-ref:${value.length}`:value)]).size}catch{return 0}}
 function ensureMonitor(){let m=document.getElementById('v361MemoryMonitor');if(m)return m;m=document.createElement('aside');m.id='v361MemoryMonitor';m.innerHTML='<strong><span>프로젝트 메모리</span><span id="v361Total">0 MB</span></strong><div class="bar"><span></span></div><small id="v361Detail">계산 중…</small>';document.body.appendChild(m);const status=document.getElementById('saveStatus');if(status&&!document.getElementById('v361Badge')){const b=document.createElement('span');b.id='v361Badge';b.className='v361-badge';b.textContent='v36.1 안정화';status.after(b)}return m}
 function update(){const m=ensureMonitor(),currentProject=typeof window.project!=='undefined'&&window.project?window.project:(typeof project!=='undefined'?project:null),projectBytes=roughSize(currentProject),historyBytes=(Array.isArray(history)?history:[]).reduce((a,x)=>a+(x?.length||0)*2,0),poolBytes=window.__historyBinaryPool?[...window.__historyBinaryPool.values()].reduce((a,x)=>a+(x?.length||0)*2,0):0,total=projectBytes+historyBytes+poolBytes;m.querySelector('#v361Total').textContent=formatBytes(total);m.querySelector('#v361Detail').textContent=`프로젝트 ${formatBytes(projectBytes)} · 실행 취소 ${formatBytes(historyBytes)} · 이미지 풀 ${formatBytes(poolBytes)}`;m.querySelector('.bar span').style.width=`${Math.min(100,total/(200*1024*1024)*100)}%`;m.classList.toggle('warn',total>160*1024*1024)}
 window.__acdlUpdateMemoryMonitor=update;setTimeout(update,200);setInterval(update,5000);
 async function saveRecovery(){const currentProject=typeof window.project!=='undefined'&&window.project?window.project:(typeof project!=='undefined'?project:null);if(!currentProject)return;try{const record=window.ACDLPersistenceProject.createRecoveryRecord(currentProject,window.selectedPageId||selectedPageId,{compact:typeof __compactHistoryValue==='function'?__compactHistoryValue:undefined});await txPut('recovery',record);const remote=window.ACDLTemplateRemotePersistence,remoteId=currentProject.template?.remoteId;if(remoteId&&remote?.hasSession?.())remote.saveDraft({templateId:remoteId,schemaVersion:'2.0',projectData:record.project}).catch(error=>console.warn('원격 자동저장 실패',error));const s=document.getElementById('saveStatus');if(s&&s.textContent.includes('변경'))s.title='자동 복구본이 저장되었습니다.'}catch(err){console.warn('자동 복구 저장 실패',err)}}
 setInterval(saveRecovery,30000);window.addEventListener('beforeunload',()=>{saveRecovery()});
 const oldRender=typeof window.render==='function'?window.render:null;if(oldRender)window.render=function(){return oldRender.apply(this,arguments)};
})();

(()=>{
  const $=id=>document.getElementById(id);
  const typeLabels={desk:'탁상형',wall:'벽걸이형',poster:'연간 포스터형',postcard:'엽서형'};
  SIZE_PRESETS.postcard=[
    {id:'postcard-148x100',label:'가로형 — 148 × 100 mm',width:148,height:100,note:'표지와 월별 사진을 넓게 구성하는 기본 엽서형',recommended:true},
    {id:'postcard-100x148',label:'세로형 — 100 × 148 mm',width:100,height:148,note:'세로 사진과 월력을 조합하는 엽서형'},
    {id:'postcard-a6',label:'A6 — 148 × 105 mm',width:148,height:105,note:'인쇄·우편 규격 활용이 쉬운 A6 엽서형'}
  ];
  SETUP_TYPE_NOTES.postcard='엽서형은 단면 페이지로 구성됩니다. 표지와 12개월 월력이 기본이며, 앞·뒤 간지와 뒷표지를 선택적으로 포함할 수 있습니다.';

  const oldMakeProject=makeProject;
  makeProject=function(opts){
    if(opts.type!=='postcard')return oldMakeProject(opts);
    const chosen=SIZE_PRESETS.postcard.find(x=>x.id===opts.sizePresetId)||SIZE_PRESETS.postcard[0];
    const base=oldMakeProject({...opts,type:'wall',sizePresetId:'wall-a4'});
    base.settings={...base.settings,...opts,type:'postcard',sizePreset:{id:chosen.id,label:chosen.label,width:chosen.width,height:chosen.height}};
    base.productType={id:'postcard-single-pages',category:'postcard',duplex:false,pageSize:{width:chosen.width,height:chosen.height,unit:'mm'}};
    base.book.id=`book.postcard.${opts.year}.${String(opts.startMonth).padStart(2,'0')}`;
    base.book.pageInstances.forEach((page,index)=>{
      page.id=`postcard.page.${index+1}`;
      page.side='front';
      page.number=index+1;
      if(page.role==='cover-front')page.masterId='master.postcard.cover';
      else if(page.role==='monthly-front')page.masterId='master.postcard.monthly.front';
      else if(page.role==='back-cover-front')page.masterId='master.postcard.back-cover';
      else if(page.role.includes('insert'))page.masterId=`master.postcard.${page.role}`;
    });
    base.book.elementsByPage={};base.book.pageInstances.forEach(p=>base.book.elementsByPage[p.id]=[]);
    base.book.sheets=[];
    return base;
  };

  const oldRenderUserSizeOptions=renderUserSizeOptions;
  renderUserSizeOptions=function(){
    const list=SIZE_PRESETS[selectedUserTemplate.type]||SIZE_PRESETS.desk;
    $('userSize').innerHTML=list.map(x=>`<option value="${x.id}" ${x.recommended?'selected':''}>${x.label}${x.recommended?' · 추천':''}</option>`).join('');
    $('userRearInsertField').classList.toggle('hidden',!['desk','postcard'].includes(selectedUserTemplate.type));
    const front=$('userFrontInserts')?.closest('label');if(front)front.classList.toggle('hidden',selectedUserTemplate.type==='poster');
  };

  const oldApplyCalendarType=typeof applyCalendarType==='function'?applyCalendarType:()=>{};
  applyCalendarType=function(type){
    oldApplyCalendarType(type);
    selectedCalendarType=type;
    const label=$('selectedTypeLabel');if(label)label.textContent=typeLabels[type]||type;
    renderUserSizeOptions();
  };

  function typeName(type){return typeLabels[type]||type}
  const oldRenderTemplateLibrary=typeof renderTemplateLibrary==='function'?renderTemplateLibrary:()=>{};
  renderTemplateLibrary=function(filter='all'){
    oldRenderTemplateLibrary(filter);
    document.querySelectorAll('.library-template-card').forEach(card=>{
      const rec=v22Library().find(x=>x.id===card.dataset.templateId);const small=card.querySelector('.library-card-body small');
      if(rec&&small)small.textContent=`${typeName(rec.type)} · 수정 ${rec.updatedAt||'-'}`;
    });
  };
  const oldRenderUserTemplateChoices=typeof renderUserTemplateChoices==='function'?renderUserTemplateChoices:()=>{};
  renderUserTemplateChoices=function(){
    oldRenderUserTemplateChoices();
    document.querySelectorAll('#userTemplateChoiceGrid [data-user-template]').forEach(card=>{
      const type=card.dataset.userType;const tag=card.querySelector('.template-tags span:first-child');if(tag)tag.textContent=typeName(type);
    });
  };

  const setupType=$('setupType');
  if(setupType&&!setupType.querySelector('option[value="postcard"]'))setupType.insertAdjacentHTML('beforeend','<option value="postcard">엽서형 · 표지 + 월력 12장</option>');
  document.querySelectorAll('.setup-field[data-types]').forEach(n=>{
    const values=new Set(n.dataset.types.split(/\s+/));
    if(['setupYear','setupMonth','setupCalendarRows','setupWeekStart','setupSize','setupTemplate'].includes(n.querySelector('input,select')?.id))values.add('postcard');
    n.dataset.types=[...values].join(' ');
  });

  const typeGrid=document.querySelector('.calendar-type-grid');
  if(typeGrid&&!typeGrid.querySelector('[data-calendar-type="postcard"]')){
    const btn=document.createElement('button');btn.className='calendar-type-choice';btn.dataset.calendarType='postcard';btn.innerHTML='<div class="type-icon">✉️</div><strong>엽서형 달력</strong><small>표지와 월력 12장을 기본으로 하며 간지와 뒷표지를 선택적으로 추가합니다.</small>';
    btn.addEventListener('click',()=>applyCalendarType('postcard'));typeGrid.appendChild(btn);
  }else typeGrid?.querySelector('[data-calendar-type="postcard"]')?.addEventListener('click',()=>applyCalendarType('postcard'));

  const oldRoleLabel=roleLabel;
  roleLabel=function(p){
    if(project?.productType?.category==='postcard'){
      if(p.role==='cover-front')return '표지';
      if(p.role==='back-cover-front')return '뒷표지';
      if(p.role==='front-insert-front')return `앞 간지 ${p.insertIndex||1}`;
      if(p.role==='rear-insert-front')return `뒤 간지 ${p.insertIndex||1}`;
      if(p.role==='monthly-front')return `${p.calendarYear}.${String(p.calendarMonth).padStart(2,'0')} · 월력`;
    }
    return oldRoleLabel(p);
  };

  const oldRenderNavigator=renderNavigator;
  renderNavigator=function(){oldRenderNavigator()};

  // Wall and postcard pages are fully editable single-sided surfaces in Workspace.
  function unlockSingleSurfaceInsert(){
    const editable=['wall','postcard','poster'].includes(project?.productType?.category);
    if(!editable)return;
    document.querySelectorAll('.menu-root').forEach(root=>{if(root.querySelector(':scope>button')?.textContent?.trim()==='삽입')root.dataset.workspaceHidden='false'});
    document.querySelectorAll('[data-open-library]').forEach(btn=>{btn.style.removeProperty('display');btn.disabled=false});
  }
  const oldRender=typeof window.render==='function'?window.render:render; if(typeof oldRender==='function')render=function(){const out=oldRender.apply(this,arguments);unlockSingleSurfaceInsert();return out};
  const oldEnterUser=typeof enterUser==='function'?enterUser:null; if(oldEnterUser)enterUser=function(){const out=oldEnterUser.apply(this,arguments);setTimeout(unlockSingleSurfaceInsert,0);return out};

  renderUserTemplateChoices();
  updateSetupFields();
})();

(()=>{
 const $=id=>document.getElementById(id);
 function bytesFromDataUrl(url){if(!url||typeof url!=='string')return 0;const comma=url.indexOf(',');return comma<0?0:Math.round((url.length-comma-1)*.75)}
 window.renderUserCustomAssets=function(){
  const n=$('userCustomAssetPreview');if(!n)return;
  n.className='user-custom-asset-list';
  const items=(window.userImages?.customAssets||[]);
  n.innerHTML=items.length?items.map((a,i)=>`<div class="user-custom-asset-row"><div class="user-custom-asset-thumb"><img src="${a.image}" alt="${v21Escape(a.name||'사용자 이미지')}"></div><div class="user-custom-asset-meta"><strong title="${v21Escape(a.name||'사용자 이미지')}">${v21Escape(a.name||'사용자 이미지')}</strong><small>${Math.max(1,Math.round(bytesFromDataUrl(a.image)/1024))} KB · 사용자 지정 이미지</small></div><button type="button" class="user-custom-asset-remove" data-remove-user-custom="${i}">삭제</button></div>`).join(''):'<div class="user-custom-asset-empty">등록된 이미지가 없습니다.</div>';
  n.querySelectorAll('[data-remove-user-custom]').forEach(b=>b.onclick=()=>{window.userImages.customAssets.splice(Number(b.dataset.removeUserCustom),1);window.renderUserCustomAssets()});
 };
 function ensurePostcardModel(){
  if(!window.project||project?.productType?.category!=='postcard')return;
  project.template.masters.calendar.calendarRegionsByType ||= {};
  project.template.masters.calendar.calendarRegionsByType.postcard ||= {x:6,y:60,width:88,height:35};
  project.template.masterElements ||= {};
  const mid='master.postcard.monthly.front';
  const arr=project.template.masterElements[mid] ||= [];
  project.book.pageInstances.filter(p=>p.role==='monthly-front').forEach(p=>p.masterId=mid);
  if(!arr.some(x=>x.role==='postcard-month-image'))arr.unshift({id:'element.postcard.month-image.default',type:'image-frame',role:'postcard-month-image',x:6,y:6,width:88,height:49,zIndex:1,image:{binding:'calendar.monthlyImages.current',src:'',fit:'cover'},src:'',fit:'cover',style:{borderRadius:2,border:false}});
  if(!arr.some(x=>x.binding==='calendar.year'))arr.push({id:'element.postcard.year.default',type:'text',role:'year',binding:'calendar.year',content:String(project.settings.year||2027),x:7,y:56,width:20,height:7,zIndex:3,style:{fontSize:14,textAlign:'left',background:false,color:'#17202e'}});
  if(!arr.some(x=>x.binding==='calendar.month'))arr.push({id:'element.postcard.month.default',type:'text',role:'month',binding:'calendar.month',content:'1월',x:75,y:56,width:18,height:7,zIndex:3,style:{fontSize:14,textAlign:'right',background:false,color:'#17202e'}});
 }
 const priorMake=makeProject;
 makeProject=function(opts){const p=priorMake(opts);if(opts.type==='postcard'){project=p;ensurePostcardModel();project=p}return p};
 function refreshTypeEditing(){
  if(!window.project&&!project)return;const type=project?.productType?.category;document.body.dataset.calendarProduct=type||'';
  const page=selectedPage?.();const monthly=page?.role==='monthly-front';
  if(['postcard','wall'].includes(type)&&monthly){$('editCalendarBtn')?.classList.remove('hidden');$('editCalendarBtn').disabled=false}
  if(['postcard','wall','poster'].includes(type)){
   $('openObjectDrawerBtn')?.classList.remove('hidden');$('openObjectDrawerBtn')?.removeAttribute('disabled');
   document.querySelectorAll('[data-open-library],[data-semantic-add],[data-school-text-add],[data-basic-add],[data-widget-add]').forEach(b=>{b.disabled=false;b.style.removeProperty('display');b.style.pointerEvents='auto'});
  }
  ensurePostcardModel();
  const pageNode=$('page');if(pageNode)pageNode.dataset.productType=type||'';
 }
 const prevRender=typeof window.render==='function'?window.render:render; if(typeof prevRender==='function')render=function(){const r=prevRender.apply(this,arguments);requestAnimationFrame(refreshTypeEditing);return r};
 $('openObjectDrawerBtn')?.addEventListener('click',()=>{refreshTypeEditing();$('objectDrawer')?.classList.remove('hidden');renderObjectRecommendations?.();renderRegisteredAssetLibrary?.()},true);
 // Existing projects loaded from JSON also receive the full postcard model.
 const oldNormalize=normalizeElementData;normalizeElementData=function(){const r=oldNormalize.apply(this,arguments);ensurePostcardModel();return r};
 setTimeout(()=>{window.renderUserCustomAssets?.();refreshTypeEditing()},200);
})();

(()=>{
 if(window.ACDLCalendarTypeDomain)return;
 const $=id=>document.getElementById(id),KEY='acdl.calendarTypeDefinitions.v37';
 const objectLabels={text:'텍스트',image:'이미지',shape:'도형',vector:'벡터',frame:'사진 프레임','school-object':'학교 개체','monthly-calendar':'월력','year-calendar':'연간 달력','monthly-schedule':'해당 월 일정','event-list':'전체 학사일정',memo:'메모'};
 const allObjects=Object.keys(objectLabels);
 const defaults=[
  {id:'desk',name:'탁상형',baseType:'desk',builtin:true,width:260,height:190,monthlyCount:12,duplex:true,cover:true,backCover:true,frontInsert:true,rearInsert:true,annualSingle:false,startMonth:true,resizable:true,monthlyImages:true,allowedObjects:allObjects},
  {id:'wall',name:'벽걸이형',baseType:'wall',builtin:true,width:297,height:420,monthlyCount:12,duplex:false,cover:true,backCover:false,frontInsert:true,rearInsert:false,annualSingle:false,startMonth:true,resizable:true,monthlyImages:true,allowedObjects:allObjects},
  {id:'poster',name:'연간 포스터형',baseType:'poster',builtin:true,width:420,height:594,monthlyCount:12,duplex:false,cover:false,backCover:false,frontInsert:false,rearInsert:false,annualSingle:true,startMonth:true,resizable:true,monthlyImages:false,allowedObjects:allObjects},
  {id:'postcard',name:'엽서형',baseType:'postcard',builtin:true,width:148,height:100,monthlyCount:12,duplex:false,cover:true,backCover:true,frontInsert:true,rearInsert:true,annualSingle:false,startMonth:true,resizable:true,monthlyImages:true,allowedObjects:allObjects}
 ];
 function load(){try{const x=JSON.parse(localStorage.getItem(KEY)||'null');return Array.isArray(x)&&x.length?x:structuredClone(defaults)}catch{return structuredClone(defaults)}}
 let definitions=load(),activeId='desk';
 function saveAll(){localStorage.setItem(KEY,JSON.stringify(definitions));window.ACDLCalendarTypeDefinitions=definitions;syncRuntime()}
 function getDef(id){return definitions.find(x=>x.id===id)}
 function renderAllowed(selected=allObjects){$('tmAllowedObjects').innerHTML=allObjects.map(k=>`<label><input type="checkbox" value="${k}" ${selected.includes(k)?'checked':''}>${objectLabels[k]}</label>`).join('')}
 function fill(d){activeId=d.id;$('tmName').value=d.name;$('tmId').value=d.id;$('tmId').disabled=!!d.builtin;$('tmBase').value=d.baseType;$('tmWidth').value=d.width;$('tmHeight').value=d.height;$('tmMonths').value=d.monthlyCount;$('tmDuplex').checked=!!d.duplex;$('tmCover').checked=!!d.cover;$('tmBackCover').checked=!!d.backCover;$('tmFrontInsert').checked=!!d.frontInsert;$('tmRearInsert').checked=!!d.rearInsert;$('tmAnnualSingle').checked=!!d.annualSingle;$('tmStartMonth').checked=d.startMonth!==false;$('tmResizable').checked=d.resizable!==false;$('tmMonthlyImages').checked=!!d.monthlyImages;renderAllowed(d.allowedObjects||allObjects);$('deleteTypeDefinitionBtn').disabled=!!d.builtin;renderList()}
 function renderList(){$('typeDefinitionList').innerHTML=definitions.map(d=>`<button class="type-definition-card ${d.id===activeId?'active':''}" data-type-def="${d.id}"><strong>${v21Escape(d.name)}</strong><small>${d.duplex?'양면':'단면'} · ${d.annualSingle?'연간 1페이지':`${d.monthlyCount}개월`} · ${d.width}×${d.height}mm${d.builtin?' · 기본 유형':''}</small></button>`).join('');$('typeDefinitionList').querySelectorAll('[data-type-def]').forEach(b=>b.onclick=()=>fill(getDef(b.dataset.typeDef)))}
 function readForm(){return {id:$('tmId').value.trim().replace(/[^a-zA-Z0-9_-]/g,'-'),name:$('tmName').value.trim(),baseType:$('tmBase').value,builtin:getDef(activeId)?.builtin||false,width:Number($('tmWidth').value),height:Number($('tmHeight').value),monthlyCount:Number($('tmMonths').value),duplex:$('tmDuplex').checked,cover:$('tmCover').checked,backCover:$('tmBackCover').checked,frontInsert:$('tmFrontInsert').checked,rearInsert:$('tmRearInsert').checked,annualSingle:$('tmAnnualSingle').checked,startMonth:$('tmStartMonth').checked,resizable:$('tmResizable').checked,monthlyImages:$('tmMonthlyImages').checked,allowedObjects:[...$('tmAllowedObjects').querySelectorAll('input:checked')].map(x=>x.value)}}
 function syncRuntime(){
  window.ACDLCalendarTypeDefinitions=definitions;
  definitions.forEach(d=>{if(!SIZE_PRESETS[d.id])SIZE_PRESETS[d.id]=[{id:`${d.id}-default`,label:`${d.name} 기본 — ${d.width} × ${d.height} mm`,width:d.width,height:d.height,note:`${d.name} 유형 설정에서 정의된 기본 크기`,recommended:true}];else if(!d.builtin)SIZE_PRESETS[d.id]=[{id:`${d.id}-default`,label:`${d.name} 기본 — ${d.width} × ${d.height} mm`,width:d.width,height:d.height,note:'사용자 정의 달력 유형',recommended:true}]});
  const sel=$('setupType');definitions.forEach(d=>{if(!sel.querySelector(`option[value="${d.id}"]`)){const o=document.createElement('option');o.value=d.id;o.textContent=d.name;sel.appendChild(o)}});
  document.querySelectorAll('.setup-field[data-types]').forEach(n=>{const s=new Set(n.dataset.types.split(/\s+/));definitions.forEach(d=>s.add(d.id));n.dataset.types=[...s].join(' ')});
  const grid=document.querySelector('.calendar-type-grid');definitions.filter(d=>!d.builtin).forEach(d=>{if(grid&&!grid.querySelector(`[data-calendar-type="${d.id}"]`)){const b=document.createElement('button');b.className='calendar-type-choice';b.dataset.calendarType=d.id;b.innerHTML=`<div class="type-icon">▦</div><strong>${v21Escape(d.name)}</strong><small>${d.duplex?'양면':'단면'} · ${d.annualSingle?'연간 한 페이지':`${d.monthlyCount}개월 월력`}</small>`;b.onclick=()=>applyCalendarType(d.id);grid.appendChild(b)}});
 }
 const oldMake=makeProject;
 makeProject=function(opts){const d=getDef(opts.type);if(!d||d.builtin)return oldMake(opts);const mapped={...opts,type:d.baseType,sizePresetId:(SIZE_PRESETS[d.baseType]||[])[0]?.id,frontInsertCount:d.frontInsert?opts.frontInsertCount:0,rearInsertCount:d.rearInsert?opts.rearInsertCount:0};let p=oldMake(mapped);p.settings.type=d.id;p.settings.typeDefinition=structuredClone(d);p.productType.category=d.id;p.productType.id=`custom.${d.id}`;p.productType.duplex=d.duplex;p.productType.pageSize={width:d.width,height:d.height,unit:'mm'};p.template.typeDefinitionId=d.id;p.template.allowedObjects=d.allowedObjects;p.template.inputRequirements=d.monthlyImages?[{key:'school.name',type:'text',label:'학교명',required:true},{key:'calendar.monthlyImages',type:'monthly-image-set',label:'월별 이미지',required:false,months:d.monthlyCount}]:[{key:'school.name',type:'text',label:'학교명',required:true}];return p};
 const home=document.querySelector('.designer-home-actions');if(home&&!$('designerHomeTypes')){const b=document.createElement('button');b.id='designerHomeTypes';b.innerHTML='<strong>달력 유형 관리</strong><span>페이지 구조, 양·단면, 간지, 월력 규칙과 허용 개체를 사전에 정의합니다.</span>';home.appendChild(b)}
 function open(){$('entryScreen')?.classList.add('hidden');definitions=load();syncRuntime();$('typeManagerOverlay').classList.remove('hidden');fill(getDef(activeId)||definitions[0])}
 $('designerHomeTypes')?.addEventListener('click',open);$('closeTypeManagerBtn').onclick=()=>$('typeManagerOverlay').classList.add('hidden');$('typeManagerOverlay').addEventListener('click',e=>{if(e.target===$('typeManagerOverlay'))$('typeManagerOverlay').classList.add('hidden')});
 $('addTypeDefinitionBtn').onclick=()=>{const id=`custom-${Date.now().toString(36)}`;const d={...structuredClone(defaults[3]),id,name:'새 달력 유형',builtin:false};definitions.push(d);fill(d)};
 $('saveTypeDefinitionBtn').onclick=()=>{const d=readForm();if(!d.id||!d.name)return alert('유형 ID와 이름을 입력해 주세요.');const idx=definitions.findIndex(x=>x.id===activeId);if(idx>=0)definitions[idx]=d;else definitions.push(d);activeId=d.id;saveAll();fill(d);showEditorToast('달력 유형 설정을 저장했습니다.')};
 $('deleteTypeDefinitionBtn').onclick=()=>{const d=getDef(activeId);if(!d||d.builtin)return;if(!confirm(`${d.name} 유형을 삭제할까요?`))return;definitions=definitions.filter(x=>x.id!==activeId);activeId=definitions[0].id;saveAll();fill(definitions[0])};
 $('resetTypeDefinitionsBtn').onclick=()=>{if(!confirm('달력 유형 설정을 기본값으로 복원할까요?'))return;definitions=structuredClone(defaults);activeId='desk';saveAll();fill(definitions[0])};
 syncRuntime();renderList();
})();

(()=>{
 if(window.ACDLCalendarTypeDomain)return;
 const $=id=>document.getElementById(id),KEY='acdl.calendarTypeDefinitions.v37',DESK_SAMPLE_MIGRATION_KEY='acdl.deskSamples.v2';
 const starterCatalog=[
  {id:'desk-sample-6',name:'탁상형 6번 · 월별 플래너형'},
  {id:'desk-sample-3',name:'탁상형 3번 · 이미지 미니월력형'},
  {id:'desk-sample-2',name:'탁상형 2번 · 이미지 콜라주형'},
  {id:'school-basic',name:'학교 기본형'},
  {id:'minimal',name:'미니멀형'},
  {id:'photo',name:'사진형'},
  {id:'illustration',name:'일러스트형'},
  {id:'blank',name:'빈 템플릿'}
 ];
 const builtinSizes={
  desk:[
   {id:'desk-compact',name:'Compact',width:210,height:150,unit:'mm',recommended:false,note:'공간 효율을 중시한 소형 규격'},
   {id:'desk-standard',name:'Standard',width:260,height:180,unit:'mm',recommended:true,note:'학교용 탁상 달력 권장 규격'},
   {id:'desk-large',name:'Large',width:297,height:210,unit:'mm',recommended:false,note:'사진과 일정을 크게 보여주는 대형 규격'}
  ],
  wall:[
   {id:'wall-a4',name:'A4',width:210,height:297,unit:'mm',recommended:false,note:'교실과 개인 공간용 소형 규격'},
   {id:'wall-b4',name:'B4',width:257,height:364,unit:'mm',recommended:false,note:'가독성과 공간의 균형이 좋은 중형 규격'},
   {id:'wall-a3',name:'A3',width:297,height:420,unit:'mm',recommended:true,note:'학교 벽걸이 달력 권장 규격'}
  ],
  poster:[
   {id:'poster-a3',name:'A3',width:297,height:420,unit:'mm',recommended:true,note:'교실 게시용'},
   {id:'poster-a2',name:'A2',width:420,height:594,unit:'mm',recommended:false,note:'복도·교무실 게시용'}
  ],
  postcard:[
   {id:'postcard-148x100',name:'가로형',width:148,height:100,unit:'mm',recommended:true,note:'표지와 월별 사진을 넓게 구성'},
   {id:'postcard-100x148',name:'세로형',width:100,height:148,unit:'mm',recommended:false,note:'세로 사진과 월력을 조합'},
   {id:'postcard-a6',name:'A6',width:148,height:105,unit:'mm',recommended:false,note:'인쇄와 우편 규격 활용'}
  ]
 };
 function readDefs(){
  try{
   const stored=JSON.parse(localStorage.getItem(KEY)||'null');
   if(Array.isArray(stored)&&stored.length)return stored;
   const runtime=Array.isArray(window.ACDLCalendarTypeDefinitions)?window.ACDLCalendarTypeDefinitions:[];
   if(runtime.length){localStorage.setItem(KEY,JSON.stringify(runtime));return runtime}
   return []
  }catch{return Array.isArray(window.ACDLCalendarTypeDefinitions)?window.ACDLCalendarTypeDefinitions:[]}
 }
 function normalizeDef(d){
  const sizes=(Array.isArray(d.sizes)&&d.sizes.length?d.sizes:builtinSizes[d.id]||[{id:`${d.id}-default`,name:`${d.name} 기본`,width:Number(d.width||148),height:Number(d.height||100),unit:'mm',recommended:true,note:'달력 유형 기본 크기'}]).map((s,i)=>({id:s.id||`${d.id}-size-${i+1}`,name:s.name||s.label||`크기 ${i+1}`,width:Number(s.width),height:Number(s.height),unit:s.unit||'mm',recommended:!!s.recommended,note:s.note||''}));
  if(!sizes.some(s=>s.recommended)&&sizes[0])sizes[0].recommended=true;
  const rec=sizes.find(s=>s.recommended)||sizes[0];
  const savedStarters=Array.isArray(d.starterTemplates)&&d.starterTemplates.length?d.starterTemplates:['school-basic','minimal','blank'];
  const requiredStarters=d.id==='desk'?['desk-sample-6','desk-sample-3','desk-sample-2']:[];
  const starterTemplates=[...requiredStarters,...savedStarters.filter(id=>!requiredStarters.includes(id))];
  return {...d,width:rec?.width||d.width,height:rec?.height||d.height,sizes,starterTemplates};
 }
 function saveDefs(defs){localStorage.setItem(KEY,JSON.stringify(defs.map(normalizeDef)));window.ACDLCalendarTypeDefinitions=defs.map(normalizeDef);syncRuntimeFromDefinitions()}
 function migrate(){
  const defs=readDefs();
  if(!defs.length)return;
  if(!localStorage.getItem(DESK_SAMPLE_MIGRATION_KEY)){
   const desk=defs.find(d=>d.id==='desk');
   if(desk){
    const current=Array.isArray(desk.starterTemplates)?desk.starterTemplates:[];
    desk.starterTemplates=['desk-sample-6','desk-sample-3','desk-sample-2',...current.filter(id=>!['desk-sample-6','desk-sample-3','desk-sample-2'].includes(id))]
   }
   localStorage.setItem(DESK_SAMPLE_MIGRATION_KEY,'1')
  }
  saveDefs(defs)
 }
 function activeDefinition(){return readDefs().map(normalizeDef).find(d=>d.id===$('tmId')?.value)||null}
 function sizeLabel(s){return `${s.name} — ${s.width} × ${s.height} ${s.unit||'mm'}`}
 function syncRuntimeFromDefinitions(){
  const defs=readDefs().map(normalizeDef);window.ACDLCalendarTypeDefinitions=defs;
  defs.forEach(d=>{SIZE_PRESETS[d.id]=d.sizes.map(s=>({id:s.id,label:sizeLabel(s),width:s.width,height:s.height,note:s.note||`${d.name} 유형에서 관리되는 크기`,recommended:s.recommended}))});
  updateStarterTemplateOptions($('setupType')?.value);
  if($('setupType')?.value)renderSizeOptions();
 }
 function ensureManagerSections(){
  const editor=document.querySelector('.type-manager-editor');if(!editor||$('tmSizeEditor'))return;
  const allowed=[...editor.querySelectorAll('.type-form-section')].find(s=>s.querySelector('#tmAllowedObjects'));
  if(!allowed)return;
  const sizes=document.createElement('section');sizes.className='type-form-section';sizes.innerHTML='<h3>기본 크기 프리셋</h3><p class="resource-description">이 유형을 선택했을 때 표시할 제작 크기를 관리합니다. 추천 크기는 한 개만 지정합니다.</p><div id="tmSizeEditor" class="type-size-editor"></div><button id="tmAddSizeBtn" type="button" class="type-add-row">+ 크기 추가</button>';
  const starters=document.createElement('section');starters.className='type-form-section';starters.innerHTML='<h3>시작 템플릿</h3><p class="resource-description">새 템플릿을 만들 때 선택할 수 있는 기본 디자인 시작점을 지정합니다.</p><div id="tmStarterEditor" class="type-starter-grid"></div>';
  allowed.before(sizes,starters);
  $('tmAddSizeBtn').addEventListener('click',()=>addSizeRow({name:'새 크기',width:Number($('tmWidth').value||148),height:Number($('tmHeight').value||100),unit:'mm',recommended:false,note:''}));
 }
 function addSizeRow(s){
  const row=document.createElement('div');row.className='type-size-row';row.innerHTML=`<label>이름<input data-size-name value="${escapeAttr(s.name||'')}"></label><label>너비<input data-size-width type="number" min="20" value="${Number(s.width||148)}"></label><label>높이<input data-size-height type="number" min="20" value="${Number(s.height||100)}"></label><label>단위<select data-size-unit><option value="mm" ${(s.unit||'mm')==='mm'?'selected':''}>mm</option><option value="px" ${s.unit==='px'?'selected':''}>px</option></select></label><label class="inline-recommended"><input data-size-recommended type="radio" name="tmRecommendedSize" ${s.recommended?'checked':''}>추천</label><button type="button" class="type-row-delete">삭제</button><input data-size-id type="hidden" value="${escapeAttr(s.id||'')}"><label style="grid-column:1/-1">설명<input data-size-note value="${escapeAttr(s.note||'')}"></label>`;
  row.querySelector('.type-row-delete').onclick=()=>{if($('tmSizeEditor').children.length<=1)return alert('크기는 한 개 이상 필요합니다.');row.remove();if(!$('tmSizeEditor').querySelector('[data-size-recommended]:checked'))$('tmSizeEditor').querySelector('[data-size-recommended]').checked=true};
  $('tmSizeEditor').appendChild(row)
 }
 function fillEnhancements(d){
  ensureManagerSections();d=normalizeDef(d||activeDefinition()||{});$('tmSizeEditor').innerHTML='';d.sizes.forEach(addSizeRow);
  $('tmStarterEditor').innerHTML=starterCatalog.map(x=>`<label><input type="checkbox" data-starter-id="${x.id}" ${d.starterTemplates.includes(x.id)?'checked':''}>${x.name}</label>`).join('');
 }
 function readEnhancedForm(){
  const sizes=[...$('tmSizeEditor').querySelectorAll('.type-size-row')].map((r,i)=>({id:r.querySelector('[data-size-id]').value||`${$('tmId').value}-size-${i+1}`,name:r.querySelector('[data-size-name]').value.trim()||`크기 ${i+1}`,width:Number(r.querySelector('[data-size-width]').value),height:Number(r.querySelector('[data-size-height]').value),unit:r.querySelector('[data-size-unit]').value,recommended:r.querySelector('[data-size-recommended]').checked,note:r.querySelector('[data-size-note]').value.trim()}));
  if(!sizes.some(s=>s.recommended)&&sizes[0])sizes[0].recommended=true;
  return {sizes,starterTemplates:[...$('tmStarterEditor').querySelectorAll('[data-starter-id]:checked')].map(x=>x.dataset.starterId)}
 }
 function persistEnhanced(){
  const defs=readDefs().map(normalizeDef),id=$('tmId')?.value;if(!id||!$('tmSizeEditor'))return;
  const idx=defs.findIndex(d=>d.id===id);if(idx<0)return;const enhanced=readEnhancedForm();defs[idx]=normalizeDef({...defs[idx],...enhanced});saveDefs(defs);fillEnhancements(defs[idx]);showEditorToast('달력 유형의 크기와 시작 템플릿을 저장했습니다.')
 }
 function closeToDesigner(){
  $('typeManagerOverlay')?.classList.add('hidden');$('designerHome')?.classList.add('hidden');$('entryScreen')?.classList.remove('hidden');$('setup')?.classList.add('hidden');$('templateLibraryModal')?.classList.add('hidden')
 }
 function updateStarterTemplateOptions(typeId){
  const select=$('setupTemplate');if(!select)return;const d=readDefs().map(normalizeDef).find(x=>x.id===typeId);const fallback=typeId==='desk'?['desk-sample-6','desk-sample-3','desk-sample-2','school-basic','minimal']:['school-basic','minimal'];const ids=d?.starterTemplates?.length?d.starterTemplates:fallback;const required=typeId==='desk'?['desk-sample-6','desk-sample-3','desk-sample-2']:[];const visibleIds=[...required,...ids.filter(id=>!required.includes(id))];const current=select.value;select.innerHTML=starterCatalog.filter(x=>visibleIds.includes(x.id)).map(x=>`<option value="${x.id}">${x.name}</option>`).join('');if([...select.options].some(o=>o.value===current))select.value=current
 }
 migrate();ensureManagerSections();syncRuntimeFromDefinitions();
 $('designerHomeTypes')?.addEventListener('click',()=>setTimeout(()=>fillEnhancements(activeDefinition()),0));
 $('typeDefinitionList')?.addEventListener('click',e=>{const card=e.target.closest('[data-type-def]');if(card)setTimeout(()=>fillEnhancements(readDefs().map(normalizeDef).find(d=>d.id===card.dataset.typeDef)),0)});
 $('addTypeDefinitionBtn')?.addEventListener('click',()=>setTimeout(()=>fillEnhancements(activeDefinition()),0));
 $('resetTypeDefinitionsBtn')?.addEventListener('click',()=>setTimeout(()=>{migrate();fillEnhancements(activeDefinition());syncRuntimeFromDefinitions()},0));
 $('saveTypeDefinitionBtn')?.addEventListener('click',()=>setTimeout(persistEnhanced,0));
 $('closeTypeManagerBtn')?.addEventListener('click',closeToDesigner);
 $('typeManagerOverlay')?.addEventListener('click',e=>{if(e.target===$('typeManagerOverlay'))closeToDesigner()});
 $('setupType')?.addEventListener('change',()=>{syncRuntimeFromDefinitions();updateStarterTemplateOptions($('setupType').value)});
 const previousMake=makeProject;makeProject=function(opts){const result=previousMake(opts),defs=readDefs().map(normalizeDef),d=defs.find(x=>x.id===opts.type),preset=d?.sizes?.find(s=>s.id===opts.sizePresetId)||d?.sizes?.find(s=>s.recommended)||d?.sizes?.[0];if(d){result.settings.typeDefinition=structuredClone(d);result.template.typeDefinitionId=d.id;result.template.starterTemplateId=opts.template;if(preset){result.settings.sizePreset={id:preset.id,label:sizeLabel(preset),width:preset.width,height:preset.height};result.productType.pageSize={width:preset.width,height:preset.height,unit:preset.unit||'mm'}}}return result};
 updateStarterTemplateOptions($('setupType')?.value||'desk');
})();
