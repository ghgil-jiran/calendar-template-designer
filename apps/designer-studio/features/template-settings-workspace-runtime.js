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
    let inner=`<div class="year-calendar-object" style="--year-cols:${cols};--year-rows:${Math.ceil(count/cols)}">`;
    seq.forEach(mm=>{const rows=yearCalendarRowCountFor(view,mm.year,mm.month),monthNames=['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'],label=view.monthLabelStyle==='number-en'?`${mm.month} <small>${monthNames[mm.month-1]}</small>`:`${mm.month}월`,weekdayRows=view.showWeekdayHeader===false?'':'auto ';inner+=`<div class="year-month"><strong>${label}</strong><div class="year-month-grid" style="--year-calendar-rows:${rows};grid-template-rows:${weekdayRows}repeat(${rows},1fr)">`;if(view.showWeekdayHeader!==false)weekDayHeaders(true).forEach(x=>inner+=`<span class="mh">${x}</span>`);calendarGridFor(mm.year,mm.month,rows).forEach(c=>{const date=`${c.year}-${String(c.month).padStart(2,'0')}-${String(c.day).padStart(2,'0')}`,evs=byDate[date]||[],holiday=evs.some(e=>e.category==='holiday'),dow=new Date(c.year,c.month-1,c.day).getDay(),cls=[c.month!==mm.month?'adj':'','year-day',dow===0?'sun':dow===6?'sat':'',holiday?'holiday':''].filter(Boolean).join(' '),dot=evs.length?`<i class="year-event-dot" style="--event-dot:${eventColor(evs[0])}" title="${evs.map(e=>v21Escape(e.title)).join(' · ')}"></i>${evs.length>1?`<b class="year-event-count">${evs.length}</b>`:''}`:'';inner+=`<span class="${cls}">${c.day}${dot}</span>`});inner+='</div></div>'});
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
  $('fullPreviewBtn')?.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();window.openFullPreview()},true);

  setTimeout(()=>{markPosterSpecificFields();refreshUserOptionVisibility();if(project?.mode==='calendar-workspace')$('templateSettingsBtn').textContent='달력 설정'},0);
  const oldRender=window.render;window.render=function(){const r=oldRender.apply(this,arguments);if(project?.mode==='calendar-workspace')$('templateSettingsBtn').textContent='달력 설정';return r};
})();
