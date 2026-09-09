(()=>{
 let gesture=null,releasePointer=null;
 const selection=window.ACDLCanvasSelection.createSelectionStore((id,scope)=>getItem(id,scope));
 const key=selection.key;
 const selectedViews=selection.views;
 const syncPrimary=()=>{
  const next=selection.sync(selectedElementId&&selectedElementScope?{id:selectedElementId,scope:selectedElementScope}:null);
  if(!next)setPrimary(null,null)
 };
 const setPrimary=(id,scope)=>{selectedElementId=id;selectedElementScope=scope};
 function selectOnly(id,scope){const next=selection.selectOnly(id,scope);setPrimary(next.id,next.scope)}
 function toggleSelection(id,scope){const next=selection.toggle(id,scope,selectedElementId&&selectedElementScope?{id:selectedElementId,scope:selectedElementScope}:null);setPrimary(next?.id||null,next?.scope||null)}
 function clearSelection(){selection.clear();setPrimary(null,null);inspectorDirty=false}
 function getItem(id,scope){const arr=scope==='master'?masterElements():pageElements();return arr.find(x=>x.id===id)}
 function ensureOverlay(pageNode){
  let v=pageNode.querySelector('.s2-snap-line.v');if(!v){v=document.createElement('div');v.className='s2-snap-line v';pageNode.appendChild(v)}
  let h=pageNode.querySelector('.s2-snap-line.h');if(!h){h=document.createElement('div');h.className='s2-snap-line h';pageNode.appendChild(h)}
  const hint=document.createElement('div');hint.className='s2-key-hint';hint.textContent='Shift 다중 선택 · 방향키 이동 · Delete 삭제 · Ctrl+Z 실행 취소';pageNode.appendChild(hint)
 }
 function renderToolbar(pageNode){
  const views=selectedViews();if(!views.length||preview)return;
  const bar=document.createElement('div');bar.className='s2-selection-toolbar';bar.innerHTML=`<span class="s2-count">${views.length}개 선택</span><button data-s2="front">맨 앞으로</button><button data-s2="back">맨 뒤로</button><button data-s2="duplicate">복제</button><button data-s2="lock">잠금</button><button data-s2="hide">숨김</button><button data-s2="delete" class="danger">삭제</button>`;
  bar.addEventListener('pointerdown',e=>e.stopPropagation());
  bar.addEventListener('click',e=>{const action=e.target.closest('button')?.dataset.s2;if(!action)return;e.stopPropagation();const list=selectedViews();if(!list.length)return;snapshot();
   if(action==='front')list.forEach(v=>v.item.zIndex=maxZ(v.scope)+1);
   if(action==='back')list.forEach(v=>v.item.zIndex=0);
   if(action==='duplicate'){const newSel=[];list.forEach(v=>{const arr=v.scope==='master'?masterElements():pageElements();const copy=structuredClone(v.item);copy.id=`${v.item.id}.copy.${Date.now()}.${Math.random().toString(36).slice(2,6)}`;copy.x=Math.min(100-copy.width,copy.x+2);copy.y=Math.min(100-copy.height,copy.y+2);copy.zIndex=maxZ(v.scope)+1;arr.push(copy);newSel.push({id:copy.id,scope:v.scope})});const next=selection.replace(newSel);setPrimary(next.id,next.scope)}
   if(action==='lock')list.forEach(v=>v.item.locked=!v.item.locked);
   if(action==='hide')list.forEach(v=>v.item.visible=false);
   if(action==='delete'){list.forEach(v=>{const arr=v.scope==='master'?masterElements():pageElements();const i=arr.findIndex(x=>x.id===v.id);if(i>=0)arr.splice(i,1)});clearSelection()}
   markDirty();render();
  });pageNode.appendChild(bar)
 }
 const baseRenderFreeElements=renderFreeElements;
 renderFreeElements=function(pageNode){
  syncPrimary();baseRenderFreeElements(pageNode);ensureOverlay(pageNode);
  pageNode.querySelectorAll('.free-element').forEach(box=>{
   const k=key(box.dataset.elementId,box.dataset.scope),isSel=selection.has(k);box.classList.toggle('s2-selected',isSel);box.classList.toggle('s2-secondary',isSel&&!(box.dataset.elementId===selectedElementId&&box.dataset.scope===selectedElementScope));
   const item=getItem(box.dataset.elementId,box.dataset.scope);box.classList.toggle('s2-locked',!!item?.locked);if(item?.visible===false)box.style.display='none';
   if(isSel&&box.dataset.elementId===selectedElementId&&box.dataset.scope===selectedElementScope&&!preview){['n','w','nw','ne','sw'].forEach(pos=>{if(!box.querySelector(`.elem-handle.${pos}`)){const h=document.createElement('span');h.className=`elem-handle ${pos}`;h.dataset.handle=pos;box.appendChild(h)}});if(!box.querySelector('.elem-rotate-handle')){const r=document.createElement('span');r.className='elem-rotate-handle';r.dataset.handle='rotate';box.appendChild(r)}}
  });renderToolbar(pageNode)
 };
 startElementPointer=function(e){
  const box=e.currentTarget;let id=box.dataset.elementId,scope=box.dataset.scope,item=getItem(id,scope);if(!item||item.locked)return;
  e.preventDefault();e.stopPropagation();if((id!==selectedElementId||scope!==selectedElementScope)&&!confirmDiscardInspectorChanges())return;
  const usePageOverride=scope==='master'&&el('elementScope')?.value==='page',multi=e.shiftKey||e.ctrlKey||e.metaKey,wasSelected=selection.has(key(id,scope));
  let snapshotTaken=false;
  if(usePageOverride){snapshot();snapshotTaken=true;const target=ensureCurrentPageEditTarget(id,scope);id=target.id;scope=target.scope;item=target.item;selectOnly(id,scope);if(target.created)showEditorToast('현재 페이지만 수정합니다. 같은 Master의 다른 페이지는 유지됩니다.')}
  else{if(multi)toggleSelection(id,scope);else if(!wasSelected)selectOnly(id,scope);else setPrimary(id,scope)}
  inspectorDirty=false;inspectorNotice={type:'ready',message:'선택한 개체를 Canvas에서 직접 편집할 수 있습니다.'};
  const rect=el('page').getBoundingClientRect(),handle=e.target.dataset.handle||'move';
  gesture=window.ACDLCanvasGesture.begin({pointerId:e.pointerId,startX:e.clientX,startY:e.clientY,handle,rect,views:selectedViews(),primary:{id,scope,item},node:box});
  gesture.snapshotTaken=snapshotTaken;gesture.needsFullRender=usePageOverride||multi||!wasSelected||selectedViews().length>1;
  releasePointer=window.ACDLCanvasInput.capturePointer(box,e.pointerId,{move:moveElementPointer,end:endElementPointer});box.classList.add('s2-selected');
 };
 moveElementPointer=function(e){
  if(!gesture)return;if(!gesture.snapshotTaken){const dx=(e.clientX-gesture.startX)/gesture.rect.width*100,dy=(e.clientY-gesture.startY)/gesture.rect.height*100;if(Math.abs(dx)<=.05&&Math.abs(dy)<=.05)return;snapshot();gesture.snapshotTaken=true}const p=window.ACDLCanvasGesture.update(gesture,{clientX:e.clientX,clientY:e.clientY,shiftKey:e.shiftKey}),n=gesture.node;n.style.left=p.x+'%';n.style.top=p.y+'%';n.style.width=p.width+'%';n.style.height=p.height+'%';n.style.transform=`rotate(${p.rotation||0}deg)`;
 };
 endElementPointer=function(e){if(!gesture)return;const g=gesture,result=window.ACDLCanvasGesture.finish(g);releasePointer?.(e.pointerId);releasePointer=null;if(result.discardSnapshot&&g.snapshotTaken){history.pop();el('undoBtn').disabled=!history.length}gesture=null;markDirty();inspectorNotice={type:'success',message:result.message};if(g.needsFullRender||!result.changed)render();else{renderInspector();renderObjectRecommendations()}};
 document.addEventListener('pointerdown',e=>{if(!project||preview)return;const page=e.target.closest('#page');if(page&&!e.target.closest('.free-element')&&!e.target.closest('.s2-selection-toolbar')&&!e.target.closest('.calendar-region')){clearSelection();render()}},true);
 document.addEventListener('keydown',e=>{if(!project||preview)return;const views=selectedViews(),command=window.ACDLCanvasInput.keyboardCommand(e,document.activeElement?.tagName,views.length>0);if(!command)return;e.preventDefault();
  if(command.type==='select-all'){const last=selection.replace(allVisibleElements().map(v=>({id:v.id,scope:v._scope})));if(last)setPrimary(last.id,last.scope);render();return}
  if(command.type==='delete'){snapshot();views.filter(v=>!v.item.locked).forEach(v=>{const arr=v.scope==='master'?masterElements():pageElements();const i=arr.findIndex(x=>x.id===v.id);if(i>=0)arr.splice(i,1)});clearSelection();markDirty();render();return}
  if(command.type==='nudge'){snapshot();views.filter(v=>!v.item.locked).forEach(v=>Object.assign(v.item,window.ACDLCanvasGeometry.nudgeFrame(v.item,command.deltaX,command.deltaY)));markDirty();render()}
 },true);
 const oldReset=resetEditorViewState;resetEditorViewState=function(){selection.clear();oldReset()};
 window.ACDLSprint2Editor={version:'2.0-product',getSelection:()=>selectedViews().map(v=>({id:v.id,scope:v.scope})),clearSelection};
})();
