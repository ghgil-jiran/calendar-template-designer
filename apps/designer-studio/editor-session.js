(function(root){
 const clone=value=>structuredClone(value),equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
 const labels={'school-logo':'교표 이미지','school-building':'학교 전경','school-song':'교가 악보','school-tree':'교목 이미지','school-flower':'교화 이미지','school.name':'학교 이름','school.englishName':'영문 학교명','school.slogan':'학교 슬로건','school.address':'학교 주소','school.website':'학교 홈페이지','school.contacts':'학교 연락처','school.profile.motto.description':'교훈'};
 const bindingOf=item=>item.bindingEnabled===false?'':item.image?.binding||item.binding||'';
 function customerRights(project,page,item,original){
  const binding=bindingOf(item),school=binding.startsWith('school.'),background=/background|decoration/.test(item.role||''),photo=['image','image-frame'].includes(item.type)||item.type==='semantic-object'&&/^school-(logo|building|song|tree|flower)$/.test(item.role||'');
  const cover=/cover/.test(page.role||''),symbols=[page.role,page.semanticPageRole,page.contentPurpose].includes('school-symbols')||photo&&/^school-(song|tree|flower)$/.test(item.role||''),front=page.role==='monthly-front',back=page.role==='monthly-back',poster=project.productType?.category==='poster';
  const text=item.type==='text'&&school&&!/calendar|year|month/.test(binding),allowed=cover||symbols||front||back||poster||school||original.content===true||original.replaceImage===true;
  if(item.locked||item.selectable===false||background||!allowed||(project.template.publishing?.dataRequirements||[]).some(r=>r.stage==='excluded'&&school&&(binding===r.path||binding.startsWith(r.path+'.'))))return {};
  const userPhoto=photo&&(school||original.replaceImage===true||/monthly-image|user-image|cover-photo/.test(item.role||'')||binding.startsWith('calendar.monthlyImages.'));
  return {replaceImage:userPhoto&&(school||original.replaceImage===true),imageFit:userPhoto&&(item.type!=='image-frame'||school||original.imageFit===true),content:text&&allowed,move:(text||userPhoto)&&(cover||symbols||poster||front&&userPhoto||back&&userPhoto||original.move===true),resize:(text||userPhoto)&&(cover||symbols||poster||front&&userPhoto||original.resize===true&&!back),textStyle:text&&allowed,textSize:text&&allowed,visibility:(text||userPhoto)&&allowed};
 }
 function targets(project,pageId,capabilities,includeHidden=false){
  const page=project.book.pageInstances.find(p=>p.id===pageId);if(!page)throw Error('페이지를 찾을 수 없어요.');
  const local=project.book.elementsByPage?.[page.id]||[];
  const movable=['cover-front','back-cover-front','back-cover-back'].includes(page.role)||page.semanticPageRole==='school-symbols';
  return root.ACDLSharedScreenComposition.visibleElements(page,project.template.masterElements?.[page.masterId]||[],local).filter(item=>(includeHidden||item.visible!==false&&item.hidden!==true)&&['image-frame','image','text','semantic-object'].includes(item.type)).map(item=>{
   const rights=item.locked||item.selectable===false?{}:{...root.ACDLUserEditingPolicy.effectivePermissions(project,page,item)},authoredRights={...rights};
   rights.move=movable&&rights.move===true;rights.resize=movable&&rights.resize===true;rights.textSize=movable&&item.type==='text'&&rights.color===true;
   if(item.type!=='image-frame')rights.imageFit=false;if(!['image-frame','image'].includes(item.type))rights.replaceImage=false;
   if(capabilities==='school-basic-v2'){const allowed=customerRights(project,page,item,authoredRights);Object.keys(rights).forEach(key=>delete rights[key]);Object.assign(rights,allowed);}
   return {pageId:page.id,elementId:item.id,scope:item._scope,type:item.type,binding:bindingOf(item),role:item.role||'',identity:item.shadowOfMasterElementId||item.id,correspondenceKey:item.metadata?.correspondenceKey||'',label:item.label||labels[item.role]||labels[bindingOf(item)]||item.alt||({'text':'글자','semantic-object':'학교 상징'}[item.type])||'사진',x:item.x,y:item.y,width:item.width,height:item.height,rotation:item.rotation||0,fontSize:item.style?.fontSize||18,rights};
  });
 }
 function validateState(state){
  if(!state||state.version!==1||!Array.isArray(state.edits)||state.edits.length>1000||typeof state.pageId!=='string')throw Error('편집 저장 정보를 확인해 주세요.');
  const keys=new Set();for(const edit of state.edits){const key=JSON.stringify([edit.pageId,edit.scope,edit.elementId]);if(keys.has(key)||!['master','page'].includes(edit.scope)||typeof edit.pageId!=='string'||typeof edit.elementId!=='string'||edit.photoId!==undefined&&typeof edit.photoId!=='string')throw Error('사진 편집 영역을 확인해 주세요.');keys.add(key);
   if(Object.keys(edit).some(k=>!['pageId','elementId','scope','photoId','fit','layout','fontSize','textStyle','hidden','photoCopy'].includes(k)))throw Error('알 수 없는 편집 항목이에요.');
   if(edit.layout&&(Object.keys(edit.layout).some(k=>!['x','y','width','height'].includes(k))||['x','y','width','height'].some(k=>!Number.isFinite(edit.layout[k]))||edit.layout.width<.2||edit.layout.width>500||edit.layout.height<.2||edit.layout.height>500||Math.abs(edit.layout.x)>500||Math.abs(edit.layout.y)>500))throw Error('배치 값을 확인해 주세요.');
   if(edit.photoCopy){const c=edit.photoCopy;if(typeof c!=='object'||Object.keys(c).some(k=>!['photoId','source'].includes(k))||Boolean(c.photoId)===Boolean(c.source)||c.photoId!==undefined&&typeof c.photoId!=='string'||edit.photoId!==undefined)throw Error('공통 이미지 정보를 확인해 주세요.');if(c.source){const r=c.source;if(Object.keys(r).some(k=>!['pageId','scope','elementId'].includes(k))||!['master','page'].includes(r.scope)||typeof r.pageId!=='string'||typeof r.elementId!=='string')throw Error('공통 이미지 영역을 확인해 주세요.');}}
   if(edit.hidden!==undefined&&typeof edit.hidden!=='boolean')throw Error('표시 값을 확인해 주세요.');
   if(edit.textStyle){const v=edit.textStyle;if(v.textAlign!==undefined&&!['left','center','right','justify'].includes(v.textAlign))throw Error('글자 정렬을 확인해 주세요.');if(Object.keys(v).some(k=>!['fontFamily','fontSize','fontWeight','color','fontStyle','textDecoration','textAlign'].includes(k))||v.fontFamily!==undefined&&(typeof v.fontFamily!=='string'||v.fontFamily.length>100||/[;{}<>\n]/.test(v.fontFamily))||v.fontSize!==undefined&&(!Number.isFinite(v.fontSize)||v.fontSize<1||v.fontSize>240)||v.fontStyle!==undefined&&!['normal','italic'].includes(v.fontStyle)||v.textDecoration!==undefined&&!['none','underline','line-through','underline line-through'].includes(v.textDecoration)||v.fontWeight!==undefined&&![400,700].includes(v.fontWeight)||v.color!==undefined&&!/^#[a-f0-9]{6}$/i.test(v.color))throw Error('글자 스타일을 확인해 주세요.');}
   if(edit.fontSize!==undefined&&(!Number.isFinite(edit.fontSize)||edit.fontSize<1||edit.fontSize>240))throw Error('글자 크기를 확인해 주세요.');
   if(edit.fit){if(Object.keys(edit.fit).some(k=>!['fit','scale','offsetX','offsetY'].includes(k)))throw Error('알 수 없는 사진 맞춤 항목이에요.');if(!['cover','contain'].includes(edit.fit.fit)||!Number.isFinite(edit.fit.scale)||edit.fit.scale<.1||edit.fit.scale>10||!Number.isFinite(edit.fit.offsetX)||Math.abs(edit.fit.offsetX)>100||!Number.isFinite(edit.fit.offsetY)||Math.abs(edit.fit.offsetY)>100)throw Error('사진 맞춤 값을 확인해 주세요.');}
  }
 }
 function originalItem(project,target){const page=project.book.pageInstances.find(p=>p.id===target.pageId);return (target.scope==='master'?project.template.masterElements?.[page?.masterId]||[]:project.book.elementsByPage?.[target.pageId]||[]).find(e=>e.id===target.elementId);}
 function photoSource(project,copy,assets,capabilities){
  if(copy.photoId){const asset=assets.find(a=>a.id===copy.photoId);if(!asset?.url)throw Error('공통 적용할 사진 원본이 없어요.');return asset.url;}
  const ref=copy.source,target=targets(project,ref.pageId,capabilities,true).find(t=>t.scope===ref.scope&&t.elementId===ref.elementId);if(!target?.rights.replaceImage)throw Error('공통 적용할 이미지 영역이 변경됐어요.');
  const item=originalItem(project,target),binding=bindingOf(item),page=project.book.pageInstances.find(p=>p.id===target.pageId);let value;
  if(binding.startsWith('school.'))value=binding.split('.').slice(1).reduce((v,k)=>v?.[k],project.book.school);
  if(binding.startsWith('calendar.monthlyImages.')){const month=binding.endsWith('.current')?page.calendarMonth:Number(binding.split('.').at(-1)),year=page.calendarYear||project.settings?.year;value=project.book.monthlyImages?.[`${year}-${String(month).padStart(2,'0')}`];}
  const src=(typeof value==='string'?value:value?.image||value?.src)||item.image?.src||item.src||item.sampleContent?.image||(project.template.resources?.sampleAssets||[]).find(a=>a.id===item.sampleAssetId)?.image||[...(project.template.resources?.assets||[]),...(project.template.resources?.aiDesignAssets||[])].find(a=>a.id===(item.image?.assetId||item.assetRef?.id||item.assetId||item.aiDesign?.resourceId))?.src;
  if(!src)throw Error('먼저 적용할 사진을 선택해 주세요.');return src;
 }
 function correspondingTargets(project,target,capabilities){
  const page=project.book.pageInstances.find(p=>p.id===target.pageId),poster=project.productType?.category==='poster';if(!page||!(poster||page.role==='monthly-front')||!target.rights.replaceImage)return [];
  const result=[],own=targets(project,page.id,capabilities).filter(t=>t.rights.replaceImage);
  for(const p of project.book.pageInstances){const sameSeries=poster?p.role===page.role||String(p.role).startsWith('poster')&&String(page.role).startsWith('poster'):p.role==='monthly-front';if(p.id===page.id||!sameSeries)continue;const candidates=targets(project,p.id,capabilities).filter(t=>t.rights.replaceImage);let match=[];
   for(const predicate of [t=>t.identity===target.identity,t=>target.correspondenceKey&&t.correspondenceKey===target.correspondenceKey,t=>target.binding&&t.binding===target.binding,t=>target.role&&t.role===target.role]){match=candidates.filter(predicate);if(match.length)break;}
   if(!match.length&&!target.binding&&!target.role&&own.length===1&&candidates.length===1)match=candidates;
   if(match.length===1)result.push(match[0]);
  }return result;
 }
 function shareChanges(project,state,selection,assets,capabilities,options){
  if(!selection)throw Error('이미지 개체를 먼저 선택해 주세요.');const related=correspondingTargets(project,selection,capabilities),base=apply(project,state,assets,{capabilities}),page=base.book.pageInstances.find(p=>p.id===selection.pageId),local=base.book.elementsByPage?.[page.id]||[],item=local.find(e=>e.id===selection.elementId||selection.scope==='master'&&e.shadowOfMasterElementId===selection.elementId)||originalItem(base,selection),own=state.edits.find(e=>e.pageId===selection.pageId&&e.scope===selection.scope&&e.elementId===selection.elementId);
  if(options.layout&&!(selection.rights.move&&selection.rights.resize))throw Error('위치와 크기를 공통 적용할 수 없는 개체예요.');
  const copy=options.image?(own?.photoId?{photoId:own.photoId}:own?.photoCopy?clone(own.photoCopy):{source:{pageId:selection.pageId,scope:selection.scope,elementId:selection.elementId}}):null;if(copy)photoSource(project,copy,assets,capabilities);
  for(const target of related){const index=state.edits.findIndex(e=>e.pageId===target.pageId&&e.scope===target.scope&&e.elementId===target.elementId),edit={...(state.edits[index]||{pageId:target.pageId,scope:target.scope,elementId:target.elementId})};let changed=false;
   if(options.layout&&target.rights.move&&target.rights.resize){edit.layout={x:item.x,y:item.y,width:item.width,height:item.height};changed=true;}
   if(options.image&&target.rights.replaceImage){delete edit.photoId;edit.photoCopy=clone(copy);changed=true;}
   if(changed){if(index<0)state.edits.push(edit);else state.edits[index]=edit;}
  }return state;
 }

 function withCopies(project,state,capabilities){
  const document=clone(project),copies=state.copies||[];
  if(!Array.isArray(copies)||copies.length>200)throw Error('복사 개체 수를 확인해 주세요.');
  const ids=new Set();
  for(const c of copies){
   if(!c||typeof c.id!=='string'||!c.id.startsWith('user-copy:')||ids.has(c.id)||!document.book.pageInstances.some(p=>p.id===c.pageId))throw Error('복사 개체 정보를 확인해 주세요.');
   ids.add(c.id);const t=targets(document,c.source?.pageId,capabilities,true).find(t=>t.elementId===c.source.elementId&&t.scope===c.source.scope);
   if(!t||!Object.values(t.rights).some(Boolean))throw Error('복사할 수 없는 개체입니다.');
   const item=clone(originalItem(document,t));item.id=c.id;delete item.shadowOfMasterElementId;item.originScope='page';
   document.book.elementsByPage||={};const list=document.book.elementsByPage[c.pageId]||=[];if(list.some(e=>e.id===c.id))throw Error('복사 개체가 중복되었습니다.');list.push(item);
  }return document;
 }
 function apply(project,state,assets,{capabilities}={}){
  validateState(state);project=withCopies(project,state,capabilities);if(!project.book.pageInstances.some(p=>p.id===state.pageId))throw Error('편집 페이지가 없어요.');const document=clone(project);
  for(const edit of state.edits){
   const target=targets(project,edit.pageId,capabilities).find(t=>t.elementId===edit.elementId&&t.scope===edit.scope);if(!target){
    const page=project.book.pageInstances.find(p=>p.id===edit.pageId),items=edit.scope==='master'?project.template.masterElements?.[page?.masterId]||[]:project.book.elementsByPage?.[edit.pageId]||[],original=items.find(e=>e.id===edit.elementId);
    // Retain prior photo edits while explicitly hidden; revalidate when shown again.
    if(original&&(original.visible===false||original.hidden===true))continue;
    throw Error('사진 편집 영역이 변경됐어요.');
   }
   if(edit.textStyle&&!target.rights.textStyle||edit.hidden!==undefined&&!target.rights.visibility)throw Error('허용하지 않은 글자 편집이에요.');
   if((edit.photoId!==undefined||edit.photoCopy)&&!target.rights.replaceImage||edit.fit&&!target.rights.imageFit)throw Error('템플릿에서 허용하지 않은 사진 편집이에요.');
   const page=document.book.pageInstances.find(p=>p.id===edit.pageId);document.book.elementsByPage||={};const local=document.book.elementsByPage[page.id]||=[];
   let item=edit.scope==='master'?(document.template.masterElements[page.masterId]||[]).find(e=>e.id===edit.elementId):local.find(e=>e.id===edit.elementId);
   const placementRights=capabilities==='school-basic-v2'&&!state.capabilityVersion?targets(project,edit.pageId).find(t=>t.elementId===edit.elementId&&t.scope===edit.scope)?.rights||target.rights:target.rights;
   if(edit.layout&&((edit.layout.x!==item.x||edit.layout.y!==item.y)&&!placementRights.move||(edit.layout.width!==item.width||edit.layout.height!==item.height)&&!placementRights.resize)||edit.fontSize!==undefined&&!placementRights.textSize)throw Error('이 페이지에서 허용하지 않은 개체 조정이에요.');
   if(edit.scope==='master'){const original=item;item=clone(original);item.id=`user-photo:${page.id}:${original.id}`;if(local.some(e=>e.id===item.id))throw Error('사진 개체 식별자가 중복됐어요.');item.shadowOfMasterElementId=original.id;item.originScope='master';local.push(item);}
   if(edit.photoId!==undefined){const asset=assets.find(a=>a.id===edit.photoId);if(!asset?.url)throw Error('편집에 사용한 사진 원본이 없어요.');if(item.type==='semantic-object'){item.sampleContent={...item.sampleContent,image:asset.url,assetId:asset.id};}else if(item.type==='image'){item.src=asset.url;}else item.image={...item.image,src:asset.url,assetId:asset.id,binding:'',fit:'cover',scale:1,offsetX:0,offsetY:0};item.binding='';item.bindingEnabled=false;}
   if(edit.photoCopy){const src=photoSource(project,edit.photoCopy,assets,capabilities);if(item.type==='semantic-object'){item.sampleContent={...item.sampleContent,image:src};delete item.sampleContent.assetId;if(edit.photoCopy.photoId)item.sampleContent.assetId=edit.photoCopy.photoId;}else if(item.type==='image'){item.src=src;delete item.assetId;}else {item.image={...item.image,src,binding:''};delete item.image.assetId;if(edit.photoCopy.photoId)item.image.assetId=edit.photoCopy.photoId;}item.binding='';item.bindingEnabled=false;}
   if(edit.layout)root.ACDLInspectorElement.apply(item,'geometry',edit.layout);
   if(edit.textStyle)item.style={...item.style,...edit.textStyle};
   if(edit.hidden!==undefined)item.visible=!edit.hidden;
   if(edit.fontSize!==undefined)root.ACDLInspectorElement.apply(item,'text-size',{fontSize:edit.fontSize});
   if(edit.fit)root.ACDLPhotoFrameEditing.apply(item,{...item.image,...edit.fit});
  }return document;
 }
 function create({project,state,assets=[],capabilities}){
  let source=clone(project);let current=clone(state||{version:1,pageId:project.book.pageInstances[0].id,edits:[]}),past=[],future=[],selection=null;
  apply(source,current,assets,{capabilities});
  function commit(next){if(capabilities==='school-basic-v2')next.capabilityVersion=2;apply(source,next,assets,{capabilities});if(equal(current,next))return false;past.push(clone(current));if(past.length>20)past.shift();current=next;future=[];return true;}
  return Object.freeze({targets:pageId=>targets(withCopies(source,current,capabilities),pageId,capabilities),select(target){selection=target?targets(withCopies(source,current,capabilities),target.pageId,capabilities).find(t=>t.elementId===target.elementId&&t.scope===target.scope)||null:null;return selection;},selection:()=>selection,getState:()=>clone(current),getDocument:()=>apply(source,current,assets,{capabilities}),canUndo:()=>past.length>0,canRedo:()=>future.length>0,
   duplicate(){if(!selection)throw Error('복사할 개체를 선택해 주세요.');const next=clone(current),id='user-copy:'+crypto.randomUUID();next.copies||=[];next.copies.push({id,pageId:current.pageId,source:{pageId:selection.pageId,scope:selection.scope,elementId:selection.elementId}});const own=current.edits.find(e=>e.pageId===selection.pageId&&e.scope===selection.scope&&e.elementId===selection.elementId);if(own)next.edits.push({...clone(own),pageId:current.pageId,scope:'page',elementId:id});commit(next);selection=targets(withCopies(source,current,capabilities),current.pageId,capabilities).find(t=>t.elementId===id);return selection;},
   remove(){if(!selection)return false;return this.editPhoto({hidden:true});},
   resetBoundPhotos(binding){const next=clone(current);next.edits=next.edits.flatMap(e=>{const t=targets(source,e.pageId,capabilities).find(t=>t.scope===e.scope&&t.elementId===e.elementId);if(t?.binding!==binding)return [e];const {photoId,photoCopy,fit,...rest}=e;return Object.keys(rest).length>3?[rest]:[];});return commit(next);},
   setProject(next){apply(next,current,assets,{capabilities});source=clone(next);},
   counterparts(target=selection){return target?correspondingTargets(source,target,capabilities):[];},
   applyAcrossPages(options){return commit(shareChanges(source,clone(current),selection,assets,capabilities,options));},
   applyToMonthlyFronts(){if(!selection||selection.binding!=='school.profile.logo')throw Error('월력 앞면 교표를 선택해주세요.');const base=apply(source,current,assets,{capabilities}),page=base.book.pageInstances.find(p=>p.id===selection.pageId);if(page.role!=='monthly-front')throw Error('월력 앞면에서 사용해주세요.');const item=(base.book.elementsByPage[page.id]||[]).find(e=>e.id===selection.elementId||e.shadowOfMasterElementId===selection.elementId)||(base.template.masterElements[page.masterId]||[]).find(e=>e.id===selection.elementId),next=clone(current);for(const p of source.book.pageInstances.filter(p=>p.role==='monthly-front'))for(const t of targets(source,p.id,capabilities).filter(t=>t.binding==='school.profile.logo'&&t.rights.move&&t.rights.resize)){const index=next.edits.findIndex(e=>e.pageId===t.pageId&&e.scope===t.scope&&e.elementId===t.elementId),edit={...(next.edits[index]||{pageId:t.pageId,scope:t.scope,elementId:t.elementId}),layout:{x:item.x,y:item.y,width:item.width,height:item.height}};const own=current.edits.find(e=>e.pageId===selection.pageId&&e.scope===selection.scope&&e.elementId===selection.elementId);if(t.rights.imageFit)edit.fit=own?.fit?clone(own.fit):{fit:item.image?.fit||'cover',scale:Number(item.image?.scale||1),offsetX:Number(item.image?.offsetX||0),offsetY:Number(item.image?.offsetY||0)};if(index<0)next.edits.push(edit);else next.edits[index]=edit;}return commit(next);},
   setAssets(next){apply(source,current,next,{capabilities});assets=next;},
   setPage(pageId){targets(source,pageId,capabilities);current={...current,pageId};selection=null;},
   editPhoto(patch,sharing={}){if(!selection)throw Error('사진 영역을 먼저 선택해 주세요.');const next=clone(current);if(capabilities==='school-basic-v2')next.capabilityVersion=2;const index=next.edits.findIndex(e=>e.pageId===selection.pageId&&e.elementId===selection.elementId&&e.scope===selection.scope),previous=next.edits[index]||{pageId:selection.pageId,elementId:selection.elementId,scope:selection.scope};const edit={...previous};if(Object.hasOwn(patch,'photoId')){edit.photoId=patch.photoId;delete edit.photoCopy;delete edit.fit;}if(patch.fit)edit.fit=clone(patch.fit);if(patch.layout)edit.layout=clone(patch.layout);if(patch.fontSize!==undefined)edit.fontSize=patch.fontSize;if(patch.textStyle)edit.textStyle={...edit.textStyle,...clone(patch.textStyle)};if(patch.hidden!==undefined)edit.hidden=patch.hidden;if(index<0)next.edits.push(edit);else next.edits[index]=edit;if(patch.layout&&sharing.layoutAll||patch.photoId!==undefined&&sharing.imageAll)shareChanges(source,next,selection,assets,capabilities,{layout:!!patch.layout&&sharing.layoutAll,image:patch.photoId!==undefined&&sharing.imageAll});return commit(next);},
   resetPhoto(sharing={}){if(!selection)return false;const next={...clone(current),edits:current.edits.flatMap(e=>{if(!(e.pageId===selection.pageId&&e.elementId===selection.elementId&&e.scope===selection.scope))return [e];const {photoId,photoCopy,fit,...preserved}=e;return Object.keys(preserved).length>3?[preserved]:[];})};if(sharing.imageAll)shareChanges(source,next,selection,assets,capabilities,{image:true});return commit(next);},
   undo(){if(!past.length)return false;future.push(clone(current));current=past.pop();selection=null;return true;},redo(){if(!future.length)return false;past.push(clone(current));current=future.pop();selection=null;return true;}
  });
 }
 root.ACDLEditorSession=Object.freeze({version:1,targets,validateState,apply,create});
})(globalThis);
