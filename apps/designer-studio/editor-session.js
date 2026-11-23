(function(root){
 const clone=value=>structuredClone(value),equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
 const labels={'school-logo':'교표 이미지','school-building':'학교 전경','school-song':'교가 악보','school-tree':'교목 이미지','school-flower':'교화 이미지','school.name':'학교 이름','school.englishName':'영문 학교명','school.slogan':'학교 슬로건','school.address':'학교 주소','school.website':'학교 홈페이지','school.contacts':'학교 연락처','school.profile.motto.description':'교훈'};
 const bindingOf=item=>item.bindingEnabled===false?'':item.image?.binding||item.binding||'';
 const protectedBackground=item=>/background/i.test(item.role||'')||Boolean(item.backgroundPresetId||item.metadata?.isBackground);
 const layerDirections=['forward','backward','front','back'];
 const pageById=(project,pageId)=>project.book.pageInstances.find(p=>p.id===pageId);
 const supportsPageObjects=project=>['desk','poster'].includes(project.productType?.category);
 const additionPresets={shape:['rect','rounded','circle','ellipse','triangle','diamond','pentagon','hexagon','octagon','star','heart','cross','speech','ribbon','cloud','arch','line','line-dashed','line-dotted','line-bold'],frame:['rect','rounded','circle','ellipse']};
 const additionKinds=['text','image','shape','frame','illustration'];
 function canAddPageObject(project,page,type){
  const permission=['frame','illustration'].includes(type)?'image':type==='shape'?'shape':type;
  return supportsPageObjects(project)&&page&&project.template.userEditing?.restrictions?.additions?.[permission]!==false&&page.userEditing?.restrictions?.additions?.[permission]!==false;
 }
 function customerRights(project,page,item,original){
  const binding=bindingOf(item),school=binding.startsWith('school.'),background=supportsPageObjects(project)?protectedBackground(item):/background|decoration/.test(item.role||''),photo=['image','image-frame'].includes(item.type)||item.type==='semantic-object'&&/^school-(logo|building|song|tree|flower)$/.test(item.role||'');
  const cover=/cover/.test(page.role||''),symbols=[page.role,page.semanticPageRole,page.contentPurpose].includes('school-symbols')||photo&&/^school-(song|tree|flower)$/.test(item.role||''),front=page.role==='monthly-front',back=page.role==='monthly-back',poster=project.productType?.category==='poster';
  const text=item.type==='text'&&school&&!/calendar|year|month/.test(binding),allowed=cover||symbols||front||back||supportsPageObjects(project)||school||original.content===true||original.replaceImage===true;
  if(item.locked||item.selectable===false||background||!allowed||(project.template.publishing?.dataRequirements||[]).some(r=>r.stage==='excluded'&&school&&(binding===r.path||binding.startsWith(r.path+'.'))))return {};
  if(poster&&item.type==='year-calendar'&&item.academicPoster)return {calendarStyle:true};
  const userPhoto=photo&&(school||original.replaceImage===true||/monthly-image|user-image|cover-photo/.test(item.role||'')||binding.startsWith('calendar.monthlyImages.'));
  if(supportsPageObjects(project)){
   const isText=item.type==='text',shape=item.type==='shape',editable=isText||shape||photo||['graphic','vector'].includes(item.type);
   if(!editable)return {};
   if(!poster&&isText&&binding.startsWith('calendar.'))return {content:false};
   const limit=item.customerEditingRestrictions||{};
   const allowed=action=>limit[action]!==false;
   return {replaceImage:userPhoto&&(school||original.replaceImage===true||item.role==='user-image')&&allowed('replaceImage'),
    imageFit:userPhoto&&(school||original.imageFit===true||item.role==='user-image'||!poster&&item.type!=='image-frame')&&allowed('imageFit'),
    content:isText&&allowed('content')&&(!binding||school),freeText:isText&&!binding&&allowed('content'),
    move:allowed('move'),resize:allowed('resize')&&(poster||!back||!userPhoto||item.role==='user-image'),layer:allowed('layer'),duplicate:allowed('duplicate'),
    visibility:item.required!==true&&allowed('delete'),textStyle:isText&&allowed('color'),textSize:isText&&allowed('color'),fill:shape&&allowed('color')};
  }
  return {replaceImage:userPhoto&&(school||original.replaceImage===true),imageFit:userPhoto&&(item.type!=='image-frame'||school||original.imageFit===true),content:text&&allowed,move:(text||userPhoto)&&(cover||symbols||poster||front&&userPhoto||back&&userPhoto||original.move===true),resize:(text||userPhoto)&&(cover||symbols||poster||front&&userPhoto||original.resize===true&&!back),textStyle:text&&allowed,textSize:text&&allowed,visibility:(text||userPhoto)&&allowed};
 }
 function targets(project,pageId,capabilities,includeHidden=false){
  const page=project.book.pageInstances.find(p=>p.id===pageId);if(!page)throw Error('페이지를 찾을 수 없어요.');
  const local=project.book.elementsByPage?.[page.id]||[];
  const movable=['cover-front','back-cover-front','back-cover-back'].includes(page.role)||page.semanticPageRole==='school-symbols';
  const result=root.ACDLSharedScreenComposition.visibleElements(page,project.template.masterElements?.[page.masterId]||[],local).filter(item=>(includeHidden||item.visible!==false&&item.hidden!==true)&&['image-frame','image','text','semantic-object','year-calendar',...(supportsPageObjects(project)?['shape','graphic','vector']:[])].includes(item.type)).map(item=>{
   const rights=item.locked||item.selectable===false?{}:{...root.ACDLUserEditingPolicy.effectivePermissions(project,page,item)},authoredRights={...rights};
   rights.move=movable&&rights.move===true;rights.resize=movable&&rights.resize===true;rights.textSize=movable&&item.type==='text'&&rights.color===true;
   if(item.type!=='image-frame')rights.imageFit=false;if(!['image-frame','image'].includes(item.type))rights.replaceImage=false;
   if(capabilities==='school-basic-v2'){const allowed=customerRights(project,page,item,authoredRights);Object.keys(rights).forEach(key=>delete rights[key]);Object.assign(rights,allowed);}
   return {pageId:page.id,elementId:item.id,scope:item._scope,type:item.type,binding:bindingOf(item),role:item.role||'',identity:item.shadowOfMasterElementId||item.id,logoGroupId:item.metadata?.logoGroupId||'',logoPart:item.metadata?.logoPart||'',correspondenceKey:item.metadata?.correspondenceKey||'',label:item.label||labels[item.role]||labels[bindingOf(item)]||item.alt||({'text':'글자','semantic-object':'학교 상징','year-calendar':'전체 월력',shape:item.shapeType==='line'?'선':['rect','rounded'].includes(item.shapeType)?'사각형':'도형',graphic:'그래픽',vector:'일러스트','image-frame':'사진 프레임'}[item.type])||'사진',x:item.x,y:item.y,width:item.width,height:item.height,rotation:item.rotation||0,fontSize:item.style?.fontSize||18,rights};
  });
  if(capabilities==='school-basic-v2'&&project.productType?.category==='desk'&&page.role==='monthly-front'&&project.template.masters?.calendar){
   const r=project.template.masters.calendar.calendarRegion||{x:5,y:16,width:90,height:79};
   result.push({pageId:page.id,elementId:'$calendar-grid',scope:'page',type:'calendar-grid',binding:'',role:'calendar-grid',identity:'$calendar-grid',correspondenceKey:'calendar-grid',label:'날짜 격자',...r,rotation:0,fontSize:0,rights:{scheduleStyle:true}});
  }
  return result;
 }
 function validateState(state){
  if(state?.deskScheduleSizing){const s=state.deskScheduleSizing;if(typeof s!=='object'||Array.isArray(s)||Object.keys(s).some(k=>!['fontSizePt','barHeight','joinText','rangeEachDay','bullet','showVacationBackground','vacationBackgroundColor'].includes(k))||s.fontSizePt!==undefined&&(!Number.isFinite(s.fontSizePt)||s.fontSizePt<3||s.fontSizePt>18)||s.barHeight!==undefined&&(!Number.isFinite(s.barHeight)||s.barHeight<1||s.barHeight>24)||s.joinText!==undefined&&typeof s.joinText!=='boolean'||s.rangeEachDay!==undefined&&typeof s.rangeEachDay!=='boolean'||s.bullet!==undefined&&typeof s.bullet!=='boolean'||s.showVacationBackground!==undefined&&typeof s.showVacationBackground!=='boolean'||s.vacationBackgroundColor!==undefined&&!/^#[a-f0-9]{6}$/i.test(s.vacationBackgroundColor))throw Error('일정 글자 크기와 영역 높이를 확인해 주세요.');}

  if(state?.deskScheduleStyle!==undefined&&!['bar','text','line'].includes(state.deskScheduleStyle))throw Error('일정 표시 스타일을 확인해 주세요.');
  if(state?.logoMode!==undefined&&!['split','combined'].includes(state.logoMode))throw Error('로고 구성을 확인해 주세요.');
  if(state?.logoGeometry)for(const [mode,edits] of Object.entries(state.logoGeometry)){if(!['split','combined'].includes(mode))throw Error('로고 배치를 확인해 주세요.');validateState({version:1,pageId:state.pageId,edits});}
  if(!state||state.version!==1||!Array.isArray(state.edits)||state.edits.length>1000||typeof state.pageId!=='string')throw Error('편집 저장 정보를 확인해 주세요.');
  const keys=new Set();for(const edit of state.edits){const key=JSON.stringify([edit.pageId,edit.scope,edit.elementId]);if(keys.has(key)||!['master','page'].includes(edit.scope)||typeof edit.pageId!=='string'||typeof edit.elementId!=='string'||edit.photoId!==undefined&&typeof edit.photoId!=='string')throw Error('사진 편집 영역을 확인해 주세요.');keys.add(key);
   if(Object.keys(edit).some(k=>!['pageId','elementId','scope','photoId','fit','layout','fontSize','textStyle','hidden','photoCopy','calendarSettings','text','fill'].includes(k)))throw Error('알 수 없는 편집 항목이에요.');
   if(edit.text!==undefined&&(typeof edit.text!=='string'||edit.text.length>2000))throw Error('텍스트 내용을 확인해 주세요.');
   if(edit.fill!==undefined&&(typeof edit.fill!=='string'||!/^(?:transparent|#[0-9a-f]{6})$/i.test(edit.fill)))throw Error('채우기 색을 확인해 주세요.');
   if(edit.calendarSettings)root.ACDLWallCalendar.validateCustomer(edit.calendarSettings);
   if(edit.layout&&(Object.keys(edit.layout).some(k=>!['x','y','width','height'].includes(k))||['x','y','width','height'].some(k=>!Number.isFinite(edit.layout[k]))||edit.layout.width<.2||edit.layout.width>500||edit.layout.height<.2||edit.layout.height>500||Math.abs(edit.layout.x)>500||Math.abs(edit.layout.y)>500))throw Error('배치 값을 확인해 주세요.');
   if(edit.photoCopy){const c=edit.photoCopy;if(typeof c!=='object'||Object.keys(c).some(k=>!['photoId','source'].includes(k))||Boolean(c.photoId)===Boolean(c.source)||c.photoId!==undefined&&typeof c.photoId!=='string'||edit.photoId!==undefined)throw Error('공통 이미지 정보를 확인해 주세요.');if(c.source){const r=c.source;if(Object.keys(r).some(k=>!['pageId','scope','elementId'].includes(k))||!['master','page'].includes(r.scope)||typeof r.pageId!=='string'||typeof r.elementId!=='string')throw Error('공통 이미지 영역을 확인해 주세요.');}}
   if(edit.hidden!==undefined&&typeof edit.hidden!=='boolean')throw Error('표시 값을 확인해 주세요.');
   if(edit.textStyle){const v=edit.textStyle;if(v.textAlign!==undefined&&!['left','center','right','justify'].includes(v.textAlign))throw Error('글자 정렬을 확인해 주세요.');if(Object.keys(v).some(k=>!['fontFamily','fontSize','fontWeight','color','backgroundColor','fontStyle','textDecoration','textAlign'].includes(k))||v.fontFamily!==undefined&&(typeof v.fontFamily!=='string'||v.fontFamily.length>100||/[;{}<>\n]/.test(v.fontFamily))||v.fontSize!==undefined&&(!Number.isFinite(v.fontSize)||v.fontSize<1||v.fontSize>240)||v.fontStyle!==undefined&&!['normal','italic'].includes(v.fontStyle)||v.textDecoration!==undefined&&!['none','underline','line-through','underline line-through'].includes(v.textDecoration)||v.fontWeight!==undefined&&![400,700].includes(v.fontWeight)||v.color!==undefined&&!/^#[a-f0-9]{6}(?:[a-f0-9]{2})?$/i.test(v.color))throw Error('글자 스타일을 확인해 주세요.');}
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
  if(state.logoMode==='combined')for(const list of [...Object.values(document.template.masterElements||{}),...Object.values(document.book.elementsByPage||{})])for(const item of list){
   if(!item.metadata?.logoGroupId)continue;
   if(['name','english'].includes(item.metadata.logoPart))item.visible=false;
   if(item.metadata.logoPart==='image'&&item.metadata.combinedFrame){Object.assign(item,item.metadata.combinedFrame);item.image={...item.image,fit:'contain',scale:1,offsetX:0,offsetY:0};}
  }
  const additions=state.additions??[];
  if(!Array.isArray(additions)||additions.length>200)throw Error('추가 개체 수를 확인해 주세요.');
  for(const addition of additions){
   const {id,pageId,type}=addition||{},page=pageById(document,pageId);
   if(!additionKinds.includes(type)||!canAddPageObject(document,page,type)||typeof id!=='string'||!/^user-object:[\w-]+$/.test(id))throw Error('추가 개체 정보를 확인해 주세요.');
   document.book.elementsByPage||={};
   const local=document.book.elementsByPage[pageId]||=[],master=document.template.masterElements?.[page.masterId]||[];
   if([...local,...master].some(e=>e.id===id))throw Error('추가 개체가 중복되었습니다.');
   const zIndex=Math.max(0,...[...master,...local].map(e=>Number(e.zIndex)||0))+1;
   let element;
   if(type==='illustration'){
    const graphic=addition.graphic;
    if(!graphic||typeof graphic.id!=='string'||typeof graphic.name!=='string'||graphic.name.length>120)throw Error('일러스트 정보를 확인해 주세요.');
    if(graphic.image&&!graphic.vectorObject){
     const {version,width,height}=graphic.image;
     if(!/^[0-9a-f-]{36}$/i.test(graphic.id)||!/^[a-f0-9]{64}$/.test(version)||
       !Number.isFinite(width)||!Number.isFinite(height)||width<=0||height<=0)throw Error('일러스트 원본 정보를 확인해 주세요.');
     const pageSize=document.productType.pageSize;
     const ratio=width/height*pageSize.height/pageSize.width;
     const w=Math.min(25,25*ratio),h=Math.min(25,25/ratio);
     element={type:'image',role:'graphic-library-illustration',label:graphic.name,alt:graphic.name,fit:'contain',
      src:`/api/workspace/illustrations?id=${graphic.id}&version=${version}`,x:50-w/2,y:50-h/2,width:w,height:h};
    }else element={...root.ACDLGraphicVectorObject.placement({...graphic,status:'active'},document.productType.pageSize),label:graphic.name};
   }else{
    if(additionPresets[type]&&!additionPresets[type].includes(addition.preset))throw Error('개체 모양을 확인해 주세요.');
    const line=type==='shape'&&addition.preset.startsWith('line');
    element={type:type==='shape'?'shape':type==='text'?'text':'image-frame',
     role:type==='shape'?'user-shape':type==='text'?'user-text':'user-image',
     label:type==='text'?'추가 텍스트':line?'선':type==='shape'?'도형':type==='frame'?'사진 프레임':'추가 이미지',
     x:30,y:30,width:['frame','shape'].includes(type)&&addition.preset==='circle'?25*document.productType.pageSize.height/document.productType.pageSize.width:35,height:type==='text'?8:line?3:25};
    if(type==='shape')Object.assign(element,{shapeType:line?'line':addition.preset,style:{fill:'#4777bd',stroke:'#4777bd',strokeWidth:line?(addition.preset==='line-bold'?5:2):0,...(line?{dash:addition.preset.slice(5)||'solid'}:{}),...(addition.preset==='rounded'?{cornerRadiusMm:3}:addition.preset==='rect'?{borderRadius:0}:{})}});
    else if(type==='text')Object.assign(element,{content:'새 텍스트',style:{fontSize:22,color:'#17202e'}});
    else Object.assign(element,{frameType:addition.preset||'rect',image:{fit:type==='frame'?'cover':'contain',scale:1,offsetX:0,offsetY:0}});
   }
   local.push({...element,id,zIndex});
  }
  if(!Array.isArray(copies)||copies.length>200)throw Error('복사 개체 수를 확인해 주세요.');
  const ids=new Set();
  for(const c of copies){
   if(!c||typeof c.id!=='string'||!c.id.startsWith('user-copy:')||ids.has(c.id)||!document.book.pageInstances.some(p=>p.id===c.pageId))throw Error('복사 개체 정보를 확인해 주세요.');
   ids.add(c.id);const t=targets(document,c.source?.pageId,capabilities,true).find(t=>t.elementId===c.source.elementId&&t.scope===c.source.scope);
   if(!t||(supportsPageObjects(project)&&capabilities==='school-basic-v2'?!t.rights.duplicate:!Object.values(t.rights).some(Boolean)))throw Error('복사할 수 없는 개체입니다.');
   const item=clone(originalItem(document,t));item.id=c.id;delete item.shadowOfMasterElementId;item.originScope='page';
   document.book.elementsByPage||={};const list=document.book.elementsByPage[c.pageId]||=[];if(list.some(e=>e.id===c.id))throw Error('복사 개체가 중복되었습니다.');list.push(item);
  }return document;
 }
 function apply(project,state,assets,{capabilities}={}){
  validateState(state);project=withCopies(project,state,capabilities);if(!project.book.pageInstances.some(p=>p.id===state.pageId))throw Error('편집 페이지가 없어요.');const document=clone(project);
  const calendar=document.template.masters?.calendar;
  const desk=project.productType?.category==='desk'&&calendar;
  if((state.deskScheduleStyle||state.deskScheduleSizing)&&!desk)throw Error('탁상형 월력 설정을 찾을 수 없습니다.');
  if(desk&&(project.mode==='calendar-workspace'||state.deskScheduleStyle||state.deskScheduleSizing)){
   const current=calendar.rangeEventStyle||{};
   const style=state.deskScheduleStyle?root.ACDLSharedSchedule.displayStyle(state.deskScheduleStyle,current):current;
   const sizing=project.mode==='calendar-workspace'?root.ACDLSharedSchedule.deskScheduleDefaults(document.book.events,document.book.pageInstances):{};
   if(current.deskDateSchedule){
    if(current.fontSizePt!=null)sizing.fontSizePt=current.fontSizePt;
    if(current.barHeight!=null)sizing.barHeight=current.barHeight;
   }
   calendar.rangeEventStyle={displayMode:'bar',...style,...sizing,...state.deskScheduleSizing,deskDateSchedule:true};
  }
  for(const edit of state.edits){
   if(edit.elementId==='$calendar-grid')throw Error('날짜 격자는 일정 표시 스타일만 변경할 수 있습니다.');
   const target=targets(project,edit.pageId,capabilities).find(t=>t.elementId===edit.elementId&&t.scope===edit.scope);if(!target){
    const page=project.book.pageInstances.find(p=>p.id===edit.pageId),items=edit.scope==='master'?project.template.masterElements?.[page?.masterId]||[]:project.book.elementsByPage?.[edit.pageId]||[],original=items.find(e=>e.id===edit.elementId);
    // Retain prior photo edits while explicitly hidden; revalidate when shown again.
    if(original&&(original.visible===false||original.hidden===true))continue;
    throw Error('사진 편집 영역이 변경됐어요.');
   }
   if(edit.calendarSettings&&!target.rights.calendarStyle)throw Error('전체 월력 표시를 변경할 수 없습니다.');
   if(edit.text!==undefined&&!target.rights.freeText||edit.fill!==undefined&&!target.rights.fill)throw Error('이 개체에서 허용하지 않은 편집이에요.');
   if(edit.textStyle?.backgroundColor!==undefined&&(!supportsPageObjects(project)||typeof edit.textStyle.backgroundColor!=='string'||!/^(?:transparent|#[0-9a-f]{6}(?:[0-9a-f]{2})?)$/i.test(edit.textStyle.backgroundColor)))throw Error('글자 배경색을 확인해 주세요.');
   if(edit.textStyle&&!target.rights.textStyle||edit.hidden!==undefined&&!target.rights.visibility)throw Error('허용하지 않은 글자 편집이에요.');
   if((edit.photoId!==undefined||edit.photoCopy)&&!target.rights.replaceImage||edit.fit&&!target.rights.imageFit)throw Error('템플릿에서 허용하지 않은 사진 편집이에요.');
   const page=document.book.pageInstances.find(p=>p.id===edit.pageId);document.book.elementsByPage||={};const local=document.book.elementsByPage[page.id]||=[];
   let item=edit.scope==='master'?(document.template.masterElements[page.masterId]||[]).find(e=>e.id===edit.elementId):local.find(e=>e.id===edit.elementId);
   const placementRights=capabilities==='school-basic-v2'&&!state.capabilityVersion&&project.productType?.category!=='poster'?targets(project,edit.pageId).find(t=>t.elementId===edit.elementId&&t.scope===edit.scope)?.rights||target.rights:target.rights;
   if(edit.layout&&((edit.layout.x!==item.x||edit.layout.y!==item.y)&&!placementRights.move||(edit.layout.width!==item.width||edit.layout.height!==item.height)&&!placementRights.resize)||edit.fontSize!==undefined&&!placementRights.textSize)throw Error('이 페이지에서 허용하지 않은 개체 조정이에요.');
   if(edit.scope==='master'){const original=item;item=clone(original);item.id=`user-photo:${page.id}:${original.id}`;if(local.some(e=>e.id===item.id))throw Error('사진 개체 식별자가 중복됐어요.');item.shadowOfMasterElementId=original.id;item.originScope='master';local.push(item);}
   if(edit.photoId!==undefined){const asset=assets.find(a=>a.id===edit.photoId);if(!asset?.url)throw Error('편집에 사용한 사진 원본이 없어요.');if(item.type==='semantic-object'){item.sampleContent={...item.sampleContent,image:asset.url,assetId:asset.id};}else if(item.type==='image'){item.src=asset.url;}else item.image={...item.image,src:asset.url,assetId:asset.id,binding:'',fit:'cover',scale:1,offsetX:0,offsetY:0};item.binding='';item.bindingEnabled=false;}
   if(edit.photoCopy){const src=photoSource(project,edit.photoCopy,assets,capabilities);if(item.type==='semantic-object'){item.sampleContent={...item.sampleContent,image:src};delete item.sampleContent.assetId;if(edit.photoCopy.photoId)item.sampleContent.assetId=edit.photoCopy.photoId;}else if(item.type==='image'){item.src=src;delete item.assetId;}else {item.image={...item.image,src,binding:''};delete item.image.assetId;if(edit.photoCopy.photoId)item.image.assetId=edit.photoCopy.photoId;}item.binding='';item.bindingEnabled=false;}
   if(edit.layout)root.ACDLInspectorElement.apply(item,'geometry',edit.layout);
   if(edit.calendarSettings){
    const {scheduleStylePreset,...settings}=edit.calendarSettings;
    const wall=root.ACDLWallCalendar,arrangement=wall.onePageStyles[scheduleStylePreset];
    if(arrangement&&(project.book.pageInstances.length!==1||Number(item.monthCount)!==12))throw Error('1페이지형 전체 월력에서만 배열을 변경할 수 있습니다.');
    const patch=arrangement?{...wall.presets[scheduleStylePreset],...settings}:settings;
    if(arrangement)item.columns=arrangement.columns;
    item.wallCalendarSettings={...item.wallCalendarSettings,...patch};
    for(const value of Object.values(item.wallMonthOverrides||{}))Object.assign(value,patch);
   }
   if(edit.text!==undefined)item.content=edit.text;
   if(edit.fill!==undefined)item.style={...item.style,...(item.shapeType==='line'?{stroke:edit.fill}:{fill:edit.fill})};
   if(edit.textStyle){item.style={...item.style,...edit.textStyle};if(edit.textStyle.backgroundColor!==undefined)item.style.background=edit.textStyle.backgroundColor!=='transparent';}
   if(edit.hidden!==undefined)item.visible=!edit.hidden;
   if(edit.fontSize!==undefined)root.ACDLInspectorElement.apply(item,'text-size',{fontSize:edit.fontSize});
   if(edit.fit)root.ACDLPhotoFrameEditing.apply(item,{...item.image,...edit.fit});
  }
  const moves=state.layerMoves??[];
  if(!Array.isArray(moves)||moves.length>1000||moves.length&&!supportsPageObjects(project))throw Error('개체 순서 정보를 확인해 주세요.');
  for(const pageId of new Set(moves.map(move=>move?.pageId))){
   const page=pageById(document,pageId);
   if(!page)throw Error('개체 순서를 적용할 페이지를 찾을 수 없어요.');
   const local=document.book.elementsByPage[pageId]||=[],master=document.template.masterElements?.[page.masterId]||[];
   const all=root.ACDLSharedScreenComposition.visibleElements(page,master,local);
   const foreground=all.filter(item=>!protectedBackground(item)),background=all.filter(protectedBackground);
   for(const move of moves.filter(move=>move.pageId===pageId)){
    const rights=targets(project,pageId,capabilities,true).find(t=>t.scope===move.scope&&t.elementId===move.elementId)?.rights;
    if(!rights?.layer||!layerDirections.includes(move.direction))throw Error('개체 순서를 변경할 수 없어요.');
    const index=foreground.findIndex(item=>(item.shadowOfMasterElementId||item.id)===move.elementId&&(item.shadowOfMasterElementId?'master':item._scope)===move.scope);
    if(index<0)continue;
    const to={forward:Math.min(index+1,foreground.length-1),backward:Math.max(index-1,0),front:foreground.length-1,back:0}[move.direction];
    foreground.splice(to,0,...foreground.splice(index,1));
   }
   const floor=Math.max(0,...background.map(item=>Number(item.zIndex)||0));
   foreground.forEach((item,index)=>{
    const zIndex=floor+index+1;
    if(item._scope==='page'){local.find(e=>e.id===item.id).zIndex=zIndex;return;}
    const original=master.find(e=>e.id===item.id);
    local.push({...clone(original),id:'user-layer:'+pageId+':'+item.id,shadowOfMasterElementId:item.id,originScope:'master',zIndex});
   });
   document.book.elementsByPage[pageId]=local;
  }
  return document;
 }
 function create({project,state,assets=[],capabilities}){
  let source=clone(project);let current=clone(state||{version:1,pageId:project.book.pageInstances[0].id,edits:[]}),past=[],future=[],selection=null;
  apply(source,current,assets,{capabilities});
  function commit(next){if(capabilities==='school-basic-v2')next.capabilityVersion=2;apply(source,next,assets,{capabilities});if(equal(current,next))return false;past.push(clone(current));if(past.length>20)past.shift();current=next;future=[];return true;}
  return Object.freeze({targets:pageId=>targets(withCopies(source,current,capabilities),pageId,capabilities),select(target){selection=target?targets(withCopies(source,current,capabilities),target.pageId,capabilities).find(t=>t.elementId===target.elementId&&t.scope===target.scope)||null:null;return selection;},selection:()=>selection,getState:()=>clone(current),getDocument:()=>apply(source,current,assets,{capabilities}),canUndo:()=>past.length>0,canRedo:()=>future.length>0,
   setDeskScheduleSizing(patch){if(!selection?.rights.scheduleStyle)throw Error('날짜 격자를 먼저 선택해 주세요.');const next=clone(current);next.deskScheduleSizing={...next.deskScheduleSizing,...patch};return commit(next);},
   setDeskScheduleStyle(mode){if(!selection?.rights.scheduleStyle)throw Error('날짜 격자를 먼저 선택해 주세요.');const next=clone(current);next.deskScheduleStyle=mode;return commit(next);},
   setLogoMode(mode){
    if(!['split','combined'].includes(mode))throw Error('로고 구성을 확인해 주세요.');
    if(!selection?.logoGroupId||selection.logoPart!=='image')throw Error('로고 이미지 개체를 선택해 주세요.');
    if(mode===(current.logoMode||'split'))return false;
    const next=clone(current),group=selection.logoGroupId,logoIds=new Set();
    for(const page of source.book.pageInstances)for(const target of targets(source,page.id,capabilities,true))if(target.logoGroupId===group&&target.logoPart==='image')logoIds.add(JSON.stringify([target.pageId,target.scope,target.elementId]));
    const isLogo=e=>logoIds.has(JSON.stringify([e.pageId,e.scope,e.elementId]));
    next.logoGeometry||={};next.logoGeometry[current.logoMode||'split']=current.edits.filter(isLogo).filter(e=>e.layout||e.fit).map(e=>({pageId:e.pageId,scope:e.scope,elementId:e.elementId,...e.layout&&{layout:clone(e.layout)},...e.fit&&{fit:clone(e.fit)}}));
    next.edits=next.edits.flatMap(e=>{if(!isLogo(e))return [e];const {layout,fit,...rest}=e;return Object.keys(rest).length>3?[rest]:[];});
    for(const saved of next.logoGeometry[mode]||[]){const index=next.edits.findIndex(e=>e.pageId===saved.pageId&&e.scope===saved.scope&&e.elementId===saved.elementId);if(index<0)next.edits.push(clone(saved));else Object.assign(next.edits[index],saved);}
    next.logoMode=mode;return commit(next);
   },
   canAddObject(type){return additionKinds.includes(type)&&!!canAddPageObject(source,pageById(source,current.pageId),type);},
   addObject(type,value){
    if(!this.canAddObject(type)||type==='image'&&typeof value!=='string')throw Error('개체를 추가할 수 없어요.');
    const next=clone(current),id='user-object:'+crypto.randomUUID(),pageId=current.pageId;
    (next.additions||=[]).push({id,pageId,type,...(additionPresets[type]?{preset:value}:type==='illustration'?{graphic:clone(value)}:{})});
    if(type==='image')next.edits.push({pageId,elementId:id,scope:'page',photoId:value});
    commit(next);
    selection=targets(withCopies(source,current,capabilities),pageId,capabilities).find(t=>t.elementId===id);
    return selection;
   },
   moveLayer(direction){
    if(!selection?.rights.layer||!layerDirections.includes(direction))throw Error('개체 순서를 변경할 수 없어요.');
    const {pageId,elementId,scope}=selection,next=clone(current);
    const doc=apply(source,current,assets,{capabilities}),page=pageById(doc,pageId);
    const layers=root.ACDLSharedScreenComposition.visibleElements(page,doc.template.masterElements?.[page.masterId]||[],doc.book.elementsByPage?.[pageId]||[]).filter(item=>!protectedBackground(item));
    const index=layers.findIndex(item=>(item.shadowOfMasterElementId||item.id)===elementId&&(item.shadowOfMasterElementId?'master':item._scope)===scope);
    if(index<0||index===0&&['back','backward'].includes(direction)||index===layers.length-1&&['front','forward'].includes(direction))return false;
    (next.layerMoves||=[]).push({pageId,elementId,scope,direction});
    return commit(next);
   },
   duplicate(){if(!selection)throw Error('복사할 개체를 선택해 주세요.');const next=clone(current),id='user-copy:'+crypto.randomUUID();next.copies||=[];next.copies.push({id,pageId:current.pageId,source:{pageId:selection.pageId,scope:selection.scope,elementId:selection.elementId}});const own=current.edits.find(e=>e.pageId===selection.pageId&&e.scope===selection.scope&&e.elementId===selection.elementId);if(own)next.edits.push({...clone(own),pageId:current.pageId,scope:'page',elementId:id});commit(next);selection=targets(withCopies(source,current,capabilities),current.pageId,capabilities).find(t=>t.elementId===id);return selection;},
   remove(){if(!selection)return false;return this.editPhoto({hidden:true});},
   resetBoundPhotos(binding){const next=clone(current);next.edits=next.edits.flatMap(e=>{const t=targets(source,e.pageId,capabilities).find(t=>t.scope===e.scope&&t.elementId===e.elementId);if(t?.binding!==binding)return [e];const {photoId,photoCopy,fit,...rest}=e;return Object.keys(rest).length>3?[rest]:[];});return commit(next);},
   setProject(next){apply(next,current,assets,{capabilities});source=clone(next);},
   counterparts(target=selection){return target?correspondingTargets(source,target,capabilities):[];},
   applyAcrossPages(options){return commit(shareChanges(source,clone(current),selection,assets,capabilities,options));},
   applyToMonthlyFronts(){if(!selection||selection.binding!=='school.profile.logo')throw Error('월력 앞면 교표를 선택해주세요.');const base=apply(source,current,assets,{capabilities}),page=base.book.pageInstances.find(p=>p.id===selection.pageId);if(page.role!=='monthly-front')throw Error('월력 앞면에서 사용해주세요.');const item=(base.book.elementsByPage[page.id]||[]).find(e=>e.id===selection.elementId||e.shadowOfMasterElementId===selection.elementId)||(base.template.masterElements[page.masterId]||[]).find(e=>e.id===selection.elementId),next=clone(current);for(const p of source.book.pageInstances.filter(p=>p.role==='monthly-front'))for(const t of targets(source,p.id,capabilities).filter(t=>t.binding==='school.profile.logo'&&t.rights.move&&t.rights.resize)){const index=next.edits.findIndex(e=>e.pageId===t.pageId&&e.scope===t.scope&&e.elementId===t.elementId),edit={...(next.edits[index]||{pageId:t.pageId,scope:t.scope,elementId:t.elementId}),layout:{x:item.x,y:item.y,width:item.width,height:item.height}};const own=current.edits.find(e=>e.pageId===selection.pageId&&e.scope===selection.scope&&e.elementId===selection.elementId);if(t.rights.imageFit)edit.fit=own?.fit?clone(own.fit):{fit:item.image?.fit||'cover',scale:Number(item.image?.scale||1),offsetX:Number(item.image?.offsetX||0),offsetY:Number(item.image?.offsetY||0)};if(index<0)next.edits.push(edit);else next.edits[index]=edit;}return commit(next);},
   setAssets(next){apply(source,current,next,{capabilities});assets=next;},
   setPage(pageId){targets(source,pageId,capabilities);current={...current,pageId};selection=null;},
   editPhoto(patch,sharing={}){if(!selection)throw Error('사진 영역을 먼저 선택해 주세요.');const next=clone(current);if(capabilities==='school-basic-v2')next.capabilityVersion=2;const index=next.edits.findIndex(e=>e.pageId===selection.pageId&&e.elementId===selection.elementId&&e.scope===selection.scope),previous=next.edits[index]||{pageId:selection.pageId,elementId:selection.elementId,scope:selection.scope};const edit={...previous};if(Object.hasOwn(patch,'photoId')){edit.photoId=patch.photoId;delete edit.photoCopy;delete edit.fit;}if(patch.fit)edit.fit=clone(patch.fit);if(patch.layout)edit.layout=clone(patch.layout);if(patch.fontSize!==undefined)edit.fontSize=patch.fontSize;if(patch.calendarSettings){const nextSettings=clone(patch.calendarSettings),preset=root.ACDLWallCalendar.presets[nextSettings.scheduleStylePreset];edit.calendarSettings={...edit.calendarSettings,...preset,...nextSettings};}if(patch.text!==undefined)edit.text=patch.text;if(patch.fill!==undefined)edit.fill=patch.fill;if(patch.textStyle)edit.textStyle={...edit.textStyle,...clone(patch.textStyle)};if(patch.hidden!==undefined)edit.hidden=patch.hidden;if(index<0)next.edits.push(edit);else next.edits[index]=edit;if(patch.calendarSettings&&sharing.calendarAll){for(const page of source.book.pageInstances)if(page.id!==selection.pageId)for(const target of targets(source,page.id,capabilities).filter(t=>t.rights.calendarStyle)){const old=next.edits.find(e=>e.pageId===target.pageId&&e.elementId===target.elementId&&e.scope===target.scope);if(old)old.calendarSettings={...old.calendarSettings,...clone(patch.calendarSettings)};else next.edits.push({pageId:target.pageId,elementId:target.elementId,scope:target.scope,calendarSettings:clone(patch.calendarSettings)});}}if(patch.layout&&sharing.layoutAll||patch.photoId!==undefined&&sharing.imageAll)shareChanges(source,next,selection,assets,capabilities,{layout:!!patch.layout&&sharing.layoutAll,image:patch.photoId!==undefined&&sharing.imageAll});return commit(next);},
   resetPhoto(sharing={}){if(!selection)return false;const next={...clone(current),edits:current.edits.flatMap(e=>{if(!(e.pageId===selection.pageId&&e.elementId===selection.elementId&&e.scope===selection.scope))return [e];const {photoId,photoCopy,fit,...preserved}=e;return Object.keys(preserved).length>3?[preserved]:[];})};if(sharing.imageAll)shareChanges(source,next,selection,assets,capabilities,{image:true});return commit(next);},
   undo(){if(!past.length)return false;future.push(clone(current));current=past.pop();selection=null;return true;},redo(){if(!future.length)return false;past.push(clone(current));current=future.pop();selection=null;return true;}
  });
 }
 root.ACDLEditorSession=Object.freeze({version:1,targets,validateState,apply,create,customerRights});
})(globalThis);
