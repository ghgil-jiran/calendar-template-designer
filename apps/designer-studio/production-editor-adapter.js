(function(root){
 const clone=value=>JSON.parse(JSON.stringify(value));
 const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
 const permissions={move:true,resize:true,rotate:true,color:true,delete:true,duplicate:true,layer:true,content:true};
 function withoutEditor(document){const copy=clone(document);delete copy.editorProject;return copy;}
 function imageData(payload){return typeof payload==='string'?{src:payload}:payload?.image||payload?.imageRef||payload||{};}
 function createProject(source,document,requestId){
  if(source?.format!=='acdl-project'||!source.book||!document?.template?.pages?.length)throw Error('에디터 교정 원본이 없습니다.');
  const p=clone(source),doc=withoutEditor(document),size=p.productType.pageSize,sourcePages=p.book.pageInstances;
  const originalElements={};
  for(const page of sourcePages){originalElements[page.id]=[...(p.template.masterElements?.[page.masterId]||[]),...(p.book.elementsByPage?.[page.id]||[])];}
  p.book.pageInstances=doc.template.pages.map((page,index)=>{
   if(page.size.width!==size.width||page.size.height!==size.height)throw Error('접수본과 에디터 규격이 일치하지 않습니다.');
   const original=sourcePages.find(item=>item.id===page.id);
   if(!original)throw Error('접수본 페이지를 원본 프로젝트에서 찾지 못했습니다.');
   return {...original,...clone(page.metadata||{}),id:page.id,role:page.role,number:index+1,masterId:`production.${page.id}`,overrides:{}};
  });
  p.template.masterElements={};p.book.elementsByPage={};
  for(const page of doc.template.pages){
   p.book.elementsByPage[page.id]=(page.objects||[]).map(object=>{
    const original=originalElements[page.id]?.find(item=>item.id===object.id)||{};
    const e={...clone(original),...clone(object.runtimeWidget||{}),id:object.id,type:object.metadata?.sourceType||original.type||object.type,role:object.role,x:object.frame.x/size.width*100,y:object.frame.y/size.height*100,width:object.frame.width/size.width*100,height:object.frame.height/size.height*100,style:clone(object.style||{}),value:clone(object.payload??object.value??null),zIndex:object.zIndex,visible:object.visible,rotation:object.rotation||0,opacity:object.opacity??1,permissions:{...permissions},bindingEnabled:false,productionObject:true};
    delete e.binding;delete e.bindingPattern;delete e.targetBindingPattern;delete e.sourceBinding;delete e.printSource;delete e.printAsset;
    if(original.printSource){e.printSource=clone(original.printSource);e.printSource.approved=false;delete e.printSource.approvedAt;delete e.printSource.approvedBy;}
    if(object.type==='image'){
     const image=imageData(object.payload);const ref=image.assetRef;const src=image.src||image.url||ref?.src||(typeof image==='string'?image:'');
     if(!src)throw Error(`이미지 원본을 확인할 수 없습니다: ${object.id}`);
     e.src=src;e.image={...(original.image||{}),...clone(image),src,fit:image.fit||original.image?.fit||'cover'};delete e.image.binding;delete e.image.assetId;delete e.assetId;delete e.assetRef;delete e.aiDesign;
     e.type='image-frame';
     if(original.type!=='image-frame'){e.style.background='transparent';e.style.stroke='transparent';e.style.strokeWidth=0;}
     const placement=image.placement||{},transform=image.imageTransform||{};e.image.scale=placement.scale??transform.scale??e.image.scale??1;e.image.offsetX=transform.offsetX??e.image.offsetX??0;e.image.offsetY=transform.offsetY??e.image.offsetY??0;e.image.focalPoint={x:(placement.x??50)/100,y:(placement.y??50)/100};e.image.brightness=placement.brightness??transform.brightness??100;e.image.contrast=transform.contrast??100;e.image.saturation=transform.saturation??100;e.image.flipX=transform.flipX===true;e.image.flipY=transform.flipY===true;
    }
    if(object.type==='text')e.content=String(object.payload??object.value??'');
    if(object.type==='semantic-object')e.sampleContent=clone(object.payload||{});
    return e;
   });
   const calendar=(page.objects||[]).find(object=>['calendar','calendar-grid'].includes(object.type));
   if(calendar){const editorPage=p.book.pageInstances.find(item=>item.id===page.id),element=p.book.elementsByPage[page.id].find(item=>item.id===calendar.id);editorPage.productionCalendarMaster={...clone(p.template.masters.calendar),...clone(calendar.style||{}),calendarRegion:root.ACDLSharedScreenComposition.contentRelativeFrame(element,root.ACDLSharedScreenComposition.contentFrame(p,editorPage))};}
  }
  const dataset=doc.dataset||{},cal=dataset.calendar||{};
  p.book.school=clone(dataset.school||p.book.school);p.book.events=clone(cal.events||[]);p.book.monthlyImages=clone(dataset.monthlyImages||{});p.book.monthlyQuotes=clone(dataset.monthlyQuotes||{});
  p.settings={...p.settings,year:cal.year??p.settings.year,startMonth:cal.startMonth??p.settings.startMonth,calendarRows:cal.gridRows??p.settings.calendarRows,weekStart:cal.weekStart??p.settings.weekStart,dataOptions:clone(cal.dataOptions||{})};
  p.book.sheets=(p.book.sheets||[]).map(sheet=>({...sheet,surfaces:(sheet.surfaces||[]).map(page=>p.book.pageInstances.find(item=>item.id===page.id)).filter(Boolean)}));
  p.template.id=`production-${requestId}`;delete p.template.remoteId;delete p.template.remoteStableKey;delete p.template.remoteVersionNumber;p.template.publishing={};p.template.metadata={...p.template.metadata,state:'draft',isStandard:false};
  p.productionCorrection={schemaVersion:'production-editor.v1',requestId,baseDocument:doc,baselineElements:clone(p.book.elementsByPage),baselinePages:clone(p.book.pageInstances),baselineSettings:clone(p.settings),baselineBook:{school:clone(p.book.school),events:clone(p.book.events),monthlyImages:clone(p.book.monthlyImages),monthlyQuotes:clone(p.book.monthlyQuotes)},printInspection:null};
  return p;
 }
 function toDocument(project){
  const context=project.productionCorrection;if(context?.schemaVersion!=='production-editor.v1')throw Error('교정 프로젝트 연결이 없습니다.');
  const doc=clone(context.baseDocument),size=project.productType.pageSize;
  const pageIds=project.book.pageInstances.map(page=>page.id);
  if(!same(pageIds,doc.template.pages.map(page=>page.id)))throw Error('교정 중 면 구성 변경은 지원하지 않습니다.');
  for(const page of doc.template.pages){
   const old=new Map(page.objects.map(o=>[o.id,o]));
   page.objects=(project.book.elementsByPage[page.id]||[]).map(e=>{
    const before=context.baselineElements[page.id]?.find(item=>item.id===e.id),original=old.get(e.id);
    if(!before||!original)throw Error('새 개체 추가·복제는 아직 교정 저장에 연결되지 않았습니다. 기존 개체를 수정해 주세요.');
    const o=clone(original);
    if(['x','y','width','height'].some(k=>e[k]!==before[k]))o.frame={x:e.x/100*size.width,y:e.y/100*size.height,width:e.width/100*size.width,height:e.height/100*size.height};
    for(const key of ['style','zIndex','visible','rotation','opacity','shapeType'])if(!same(e[key],before[key]))o[key]=clone(e[key]??null);
    for(const key of ['colors','flipX','flipY','showTitle','showCaption','titleOverride','layoutPreset','frameType','mask'])if(!same(e[key],before[key])){o.metadata||={};o.metadata[key]=clone(e[key]??null);}
    if(['calendar','calendar-grid'].includes(o.type)){
     const editorPage=project.book.pageInstances.find(item=>item.id===page.id),master=editorPage.productionCalendarMaster,baseline=context.baselinePages?.find(item=>item.id===page.id)?.productionCalendarMaster;
     if(master&&baseline){
      if(!same(master.calendarRegion,baseline.calendarRegion)){const f=root.ACDLSharedScreenComposition.pageFrame(master.calendarRegion,root.ACDLSharedScreenComposition.contentFrame(project,editorPage));o.frame={x:f.x/100*size.width,y:f.y/100*size.height,width:f.width/100*size.width,height:f.height/100*size.height};}
      for(const key of Object.keys(o.style||{}))if(key!=='calendarRegion'&&!same(master[key],baseline[key]))o.style[key]=clone(master[key]??null);
     }
    }
    if(o.type==='image'&&(!same(e.image,before.image)||e.src&&e.src!==before.src)){
     const source=e.image?.src||e.src;
     const payload=typeof o.payload==='object'&&o.payload?clone(o.payload):{};
     const image=payload.image&&typeof payload.image==='object'?payload.image:payload;
     if(image.assetRef)image.assetRef={ref:'url',src:source};Object.assign(image,{src:source,fit:e.image?.fit||e.fit||'cover',placement:{...(image.placement||{}),scale:e.image?.scale??1,brightness:e.image?.brightness??100},imageTransform:{...(image.imageTransform||{}),offsetX:e.image?.offsetX??0,offsetY:e.image?.offsetY??0,contrast:e.image?.contrast??100,saturation:e.image?.saturation??100,flipX:e.image?.flipX===true,flipY:e.image?.flipY===true}});o.payload=payload;
    }else if(o.type==='text'&&(e.content!==before.content||!same(e.value,before.value)))o.payload=e.content!==before.content?e.content:e.value;
    else if(o.type==='semantic-object'&&!same(e.sampleContent,before.sampleContent))o.payload=clone(e.sampleContent);
    else if(!same(e.value,before.value))o.payload=clone(e.value);
    const widget=o.runtimeWidget||{};for(const key of Object.keys(widget))if(!same(e[key],before[key]))widget[key]=clone(e[key]??null);o.runtimeWidget=widget;
    return o;
   });
  }
  const b=context.baselineBook;
  if(!same(project.book.school,b.school))doc.dataset.school=clone(project.book.school);
  if(!same(project.book.events,b.events))doc.dataset.calendar.events=clone(project.book.events);
  for(const key of ['monthlyImages','monthlyQuotes'])if(!same(project.book[key],b[key]))doc.dataset[key]=clone(project.book[key]);
  for(const [key,target] of [['year','year'],['startMonth','startMonth'],['weekStart','weekStart'],['calendarRows','gridRows'],['dataOptions','dataOptions']])if(!same(project.settings[key],context.baselineSettings?.[key]))doc.dataset.calendar[target]=clone(project.settings[key]??null);
  return doc;
 }
 root.ACDLProductionEditorAdapter=Object.freeze({createProject,toDocument,withoutEditor});
})(typeof window!=='undefined'?window:globalThis);
