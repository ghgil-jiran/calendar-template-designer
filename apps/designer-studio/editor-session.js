(function(root){
 const clone=value=>structuredClone(value),equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
 function targets(project,pageId){
  const page=project.book.pageInstances.find(p=>p.id===pageId);if(!page)throw Error('페이지를 찾을 수 없어요.');
  const local=project.book.elementsByPage?.[page.id]||[];
  return root.ACDLSharedScreenComposition.visibleElements(page,project.template.masterElements?.[page.masterId]||[],local).filter(item=>item.visible!==false&&item.hidden!==true&&item.type==='image-frame').map(item=>({pageId:page.id,elementId:item.id,scope:item._scope,label:item.label||item.alt||'사진',x:item.x,y:item.y,width:item.width,height:item.height,rotation:item.rotation||0,rights:item.locked||item.selectable===false?{}:root.ACDLUserEditingPolicy.effectivePermissions(project,page,item)}));
 }
 function validateState(state){
  if(!state||state.version!==1||!Array.isArray(state.edits)||state.edits.length>1000||typeof state.pageId!=='string')throw Error('편집 저장 정보를 확인해 주세요.');
  const keys=new Set();for(const edit of state.edits){const key=JSON.stringify([edit.pageId,edit.scope,edit.elementId]);if(keys.has(key)||!['master','page'].includes(edit.scope)||typeof edit.pageId!=='string'||typeof edit.elementId!=='string'||edit.photoId!==undefined&&typeof edit.photoId!=='string')throw Error('사진 편집 영역을 확인해 주세요.');keys.add(key);
   if(Object.keys(edit).some(k=>!['pageId','elementId','scope','photoId','fit'].includes(k)))throw Error('알 수 없는 편집 항목이에요.');
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
   if(edit.scope==='master'){const original=item;item=clone(original);item.id=`user-photo:${page.id}:${original.id}`;if(local.some(e=>e.id===item.id))throw Error('사진 개체 식별자가 중복됐어요.');item.shadowOfMasterElementId=original.id;item.originScope='master';local.push(item);}
   if(edit.photoId!==undefined){const asset=assets.find(a=>a.id===edit.photoId);if(!asset?.url)throw Error('편집에 사용한 사진 원본이 없어요.');item.image={...item.image,src:asset.url,assetId:asset.id,binding:'',fit:'cover',scale:1,offsetX:0,offsetY:0};item.binding='';item.bindingEnabled=false;}
   if(edit.fit)root.ACDLPhotoFrameEditing.apply(item,{...item.image,...edit.fit});
  }return document;
 }
 function create({project,state,assets=[]}){
  const source=clone(project);let current=clone(state||{version:1,pageId:project.book.pageInstances[0].id,edits:[]}),past=[],future=[],selection=null;
  apply(source,current,assets);
  function commit(next){apply(source,next,assets);if(equal(current,next))return false;past.push(clone(current));if(past.length>20)past.shift();current=next;future=[];return true;}
  return Object.freeze({targets:pageId=>targets(source,pageId),select(target){selection=target?targets(source,target.pageId).find(t=>t.elementId===target.elementId&&t.scope===target.scope)||null:null;return selection;},selection:()=>selection,getState:()=>clone(current),getDocument:()=>apply(source,current,assets),canUndo:()=>past.length>0,canRedo:()=>future.length>0,
   setPage(pageId){targets(source,pageId);current={...current,pageId};selection=null;},
   editPhoto(patch){if(!selection)throw Error('사진 영역을 먼저 선택해 주세요.');const next=clone(current),index=next.edits.findIndex(e=>e.pageId===selection.pageId&&e.elementId===selection.elementId&&e.scope===selection.scope),previous=next.edits[index]||{pageId:selection.pageId,elementId:selection.elementId,scope:selection.scope};const edit={...previous};if(Object.hasOwn(patch,'photoId')){edit.photoId=patch.photoId;delete edit.fit;}if(patch.fit)edit.fit=clone(patch.fit);if(index<0)next.edits.push(edit);else next.edits[index]=edit;return commit(next);},
   resetPhoto(){if(!selection)return false;return commit({...clone(current),edits:current.edits.filter(e=>!(e.pageId===selection.pageId&&e.elementId===selection.elementId&&e.scope===selection.scope))});},
   undo(){if(!past.length)return false;future.push(clone(current));current=past.pop();selection=null;return true;},redo(){if(!future.length)return false;past.push(clone(current));current=future.pop();selection=null;return true;}
  });
 }
 root.ACDLEditorSession=Object.freeze({version:1,targets,validateState,apply,create});
})(globalThis);
