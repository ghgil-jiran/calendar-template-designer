(function(root){
 function readPath(source,path){if(!path)return undefined;return path.replace(/\[(\d+)\]/g,'.$1').split('.').filter(Boolean).reduce((value,key)=>value==null?undefined:value[key],source)}
 function pct(value,total){return Number(value||0)/100*total}
 const TYPE_ALIASES=Object.freeze({frame:'image-frame','monthly-calendar':'calendar','school-object':'semantic-object'});
 function objectType(value){const type=String(value||'shape');return TYPE_ALIASES[type]||type}
 function shiftedMonth(year,month,offset){const date=new Date(Date.UTC(Number(year),Number(month)-1+offset,1));return {year:date.getUTCFullYear(),month:date.getUTCMonth()+1}}
 function widgetValue(element,page){
  const config=element.runtimeWidget||element,type=objectType(element.type),year=Number(page?.calendarYear),month=Number(page?.calendarMonth);
  if(!Number.isInteger(year)||month<1||month>12)return element.value;
  if(type==='mini-calendar-prev')return {...shiftedMonth(year,month,-1),rows:element.rows,weekStart:element.weekStart};
  if(type==='mini-calendar-next')return {...shiftedMonth(year,month,1),rows:element.rows,weekStart:element.weekStart};
  if(type==='mini-calendar'||type==='month-date-strip')return {year,month,rows:config.rows,weekStart:config.weekStart,showWeekday:config.showWeekday!==false,showDate:config.showDate!==false};
  if(type==='memo')return {layout:config.memoLayout||'lines',title:config.title||'MEMO',lineCount:Number(config.lineCount||8),itemCount:Number(config.itemCount||9),weekCount:Number(config.weekCount||5),showMemo:config.showMemo!==false};
  return element.value
 }
 function legacyObject(element,width,height,index,project){
  let value=element.value!==undefined?element.value:element.content;
  if(value===undefined&&(element.type==='image'||element.type==='image-frame'))value=root.ACDLProjectAssetResolver?.elementValue(project,element)||element.src||element.image||null;
  const binding=typeof element.binding==='string'?element.binding:typeof element.image?.binding==='string'?element.image.binding:undefined;
  return {id:String(element.id||`legacy.object.${index}`),sourceObjectId:String(element.id||`legacy.object.${index}`),type:objectType(element.type),frame:{x:pct(element.x,width),y:pct(element.y,height),width:pct(element.width==null?10:element.width,width),height:pct(element.height==null?10:element.height,height)},binding,value,runtimeWidget:{rows:element.rows,weekStart:element.weekStart,showWeekday:element.showWeekday,showDate:element.showDate,memoLayout:element.memoLayout,title:element.title,lineCount:element.lineCount,itemCount:element.itemCount,weekCount:element.weekCount,showMemo:element.showMemo},style:{...(element.style||{}),legacyRole:element.role},visible:element.visible!==false,zIndex:Number(element.zIndex==null?index:element.zIndex)}
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
    const sourcePageId=page.sourcePageId||page.id,master=project.template.masterElements?.[page.masterId]||[],local=project.book.elementsByPage?.[sourcePageId]||[],objects=[...master,...local].map((element,objectIndex)=>legacyObject(element,size.width,size.height,objectIndex,project));
    if(String(page.role||'').includes('monthly-calendar')||String(page.role||'').startsWith('monthly-front')){
     const region=project.template.masters?.calendar?.calendarRegionsByType?.[project.productType.category]||project.template.masters?.calendar?.calendarRegion||{x:5,y:16,width:90,height:79};
     objects.unshift(legacyObject({id:`${page.id}.calendar`,type:'calendar',...region,zIndex:0,value:{year:page.calendarYear,month:page.calendarMonth}},size.width,size.height,-1,project));
    }
    return {id:String(page.id||`page.${index+1}`),sourcePageId:String(sourcePageId||page.id||`page.${index+1}`),role:String(page.role||'page'),size:{width:size.width,height:size.height,unit:size.unit||'mm'},background:{},objects:objects.map(object=>{const binding=datasetDomain.resolvePageBinding(object.binding,page),bound=binding?readPath(dataset,binding):undefined,widget=widgetValue(object,page);return {...object,binding,value:object.type==='monthly-quote'?dataset.monthlyQuotes[`${page.calendarYear}-${String(page.calendarMonth).padStart(2,'0')}`]:bound!==undefined?bound:widget!==undefined?widget:object.value}}).sort((a,b)=>a.zIndex-b.zIndex),metadata:{number:page.number,side:page.side,calendarYear:page.calendarYear,calendarMonth:page.calendarMonth,masterId:page.masterId,integrationSourceRole:page.integrationSourceRole}};
   });
   return {template:{schemaVersion:'1.0',id:String(project.template.id||'legacy.template'),revision:Number(project.template.revision||1),pages},dataset}
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
  return Object.freeze({readPath,objectType,widgetValue,legacyObject,adapt,adaptDeskAcademic,adaptUserService,adaptUserServiceWithAssets})
 }
 root.ACDLRuntimeProjectAdapter=Object.freeze({readPath,legacyObject,create})
})(typeof window!=='undefined'?window:globalThis);
