(function(root){
 function resources(project){project.template||={};project.template.resources||={};project.template.resources.assets||=[];return project.template.resources}
 function normalize(project){
  if(!project||typeof project!=='object')return project;
  const store=resources(project),aiAssets=(store.aiDesignAssets||[]).filter(Boolean),aiIds=new Set(aiAssets.map(asset=>asset.id));
  store.assets=store.assets.filter(asset=>asset&&!aiIds.has(asset.id));
  const byId=new Map(store.assets.map(asset=>[asset.id,asset]));
  aiAssets.forEach(asset=>{asset.kind='image';asset.origin=asset.origin||'ai-generated';byId.set(asset.id,asset)});
  Object.values(project.book?.elementsByPage||{}).flat().filter(item=>item?.type==='image'||item?.type==='image-frame').forEach(item=>{
   const id=item.assetRef?.ref==='template'?item.assetRef.id:item.assetId||item.aiDesign?.resourceId||item.aiDesign?.assetId;
   let linked=id?byId.get(id):null;
   if(!linked&&item.src){linked={id:id||`project.asset.${item.id||byId.size+1}`,kind:'image',src:item.src,alt:item.alt||'',origin:item.role==='ai-design-background'?'ai-generated':'editor'};store.assets.push(linked);byId.set(linked.id,linked)}
   if(linked){item.assetId=linked.id;item.assetRef={ref:'template',id:linked.id};if(item.role==='ai-design-background')delete item.src}
  });
  return project
 }
 function asset(project,id){const store=project?.template?.resources||{};return [...(store.aiDesignAssets||[]),...(store.assets||[])].find(item=>item?.id===id)||null}
 function elementSource(project,element){if(element?.src)return element.src;const id=element?.assetRef?.ref==='template'?element.assetRef.id:element?.assetId||element?.aiDesign?.resourceId;return asset(project,id)?.src||''}
 function elementValue(project,element){const id=element?.assetRef?.ref==='template'?element.assetRef.id:element?.assetId||element?.aiDesign?.resourceId,linked=asset(project,id),src=elementSource(project,element);if(!id&&!src)return element?.value!==undefined?element.value:element?.content;return {assetId:id||linked?.id||`inline.${element?.id||'image'}`,src,fit:element?.fit||element?.image?.fit||'cover',focalPoint:element?.focalPoint||element?.image?.focalPoint||{x:.5,y:.5},...(id?{assetRef:{ref:'template',id}}:{})}}
 function runtimeAssets(project){normalize(project);const store=project?.template?.resources||{},unique=new Map([...(store.assets||[]),...(store.aiDesignAssets||[])].filter(Boolean).map(item=>[item.id,item]));return [...unique.values()].map(item=>({...item}))}
 root.ACDLProjectAssetResolver=Object.freeze({normalize,asset,elementSource,elementValue,runtimeAssets})
})(typeof window!=='undefined'?window:globalThis);
