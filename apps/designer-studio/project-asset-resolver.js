(function(root){
 function resources(project){project.template||={};project.template.resources||={};project.template.resources.assets||=[];return project.template.resources}
 function normalize(project){
  if(!project||typeof project!=='object')return project;
  const store=resources(project),byId=new Map(store.assets.filter(Boolean).map(asset=>[asset.id,asset]));
  (store.aiDesignAssets||[]).filter(Boolean).forEach(asset=>{if(!byId.has(asset.id)){const common={...asset,kind:'image',origin:asset.origin||'ai-generated'};store.assets.push(common);byId.set(common.id,common)}else Object.assign(byId.get(asset.id),asset,{kind:'image',origin:asset.origin||byId.get(asset.id).origin||'ai-generated'})});
  Object.values(project.book?.elementsByPage||{}).flat().filter(item=>item?.type==='image'||item?.type==='image-frame').forEach(item=>{
   const id=item.assetRef?.ref==='template'?item.assetRef.id:item.assetId||item.aiDesign?.resourceId||item.aiDesign?.assetId;
   let linked=id?byId.get(id):null;
   if(!linked&&item.src){linked={id:id||`project.asset.${item.id||byId.size+1}`,kind:'image',src:item.src,alt:item.alt||'',origin:item.role==='ai-design-background'?'ai-generated':'editor'};store.assets.push(linked);byId.set(linked.id,linked)}
   if(linked){item.assetId=linked.id;item.assetRef={ref:'template',id:linked.id};if(item.role==='ai-design-background')delete item.src}
  });
  return project
 }
 function asset(project,id){const store=project?.template?.resources||{};return [...(store.assets||[]),...(store.aiDesignAssets||[])].find(item=>item?.id===id)||null}
 function elementSource(project,element){if(element?.src)return element.src;const id=element?.assetRef?.ref==='template'?element.assetRef.id:element?.assetId||element?.aiDesign?.resourceId;return asset(project,id)?.src||''}
 function elementValue(project,element){const id=element?.assetRef?.ref==='template'?element.assetRef.id:element?.assetId||element?.aiDesign?.resourceId,linked=asset(project,id),src=elementSource(project,element);if(!id&&!src)return element?.value!==undefined?element.value:element?.content;return {assetId:id||linked?.id||`inline.${element?.id||'image'}`,src,fit:element?.fit||element?.image?.fit||'cover',focalPoint:element?.focalPoint||element?.image?.focalPoint||{x:.5,y:.5},...(id?{assetRef:{ref:'template',id}}:{})}}
 function runtimeAssets(project){normalize(project);return (project?.template?.resources?.assets||[]).map(item=>({...item}))}
 root.ACDLProjectAssetResolver=Object.freeze({normalize,asset,elementSource,elementValue,runtimeAssets})
})(typeof window!=='undefined'?window:globalThis);
