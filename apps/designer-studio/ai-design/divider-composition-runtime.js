(function(root){
 const PRESETS=Object.freeze([
  {id:'school-symbols',label:'학교 상징',layoutId:'split-panels',objects:['title','school-logo','school-motto','school-song','school-tree','school-flower'],imageSource:'school-assets',fallback:'free'},
  {id:'school-introduction',label:'학교 소개',layoutId:'content-led',objects:['school-building','school-logo','school-name','body'],imageSource:'school-assets',fallback:'free'},
  {id:'yearly-plan',label:'Yearly Plan',layoutId:'editorial-cards',objects:['yearly-plan'],imageSource:'none',fallback:'free'},
  {id:'annual-calendar',label:'연력',layoutId:'heritage-document',objects:['annual-calendar'],imageSource:'none',fallback:'free'},
  {id:'free',label:'사용자 정의',layoutId:'open-gallery',objects:[],imageSource:'user-assets',fallback:null}
 ]);
 const OBJECTS=Object.freeze([['title','제목'],['body','본문'],['school-name','학교명'],['school-building','학교 사진'],['school-logo','교표'],['school-motto','교훈'],['school-song','교가'],['school-tree','교목'],['school-flower','교화'],['image-slot','사용자 이미지'],['annual-calendar','연간 월력'],['mini-calendar','미니 월력'],['schedule-list','일정 목록'],['history-list','학교 연혁'],['vision','교육 목표/비전'],['yearly-plan','Yearly Plan'],['yearly-checklist','Yearly Checklist']]);
 const IMAGE_SOURCES=Object.freeze([['school-assets','학교 정보 및 에셋'],['user-assets','사용자 등록 이미지'],['template-assets','템플릿 그래픽 라이브러리'],['none','이미지 사용 안 함']]);
 const SCHOOL_SYMBOL_LAYOUTS=Object.freeze([
  ['individual-cards','개별 카드형','각 상징과 교가를 독립 카드로 구분'],
  ['split-panels','좌우 분할형','왼쪽 상징 묶음과 오른쪽 교가를 분리'],
  ['open-editorial','오픈형','박스 없이 여백과 정렬로 구분'],
  ['ruled-editorial','구분선형','제목 아래 선으로 단락을 구분']
 ]);
 const GENERIC_LAYOUTS=Object.freeze([['content-led','콘텐츠 중심형'],['editorial-cards','에디토리얼형'],['heritage-document','기록 문서형'],['open-gallery','여백 갤러리형']]);
 const defaults=target=>target.surface==='back'?PRESETS[0]:PRESETS[1];
 const esc=value=>String(value??'').replace(/[&<>"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[char]));
 const preset=id=>PRESETS.find(item=>item.id===id)||PRESETS.find(item=>item.id==='free');
 const layoutsFor=purpose=>purpose==='school-symbols'?SCHOOL_SYMBOL_LAYOUTS:GENERIC_LAYOUTS;
 function projectValue(){return root.project||(typeof project!=='undefined'?project:null)}
 function install(){
  const page=document.querySelector('[data-resource-content="page-settings"]'),mount=document.getElementById('pageSettingsDividerMount');
  if(!page||document.getElementById('dividerCompositionCard'))return;
  const card=document.createElement('div');card.id='dividerCompositionCard';card.className='ai-divider-composition-options';
  card.innerHTML='<div class="settings-section-head"><div><h4>간지 페이지 구성</h4><p class="resource-description">1. 구성 형태 → 2. 포함 개체 → 3. 대표 배치 순으로 실제 간지를 설정합니다. 변경 내용은 페이지 설정 저장으로 함께 저장됩니다.</p></div><span class="desk-only-badge">실제 간지 기준</span></div><div id="dividerCompositionList" class="divider-composition-list"></div>';
  if(mount)mount.appendChild(card);else page.appendChild(card);render();
 }
 function targets(){return root.ACDLAIGenerationContext?.build(projectValue())?.roles?.find(role=>role.role==='divider')?.targets||[]}
 function current(){return root.ACDLDesignSpec.read(projectValue(),root.ACDLDesignTypeCatalog)}
 function entryFor(target,spec){const base=defaults(target),saved=spec.dividerPages?.[target.pageId]||{},chosen=preset(saved.purpose||base.id),valid=layoutsFor(chosen.id).map(item=>item[0]);return {purpose:chosen.id,layoutId:valid.includes(saved.layoutId)?saved.layoutId:chosen.layoutId,objects:Array.isArray(saved.objects)?saved.objects:chosen.objects,imageSource:saved.imageSource||chosen.imageSource,fallbackPreset:saved.fallbackPreset===undefined?chosen.fallback:saved.fallbackPreset}}
 function presetOptions(selected){return PRESETS.map(item=>`<option value="${item.id}" ${selected===item.id?'selected':''}>${item.label}</option>`).join('')}
 function fallbackOptions(selected){return '<option value="">대체 구성 없음</option>'+PRESETS.map(item=>`<option value="${item.id}" ${selected===item.id?'selected':''}>${item.label}</option>`).join('')}
 function symbolBoxes(objects){
  const hasSong=objects.includes('school-song'),left=hasSong?{x:7,y:20,width:40,height:70}:{x:8,y:20,width:84,height:70},boxes=[];
  if(objects.includes('title'))boxes.push(['title',8,6,84,9]);
  if(objects.includes('school-logo'))boxes.push(['school-logo',7,6,10,10]);
  if(objects.includes('school-motto'))boxes.push(['school-motto',left.x,left.y,left.width,18]);
  const symbols=['school-tree','school-flower'].filter(id=>objects.includes(id)),startY=left.y+(objects.includes('school-motto')?24:0),height=left.height-(objects.includes('school-motto')?24:0),gap=2,width=(left.width-gap*Math.max(0,symbols.length-1))/Math.max(1,symbols.length);
  symbols.forEach((id,index)=>boxes.push([id,left.x+index*(width+gap),startY,width,height]));
  if(hasSong)boxes.push(['school-song',53,18,40,74]);
  return boxes.map(([id,x,y,widthValue,heightValue])=>({id,x,y,width:widthValue,height:heightValue}));
 }
 function genericBoxes(objects){const count=Math.max(1,objects.length),columns=count>2?2:1,gap=3,width=(86-gap*(columns-1))/columns,rows=Math.ceil(count/columns),height=(74-gap*(rows-1))/rows;return objects.map((id,index)=>({id,x:7+index%columns*(width+gap),y:17+Math.floor(index/columns)*(height+gap),width,height}))}
 function layoutCards(entry){const labels=Object.fromEntries(OBJECTS);return `<div class="divider-layout-options"><strong>3. 대표 배치</strong><div class="ai-layout-grid">${layoutsFor(entry.purpose).map(([id,name,description])=>`<label class="ai-layout-card${entry.layoutId===id?' selected':''}"><input type="radio" name="divider-layout-${esc(entry.pageId)}" value="${id}" data-divider-layout ${entry.layoutId===id?'checked':''}><header><strong>${name}</strong><span>${entry.objects.length}개</span></header><div class="ai-layout-wireframe symbol-layout-${id}">${(entry.purpose==='school-symbols'?symbolBoxes(entry.objects):genericBoxes(entry.objects)).map(box=>`<span class="ai-layout-box layout-${box.id}" style="left:${box.x}%;top:${box.y}%;width:${box.width}%;height:${box.height}%">${labels[box.id]||box.id}</span>`).join('')}</div>${description?`<small>${description}</small>`:''}</label>`).join('')}</div></div>`}
 function render(){
  const host=document.getElementById('dividerCompositionList');if(!host)return;
  const spec=current(),items=targets(),card=document.getElementById('dividerCompositionCard');if(card)card.hidden=!items.length;
  host.innerHTML=items.length?items.map((target,index)=>{const entry={...entryFor(target,spec),pageId:target.pageId};return `<article class="page-type-card divider-page-composition" data-divider-page="${esc(target.pageId)}"><header><strong>간지 ${index+1}</strong><small>${esc(target.position)} · ${esc(target.surface)} · ${esc(target.pageId)}</small></header><div class="settings-grid"><label>1. 구성 형태<select data-divider-purpose>${presetOptions(entry.purpose)}</select></label><label>이미지 출처<select data-divider-image-source>${IMAGE_SOURCES.map(([id,label])=>`<option value="${id}" ${entry.imageSource===id?'selected':''}>${label}</option>`).join('')}</select></label><label>데이터가 없을 때<select data-divider-fallback>${fallbackOptions(entry.fallbackPreset)}</select></label></div><div class="divider-object-options"><strong>2. 포함 개체</strong><div class="checkbox-grid">${OBJECTS.map(([id,label])=>`<label><input type="checkbox" value="${id}" data-divider-object ${entry.objects.includes(id)?'checked':''}>${label}</label>`).join('')}</div></div>${layoutCards(entry)}<p class="ai-month-back-note">개체의 실제 위치·크기·가독성은 AI 보호 조건으로 전달됩니다. 카드와 구분선은 이미지에 굽지 않고 편집 가능한 스타일로 적용됩니다.</p></article>`}).join(''):'<div class="design-type-unsupported">현재 템플릿에 간지 페이지가 없습니다. 간지를 추가하면 이곳에 페이지별 설정이 나타납니다.</div>';
 }
 function collect(spec=current()){spec.dividerPages=Object.fromEntries([...document.querySelectorAll('[data-divider-page]')].map(card=>{const purpose=card.querySelector('[data-divider-purpose]').value;return [card.dataset.dividerPage,{purpose,layoutId:card.querySelector('[data-divider-layout]:checked')?.value||layoutsFor(purpose)[0][0],imageSource:card.querySelector('[data-divider-image-source]').value,fallbackPreset:card.querySelector('[data-divider-fallback]').value||null,objects:[...card.querySelectorAll('[data-divider-object]:checked')].map(input=>input.value)}]}));return spec}
 document.addEventListener('change',event=>{
  const card=event.target.closest?.('[data-divider-page]');if(!card)return;
  const spec=collect(),pageId=card.dataset.dividerPage;
  if(event.target.matches('[data-divider-purpose]')){const item=preset(event.target.value);spec.dividerPages[pageId]={purpose:item.id,layoutId:item.layoutId,imageSource:item.imageSource,fallbackPreset:item.fallback,objects:[...item.objects]}}
  root.ACDLDesignSpec.write(projectValue(),spec,root.ACDLDesignTypeCatalog);render();
 });
 document.addEventListener('click',event=>{if(event.target.closest?.('[data-resource-page="page-settings"]'))setTimeout(()=>{install();render()},0)});
 install();root.ACDLDividerComposition=Object.freeze({PRESETS,OBJECTS,IMAGE_SOURCES,SCHOOL_SYMBOL_LAYOUTS,render,entryFor,collect});
})(typeof window==='undefined'?globalThis:window);
