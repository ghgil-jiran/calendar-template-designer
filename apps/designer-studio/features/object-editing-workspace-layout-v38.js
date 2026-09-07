(()=>{
 const $=id=>document.getElementById(id),host=$('insertSidebarHost'),drawer=$('objectDrawer'),body=drawer?.querySelector('.drawer-body');
 if(!host||!body)return;
 const previewMenu=$('previewMenuBtn'),previewDropdown=$('previewMenuDropdown');
 previewMenu?.addEventListener('click',event=>{event.stopPropagation();previewDropdown?.classList.toggle('hidden');$('templateMenuDropdown')?.classList.add('hidden')});
 document.addEventListener('click',event=>{if(!event.target.closest('.preview-menu-wrap'))previewDropdown?.classList.add('hidden')});
 previewDropdown?.querySelectorAll('button').forEach(button=>button.addEventListener('click',()=>previewDropdown.classList.add('hidden')));
 host.appendChild(body);
 drawer.classList.add('hidden');
 const utilities=$('insertSidebarUtilities'),utilitiesToggle=$('toggleInsertSidebarUtilities');
 const setUtilitiesCollapsed=collapsed=>{utilities?.classList.toggle('is-collapsed',collapsed);if(utilitiesToggle){utilitiesToggle.setAttribute('aria-expanded',String(!collapsed));utilitiesToggle.textContent=collapsed?'자료·적용 범위 펼치기':'자료·적용 범위 접기'}};
 utilitiesToggle?.addEventListener('click',()=>setUtilitiesCollapsed(utilitiesToggle.getAttribute('aria-expanded')==='true'));
 const normalize=tab=>({all:'school',shapes:'graphics',frames:'graphics',vectors:'graphics'}[tab]||tab||'school');
 const activate=tab=>{
  const category=normalize(tab);
  setUtilitiesCollapsed(true);
  document.querySelectorAll('[data-library-tab]').forEach(button=>button.classList.toggle('active',button.dataset.libraryTab===category));
  document.querySelectorAll('[data-library-section]').forEach(section=>section.classList.toggle('library-filter-hidden',section.dataset.librarySection!==category));
  host.scrollIntoView({block:'nearest'});
 renderObjectRecommendations?.();renderRegisteredAssetLibrary?.();
 };
 switchObjectLibrary=activate;window.switchObjectLibrary=activate;
 $('openSampleSchoolDataBtn')?.addEventListener('click',()=>openResourceModal('school'));
 const scopeMirror=$('insertScopeMirror'),scopeSource=$('elementScope');
 const materializePageOverride=()=>{
  if(scopeMirror?.value!=='page'||selectedElementScope!=='master')return false;
  const masterItem=sourceElement();if(!masterItem)return false;
  const pageItems=pageElements(),existing=pageItems.find(item=>item.shadowOfMasterElementId===masterItem.id);
  if(existing){selectedElementId=existing.id;selectedElementScope='page';render();return true}
  snapshot();
  const clone=typeof structuredClone==='function'?structuredClone(masterItem):JSON.parse(JSON.stringify(masterItem));
  clone.id=`element.page-override.${Date.now()}`;clone.shadowOfMasterElementId=masterItem.id;clone.originScope='master';
  pageItems.push(clone);selectedElementId=clone.id;selectedElementScope='page';markDirty();render();showEditorToast('이 개체를 현재 페이지 전용으로 분리했습니다. 다른 Master 페이지는 변경되지 않습니다.');return true;
 };
 if(scopeMirror&&scopeSource){scopeMirror.value=scopeSource.value;scopeMirror.addEventListener('change',()=>{if(scopeMirror.value==='page')materializePageOverride();scopeSource.value=scopeMirror.value;scopeSource.dispatchEvent(new Event('change',{bubbles:true}))});scopeSource.addEventListener('change',()=>scopeMirror.value=scopeSource.value)}
 $('openObjectDrawerBtn')?.addEventListener('click',event=>{event.preventDefault();event.stopImmediatePropagation();activate('school')},true);
 document.querySelectorAll('[data-library-tab]').forEach(button=>button.addEventListener('click',()=>activate(button.dataset.libraryTab)));
 const priorNavigator=renderNavigator;
 renderNavigator=function(){
  priorNavigator();
  const pages=project?.book?.pageInstances||[],index=Math.max(0,pages.findIndex(page=>page.id===selectedPageId));if($('pageDockStatus'))$('pageDockStatus').textContent=pages.length?`${index+1} / ${pages.length}`:'페이지 없음';
  requestAnimationFrame(()=>$('navigator')?.querySelector('.page-btn.active')?.scrollIntoView({behavior:'smooth',block:'nearest',inline:'center'}));
 };
 const priorRender=render;
 render=function(){
  const result=priorRender.apply(this,arguments),item=typeof sourceElement==='function'?sourceElement():null,title=$('inspectorPanelTitle');
  document.querySelectorAll('.toolbar-align-tools [data-menu-action]').forEach(button=>button.disabled=!item);
  if(title)title.textContent=item?'선택 개체 속성':'페이지 스타일';
  const summary=$('inspectorSelectionSummary');
  if(summary){
   if(!item)summary.textContent='개체를 선택하면 콘텐츠·스타일·배치·데이터·권한을 설정할 수 있습니다.';
   else{
    const names={'semantic-object':'학교 개체',text:'텍스트',image:'이미지',shape:'도형',vector:'벡터','image-frame':'사진 프레임','mini-calendar':'미니 월력','mini-calendar-prev':'이전달 미니 월력','mini-calendar-next':'다음달 미니 월력','year-calendar':'연간 월력','monthly-schedule':'월 일정','event-list':'학사일정','month-date-strip':'날짜 띠','monthly-quote':'월 명언',memo:'플래너·메모'};
    const scope=selectedElementScope==='master'?'같은 Master 전체':'현재 페이지';
    summary.innerHTML=`<strong>${names[item.type]||item.type}</strong><div class="selection-chips"><span class="selection-chip ${selectedElementScope==='master'?'master':''}">${scope}</span>${item.binding||item.image?.binding||item.role?'<span class="selection-chip">데이터 연결</span>':''}</div>`;
   }
  }
  return result;
 };
 const objectCards=[...body.querySelectorAll('.object-card')];
 objectCards.forEach(card=>card.dataset.search ||= card.textContent.trim().replace(/\s+/g,' '));
 const search=$('objectLibrarySearch'),empty=document.createElement('div');empty.className='library-search-empty hidden';empty.textContent='이 범주에서 일치하는 개체가 없습니다.';body.appendChild(empty);
 const filterObjects=()=>{
  const query=(search?.value||'').trim().toLowerCase(),category=body.querySelector('[data-library-tab].active')?.dataset.libraryTab||'school';let visible=0;
  body.querySelectorAll('[data-library-section]').forEach(section=>{
   if(section.dataset.librarySection!==category)return;
   section.querySelectorAll('.object-card').forEach(card=>{const match=!query||(card.dataset.search||card.textContent).toLowerCase().includes(query);card.style.display=match?'':'none';if(match)visible++});
  });
  empty.classList.toggle('hidden',visible>0||!query);
 };
 search?.addEventListener('input',()=>setTimeout(filterObjects,0));
 body.querySelectorAll('[data-library-tab]').forEach(button=>button.addEventListener('click',()=>setTimeout(filterObjects,0)));
 const bindingFor=item=>{
  const widgetBindings={'mini-calendar':'calendar.currentMonth','mini-calendar-prev':'calendar.previousMonth','mini-calendar-next':'calendar.nextMonth','year-calendar':'calendar.year','monthly-schedule':'calendar.events','event-list':'calendar.events','month-date-strip':'calendar.currentMonth','monthly-quote':'calendar.monthlyQuotes'};
  return item?.binding||item?.image?.binding||widgetBindings[item?.type]||(item?.type==='semantic-object'&&item?.bindingEnabled!==false?`school.profile.${String(item.role||'').replace('school-','')}`:'');
 };
 const ensureInspectorSupport=()=>{
  const item=typeof sourceElement==='function'?sourceElement():null,ins=$('inspector');if(!item||!ins)return;
  const tabs=ins.querySelector('.inspector-tabs');
  [['data','데이터'],['permission','권한']].forEach(([id,label])=>{if(tabs&&!tabs.querySelector(`[data-tab="${id}"]`)){const button=document.createElement('button');button.type='button';button.className=`inspector-tab ${inspectorActiveTab===id?'active':''}`;button.dataset.tab=id;button.textContent=label;tabs.appendChild(button)}});
  const binding=bindingFor(item);
  let dataPanel=ins.querySelector('[data-panel="data"]');if(!dataPanel){dataPanel=document.createElement('div');dataPanel.className='inspector-tab-panel';dataPanel.dataset.panel='data';ins.appendChild(dataPanel)}
  dataPanel.innerHTML=binding?`<div class="section element-inspector"><div class="inspector-group"><div class="inspector-group-title"><span>데이터 연결</span><small>연결됨</small></div><div class="binding-path">${binding}</div><div class="hint">샘플 학교 자료 또는 사용자 서비스 데이터가 이 개체에 연결됩니다.</div></div></div>`:'<div class="inspector-tab-empty">고정 콘텐츠 개체입니다. 콘텐츠 탭에서 직접 값을 설정합니다.</div>';
  let permissionPanel=ins.querySelector('[data-panel="permission"]');if(!permissionPanel){permissionPanel=document.createElement('div');permissionPanel.className='inspector-tab-panel';permissionPanel.dataset.panel='permission';ins.appendChild(permissionPanel)}permissionPanel.innerHTML=permissionHTML(item);
  ins.querySelectorAll('.inspector-tab').forEach(button=>button.onclick=()=>{inspectorActiveTab=button.dataset.tab;ins.querySelectorAll('.inspector-tab').forEach(n=>n.classList.toggle('active',n.dataset.tab===inspectorActiveTab));ins.querySelectorAll('.inspector-tab-panel').forEach(n=>n.classList.toggle('active',n.dataset.panel===inspectorActiveTab))});
  ins.querySelectorAll('.inspector-tab-panel').forEach(panel=>panel.classList.toggle('active',panel.dataset.panel===inspectorActiveTab));
 };
 const renderedWithSupport=render;
 render=function(){const result=renderedWithSupport.apply(this,arguments);ensureInspectorSupport();return result};
 $('inspector')?.addEventListener('click',event=>{const button=event.target.closest('#applyGraphicPermissions');if(!button)return;event.preventDefault();event.stopImmediatePropagation();const item=sourceElement();if(!item)return;snapshot();item.permissions=Object.fromEntries([...$('inspector').querySelectorAll('[data-permission]')].map(input=>[input.dataset.permission,input.checked]));item.required=!!$('graphicRequired')?.checked;markDirty();render();showEditorToast('사용자 편집 권한을 저장했습니다.')},true);
 activate('school');
})();
