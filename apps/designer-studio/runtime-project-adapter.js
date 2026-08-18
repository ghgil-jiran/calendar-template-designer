(function(root){
 function readPath(source,path){if(!path)return undefined;return path.replace(/\[(\d+)\]/g,'.$1').split('.').filter(Boolean).reduce((value,key)=>value==null?undefined:value[key],source)}
 function pct(value,total){return Number(value||0)/100*total}
 function legacyObject(element,width,height,index){
  let value=element.value!==undefined?element.value:element.content;
  if(value===undefined&&(element.type==='image'||element.type==='image-frame'))value=element.src||element.image||null;
  const binding=typeof element.binding==='string'?element.binding:typeof element.image?.binding==='string'?element.image.binding:undefined;
  return {id:String(element.id||`legacy.object.${index}`),sourceObjectId:String(element.id||`legacy.object.${index}`),type:String(element.type||'shape'),frame:{x:pct(element.x,width),y:pct(element.y,height),width:pct(element.width==null?10:element.width,width),height:pct(element.height==null?10:element.height,height)},binding,value,style:{...(element.style||{}),legacyRole:element.role},visible:element.visible!==false,zIndex:Number(element.zIndex==null?index:element.zIndex)}
 }
 function create(options={}){
  const datasetDomain=options.datasetDomain||root.ACDLDatasetDomain;
  const userServiceDataset=options.userServiceDataset||root.ACDLUserServiceDatasetBridge;
  const parity=options.parity||root.ACDLIntegrationParity;
  const pageAdapter=options.pageAdapter||root.ACDLDeskAcademicPageAdapter;
  function adapt(project,pageInstances=project.book.pageInstances||[],datasetOverride){
   const size=project.productType.pageSize,dataset=datasetOverride||datasetDomain.buildRuntimeDataset(project);
   const pages=pageInstances.map((page,index)=>{
    const sourcePageId=page.sourcePageId||page.id,master=project.template.masterElements?.[page.masterId]||[],local=project.book.elementsByPage?.[sourcePageId]||[],objects=[...master,...local].map((element,objectIndex)=>legacyObject(element,size.width,size.height,objectIndex));
    if(String(page.role||'').includes('monthly-calendar')||String(page.role||'').startsWith('monthly-front')){
     const region=project.template.masters?.calendar?.calendarRegionsByType?.[project.productType.category]||project.template.masters?.calendar?.calendarRegion||{x:5,y:16,width:90,height:79};
     objects.unshift(legacyObject({id:`${page.id}.calendar`,type:'calendar',...region,zIndex:0,value:{year:page.calendarYear,month:page.calendarMonth}},size.width,size.height,-1));
    }
    return {id:String(page.id||`page.${index+1}`),sourcePageId:String(sourcePageId||page.id||`page.${index+1}`),role:String(page.role||'page'),size:{width:size.width,height:size.height,unit:size.unit||'mm'},background:{},objects:objects.map(object=>{const binding=datasetDomain.resolvePageBinding(object.binding,page),bound=binding?readPath(dataset,binding):undefined;return {...object,binding,value:object.type==='monthly-quote'?dataset.monthlyQuotes[`${page.calendarYear}-${String(page.calendarMonth).padStart(2,'0')}`]:bound!==undefined?bound:object.value}}).sort((a,b)=>a.zIndex-b.zIndex),metadata:{number:page.number,side:page.side,calendarYear:page.calendarYear,calendarMonth:page.calendarMonth,masterId:page.masterId,integrationSourceRole:page.integrationSourceRole}};
   });
   return {template:{schemaVersion:'1.0',id:String(project.template.id||'legacy.template'),revision:Number(project.template.revision||1),pages},dataset}
  }
  function adaptDeskAcademic(project,datasetOverride){const plan=parity.buildDeskAcademicSurfacePlan(project.settings?.year,project.settings?.startMonth||3),composition=pageAdapter.compose(project,plan);return {...adapt(project,composition.pages,datasetOverride),composition}}
  function adaptUserService(project,adapterResult){
   if(!userServiceDataset)throw new Error('User Service Dataset Bridge is not available');
   const accepted=userServiceDataset.accept(adapterResult);
   if(accepted.hasErrors)return {dataset:accepted.dataset,diagnostics:accepted.diagnostics,hasErrors:true,template:null,composition:null};
   const runtime=adaptDeskAcademic(project,accepted.dataset);
   return {...runtime,diagnostics:accepted.diagnostics,hasErrors:false};
  }
  return Object.freeze({readPath,legacyObject,adapt,adaptDeskAcademic,adaptUserService})
 }
 root.ACDLRuntimeProjectAdapter=Object.freeze({readPath,legacyObject,create})
})(typeof window!=='undefined'?window:globalThis);
