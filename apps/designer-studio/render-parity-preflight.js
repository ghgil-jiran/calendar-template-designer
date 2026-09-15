((root)=>{
 const list=value=>Array.isArray(value)?value:[];
 const text=value=>String(value??'').trim();
 const round=value=>Math.round((Number(value)||0)*1000)/1000;
 const issue=(severity,code,message,path='')=>({severity,code,message,path});
 function nodeSnapshot(node){
  const image=node.querySelector('img'),style=node.style;
  return {id:text(node.dataset.elementId),type:text(node.dataset.elementType),role:text(node.dataset.elementRole),scope:text(node.dataset.scope),geometry:{left:text(style.left),top:text(style.top),width:text(style.width),height:text(style.height),transform:text(style.transform)},image:image?{src:text(image.currentSrc||image.src),loaded:Boolean(image.complete&&image.naturalWidth>0)}:null};
 }
 function pageSnapshot(page,pageInfo){
  const rect=page.getBoundingClientRect(),objects=[...page.querySelectorAll('.free-element[data-element-id]')].filter(node=>getComputedStyle(node).display!=='none').map(nodeSnapshot);
  if(page.querySelector('#calendarRegion,.calendar-region'))objects.push({id:'@calendar-region',type:'calendar-grid',role:'calendar',scope:'master',geometry:{},image:null});
  return {pageId:text(pageInfo?.id),role:text(pageInfo?.role),width:round(page.offsetWidth||rect.width||parseFloat(page.style.width)||Number(page.dataset.previewWidth)),height:round(page.offsetHeight||rect.height||parseFloat(page.style.height)||Number(page.dataset.previewHeight)),objects};
 }
 function comparePage(screen,output,index=0){
  const problems=[],path=`render.pages[${index}]`,outputById=new Map(list(output?.objects).map(item=>[item.id,item]));
  if(!(screen?.width>0&&screen?.height>0))problems.push(issue('error','SCREEN_PAGE_SIZE_INVALID','화면 렌더링 페이지 크기를 확인할 수 없습니다.',path));
  if(!(output?.width>0&&output?.height>0))problems.push(issue('error','RGB_PAGE_SIZE_INVALID','RGB PDF 출력 페이지 크기를 확인할 수 없습니다.',path));
  if(screen?.role!==output?.role)problems.push(issue('error','RGB_PAGE_ROLE_MISMATCH',`화면과 RGB PDF의 페이지 역할이 다릅니다: ${screen?.role||'없음'} → ${output?.role||'없음'}`,path));
  list(screen?.objects).forEach(object=>{
   const resolved=outputById.get(object.id),objectPath=`${path}.objects.${object.id}`;
   if(!resolved){problems.push(issue('error','RGB_OBJECT_MISSING',`RGB PDF 출력에서 개체가 누락됐습니다: ${object.id}`,objectPath));return}
   if(object.type!==resolved.type)problems.push(issue('error','RGB_OBJECT_TYPE_MISMATCH',`화면과 RGB PDF의 개체 종류가 다릅니다: ${object.id}`,objectPath));
   if(JSON.stringify(object.geometry)!==JSON.stringify(resolved.geometry))problems.push(issue('error','RGB_OBJECT_GEOMETRY_MISMATCH',`화면과 RGB PDF의 개체 위치 또는 크기가 다릅니다: ${object.id}`,objectPath));
   if(object.image&&!object.image.loaded)problems.push(issue('error','SCREEN_IMAGE_NOT_READY',`화면 이미지가 로드되지 않았습니다: ${object.id}`,objectPath));
   if(resolved.image&&!resolved.image.loaded)problems.push(issue('error','RGB_IMAGE_NOT_READY',`RGB PDF 출력 이미지가 로드되지 않았습니다: ${object.id}`,objectPath));
  });
  return problems;
 }
 function auditPage(live,output,pageInfo,index=0){
  const screen=pageSnapshot(live,pageInfo),rgb=pageSnapshot(output,pageInfo);
  return {screen,rgb,issues:comparePage(screen,rgb,index)};
 }
 function aggregate(results){
  const pages=list(results),issues=pages.flatMap(item=>list(item.issues));
  return Object.freeze({generated:true,pages:pages.length,screenObjects:pages.reduce((sum,item)=>sum+list(item.screen?.objects).length,0),rgbObjects:pages.reduce((sum,item)=>sum+list(item.rgb?.objects).length,0),issues});
 }
 root.ACDLRenderParityPreflight=Object.freeze({pageSnapshot,comparePage,auditPage,aggregate});
})(typeof window!=='undefined'?window:globalThis);
