(function(root){
 const VERSION='ai-design-quality.v1@0.1.0',SAFE_MARGIN=3,MIN_DRAFT_DPI=144,REGENERABLE=new Set(['forbidden-text','duplicate-asset','visual-inconsistency']);
 const ROLE_BY_PAGE=Object.freeze({'cover-front':'cover','cover-back':'annual','poster-annual':'annual','school-symbols':'school-symbols','front-insert-front':'school-symbols','monthly-front':'month','monthly-back':'month-back','back-cover-front':'back-cover','back-cover-back':'back-cover'});
 function monthKey(page){return page?.monthKey||(page?.calendarYear&&page?.calendarMonth?`${page.calendarYear}-${String(page.calendarMonth).padStart(2,'0')}`:null)}
 function generatedRole(page){return page?.semanticPageRole==='school-symbols'?'school-symbols':ROLE_BY_PAGE[page?.role]||null}
 function metadataFor(selected,page,role){return ['month','month-back'].includes(role)?selected?.monthlyAssets?.[monthKey(page)]?.metadata?.[role]||{}:selected?.assetMetadataByRole?.[role]||{}}
 function assetFor(selected,page,role){return ['month','month-back'].includes(role)?selected?.monthlyAssets?.[monthKey(page)]?.[role]||null:selected?.assetsByRole?.[role]||null}
 function frame(item){const value=item?.framePct||item;if(![value?.x,value?.y,value?.width,value?.height].every(Number.isFinite))return null;return {x:value.x,y:value.y,width:value.width,height:value.height}}
 function overlapRatio(a,b){const width=Math.max(0,Math.min(a.x+a.width,b.x+b.width)-Math.max(a.x,b.x)),height=Math.max(0,Math.min(a.y+a.height,b.y+b.height)-Math.max(a.y,b.y));return width*height/Math.max(1,Math.min(a.width*a.height,b.width*b.height))}
 function dimensions(meta){if(Array.isArray(meta.size))return {width:Number(meta.size[0]),height:Number(meta.size[1])};const match=String(meta.size||'').match(/(\d+)\s*x\s*(\d+)/i);return match?{width:Number(match[1]),height:Number(match[2])}:null}
 function pageChecks(project,selected,page){
  const role=generatedRole(page),key=monthKey(page),elements=project?.book?.elementsByPage?.[page.id]||[],editable=elements.filter(item=>item.role!=='ai-design-background'),meta=metadataFor(selected,page,role),asset=assetFor(selected,page,role),issues=[];
  if(!asset)issues.push({code:'missing-asset',severity:'fail',regenerable:false});
  if(!editable.length)issues.push({code:'readability',severity:'fail',regenerable:false});
  const outside=editable.filter(item=>{const box=frame(item);return box&&(box.x<SAFE_MARGIN||box.y<SAFE_MARGIN||box.x+box.width>100-SAFE_MARGIN||box.y+box.height>100-SAFE_MARGIN)});
  if(outside.length)issues.push({code:'safe-area',severity:'fail',regenerable:false,elementIds:outside.map(item=>item.id)});
  const boxes=editable.map(item=>({item,box:frame(item)})).filter(item=>item.box);const collisions=[];
  for(let left=0;left<boxes.length;left+=1)for(let right=left+1;right<boxes.length;right+=1)if(overlapRatio(boxes[left].box,boxes[right].box)>.8)collisions.push([boxes[left].item.id,boxes[right].item.id]);
  if(collisions.length)issues.push({code:'collision',severity:'fail',regenerable:false,pairs:collisions});
  const forbidden=meta.qualityChecks?.forbiddenText||meta.quality?.forbiddenText;
  if(forbidden==='fail'||(meta.detectedForbiddenText||[]).length)issues.push({code:'forbidden-text',severity:'fail',regenerable:true,tokens:meta.detectedForbiddenText||[]});else if(forbidden==='review-required')issues.push({code:'forbidden-text-review',severity:'review',regenerable:false});
  const expectedStyle=selected?.key,actualStyle=meta.styleKey;if(expectedStyle&&actualStyle&&actualStyle!==expectedStyle)issues.push({code:'visual-inconsistency',severity:'fail',regenerable:true});
  const size=dimensions(meta),pageSize=project?.productType?.pageSize;if(size&&pageSize?.width&&pageSize?.height){const dpi=Math.min(size.width/(pageSize.width/25.4),size.height/(pageSize.height/25.4));if(dpi<MIN_DRAFT_DPI)issues.push({code:'effective-resolution',severity:'fail',regenerable:false,effectiveDpi:Math.round(dpi)});else if(dpi<300)issues.push({code:'print-resolution-review',severity:'review',regenerable:false,effectiveDpi:Math.round(dpi)})}
  return {pageId:page.id,pageRole:page.role,generatedRole:role,monthKey:key,status:issues.some(item=>item.severity==='fail')?'fail':issues.length?'review':'pass',issues};
 }
 function createReport(project,selected,now=new Date().toISOString()){
  const pages=(project?.book?.pageInstances||[]).filter(page=>generatedRole(page)).map(page=>pageChecks(project,selected,page)),seen=new Map();
  pages.forEach(page=>{const asset=assetFor(selected,page,page.generatedRole);if(!asset)return;const prior=seen.get(asset);if(prior&&prior.generatedRole===page.generatedRole&&prior.monthKey!==page.monthKey){page.issues.push({code:'duplicate-asset',severity:'fail',regenerable:true,duplicateOf:prior.pageId});page.status='fail'}else seen.set(asset,page)});
  const regenerationTargets=pages.flatMap(page=>page.issues.some(issue=>issue.severity==='fail'&&REGENERABLE.has(issue.code))?[{pageId:page.pageId,generatedRole:page.generatedRole,monthKey:page.monthKey,reasons:page.issues.filter(issue=>issue.severity==='fail'&&REGENERABLE.has(issue.code)).map(issue=>issue.code)}]:[]);
  const failedPages=pages.filter(page=>page.status==='fail'),reviewPages=pages.filter(page=>page.status==='review');return {schemaVersion:VERSION,status:failedPages.length?'failed':reviewPages.length?'review-required':'passed',checks:['readability','collision','safe-area','forbidden-text','duplicate-asset','visual-inconsistency','effective-resolution'],pageCount:pages.length,passedPageCount:pages.filter(page=>page.status==='pass').length,failedPageCount:failedPages.length,reviewPageCount:reviewPages.length,failedRoles:[...new Set(failedPages.map(page=>page.generatedRole))],regenerationTargets,pages,checkedAt:now};
 }
 root.ACDLDesignQuality=Object.freeze({VERSION,SAFE_MARGIN,MIN_DRAFT_DPI,ROLE_BY_PAGE,monthKey,generatedRole,pageChecks,createReport});
})(typeof window==='undefined'?globalThis:window);
