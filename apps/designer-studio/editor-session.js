(function(root){
 const clone=value=>structuredClone(value),equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
 function targets(project,pageId){
  const page=project.book.pageInstances.find(p=>p.id===pageId);if(!page)throw Error('페이지를 찾을 수 없어요.');
  const local=project.book.elementsByPage?.[page.id]||[];
  const movable=['cover-front','back-cover-front','back-cover-back'].includes(page.role)||page.semanticPageRole==='school-symbols';
  return root.ACDLSharedScreenComposition.visibleElements(page,project.template.masterElements?.[page.masterId]||[],local).filter(item=>item.visible!==false&&item.hidden!==true&&['image-frame','image','text','semantic-object'].includes(item.type)).map(item=>{
   const rights=item.locked||item.selectable===false?{}:{...root.ACDLUserEditingPolicy.effectivePermissions(project,page,item)};
   rights.move=movable&&rights.move===true;rights.resize=movable&&rights.resize===true;rights.textSize=movable&&item.type==='text'&&rights.color===true;
   if(item.type!=='image-frame')rights.imageFit=false;if(!['image-frame','image'].includes(item.type))rights.replaceImage=false;
   return {pageId:page.id,elementId:item.id,scope:item._scope,type:item.type,label:item.label||item.alt||({'text':'글자','semantic-object':'학교 상징'}[item.type])||'사진',x:item.x,y:item.y,width:item.width,height:item.height,rotation:item.rotation||0,fontSize:item.style?.fontSize||18,rights};
  });
 }
 function validateState(state){
  if(!state||state.version!==1||!Array.isArray(state.edits)||state.edits.length>1000||typeof state.pageId!=='string')throw Error('편집 저장 정보를 확인해 주세요.');
  const keys=new Set();for(const edit of state.edits){const key=JSON.stringify([edit.pageId,edit.scope,edit.elementId]);if(keys.has(key)||!['master','page'].includes(edit.scope)||typeof edit.pageId!=='string'||typeof edit.elementId!=='string'||edit.photoId!==undefined&&typeof edit.photoId!=='string')throw Error('사진 편집 영역을 확인해 주세요.');keys.add(key);
   if(Object.keys(edit).some(k=>!['pageId','elementId','scope','photoId','fit','layout','fontSize'].includes(k)))throw Error('알 수 없는 편집 항목이에요.');
   if(edit.layout&&(Object.keys(edit.layout).some(k=>!['x','y','width','height'].includes(k))||['x','y','width','height'].some(k=>!Number.isFinite(edit.layout[k]))||edit.layout.width<3||edit.layout.width>500||edit.layout.height<3||edit.layout.height>500||Math.abs(edit.layout.x)>500||Math.abs(edit.layout.y)>500))throw Error('배치 값을 확인해 주세요.');
   if(edit.fontSize!==undefined&&(!Number.isFinite(edit.fontSize)||edit.fontSize<1||edit.fontSize>240))throw Error('글자 크기를 확인해 주세요.');
   if(edit.fit){if(Object.keys(edit.fit).some(k=>!['fit','scale','offsetX','offsetY'].includes(k)))throw Error('알 수 없는 사진 맞춤 항목이에요.');if(!['cover','contain'].includes(edit.fit.fit)||!Number.isFinite(edit.fit.scale)||edit.fit.scale<.1||edit.fit.scale>10||!Number.isFinite(edit.fit.offsetX)||Math.abs(edit.fit.offsetX)>100||!Number.isFinite(edit.fit.offsetY)||Math.abs(edit.fit.offsetY)>100)throw Error('사진 맞춤 값을 확인해 주세요.');}
  }
 }
 function apply(project,state,assets){
  validateState(state);if(!project.book.pageInstances.some(p=>p.id===state.pageId))throw Error('편집 페이지가 없어요.');const document=clone(project);
  for(const edit of state.edits){
   const target=targets(project,edit.pageId).find(t=>t.elementId===edit.elementId&&t.scope===edit.scope);if(!target)throw Error('사진 편집 영역이 변경됐어요.');
   if(edit.photoId!==undefined&&!target.rights.replaceImage||edit.fit&&!target.rights.imageFit)throw Error('템플릿에서 허용하지 않은 사진 편집이에요.');
   const page=document.book.pageInstances.find(p=>p.id===edit.pageId);document.book.elementsByPage||={};const local=document.book.elementsByPage[page.id]||=[];
   let item=edit.scope==='master'?(document.template.masterElements[page.masterId]||[]).find(e=>e.id===edit.elementId):local.find(e=>e.id===edit.elementId);
   if(edit.layout&&((edit.layout.x!==item.x||edit.layout.y!==item.y)&&!target.rights.move||(edit.layout.width!==item.width||edit.layout.height!==item.height)&&!target.rights.resize)||edit.fontSize!==undefined&&!target.rights.textSize)throw Error('이 페이지에서 허용하지 않은 개체 조정이에요.');
   if(edit.scope==='master'){const original=item;item=clone(original);item.id=`user-photo:${page.id}:${original.id}`;if(local.some(e=>e.id===item.id))throw Error('사진 개체 식별자가 중복됐어요.');item.shadowOfMasterElementId=original.id;item.originScope='master';local.push(item);}
   if(edit.photoId!==undefined){const asset=assets.find(a=>a.id===edit.photoId);if(!asset?.url)throw Error('편집에 사용한 사진 원본이 없어요.');if(item.type==='image'){item.src=asset.url;}else item.image={...item.image,src:asset.url,assetId:asset.id,binding:'',fit:'cover',scale:1,offsetX:0,offsetY:0};item.binding='';item.bindingEnabled=false;}
   if(edit.layout)root.ACDLInspectorElement.apply(item,'geometry',edit.layout);
   if(edit.fontSize!==undefined)root.ACDLInspectorElement.apply(item,'text-size',{fontSize:edit.fontSize});
   if(edit.fit)root.ACDLPhotoFrameEditing.apply(item,{...item.image,...edit.fit});
  }return document;
 }
 function create({project,state,assets=[]}){
  const source=clone(project);let current=clone(state||{version:1,pageId:project.book.pageInstances[0].id,edits:[]}),past=[],future=[],selection=null;
  apply(source,current,assets);
  function commit(next){apply(source,next,assets);if(equal(current,next))return false;past.push(clone(current));if(past.length>20)past.shift();current=next;future=[];return true;}
  return Object.freeze({targets:pageId=>targets(source,pageId),select(target){selection=target?targets(source,target.pageId).find(t=>t.elementId===target.elementId&&t.scope===target.scope)||null:null;return selection;},selection:()=>selection,getState:()=>clone(current),getDocument:()=>apply(source,current,assets),canUndo:()=>past.length>0,canRedo:()=>future.length>0,
   setAssets(next){apply(source,current,next);assets=next;},
   setPage(pageId){targets(source,pageId);current={...current,pageId};selection=null;},
   editPhoto(patch){if(!selection)throw Error('사진 영역을 먼저 선택해 주세요.');const next=clone(current),index=next.edits.findIndex(e=>e.pageId===selection.pageId&&e.elementId===selection.elementId&&e.scope===selection.scope),previous=next.edits[index]||{pageId:selection.pageId,elementId:selection.elementId,scope:selection.scope};const edit={...previous};if(Object.hasOwn(patch,'photoId')){edit.photoId=patch.photoId;delete edit.fit;}if(patch.fit)edit.fit=clone(patch.fit);if(patch.layout)edit.layout=clone(patch.layout);if(patch.fontSize!==undefined)edit.fontSize=patch.fontSize;if(index<0)next.edits.push(edit);else next.edits[index]=edit;return commit(next);},
   resetPhoto(){if(!selection)return false;return commit({...clone(current),edits:current.edits.flatMap(e=>{if(!(e.pageId===selection.pageId&&e.elementId===selection.elementId&&e.scope===selection.scope))return [e];const {photoId,fit,...preserved}=e;return e.layout||e.fontSize!==undefined?[preserved]:[];})});},
   undo(){if(!past.length)return false;future.push(clone(current));current=past.pop();selection=null;return true;},redo(){if(!future.length)return false;past.push(clone(current));current=future.pop();selection=null;return true;}
  });
 }
 root.ACDLEditorSession=Object.freeze({version:1,targets,validateState,apply,create});
})(globalThis);
