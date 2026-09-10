(function(root){
 const PRESETS=Object.freeze([
  {id:'school-symbols',label:'학교 상징',layoutId:'song-led-split',objects:['school-logo','school-motto','school-song','school-tree','school-flower'],imageSource:'school-assets',fallback:'free'},
  {id:'school-introduction',label:'학교 소개',layoutId:'content-led',objects:['school-building','school-logo','school-name','body'],imageSource:'school-assets',fallback:'free'},
  {id:'yearly-plan',label:'Yearly Plan',layoutId:'editorial-cards',objects:['yearly-plan'],imageSource:'none',fallback:'free'},
  {id:'annual-calendar',label:'연력',layoutId:'heritage-document',objects:['annual-calendar'],imageSource:'none',fallback:'free'},
  {id:'free',label:'사용자 정의',layoutId:'open-gallery',objects:[],imageSource:'user-assets',fallback:null}
 ]);
 const OBJECTS=Object.freeze([['title','제목'],['body','본문'],['school-name','학교명'],['school-building','학교 사진'],['school-logo','교표'],['school-motto','교훈'],['school-song','교가'],['school-tree','교목'],['school-flower','교화'],['image-slot','사용자 이미지'],['annual-calendar','연간 월력'],['mini-calendar','미니 월력'],['schedule-list','일정 목록'],['history-list','학교 연혁'],['vision','교육 목표/비전'],['yearly-plan','Yearly Plan'],['yearly-checklist','Yearly Checklist']]);
 const IMAGE_SOURCES=Object.freeze([['school-assets','학교 정보 및 에셋'],['user-assets','사용자 등록 이미지'],['template-assets','템플릿 그래픽 라이브러리'],['none','이미지 사용 안 함']]);
 const defaults=target=>target.surface==='back'?PRESETS[0]:PRESETS[1];
 const esc=value=>String(value??'').replace(/[&<>"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[char]));
 const preset=id=>PRESETS.find(item=>item.id===id)||PRESETS.find(item=>item.id==='free');
 function projectValue(){return root.project||(typeof project!=='undefined'?project:null)}
 function install(){
  const page=document.querySelector('[data-resource-content="page-settings"]'),mount=document.getElementById('pageSettingsDividerMount');
  if(!page||document.getElementById('dividerCompositionCard'))return;
  const card=document.createElement('div');
  card.id='dividerCompositionCard';card.className='ai-divider-composition-options';
  card.innerHTML='<div class="settings-section-head"><div><h4>간지 페이지 구성</h4><p class="resource-description">현재 템플릿에 실제로 존재하는 간지마다 구성 프리셋과 편집 개체를 정합니다. 변경 내용은 단계 하단의 페이지 설정 저장으로 함께 저장됩니다.</p></div><span class="desk-only-badge">실제 간지 기준</span></div><div id="dividerCompositionList" class="divider-composition-list"></div>';
  if(mount)mount.appendChild(card);else page.appendChild(card);
  render();
 }
 function targets(){return root.ACDLAIGenerationContext?.build(projectValue())?.roles?.find(role=>role.role==='divider')?.targets||[]}
 function current(){return root.ACDLDesignSpec.read(projectValue(),root.ACDLDesignTypeCatalog)}
 function entryFor(target,spec){const base=defaults(target),saved=spec.dividerPages?.[target.pageId]||{},chosen=preset(saved.purpose||base.id);return {purpose:chosen.id,layoutId:saved.layoutId||chosen.layoutId,objects:Array.isArray(saved.objects)?saved.objects:chosen.objects,imageSource:saved.imageSource||chosen.imageSource,fallbackPreset:saved.fallbackPreset===undefined?chosen.fallback:saved.fallbackPreset}}
 function presetOptions(selected){return PRESETS.map(item=>`<option value="${item.id}" ${selected===item.id?'selected':''}>${item.label}</option>`).join('')}
 function fallbackOptions(selected){return '<option value="">대체 구성 없음</option>'+PRESETS.filter(item=>item.id!=='blank').map(item=>`<option value="${item.id}" ${selected===item.id?'selected':''}>${item.label}</option>`).join('')}
 function render(){
  const host=document.getElementById('dividerCompositionList');if(!host)return;
  const spec=current(),items=targets(),layouts=root.ACDLDesignTypeCatalog.roles.divider.options,card=document.getElementById('dividerCompositionCard');
  if(card)card.hidden=!items.length;
  host.innerHTML=items.length?items.map((target,index)=>{const entry=entryFor(target,spec);return `<article class="page-type-card divider-page-composition" data-divider-page="${esc(target.pageId)}"><header><strong>간지 ${index+1}</strong><small>${esc(target.position)} · ${esc(target.surface)} · ${esc(target.pageId)}</small></header><div class="settings-grid"><label>구성 프리셋<select data-divider-purpose>${presetOptions(entry.purpose)}</select></label><label>배치안<select data-divider-layout>${layouts.map(([id,label])=>`<option value="${id}" ${entry.layoutId===id?'selected':''}>${label}</option>`).join('')}</select></label><label>이미지 출처<select data-divider-image-source>${IMAGE_SOURCES.map(([id,label])=>`<option value="${id}" ${entry.imageSource===id?'selected':''}>${label}</option>`).join('')}</select></label><label>데이터가 없을 때<select data-divider-fallback>${fallbackOptions(entry.fallbackPreset)}</select></label></div><div class="checkbox-grid">${OBJECTS.map(([id,label])=>`<label><input type="checkbox" value="${id}" data-divider-object ${entry.objects.includes(id)?'checked':''}>${label}</label>`).join('')}</div><p class="ai-month-back-note" data-divider-rule>${entry.purpose==='blank'?'기능 개체 없이 배경과 장식만 생성합니다.':'선택한 기능 개체는 각각 편집 가능하며 AI 이미지에는 포함하지 않습니다.'}</p></article>`}).join(''):'<div class="design-type-unsupported">현재 템플릿에 간지 페이지가 없습니다. 간지를 추가하면 이곳에 페이지별 설정이 나타납니다.</div>';
 }
 function applyPreset(card,presetId){const item=preset(presetId);card.querySelector('[data-divider-layout]').value=item.layoutId;card.querySelector('[data-divider-image-source]').value=item.imageSource;card.querySelector('[data-divider-fallback]').value=item.fallback||'';card.querySelectorAll('[data-divider-object]').forEach(input=>input.checked=item.objects.includes(input.value));card.querySelector('[data-divider-rule]').textContent=item.id==='blank'?'기능 개체 없이 배경과 장식만 생성합니다.':'선택한 기능 개체는 각각 편집 가능하며 AI 이미지에는 포함하지 않습니다.'}
 function collect(spec=current()){spec.dividerPages=Object.fromEntries([...document.querySelectorAll('[data-divider-page]')].map(card=>[card.dataset.dividerPage,{purpose:card.querySelector('[data-divider-purpose]').value,layoutId:card.querySelector('[data-divider-layout]').value,imageSource:card.querySelector('[data-divider-image-source]').value,fallbackPreset:card.querySelector('[data-divider-fallback]').value||null,objects:[...card.querySelectorAll('[data-divider-object]:checked')].map(input=>input.value)}]));return spec}
 document.addEventListener('change',event=>{const select=event.target.closest?.('[data-divider-purpose]');if(select)applyPreset(select.closest('[data-divider-page]'),select.value)});
 document.addEventListener('click',event=>{if(event.target.closest?.('[data-resource-page="page-settings"]'))setTimeout(()=>{install();render()},0)});
 install();root.ACDLDividerComposition=Object.freeze({PRESETS,OBJECTS,IMAGE_SOURCES,render,entryFor,collect});
})(typeof window==='undefined'?globalThis:window);
