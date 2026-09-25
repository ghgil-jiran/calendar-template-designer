(function(root){
 function readPath(source,path){if(!path)return undefined;return path.replace(/\[(\d+)\]/g,'.$1').split('.').filter(Boolean).reduce((value,key)=>value==null?undefined:value[key],source)}
 function pct(value,total){return Number(value||0)/100*total}
 const TYPE_ALIASES=Object.freeze({frame:'image-frame','monthly-calendar':'calendar','school-object':'semantic-object'});
 function objectType(value){const type=String(value||'shape');return TYPE_ALIASES[type]||type}
 function hasRenderableValue(value){if(value===undefined||value===null)return false;if(typeof value==='string')return value.trim().length>0;if(Array.isArray(value))return value.length>0;if(typeof value==='object')return Object.keys(value).length>0;return true}
 function shiftedMonth(year,month,offset){const date=new Date(Date.UTC(Number(year),Number(month)-1+offset,1));return {year:date.getUTCFullYear(),month:date.getUTCMonth()+1}}
 function widgetValue(element,page){
  const storedValue=element?.value&&typeof element.value==='object'&&!Array.isArray(element.value)?element.value:{},runtimeConfig=Object.fromEntries(Object.entries(element.runtimeWidget||{}).filter(([,value])=>value!==undefined)),config={...storedValue,...runtimeConfig},type=objectType(element.type),year=Number(page?.calendarYear),month=Number(page?.calendarMonth);
  if(type==='year-calendar')return {year:Number(config.baseYear),startMonth:Number(config.startMonth||3),monthCount:Number(config.monthCount||12),columns:Number(config.columns||4),weekStart:config.weekStart||'sunday'};
  if(!Number.isInteger(year)||month<1||month>12)return element.value;
  if(type==='calendar'||type==='calendar-grid')return {...storedValue,year,month,rows:config.rows,weekStart:config.weekStart,showAdjacentMonths:config.showAdjacentMonths};
  if(type==='mini-calendar-prev')return {...storedValue,...shiftedMonth(year,month,-1),rows:config.rows,weekStart:config.weekStart};
  if(type==='mini-calendar-next')return {...storedValue,...shiftedMonth(year,month,1),rows:config.rows,weekStart:config.weekStart};
  if(type==='mini-calendar'||type==='month-date-strip')return {year,month,rows:config.rows,weekStart:config.weekStart,showWeekday:config.showWeekday!==false,showDate:config.showDate!==false};
  if(type==='memo')return {layout:config.memoLayout||'lines',title:config.title||'MEMO',lineCount:Number(config.lineCount||8),itemCount:Number(config.itemCount||9),weekCount:Number(config.weekCount||5),showMemo:config.showMemo!==false};
  return element.value
 }
 function pageScopedBindingValue(binding,page,projectYear){
  if(binding==='calendar.year'&&Number.isInteger(Number(projectYear)))return Number(projectYear);
  if(binding==='calendar.currentMonth'&&Number.isInteger(Number(page?.calendarMonth)))return Number(page.calendarMonth);
  if(binding==='calendar.currentYear'&&Number.isInteger(Number(page?.calendarYear)))return Number(page.calendarYear);
  return undefined
 }
 function pageScopedEvents(object,page,dataset){
  if(!['event-list','monthly-schedule'].includes(object.type)||object.runtimeWidget?.displayMode!=='month')return undefined;
  const year=Number(page?.calendarYear),month=Number(page?.calendarMonth);if(!Number.isInteger(year)||month<1||month>12)return [];
  const from=new Date(Date.UTC(year,month-1,1)),to=new Date(Date.UTC(year,month,0,23,59,59));
  return (dataset.calendar?.events||[]).filter(event=>new Date(`${event.startDate}T00:00:00Z`)<=to&&new Date(`${event.endDate||event.startDate}T00:00:00Z`)>=from)
 }
 function legacyObject(element,width,height,index,project){
  let value=element.value!==undefined?element.value:element.content;
  if(value===undefined&&(element.type==='image'||element.type==='image-frame'))value=root.ACDLProjectAssetResolver?.elementValue(project,element)||element.src||element.image||null;
  const binding=typeof element.binding==='string'?element.binding:typeof element.image?.binding==='string'?element.image.binding:undefined;
  const printIntent=element.printIntent||root.ACDLNativePrintAuthoring?.intentFor(element),compiled=project?.template?.nativePrintAuthoring?.enabled===true?root.ACDLNativePrintPackageCompiler?.compileElement({...element,printIntent},project.template.resources?.nativePrint||{}):null;
  return {id:String(element.id||`legacy.object.${index}`),sourceObjectId:String(element.id||`legacy.object.${index}`),type:objectType(element.type),role:String(element.role||''),frame:{x:pct(element.x,width),y:pct(element.y,height),width:pct(element.width==null?10:element.width,width),height:pct(element.height==null?10:element.height,height)},binding,value,...(printIntent?{printIntent:structuredClone(printIntent)}:{}),...(compiled?.status==='promoted'?{print:structuredClone(compiled.policy),...(compiled.asset?{printAsset:structuredClone(compiled.asset)}:{})}:{}),runtimeWidget:{rows:element.rows,weekStart:element.weekStart,showWeekday:element.showWeekday,showDate:element.showDate,memoLayout:element.memoLayout,title:element.title,lineCount:element.lineCount,itemCount:element.itemCount,weekCount:element.weekCount,showMemo:element.showMemo,columns:element.columns,startMonth:element.startMonth,monthCount:element.monthCount,monthLabelStyle:element.monthLabelStyle,yearlyColumns:element.yearlyColumns,linesPerMonth:element.linesPerMonth,baseYear:element.baseYear,yearlyLayoutType:element.yearlyLayoutType,yearlyGroupSize:element.yearlyGroupSize,yearlyContainerStyle:element.yearlyContainerStyle,scheduleLayoutType:element.scheduleLayoutType,displayMode:element.displayMode,dateBased:element.dateBased,equalCells:element.equalCells,monthSource:element.monthSource,showEmptyMessage:element.showEmptyMessage,emptyStatePresentation:element.emptyStatePresentation,layoutType:element.layoutType},style:{...(element.style||{}),legacyRole:element.role,maxItems:element.maxItems},visible:element.visible!==false,zIndex:Number(element.zIndex==null?index:element.zIndex)}
 }
 function create(options={}){
  const datasetDomain=options.datasetDomain||root.ACDLDatasetDomain;
  const userServiceDataset=options.userServiceDataset||root.ACDLUserServiceDatasetBridge;
  const userServiceAssets=options.userServiceAssets||null;
  const parity=options.parity||root.ACDLIntegrationParity;
  const pageAdapter=options.pageAdapter||root.ACDLDeskAcademicPageAdapter;
  function adapt(project,pageInstances=project.book.pageInstances||[],datasetOverride){
   const size=project.productType.pageSize,dataset=datasetOverride||datasetDomain.buildRuntimeDataset(project);
   const pages=pageInstances.map((page,index)=>{
    const sourcePageId=page.sourcePageId||page.id,master=project.template.masterElements?.[page.masterId]||[],pageElements=project.book.elementsByPage||{},local=Object.prototype.hasOwnProperty.call(pageElements,page.id)?pageElements[page.id]:(pageElements[sourcePageId]||[]),visibleElements=root.ACDLPageCompositionRuntime.visibleElements(page,master,local),objects=visibleElements.map((element,objectIndex)=>legacyObject(element,size.width,size.height,objectIndex,project));
    const surfaceRole=String(page.surfaceRole||page.role||'page'),contentPurpose=String(page.contentPurpose||page.semanticPageRole||page.packageRole||'');
    const hasExplicitCalendar=objects.some(object=>['calendar','calendar-grid'].includes(object.type)||object.role==='current-calendar');
    if((surfaceRole==='monthly-front'||contentPurpose==='monthly-calendar')&&!hasExplicitCalendar){
     const region=project.template.masters?.calendar?.calendarRegionsByType?.[project.productType.category]||project.template.masters?.calendar?.calendarRegion||{x:5,y:16,width:90,height:79};
     const calendar=project.template.masters?.calendar||{},settings=project.settings||{};
     objects.unshift(legacyObject({id:`${page.id}.calendar`,type:'calendar',role:'current-calendar',...region,zIndex:0,value:{year:page.calendarYear,month:page.calendarMonth,rows:Number(calendar.rows||settings.calendarRows||5),weekStart:calendar.weekStart||settings.weekStart||'sunday',calendarLayout:calendar.calendarLayout,calendarPreset:calendar.calendarPreset,calendarOverrides:calendar.calendarOverrides},style:{...(calendar.design||{}),design:{...(calendar.design||{})},calendarLayout:{...(calendar.calendarLayout||{})},calendarPreset:{...(calendar.calendarPreset||{})},calendarOverrides:{...(calendar.calendarOverrides||{})},rangeEventStyle:{...(calendar.rangeEventStyle||{})},monthTitleSize:calendar.monthTitleSize,eventMaxVisiblePerDay:calendar.eventMaxVisiblePerDay,showAdjacentMonths:calendar.showAdjacentMonths}},size.width,size.height,-1,project));
    }
    return {id:String(page.id||`page.${index+1}`),sourcePageId:String(sourcePageId||page.id||`page.${index+1}`),role:surfaceRole,size:{width:size.width,height:size.height,unit:size.unit||'mm'},background:{},objects:objects.map(object=>{const events=pageScopedEvents(object,page,dataset),scoped=events??pageScopedBindingValue(object.binding,page,project.settings?.year),binding=scoped===undefined?datasetDomain.resolvePageBinding(object.binding,page):undefined,bound=binding?readPath(dataset,binding):undefined,widget=widgetValue(object,page);return {...object,binding,value:object.type==='monthly-quote'?dataset.monthlyQuotes[`${page.calendarYear}-${String(page.calendarMonth).padStart(2,'0')}`]:scoped!==undefined?scoped:bound!==undefined?bound:widget!==undefined?widget:object.value}}).sort((a,b)=>a.zIndex-b.zIndex),metadata:{number:page.number,side:page.side,calendarYear:page.calendarYear,calendarMonth:page.calendarMonth,masterId:page.masterId,surfaceRole,contentPurpose,integrationSourceRole:page.integrationSourceRole}};
   });
   const authoring=project.template.nativePrintAuthoring,contract=authoring?.contract;
   return {template:{schemaVersion:'1.0',id:String(project.template.id||'legacy.template'),revision:Number(project.template.revision||1),pages,...(authoring?.enabled===true&&contract?{printContract:{schemaVersion:'print-contract.v1',profile:contract.outputIntent,pdfStandard:contract.pdfStandard,coordinateUnit:'mm',productionSizeMm:{...contract.productionSizeMm},trimSizeMm:{...contract.trimSizeMm},bleedMm:contract.bleedMm,safeInsetMm:contract.safeInsetMm,minimumImageDpi:contract.minimumImageDpi}}:{})},dataset}
  }
  function adaptDeskAcademic(project,datasetOverride){const plan=parity.buildDeskAcademicSurfacePlan(project.settings?.year,project.settings?.startMonth||3),composition=pageAdapter.compose(project,plan);return {...adapt(project,composition.pages,datasetOverride),composition}}
  function adaptUserService(project,adapterResult){
   if(!userServiceDataset)throw new Error('User Service Dataset Bridge is not available');
   const accepted=userServiceDataset.accept(adapterResult);
   if(accepted.hasErrors)return {dataset:accepted.dataset,diagnostics:accepted.diagnostics,hasErrors:true,template:null,composition:null};
   const runtimeDataset=userServiceDataset.toRuntimeView?userServiceDataset.toRuntimeView(accepted.dataset):accepted.dataset;
   const runtime=adaptDeskAcademic(project,runtimeDataset);
   return {...runtime,diagnostics:accepted.diagnostics,hasErrors:false};
  }
  async function adaptUserServiceWithAssets(project,adapterResult){
   if(!userServiceDataset)throw new Error('User Service Dataset Bridge is not available');
   if(!userServiceAssets)throw new Error('User Service Asset Resolver is not available');
   const accepted=userServiceDataset.accept(adapterResult);
   if(accepted.hasErrors)return {dataset:accepted.dataset,diagnostics:accepted.diagnostics,hasErrors:true,template:null,composition:null};
   const runtimeDataset=userServiceDataset.toRuntimeView?userServiceDataset.toRuntimeView(accepted.dataset):accepted.dataset;
   const resolved=await userServiceAssets.resolveDataset(runtimeDataset);
   const runtime=adaptDeskAcademic(project,resolved.dataset);
   return {...runtime,diagnostics:[...accepted.diagnostics,...resolved.diagnostics],hasErrors:false};
  }
  return Object.freeze({readPath,objectType,hasRenderableValue,widgetValue,legacyObject,adapt,adaptDeskAcademic,adaptUserService,adaptUserServiceWithAssets})
 }
 root.ACDLRuntimeProjectAdapter=Object.freeze({readPath,hasRenderableValue,legacyObject,create})
})(typeof window!=='undefined'?window:globalThis);
