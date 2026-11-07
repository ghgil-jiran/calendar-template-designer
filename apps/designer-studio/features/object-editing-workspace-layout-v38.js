(()=>{

 const policy=window.ACDLUserEditingPolicy;
 const previousNormalize=normalizeElementData;
 normalizeElementData=function(){const result=previousNormalize.apply(this,arguments);policy.normalizeProject(project);return result};
 const permissionControls=[['move','위치 이동'],['resize','크기 변경'],['rotate','개체 회전'],['color','색상·스타일 변경'],['content','콘텐츠 편집'],['delete','삭제'],['duplicate','복제'],['layer','겹침 순서 변경']];
 const previousPermissionHTML=permissionHTML;
 permissionHTML=function(item){
  if(project?.productionCorrection)return previousPermissionHTML(item);
  policy.normalizeProject(project);policy.normalizeElement(item);
  const p=item.permissions,page=selectedPage(),editing=project.template.userEditing,photo=policy.isImage(item),managed=policy.managedImage(item);
  const checkbox=(key,label,disabled=false)=>`<label class="permission-compact-option"><input type="checkbox" data-user-permission="${key}" ${p[key]?'checked':''} ${disabled?'disabled':''}><span>${label}</span></label>`;
  const additionLabel={image:'새 이미지 추가',text:'자유 텍스트 추가'};
  const additions=['image','text'].map(key=>`<label class="permission-compact-option"><input type="checkbox" data-template-addition="${key}" ${editing.additions[key]?'checked':''}><span>${additionLabel[key]} 허용</span></label>`).join('');
  const overrides=['image','text'].map(key=>{const value=page?.userEditing?.additions?.[key],selected=typeof value==='boolean'?String(value):'inherit';return `<label>${additionLabel[key]}<select data-page-addition="${key}" ${page?'':'disabled'}>${[['inherit','템플릿 기본값 사용'],['true','이 면에서 허용'],['false','이 면에서 금지']].map(([value,label])=>`<option value="${value}" ${selected===value?'selected':''}>${label}</option>`).join('')}</select></label>`}).join('');
  const monthlyScope=['monthly-front','monthly-back'].includes(page?.role)&&matchingMonthlyObjectsFor(item).length>1;
  return `<div class="section element-inspector"><div class="inspector-group"><div class="inspector-group-title"><span>선택 개체의 사용자 편집</span></div><p class="permission-help">사용자가 바꿀 수 있는 항목을 선택합니다. 학교 정보·일정 입력은 연결 데이터에서 관리합니다.</p>${photo?checkbox('replaceImage','이미지 교체',managed)+checkbox('imageFit','프레임 안쪽 위치·확대·회전 조정'):''}${managed?'<p class="hint">학교 공통 이미지는 입력 정보에서 교체합니다. 면별 이미지 교체는 보호됩니다.</p>':''}${permissionControls.map(([key,label])=>checkbox(key,label,key==='delete'&&item.required===true)).join('')}<label class="permission-compact-option"><input type="checkbox" id="graphicRequired" ${item.required?'checked':''}><span>필수 개체 · 사용자 삭제 방지</span></label>${monthlyScope?`<label class="permission-compact-option"><input type="checkbox" id="applyMonthlyPermissions" ${item.shadowOfMasterElementId?'':'checked'}><span>같은 월력 ${page.role==='monthly-front'?'앞면':'뒷면'} 전체에 개체 권한 적용</span></label>`:''}</div><div class="inspector-group"><div class="inspector-group-title"><span>템플릿의 추가 허용</span></div>${additions}<p class="hint">추가한 이미지·텍스트는 사용자가 편집할 수 있습니다. 면수·순서·출력 규격은 보호됩니다.</p></div><div class="inspector-group"><div class="inspector-group-title"><span>현재 면의 추가 허용</span></div>${overrides}</div><p class="hint">사용자 서비스의 편집 기능 연결은 다음 단계에서 적용됩니다.</p><button id="applyGraphicPermissions" class="action">권한 설정 저장</button></div>`;
 };
 const $=id=>document.getElementById(id),host=$('insertSidebarHost'),drawer=$('objectDrawer'),body=drawer?.querySelector('.drawer-body');
 if(!host||!body)return;
 const previewMenu=$('previewMenuBtn'),previewDropdown=$('previewMenuDropdown');
 previewMenu?.addEventListener('click',event=>{event.stopPropagation();previewDropdown?.classList.toggle('hidden');$('templateMenuDropdown')?.classList.add('hidden')});
 document.addEventListener('click',event=>{if(!event.target.closest('.preview-menu-wrap'))previewDropdown?.classList.add('hidden')});
 previewDropdown?.querySelectorAll('button').forEach(button=>button.addEventListener('click',()=>previewDropdown.classList.add('hidden')));
 host.appendChild(body);
 drawer.classList.add('hidden');
 const utilities=$('insertSidebarUtilities'),utilitiesToggle=$('toggleInsertSidebarUtilities');
 const setUtilitiesCollapsed=collapsed=>{utilities?.classList.toggle('is-collapsed',collapsed);if(utilitiesToggle){utilitiesToggle.setAttribute('aria-expanded',String(!collapsed));utilitiesToggle.textContent=collapsed?'자료 펼치기':'자료 접기'}};
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
  const permissionSave=permissionPanel.querySelector('#applyGraphicPermissions');
  if(permissionSave){
   const controls=[...permissionPanel.querySelectorAll('[data-user-permission],[data-template-addition],[data-page-addition],#graphicRequired,#applyMonthlyPermissions,#allowUserImageFit')];
   const controlValue=control=>control.type==='checkbox'?control.checked:control.value;
   const baseline=controls.map(controlValue);
   const refresh=()=>{
    const changed=controls.some((control,index)=>controlValue(control)!==baseline[index]);
    permissionSave.disabled=!changed;
    permissionSave.classList.toggle('has-changes',changed);
   };
   controls.forEach(control=>{control.addEventListener('change',()=>{const required=permissionPanel.querySelector('#graphicRequired'),remove=permissionPanel.querySelector('[data-user-permission="delete"]');if(remove&&required){remove.disabled=required.checked;if(required.checked)remove.checked=false}refresh()});control.addEventListener('input',refresh)});
   refresh();
  }
  ins.querySelectorAll('.inspector-tab').forEach(button=>button.onclick=()=>{inspectorActiveTab=button.dataset.tab;ins.querySelectorAll('.inspector-tab').forEach(n=>n.classList.toggle('active',n.dataset.tab===inspectorActiveTab));ins.querySelectorAll('.inspector-tab-panel').forEach(n=>n.classList.toggle('active',n.dataset.panel===inspectorActiveTab))});
  ins.querySelectorAll('.inspector-tab-panel').forEach(panel=>panel.classList.toggle('active',panel.dataset.panel===inspectorActiveTab));
 };
 const renderedWithSupport=render;
 render=function(){const result=renderedWithSupport.apply(this,arguments);ensureInspectorSupport();return result};
 $('inspector')?.addEventListener('click',event=>{
  const button=event.target.closest('#applyGraphicPermissions');if(!button||button.disabled)return;
  event.preventDefault();event.stopImmediatePropagation();
  const item=sourceElement();if(!item)return;
  if(project?.productionCorrection){
   const imageFit=$('allowUserImageFit'),required=$('graphicRequired'),applyAll=$('applyMonthlyPermissions')?.checked===true,targets=applyAll?matchingMonthlyObjectsFor(item):[item];
   snapshot();targets.forEach(target=>{target.permissions={...(target.permissions||{}),move:false,resize:false,rotate:false,color:false,delete:false,duplicate:false,layer:false};if(imageFit){target.permissions.replaceImage=imageFit.checked;target.permissions.content=imageFit.checked;target.userReplaceable=imageFit.checked}if(required)target.required=required.checked});markDirty();render();showEditorToast('현재 개체의 사용자 편집 설정을 저장했습니다.');return;
  }
  const panel=button.closest('[data-panel="permission"]'),required=$('graphicRequired');
  const applyAll=$('applyMonthlyPermissions')?.checked===true;
  const targets=applyAll?matchingMonthlyObjectsFor(item):[item];
  const values=Object.fromEntries([...panel.querySelectorAll('[data-user-permission]')].map(control=>[control.dataset.userPermission,control.checked]));
  snapshot();
  targets.forEach(target=>{
   target.permissions={...(target.permissions||{}),...values};
   if(required)target.required=required.checked;
   if(policy.isImage(target)){
    target.userReplaceable=values.replaceImage===true;
    if(typeof target.replaceable==='boolean')target.replaceable=target.userReplaceable;
   }
   policy.normalizeElement(target);
  });
  for(const control of panel.querySelectorAll('[data-template-addition]'))project.template.userEditing.additions[control.dataset.templateAddition]=control.checked;
  const page=selectedPage();
  if(page)for(const control of panel.querySelectorAll('[data-page-addition]')){
   const key=control.dataset.pageAddition;
   if(control.value==='inherit')delete page.userEditing.additions[key];else page.userEditing.additions[key]=control.value==='true';
  }
  policy.normalizeProject(project);
  markDirty();render();
  showEditorToast(applyAll?`같은 월력 ${selectedPage().role==="monthly-front"?"앞면":"뒷면"}의 개체 ${targets.length}개에 권한을 저장했습니다.`:'현재 개체의 사용자 편집 설정을 저장했습니다.');
 },true);
 activate('school');
})();

(()=>{
 const page=()=>document.getElementById('page'),viewport=()=>document.getElementById('editorPageViewport'),canvas=()=>document.querySelector('.workspace>.center .canvas-wrap');
 let frame=0,mode='fit',manualScale=1;
 const clamp=value=>window.ACDLEditorCanvasFit.clampCanvasScale(value,.5,1.5);
 function updateControls(scale){
  const percent=Math.round(scale*100),range=document.getElementById('canvasZoomRange'),percentButton=document.getElementById('canvasZoomPercentBtn'),fitButton=document.getElementById('canvasFitBtn');
  if(range)range.value=String(Math.round(percent/5)*5);
  if(percentButton)percentButton.textContent=`${percent}%`;
  if(fitButton){fitButton.classList.toggle('active',mode==='fit');fitButton.setAttribute('aria-pressed',String(mode==='fit'))}
 }
 function fitEditorPageToViewport(){
  frame=0;
  const node=page(),frameNode=viewport(),host=canvas(),size=typeof project!=='undefined'?project?.productType?.pageSize:null;
  if(!node||!frameNode||!host||!size||document.body.classList.contains('review-pdf-printing'))return;
  const width=Number(size.width),height=Number(size.height);
  if(!(width>0&&height>0)||host.clientWidth<1||host.clientHeight<1)return;
  const style=getComputedStyle(host),horizontalPadding=parseFloat(style.paddingLeft||0)+parseFloat(style.paddingRight||0),verticalPadding=parseFloat(style.paddingTop||0)+parseFloat(style.paddingBottom||0);
  const availableWidth=Math.max(240,host.clientWidth-horizontalPadding-12),availableHeight=Math.max(240,host.clientHeight-verticalPadding-12),fit=window.ACDLEditorCanvasFit.fixedCanvasViewport({pageWidth:width,pageHeight:height,availableWidth,availableHeight}),scale=mode==='fit'?fit.scale:clamp(manualScale);
  node.style.width=`${fit.designWidth}px`;node.style.height=`${fit.designHeight}px`;node.style.transform=`scale(${scale})`;
  frameNode.style.width=`${fit.designWidth*scale}px`;frameNode.style.height=`${fit.designHeight*scale}px`;
  frameNode.dataset.canvasScale=scale.toFixed(4);frameNode.dataset.canvasZoomMode=mode;frameNode.dataset.designWidth=String(fit.designWidth);frameNode.dataset.designHeight=fit.designHeight.toFixed(4);
  node.dataset.fitAxis=fit.fitAxis;
  updateControls(scale);
 }
 function scheduleFit(){if(frame)cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>requestAnimationFrame(fitEditorPageToViewport))}
 function setManualScale(scale){mode='manual';manualScale=clamp(scale);scheduleFit()}
 function setFitMode(){mode='fit';scheduleFit()}
 const priorRenderPage=window.renderPage;
 if(typeof priorRenderPage==='function')window.renderPage=function(){const result=priorRenderPage.apply(this,arguments);scheduleFit();return result};
 const host=canvas();
 if(host&&'ResizeObserver'in window)new ResizeObserver(scheduleFit).observe(host);
 window.addEventListener('resize',scheduleFit,{passive:true});
 window.visualViewport?.addEventListener('resize',scheduleFit,{passive:true});
 document.getElementById('canvasZoomRange')?.addEventListener('input',event=>setManualScale(Number(event.currentTarget.value)/100));
 document.getElementById('canvasZoomOutBtn')?.addEventListener('click',()=>setManualScale((Number(viewport()?.dataset.canvasScale)||1)-.05));
 document.getElementById('canvasZoomInBtn')?.addEventListener('click',()=>setManualScale((Number(viewport()?.dataset.canvasScale)||1)+.05));
 document.getElementById('canvasZoomPercentBtn')?.addEventListener('click',setFitMode);
 document.getElementById('canvasFitBtn')?.addEventListener('click',setFitMode);
 window.ACDLEditorPageFit=Object.freeze({fit:fitEditorPageToViewport,schedule:scheduleFit,setFit:setFitMode,setScale:setManualScale,state:()=>({mode,scale:Number(viewport()?.dataset.canvasScale)||manualScale}),designSize:()=>{const node=viewport();return node?{width:Number(node.dataset.designWidth),height:Number(node.dataset.designHeight),scale:Number(node.dataset.canvasScale)}:null}});
 scheduleFit();
})();
