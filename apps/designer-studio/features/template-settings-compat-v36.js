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
