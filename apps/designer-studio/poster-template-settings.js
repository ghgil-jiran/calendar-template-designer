(()=>{
 const $=id=>document.getElementById(id),poster=()=>project?.productType?.category==='poster';
 const blocked=new Set(['masters','design-types','ai-design']);
 function refresh(){
  const active=poster();for(const key of blocked){const button=document.querySelector(`[data-resource-page="${key}"]`);if(button){button.disabled=active;button.classList.toggle('hidden',active)}}
  for(const id of ['resourceFrontInserts','resourceRearInserts','resourceAdjacentMini']){const input=$(id),field=input?.closest('label');field?.classList.toggle('hidden',active);if(input&&active)input.disabled=true}
  $('resourceUserEditingPreset')?.closest('.settings-card')?.classList.toggle('hidden',active);
  const page=document.querySelector('[data-resource-content="page-settings"]');if(!page)return;
  let panel=$('posterPageSettings');if(!panel){panel=document.createElement('div');panel.id='posterPageSettings';page.appendChild(panel)}
  [...page.children].forEach(child=>{if(child!==panel)child.classList.toggle('poster-settings-suppressed',active)});panel.classList.toggle('hidden',!active);
  if(active){const grid=(project.book.elementsByPage?.[project.book.pageInstances[0]?.id]||[]).find(e=>e.academicPoster),count=project.book.pageInstances.length;panel.innerHTML=`<h3>벽보형 페이지 설정</h3><p class="resource-description">선택한 종류에 따라 페이지를 구성합니다. 표지·간지·월력 앞뒤는 사용하지 않습니다.</p><div class="settings-card"><h4>현재 페이지 구성</h4><div class="settings-grid"><label>종류<input disabled value="${project.productType.duplex?'양면형 · 앞뒤 2면':count+'페이지형'}"></label><label>개월 구성<input disabled value="12개월"></label><label>월력 배치<input disabled value="${grid?grid.columns+'열 × '+Math.ceil((grid.monthCount||12)/grid.columns)+'행':'편집 화면에서 배치'}"></label><label>일정 표시<input disabled value="${grid?.posterShowList===false?'날짜 칸':'날짜 칸 + 월별 상세 목록'}"></label></div><p class="resource-description">학교 정보·사진과 월력의 위치·크기는 편집 화면에서 조정합니다. 표시할 공공 달력 정보는 기본 설정에서, 학사일정은 일정 등록에서 관리합니다.</p></div>`}
 }
 const style=document.createElement('style');style.textContent='.poster-settings-suppressed{display:none!important}';document.head.appendChild(style);
 const originalSwitch=switchResourcePage;switchResourcePage=function(key){if(poster()&&blocked.has(key)){showEditorToast('벽보형에서는 이 설정을 사용하지 않습니다.');return false}const result=originalSwitch.apply(this,arguments);refresh();return result};
 const originalBasic=populateResourceBasicForm;populateResourceBasicForm=function(){const result=originalBasic.apply(this,arguments);refresh();return result};
 const modal=$('resourceModal');if(modal)new MutationObserver(refresh).observe(modal,{attributes:true,attributeFilter:['class']});
 function sampleButton(){for(const [typeId,count] of [['poster-standard',1],['poster-two-page',2]]){const card=document.querySelector(`[data-type-card="${typeId}"] .type-card-actions`),id=count===1?'createPosterOnePageSample':'createPosterTwoPageSample';if(!card||$(id))continue;const button=document.createElement('button');button.id=id;button.textContent=`${count}페이지 샘플 템플릿 만들기`;card.appendChild(button);button.onclick=async()=>{button.disabled=true;button.textContent='샘플 저장 중…';try{const response=await window.ACDLAdminAuth.authorizedFetch('/api/poster-sample',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pageCount:count})}),result=await response.json();if(!response.ok)throw Error(result.message||result.error||'샘플 저장 실패');button.textContent='샘플 저장 완료';showEditorToast(result.existing?`이미 등록된 ${count}페이지 샘플을 라이브러리에서 확인해주세요.`:`벽보형 ${count}페이지 샘플을 초안으로 저장했습니다.`);$('closeTypeManagerBtn')?.click();$('designerHomeLibrary')?.click()}catch(error){button.disabled=false;button.textContent='샘플 만들기 다시 시도';showEditorToast(error.message)}}}}

 const existingSampleButton=sampleButton;
 sampleButton=function(){existingSampleButton();for(const typeId of ['poster-two-page','poster-duplex']){
  const card=document.querySelector(`[data-type-card="${typeId}"] .type-card-actions`),id='createPosterDuplex-'+typeId;if(!card||$(id))continue;
  const button=document.createElement('button');button.id=id;button.textContent='현재 2페이지형으로 양면 템플릿 만들기';button.title='마지막으로 저장된 2페이지형을 복제합니다. 현재 편집 내용은 먼저 저장해주세요.';card.appendChild(button);
  button.onclick=async()=>{button.disabled=true;try{const response=await window.ACDLAdminAuth.authorizedFetch('/api/poster-sample',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({variant:'duplex'})}),result=await response.json();if(!response.ok)throw Error(result.message||result.error||'양면형 생성 실패');button.textContent='양면형 템플릿 저장 완료';await window.refreshRemoteTemplateLibrary?.();$('closeTypeManagerBtn')?.click();$('designerHomeLibrary')?.click();showEditorToast(result.existing?'기존 양면형 템플릿을 라이브러리에서 확인해주세요.':`2페이지형 v${result.sourceVersion}을 복제해 양면형 새 초안으로 저장했습니다.`);}catch(error){button.disabled=false;showEditorToast(error.message);}};
 }};

 const gallery=$('typeManagerOverlay');if(gallery)new MutationObserver(sampleButton).observe(gallery,{childList:true,subtree:true});sampleButton();
})();
