/* ================= v32 WORKSPACE PERMISSIONS & UX ================= */
(function(){
 const oldRender=typeof window.render==='function'?window.render:(typeof render==='function'?render:null);
 function isWorkspace(){return project?.mode==='calendar-workspace'}
 function itemPermissions(item){return {...{move:true,resize:true,rotate:true,color:true,replaceImage:true,delete:true,duplicate:true,layer:true,content:true},...(item?.permissions||{})}}
 function canEditAction(item,action){
   if(!item)return false;
   if(!isWorkspace())return true;
   if(item.required===true && action==='delete')return false;
   return itemPermissions(item)[action]!==false;
 }
 window.canEditAction=canEditAction;
 function bindingPath(item){return item?.image?.binding||item?.binding||''}
 function valueByPath(path){
   if(!path)return undefined;
   const normalized=path.replace(/^book\./,'');
   return normalized.split('.').reduce((v,k)=>v==null?undefined:v[k],project?.book)
 }
 function bindingImageValue(item){
   const path=item?.image?.binding;
   if(!path)return item?.image?.src||'';
   const v=valueByPath(path);
   if(typeof v==='string')return v||item?.image?.src||'';
   if(v&&typeof v==='object')return v.image||v.src||item?.image?.src||'';
   return item?.image?.src||'';
 }
 window.resolveFrameImage=bindingImageValue;
 function bindingLabel(path){return ({'school.name':'학교명','school.address':'주소','school.website':'홈페이지','school.phone':'전화번호','school.fax':'팩스','school.slogan':'슬로건','school.profile.building':'학교 전경','school.profile.logo':'교표','school.profile.flower':'교화','school.profile.tree':'교목'})[path]||path||''}
 function isBindingMissing(item){const path=bindingPath(item);if(!path)return false;const v=item.type==='image-frame'?bindingImageValue(item):valueByPath(path);return !v}
 function addWorkspaceDecorations(){
   if(!isWorkspace())return;
   document.querySelectorAll('.free-element').forEach(box=>{
     const id=box.dataset.elementId,scope=box.dataset.scope,arr=scope==='master'?masterElements():pageElements(),item=arr.find(x=>x.id===id);if(!item)return;
     const p=itemPermissions(item),locked=!p.move&&!p.resize&&!p.rotate&&!p.delete;
     box.classList.toggle('workspace-locked',locked);
     box.classList.toggle('binding-missing',isBindingMissing(item));
     const path=bindingPath(item);if(path&&!box.querySelector('.workspace-binding-badge')){const badge=document.createElement('span');badge.className='workspace-binding-badge non-output editor-only';badge.textContent=isBindingMissing(item)?`${bindingLabel(path)} 미입력`:bindingLabel(path);box.appendChild(badge)}
     box.querySelectorAll('.elem-handle').forEach(h=>{const a=h.dataset.handle==='move'?'move':'resize';if(!canEditAction(item,a))h.remove()})
   })
 }
 function updateWorkspaceChrome(){
   const workspace=isWorkspace();document.body.classList.toggle('user-mode',workspace);
   const roots=[...document.querySelectorAll('.menu-root')];
   roots.forEach(root=>{const title=root.querySelector(':scope>button')?.textContent?.trim();root.dataset.workspaceHidden=workspace&&title==='삽입'?'true':'false'});
   if(workspace){
     const arrange=roots.find(r=>r.querySelector(':scope>button')?.textContent.trim()==='정렬');if(arrange)arrange.querySelector(':scope>button').textContent='배치';
     document.querySelectorAll('.icon-toolbar button').forEach(btn=>{const txt=btn.textContent.trim();if(/텍스트|이미지|도형|프레임|벡터|월력|일정|메모/.test(txt)&&!selectedElementId)btn.dataset.workspaceDesignerTool='true'});
   }
   const item=sourceElement();
   const duplicate=el('duplicateElementBtn'),del=el('deleteElementBtn');
   if(duplicate)duplicate.disabled=!item||(workspace&&!canEditAction(item,'duplicate'));
   if(del){del.disabled=!item||(workspace&&!canEditAction(item,'delete'));del.classList.toggle('permission-hidden',workspace&&item&&!canEditAction(item,'delete'))}
   document.querySelectorAll('.icon-toolbar [data-menu-action="front"],.icon-toolbar [data-menu-action="back"]').forEach(button=>{button.disabled=!item||(workspace&&!canEditAction(item,'layer'))});
 }
 if(oldRender)render=function(){oldRender();updateWorkspaceChrome();addWorkspaceDecorations()};

 const oldGraphicMarkup=graphicMarkup;
 graphicMarkup=function(view){
   if(view?.type==='image-frame'){
     const cloned=structuredClone(view);cloned.image||={};cloned.image.src=bindingImageValue(view);return oldGraphicMarkup(cloned)
   }
   return oldGraphicMarkup(view)
 };

 const oldStart=startElementPointer;
 startElementPointer=function(e){
   const box=e.currentTarget,id=box.dataset.elementId,scope=box.dataset.scope;
   if((id!==selectedElementId||scope!==selectedElementScope)&&!confirmDiscardInspectorChanges())return;
   selectedElementId=id;selectedElementScope=scope;inspectorDirty=false;
   const item=sourceElement(),action=e.target.dataset.handle?'resize':'move';
   if(isWorkspace()&&!canEditAction(item,action)){
     e.preventDefault();renderInspector();showEditorToast(action==='resize'?'이 개체는 크기 변경이 허용되지 않았습니다.':'이 개체는 이동이 허용되지 않았습니다.');render();return
   }
   oldStart.call(this,e)
 };
 const oldMove=moveElementPointer;
 moveElementPointer=function(e){const item=sourceElement();if(isWorkspace()&&item){const action=elementDrag?.handle==='move'?'move':'resize';if(!canEditAction(item,action))return}oldMove(e)};

 const oldDelete=deleteSelected;
 deleteSelected=function(){const item=sourceElement();if(item&&isWorkspace()&&!canEditAction(item,'delete')){showEditorToast(item.required?'필수 개체는 삭제할 수 없습니다.':'디자이너가 삭제를 허용하지 않은 개체입니다.');return}oldDelete()};
 const oldDuplicate=duplicateSelected;
 duplicateSelected=function(){const item=sourceElement();if(item&&isWorkspace()&&!canEditAction(item,'duplicate')){showEditorToast('이 개체는 복제가 허용되지 않았습니다.');return}oldDuplicate()};
 const oldAlign=alignSelected;
 alignSelected=function(action){const item=sourceElement();if(item&&isWorkspace()){const permission=['front','back'].includes(action)?'layer':'move';if(!canEditAction(item,permission)){showEditorToast(permission==='layer'?'레이어 변경이 허용되지 않았습니다.':'배치 변경이 허용되지 않았습니다.');return}}oldAlign(action)};

 const oldApplyGraphic=applyGraphicInspector;
 applyGraphicInspector=function(action){
   const item=sourceElement();if(isWorkspace()&&item){const map={style:'color',layout:'resize',frame:'replaceImage'};const perm=map[action];if(perm&&!canEditAction(item,perm)){showEditorToast('디자이너가 이 편집 항목을 허용하지 않았습니다.');return}}
   oldApplyGraphic(action)
 };

 function permissionSummary(item){const p=itemPermissions(item),defs=[['move','이동'],['resize','크기'],['rotate','회전'],['color','색상'],['replaceImage','이미지'],['delete','삭제']];return `<div class="workspace-permission-summary">${defs.map(([k,n])=>`<span class="${p[k]!==false?'on':'off'}">${n} ${p[k]!==false?'허용':'보호'}</span>`).join('')}</div>`}
 const oldTabs=inspectorTabsHTML;
 inspectorTabsHTML=function(){
   if(!isWorkspace())return oldTabs();
   const item=sourceElement();if(!item)return `<div class="inspector-tabs"><button class="inspector-tab active">페이지</button></div>`;
   const p=itemPermissions(item),tabs=[['content','콘텐츠',p.content!==false||p.replaceImage!==false],['design','스타일',p.color!==false],['layout','배치',p.move!==false||p.resize!==false||p.rotate!==false],['data','연결',!!bindingPath(item)]];
   const visible=tabs.filter(x=>x[2]);if(!visible.some(x=>x[0]===inspectorActiveTab))inspectorActiveTab=visible[0]?.[0]||'content';
   return `<div class="inspector-tabs" role="tablist">${visible.map(([id,n])=>`<button type="button" class="inspector-tab ${inspectorActiveTab===id?'active':''}" data-tab="${id}">${n}</button>`).join('')}</div>`
 };
 const oldElementPanels=elementInspectorPanels;
 elementInspectorPanels=function(){
   const panels=oldElementPanels(),item=sourceElement();if(!isWorkspace()||!item)return panels;const p=itemPermissions(item);
   if(p.content===false&&p.replaceImage===false)panels.content='<div class="workspace-empty-inspector">이 개체의 콘텐츠는 디자이너가 보호했습니다.</div>';
   if(p.color===false)panels.design='<div class="workspace-empty-inspector">스타일 편집이 허용되지 않았습니다.</div>';
   if(p.move===false&&p.resize===false&&p.rotate===false)panels.layout='<div class="workspace-empty-inspector">위치와 크기가 보호된 개체입니다.</div>';
   panels.permission='';
   const path=bindingPath(item);if(path)panels.data=`<div class="section element-inspector"><div class="inspector-group"><div class="inspector-group-title"><span>데이터 연결</span><small>${isBindingMissing(item)?'미입력':'연결됨'}</small></div><div class="binding-path">${bindingLabel(path)}</div><div class="workspace-action-note">${isBindingMissing(item)?'학교 정보 입력에서 해당 콘텐츠를 추가하면 자동으로 적용됩니다.':'학교 정보와 연결된 콘텐츠가 적용되어 있습니다.'}</div>${permissionSummary(item)}</div></div>`;
   return panels
 };
 const oldRenderInspector=renderInspector;
 renderInspector=function(){oldRenderInspector();if(!isWorkspace())return;const ins=el('inspector'),item=sourceElement();ins.querySelectorAll('[data-panel="permission"],.inspector-tab[data-tab="permission"]').forEach(n=>n.remove());if(item){ins.querySelectorAll('#frameBinding,#graphicFrameType,#graphicShapeType,#graphicVectorAsset').forEach(n=>n.closest('label')?.remove());if(!canEditAction(item,'replaceImage'))ins.querySelectorAll('#replaceFrameImageBtn,#applyFrameImage').forEach(n=>n.remove());if(!canEditAction(item,'color'))ins.querySelectorAll('#applyGraphicStyle').forEach(n=>n.remove());if(!canEditAction(item,'move'))ins.querySelectorAll('#elemX,#elemY').forEach(n=>{n.disabled=true;n.closest('label')?.classList.add('disabled')});if(!canEditAction(item,'resize'))ins.querySelectorAll('#elemW,#elemH').forEach(n=>{n.disabled=true;n.closest('label')?.classList.add('disabled')});if(!canEditAction(item,'rotate')){const n=el('graphicRotation');if(n)n.disabled=true}}
 };

 const oldFrameChange=el('frameImageInput')?.onchange;
 el('frameImageInput')?.addEventListener('click',e=>{const item=sourceElement();if(isWorkspace()&&item&&!canEditAction(item,'replaceImage')){e.preventDefault();showEditorToast('이미지 교체가 허용되지 않은 개체입니다.')}} ,true);

 function autoSizeBoundText(){
   normalizeElementData();const all=[];Object.values(project.book.elementsByPage||{}).forEach(a=>all.push(...a));Object.values(project.template.masterElements||{}).forEach(a=>all.push(...a));
   all.filter(i=>i.type==='text'&&i.binding&&i.autoSize&&i.autoSize!=='none').forEach(i=>{const text=String(valueByPath(i.binding)||i.content||''),font=Number(i.style?.fontSize||12),est=estimateSchoolTextBox(i.binding,text,font);if(i.autoSize==='width'||i.autoSize==='both')i.width=est.width;if(i.autoSize==='height'||i.autoSize==='both')i.height=est.height})
 }
 const oldApplySchool=applyUserSchoolData;
 applyUserSchoolData=function(){oldApplySchool();autoSizeBoundText()};

 // Optional protection model: all permissions remain open unless the designer explicitly disables them.
 const oldCreateGraphic=createGraphicElement;
 createGraphicElement=function(kind,id){oldCreateGraphic(kind,id);const item=sourceElement();if(item){item.required=false;item.permissions={move:true,resize:true,rotate:true,color:true,replaceImage:true,delete:true,duplicate:true,layer:true,content:true}}};

 // Designer permission panel: add optional required-object switch and extra freedom controls.
 const oldPermissionHTML=permissionHTML;
 permissionHTML=function(item){let html=oldPermissionHTML(item);html=html.replace('<div class="permission-grid">','<label style="margin-bottom:8px"><input type="checkbox" id="graphicRequired" '+(item.required?'checked':'')+'> 필수 개체로 지정(삭제 방지)</label><div class="permission-grid">').replace('</div><button id="applyGraphicPermissions"','<label><input type="checkbox" data-permission="duplicate" '+(item.permissions?.duplicate!==false?'checked':'')+'>복제 허용</label><label><input type="checkbox" data-permission="layer" '+(item.permissions?.layer!==false?'checked':'')+'>레이어 변경 허용</label><label><input type="checkbox" data-permission="content" '+(item.permissions?.content!==false?'checked':'')+'>콘텐츠 편집 허용</label></div><button id="applyGraphicPermissions"');return html};
 const priorApplyGraphic=applyGraphicInspector;
 applyGraphicInspector=function(action){priorApplyGraphic(action);if(action==='permission'&&!isWorkspace()){const item=sourceElement();if(item){item.required=!!el('graphicRequired')?.checked;markDirty();render()}}};

 // Re-run once after all overrides.
 setTimeout(()=>{updateWorkspaceChrome();addWorkspaceDecorations()},0)
})();
