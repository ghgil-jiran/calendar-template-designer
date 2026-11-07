(function(root){
 const PRESETS=Object.freeze([
  {id:'school-symbols',label:'학교 상징',layoutId:'split-panels',objects:['title','school-logo','school-motto','school-song','school-tree','school-flower'],imageSource:'school-assets',fallback:'free'},
  {id:'school-introduction',label:'학교 소개',layoutId:'school-intro-center-image',objects:['title','school-building'],imageSource:'school-assets',fallback:'free'},
  {id:'yearly-plan',label:'Yearly Plan',layoutId:'yearly-open-grid',objects:['yearly-plan'],imageSource:'none',fallback:'free'},
  {id:'annual-calendar',label:'연력',layoutId:'open-grid',objects:['annual-calendar'],imageSource:'none',fallback:'free'},
  {id:'academic-schedule',label:'학사일정',layoutId:'schedule-open-grid',objects:['title','schedule-list'],imageSource:'none',fallback:'free'},
  {id:'free',label:'사용자 정의',layoutId:'open-gallery',objects:[],imageSource:'user-assets',fallback:null},
  {id:'blank',label:'빈 페이지',layoutId:'open-gallery',objects:[],imageSource:'none',fallback:null}
 ]);
 const OBJECTS=Object.freeze([['title','제목'],['body','본문'],['school-name','학교명'],['school-building','학교 사진'],['school-logo','교표'],['school-motto','교훈'],['school-song','교가'],['school-tree','교목'],['school-flower','교화'],['image-slot','사용자 이미지'],['annual-calendar','연간 월력'],['mini-calendar','미니 월력'],['schedule-list','일정 목록'],['yearly-plan','Yearly Plan']]);
 const IMAGE_SOURCES=Object.freeze([['school-assets','학교 정보 및 에셋'],['user-assets','사용자 등록 이미지'],['template-assets','템플릿 그래픽 라이브러리'],['none','이미지 사용 안 함']]);
 const SCHOOL_SYMBOL_LAYOUTS=Object.freeze([
  ['individual-cards','개별 카드형','각 상징과 교가를 독립 카드로 구분'],
  ['split-panels','좌우 분할형','왼쪽 상징 묶음과 오른쪽 교가를 분리'],
  ['open-editorial','오픈형','박스 없이 여백과 정렬로 구분'],
  ['ruled-editorial','구분선형','제목 아래 선으로 단락을 구분']
 ]);
 const ACADEMIC_SCHEDULE_LAYOUTS=Object.freeze([
  ['schedule-open-grid','구분 박스 없는 유형','월과 일정을 4×3 배열로 정돈'],
  ['schedule-month-cards','월별 개별 박스형','12개월을 각각 독립 카드로 구분'],
  ['schedule-vertical-groups','세로 박스형','세로 박스 4개에 각각 3개월 배치'],
  ['schedule-horizontal-groups','가로 박스형','가로 박스 3개에 각각 4개월 배치']
 ]);
 const SCHOOL_INTRODUCTION_LAYOUTS=Object.freeze([
  ['school-intro-center-image','상단 제목·중앙 이미지형','제목 아래에 학교 이미지를 넓게 배치'],
  ['school-intro-left-image','좌측 이미지·우측 정보형','왼쪽 학교 이미지와 오른쪽 교표·교훈을 분리'],
  ['school-intro-background-image','배경 이미지·상단 제목형','학교 이미지를 넓게 쓰고 제목과 선택 개체를 위에 배치']
 ]);
 const YEARLY_PLAN_LAYOUTS=Object.freeze([
  ['yearly-open-grid','월 구분 박스 없음','12개월 계획을 열린 4×3 배열로 정돈'],
  ['yearly-month-cards','월별 개별 박스형','12개월 계획을 각각 독립 카드로 구분'],
  ['yearly-vertical-groups','세로 박스형','세로 박스 4개에 각각 3개월 계획 배치'],
  ['yearly-horizontal-groups','가로 박스형','가로 박스 3개에 각각 4개월 계획 배치']
 ]);
 const ANNUAL_LAYOUTS=Object.freeze([
  ['open-grid','월 구분 박스 없음','12개월 날짜를 열린 4×3 배열로 읽습니다'],
  ['individual-month-boxes','월별 개별 박스형','12개월 날짜를 독립된 월 박스로 구분합니다'],
  ['vertical-three-month-groups','세로 3개월 그룹형','3개월씩 묶은 세로 그룹 4개를 만듭니다'],
  ['horizontal-four-month-groups','가로 4개월 그룹형','4개월씩 묶은 가로 그룹 3개를 만듭니다']
 ]);
 const GENERIC_LAYOUTS=Object.freeze([['content-led','콘텐츠 중심형'],['editorial-cards','에디토리얼형'],['heritage-document','기록 문서형'],['open-gallery','여백 갤러리형']]);
 const defaults=target=>target.sourceRole==='cover-back'?PRESETS[3]:target.sourceRole==='back-cover-front'?PRESETS[0]:target.surface==='back'?PRESETS[0]:PRESETS[1];
 const esc=value=>String(value??'').replace(/[&<>"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[char]));
 const preset=id=>PRESETS.find(item=>item.id===id)||PRESETS.find(item=>item.id==='free');
 const layoutsFor=purpose=>purpose==='school-symbols'?SCHOOL_SYMBOL_LAYOUTS:purpose==='school-introduction'?SCHOOL_INTRODUCTION_LAYOUTS:purpose==='yearly-plan'?YEARLY_PLAN_LAYOUTS:purpose==='annual-calendar'?ANNUAL_LAYOUTS:purpose==='academic-schedule'?ACADEMIC_SCHEDULE_LAYOUTS:GENERIC_LAYOUTS;
 const semanticRule=purpose=>root.ACDLPageCompositionPolicy?.rule('divider',purpose);
 const objectsFor=purpose=>purpose==='school-introduction'?[['school-logo','교표'],['school-motto','교훈']]:purpose==='yearly-plan'?[]:OBJECTS;
 function projectValue(){return root.project||(typeof project!=='undefined'?project:null)}
 function install(){
  const page=document.querySelector('[data-resource-content="page-settings"]'),mount=document.getElementById('pageSettingsDividerMount');
  if(!page||document.getElementById('dividerCompositionCard'))return;
  const card=document.createElement('div');card.id='dividerCompositionCard';card.className='ai-divider-composition-options';
  card.innerHTML='<div class="settings-section-head"><div><h4>안쪽면·간지 페이지 구성</h4><p class="resource-description">표지 안쪽면, 간지 앞·뒷면, 뒷표지 안쪽면의 목적과 개체를 실제 면별로 설정합니다.</p></div><span class="desk-only-badge">실제 면 기준</span></div><div id="dividerCompositionList" class="divider-composition-list"></div>';
  if(mount)mount.appendChild(card);else page.appendChild(card);render();
 }
 function targets(){const pages=projectValue()?.book?.pageInstances||[];return pages.filter(page=>['cover-back','back-cover-front'].includes(page.role)||/^(front|rear)-insert-(front|back)$/.test(page.role)).map(page=>({pageId:page.id,sourceRole:page.role,position:page.role==='cover-back'?'cover':page.role==='back-cover-front'?'back-cover':page.role.startsWith('rear-')?'rear':'front',surface:page.role.endsWith('-back')?'back':'front',insertIndex:page.insertIndex||null}))}
 function targetLabel(target){if(target.sourceRole==='cover-back')return '표지 안쪽면';if(target.sourceRole==='back-cover-front')return '뒷표지 안쪽면';return `${target.position==='rear'?'뒤':'앞'} 간지 ${target.insertIndex||1} ${target.surface==='back'?'뒷면':'앞면'}`}
 function current(){return root.ACDLDesignSpec.read(projectValue(),root.ACDLDesignTypeCatalog)}
 function entryFor(target,spec){const base=defaults(target),saved=spec.dividerPages?.[target.pageId]||{},chosen=preset(saved.purpose||base.id),valid=layoutsFor(chosen.id).map(item=>item[0]);return {purpose:chosen.id,layoutId:valid.includes(saved.layoutId)?saved.layoutId:chosen.layoutId,objects:Array.isArray(saved.objects)?saved.objects:chosen.objects,imageSource:saved.imageSource||chosen.imageSource,fallbackPreset:saved.fallbackPreset===undefined?chosen.fallback:saved.fallbackPreset}}
 function presetOptions(selected){return PRESETS.map(item=>`<option value="${item.id}" ${selected===item.id?'selected':''}>${item.label}</option>`).join('')}
 function fallbackOptions(selected){return '<option value="">대체 구성 없음</option>'+PRESETS.map(item=>`<option value="${item.id}" ${selected===item.id?'selected':''}>${item.label}</option>`).join('')}
 function symbolBoxes(objects){return root.ACDLPageCompositionPolicy.schoolSymbolBoxes(objects,projectValue()?.productType?.pageSize)}
 function genericBoxes(objects){const count=Math.max(1,objects.length),columns=count>2?2:1,gap=3,width=(86-gap*(columns-1))/columns,rows=Math.ceil(count/columns),height=(74-gap*(rows-1))/rows;return objects.map((id,index)=>({id,x:7+index%columns*(width+gap),y:17+Math.floor(index/columns)*(height+gap),width,height}))}
 function scheduleBoxes(layoutId){if(layoutId==='schedule-vertical-groups')return Array.from({length:4},(_,index)=>({id:`3개월`,x:6+index*22.5,y:18,width:20.5,height:72}));if(layoutId==='schedule-horizontal-groups')return Array.from({length:3},(_,index)=>({id:`4개월`,x:6,y:18+index*25,width:88,height:22}));return Array.from({length:12},(_,index)=>({id:`${index+1}월`,x:6+(index%4)*22.5,y:18+Math.floor(index/4)*25,width:20.5,height:22}))}
 function schoolIntroductionBoxes(objects,layoutId){return root.ACDLPageCompositionPolicy.schoolIntroductionBoxes(objects,layoutId,projectValue()?.productType?.pageSize)}
 function yearlyPlanBoxes(layoutId){if(layoutId==='yearly-vertical-groups')return Array.from({length:4},(_,index)=>({id:'3개월 계획',x:6+index*22.5,y:16,width:20.5,height:76}));if(layoutId==='yearly-horizontal-groups')return Array.from({length:3},(_,index)=>({id:'4개월 계획',x:6,y:16+index*26,width:88,height:23}));return Array.from({length:12},(_,index)=>({id:`${index+1}월`,x:6+(index%4)*22.5,y:16+Math.floor(index/4)*26,width:20.5,height:23}))}
 function annualPreview(layoutId){
  const project=projectValue(),year=Number(project?.settings?.year)||2027,startMonth=Number(project?.settings?.startMonth)||3;
  const zones=root.ACDLPageCompositionPolicy.annualZones(layoutId),position=zone=>`left:${zone.x}%;top:${zone.y}%;width:${zone.width}%;height:${zone.height}%`;
  const annual=root.ACDLPageCompositionRuntime?.resolveAnnualCalendar?.({type:'year-calendar',layoutType:layoutId,startMonth,monthCount:12,columns:4,showWeekdayHeader:true},{calendarYear:year},{year,startMonth});
  if(!annual)return '';
  const month=item=>`<div class="annual-card-month"><strong>${esc(item.label)}</strong><div class="annual-card-days">${(item.headers||[]).map(day=>`<b>${esc(day)}</b>`).join('')}${(item.cells||[]).map(day=>`<span class="${day.month===item.month?'':'adj'}">${esc(day.day)}</span>`).join('')}</div></div>`;
  const groups=annual.groupSize?Array.from({length:12/annual.groupSize},(_,index)=>`<div class="annual-card-group">${annual.months.slice(index*annual.groupSize,(index+1)*annual.groupSize).map(month).join('')}</div>`).join(''):annual.months.map(month).join('');
  return `<span class="annual-card-logo" style="${position(zones.logo)}">교표</span><strong class="annual-card-title" style="${position(zones.title)}">${esc(year)}학년도 연력</strong><div class="annual-card-preview annual-card-${layoutId}" style="${position(zones.content)}" aria-label="${esc(year)}학년도 연력 ${esc(layoutId)}">${groups}</div>`;
 }
 function twelveMonthPreview(purpose,layoutId){
  const project=projectValue(),year=Number(project?.settings?.year)||2027,startMonth=Number(project?.settings?.startMonth)||3,runtime=root.ACDLPageCompositionRuntime;
  const zones=root.ACDLPageCompositionPolicy.twelveMonthZones(purpose,{title:purpose==='academic-schedule'}),contentZone=zones.content;
  const schedule=purpose==='academic-schedule'?runtime?.resolveScheduleEvents?.(project?.book?.events||[],{type:'event-list',displayMode:'year-by-month',startMonth,monthCount:12},{calendarYear:year},{year,startMonth}):null;
  const plan=purpose==='yearly-plan'?runtime?.resolveMemoLayout?.({memoLayout:'yearly-grid',startMonth,baseYear:year,yearlyLayoutType:layoutId,yearlyColumns:4}):null;
  const months=purpose==='academic-schedule'?(schedule?.groups||[]).map(group=>({year:group.year,month:group.month,items:group.items})):(plan?.yearlyMonths||[]).map(item=>({...item,items:[]}));
  const renderMonth=item=>`<div class="purpose-card-month"><strong>${item.year!==year?`${item.year} `:''}${item.month}월</strong>${purpose==='academic-schedule'?`<div class="purpose-card-events">${item.items.length?item.items.slice(0,2).map(event=>`<span>${esc(String(event.startDate||'').slice(8))} ${esc(event.title||event.name||'')}</span>`).join(''):'<span>일정 없음</span>'}</div>`:'<div class="purpose-card-lines"><i></i><i></i><i></i></div>'}</div>`;
  const groupSize=layoutId.includes('vertical-groups')?3:layoutId.includes('horizontal-groups')?4:0;
  const content=groupSize?Array.from({length:Math.ceil(months.length/groupSize)},(_,index)=>`<div class="purpose-card-group">${months.slice(index*groupSize,(index+1)*groupSize).map(renderMonth).join('')}</div>`).join(''):months.map(renderMonth).join('');
  const title=purpose==='academic-schedule'?`<strong class="purpose-card-title" style="left:${zones.title.x}%;top:${zones.title.y}%;width:${zones.title.width}%;height:${zones.title.height}%">${esc(year)}학년도 학사일정</strong>`:'';
  return `${title}<div class="purpose-card-preview ${purpose==='yearly-plan'?'purpose-plan':'purpose-schedule'} ${groupSize===3?'purpose-vertical':groupSize===4?'purpose-horizontal':''} ${layoutId.includes('month-cards')?'purpose-boxes':''}" style="left:${contentZone.x}%;top:${contentZone.y}%;width:${contentZone.width}%;height:${contentZone.height}%" aria-label="${esc(year)}학년도 ${purpose==='yearly-plan'?'월별 계획':'학사일정'}">${content}</div>`;
 }
 function symbolPreview(objects,layoutId){const labels=Object.fromEntries(OBJECTS);return symbolBoxes(objects).map(box=>{const label=labels[box.id]||box.id,score=box.id==='school-song';return `<span class="ai-layout-box layout-${box.id}" style="left:${box.x}%;top:${box.y}%;width:${box.width}%;height:${box.height}%"><b>${esc(label)}</b>${score?'<i class="purpose-score-lines"></i>':box.id==='school-motto'?'<small>교훈 문구</small>':box.id==='school-tree'||box.id==='school-flower'?'<small>이미지 · 설명</small>':''}</span>`}).join('')}
 function schoolIntroductionPreview(objects,layoutId){return schoolIntroductionBoxes(objects,layoutId).map(box=>`<span class="ai-layout-box intro-${box.id}" style="left:${box.x}%;top:${box.y}%;width:${box.width}%;height:${box.height}%">${box.id==='school-building'?'<i class="intro-building-roof"></i><i class="intro-building-front"></i><small>학교 전경 사진</small>':box.id==='school-logo'?'교표':box.id==='school-motto'?'교훈 문구':'학교 소개'}</span>`).join('')}
 function layoutCards(entry){const labels=Object.fromEntries(OBJECTS);return `<div class="divider-layout-options"><strong>3. 대표 배치</strong><div class="ai-layout-grid">${layoutsFor(entry.purpose).map(([id,name,description])=>`<label class="ai-layout-card${entry.layoutId===id?' selected':''}"><input type="radio" name="divider-layout-${esc(entry.pageId)}" value="${id}" data-divider-layout ${entry.layoutId===id?'checked':''}><header><strong>${name}</strong><span>${['academic-schedule','yearly-plan'].includes(entry.purpose)?'12개월':`${entry.objects.length}개`}</span></header><div class="ai-layout-wireframe symbol-layout-${id}" style="aspect-ratio:${Number(projectValue()?.productType?.pageSize?.width)||260}/${Number(projectValue()?.productType?.pageSize?.height)||180}">${entry.purpose==='annual-calendar'?annualPreview(id):entry.purpose==='school-symbols'?symbolPreview(entry.objects,id):entry.purpose==='school-introduction'?schoolIntroductionPreview(entry.objects,id):['academic-schedule','yearly-plan'].includes(entry.purpose)?twelveMonthPreview(entry.purpose,id):genericBoxes(entry.objects).map(box=>`<span class="ai-layout-box layout-${box.id}" style="left:${box.x}%;top:${box.y}%;width:${box.width}%;height:${box.height}%">${labels[box.id]||box.id}</span>`).join('')}</div>${description?`<small>${description}</small>`:''}</label>`).join('')}</div></div>`}
 function render(){
  const host=document.getElementById('dividerCompositionList');if(!host)return;
  const spec=current(),items=targets(),card=document.getElementById('dividerCompositionCard');if(card)card.hidden=!items.length;
  host.innerHTML=items.length?items.map(target=>{const entry={...entryFor(target,spec),pageId:target.pageId},selectable=objectsFor(entry.purpose),fixed=entry.purpose==='school-introduction'?'<p class="resource-description">기본 개체: 제목·학교 이미지</p>':entry.purpose==='yearly-plan'?'<p class="resource-description">기본 개체: 12개월 Yearly Plan</p>':'';return `<article class="page-type-card divider-page-composition" data-divider-page="${esc(target.pageId)}"><header><strong>${esc(targetLabel(target))}</strong><small>${esc(target.pageId)}</small></header><div class="settings-grid"><label>1. 구성 형태<select data-divider-purpose>${presetOptions(entry.purpose)}</select></label><label>이미지 출처<select data-divider-image-source>${IMAGE_SOURCES.map(([id,label])=>`<option value="${id}" ${entry.imageSource===id?'selected':''}>${label}</option>`).join('')}</select></label><label>데이터가 없을 때<select data-divider-fallback>${fallbackOptions(entry.fallbackPreset)}</select></label></div><div class="divider-object-options"><strong>2. 포함 개체</strong>${fixed}${selectable.length?`<div class="checkbox-grid">${selectable.map(([id,label])=>{const required=semanticRule(entry.purpose)?.required.includes(id);return `<label><input type="checkbox" value="${id}" data-divider-object ${entry.objects.includes(id)||required?'checked':''} ${required?'disabled':''}>${label}${required?' · 필수':''}</label>`}).join('')}</div>`:''}</div>${layoutCards(entry)}<p class="ai-month-back-note">개체의 실제 위치·크기·가독성은 AI 보호 조건으로 전달됩니다. 카드와 구분선은 이미지에 굽지 않고 편집 가능한 스타일로 적용됩니다.</p></article>`}).join(''):'<div class="design-type-unsupported">현재 설정할 수 있는 안쪽면이나 간지 페이지가 없습니다.</div>';
 }
 function collect(spec=current()){spec.dividerPages=Object.fromEntries([...document.querySelectorAll('[data-divider-page]')].map(card=>{const purpose=card.querySelector('[data-divider-purpose]').value,selected=[...card.querySelectorAll('[data-divider-object]:checked')].map(input=>input.value),objects=purpose==='school-introduction'?['title','school-building',...selected]:purpose==='yearly-plan'?['yearly-plan']:selected;return [card.dataset.dividerPage,{purpose,layoutId:card.querySelector('[data-divider-layout]:checked')?.value||layoutsFor(purpose)[0][0],imageSource:card.querySelector('[data-divider-image-source]').value,fallbackPreset:card.querySelector('[data-divider-fallback]').value||null,objects}]}));return spec}
 function surfaceKey(page){return `${page.role}:${Number(page.insertIndex)||0}`}
 function capture(project,spec=current()){const pages=project?.book?.pageInstances||[];return Object.fromEntries(pages.flatMap(page=>spec.dividerPages?.[page.id]?[[surfaceKey(page),spec.dividerPages[page.id]]]:[]))}
 function restore(project,spec,snapshot={}){spec.dividerPages=Object.fromEntries((project?.book?.pageInstances||[]).flatMap(page=>snapshot[surfaceKey(page)]?[[page.id,snapshot[surfaceKey(page)]]]:[]));return spec}
 function applyToPages(project,spec=current()){const semantics={'annual-calendar':'yearly-calendar','school-symbols':'school-symbols','school-introduction':'divider','yearly-plan':'divider','academic-schedule':'divider',free:'divider',blank:'blank'};(project?.book?.pageInstances||[]).forEach(page=>{const entry=spec.dividerPages?.[page.id];if(!entry)return;page.contentPurpose=entry.purpose;page.semanticPageRole=semantics[entry.purpose]||'divider'});return project}
 document.addEventListener('change',event=>{
  const card=event.target.closest?.('[data-divider-page]');if(!card)return;
  const spec=collect(),pageId=card.dataset.dividerPage;
  if(event.target.matches('[data-divider-purpose]')){const item=preset(event.target.value),rule=semanticRule(item.id),supported=rule?.layouts.some(id=>layoutsFor(item.id).some(([layout])=>layout===id));spec.dividerPages[pageId]={purpose:item.id,layoutId:supported?rule.layouts.find(id=>layoutsFor(item.id).some(([layout])=>layout===id)):item.layoutId,imageSource:item.imageSource,fallbackPreset:item.fallback,objects:rule?.defaults.length||rule?.required.length?root.ACDLPageCompositionPolicy.initial('divider',item.id):[...item.objects]}}
  root.ACDLDesignSpec.write(projectValue(),spec,root.ACDLDesignTypeCatalog);render();
 });
 document.addEventListener('click',event=>{if(event.target.closest?.('[data-resource-page="page-settings"]'))setTimeout(()=>{install();render()},0)});
 install();root.ACDLDividerComposition=Object.freeze({PRESETS,OBJECTS,IMAGE_SOURCES,SCHOOL_SYMBOL_LAYOUTS,SCHOOL_INTRODUCTION_LAYOUTS,YEARLY_PLAN_LAYOUTS,ACADEMIC_SCHEDULE_LAYOUTS,render,entryFor,collect,applyToPages,targets,targetLabel,capture,restore,surfaceKey});
})(typeof window==='undefined'?globalThis:window);
