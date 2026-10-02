(function(root){
 const list=v=>Array.isArray(v)?v:[],text=v=>String(v??'');
 const VERSION='template-image-print-quality.v2@0.1.0';
 const COMMON=[['identity','사용 이미지·페이지·개체 연결'],['frameSuitability','원본 접근·파일 정상 여부'],['effectiveResolution','실배치·크롭 기준 300 DPI'],['placementIntegrity','확대 선명도·잘림·CMYK 색상·계조'],['visualArtifacts','흐림·노이즈·깨짐']];
 const AI=[['generationStandard','AI 생성 기준·최대 품질'],['contentLegibility','AI 비정상 형상·원치 않는 문자·숫자']];
 const probes=new Map();
 function signature(items){const raw=JSON.stringify(items.map(item=>({...item,src:root.ACDLTemplateRemotePersistence?.canonicalAssetSource?.(item.src)||item.src})));let a=2166136261,b=5381;for(let i=0;i<raw.length;i++){a=Math.imul(a^raw.charCodeAt(i),16777619);b=Math.imul(b,33)^raw.charCodeAt(i)}return `${items.length}:${a>>>0}:${b>>>0}`}
 function inventory(project){
  const resources=project?.template?.resources||{},assets=[...list(resources.assets),...list(resources.aiDesignAssets)],byId=new Map(assets.map(a=>[a.id,a])),items=[],size=project?.productType?.pageSize||{};
  for(const page of list(project?.book?.pageInstances||project?.pages)){
   const unique=new Map([...list(project?.template?.masterElements?.[page.masterId]),...list(project?.book?.elementsByPage?.[page.id]),...list(page.elements),...list(page.objects)].map(e=>[e.id,e]));
   for(const e of unique.values()){
    if(!['image','image-frame'].includes(e.type)||e.hidden===true||e.visible===false||e.printable===false)continue;
    const binding=e.image?.binding||e.binding||'',id=e.image?.assetId||e.assetRef?.id||e.assetId||e.aiDesign?.resourceId,asset=byId.get(id)||{},school=project?.book?.school||{};
    let bound=binding.startsWith('school.')?binding.slice(7).split('.').reduce((v,k)=>v?.[k],school):null;
    if(bound?.image)bound=bound.image;
    if(/(?:calendar\.)?monthlyImages\./.test(binding)){const m=binding.endsWith('.current')?page.calendarMonth:Number(binding.split('.').pop());bound=project?.book?.monthlyImages?.[`${page.calendarYear||project.settings?.year}-${String(m).padStart(2,'0')}`]}
    const src=text((typeof bound==='string'?bound:bound?.src)||e.image?.src||e.src||asset.src||root.ACDLProjectAssetResolver?.elementSource?.(project,e)||'');
    const ai=Boolean(e.aiDesign)||/^ai-(design-)?background$/.test(e.role||'')||asset.origin==='ai-generated'||asset.source?.type==='live-ai-generation'||text(id).startsWith('ai-design.');
    const widthMm=e.frame?.width??Number(size.width)*Number(e.width)/100,heightMm=e.frame?.height??Number(size.height)*Number(e.height)/100;
    items.push({id:`${page.id}:${e.id}`,pageId:page.id,objectId:e.id,assetId:id||null,src,ai,role:e.role||null,binding,placeholder:!src&&e.type==='image-frame'&&e.replaceable===true&&e.emptyBehavior==='placeholder',widthMm,heightMm,x:e.x,y:e.y,rotation:e.rotation||0,fit:e.image?.fit||e.fit||'cover',scale:Math.max(.01,Number(e.image?.scale)||1),offsetX:e.image?.offsetX||0,offsetY:e.image?.offsetY||0,origin:ai?'ai':e.graphicSource?'graphic-library':binding?'bound':'editor',originalAssetId:e.graphicSource?.originalAssetId||e.printSource?.assetId||e.image?.assetId||null,originalVersion:e.graphicSource?.version||null,generationEvidence:asset.generationEvidence||asset.generation?.generationEvidence||null,style:e.style||{},imageStyle:{flipX:e.image?.flipX,flipY:e.image?.flipY,brightness:e.image?.brightness,contrast:e.image?.contrast,saturation:e.image?.saturation}});
   }
  }
  return {items,count:items.length,signature:signature(items),aiCount:items.filter(i=>i.ai).length};
 }
 function resolution(item,width,height){
  if(!(item.widthMm>0&&item.heightMm>0&&width>0&&height>0))return null;
  const fit=item.fit==='contain'?Math.min:Math.max;
  const mmPerPixel=fit(item.widthMm/width,item.heightMm/height)*item.scale;
  return 25.4/mmPerPixel;
 }
 async function probe(project,loader){
  const inv=inventory(project),results=[];
  const load=loader||((src)=>new Promise((resolve,reject)=>{const img=new root.Image(),timer=setTimeout(()=>reject(new Error('원본 응답 시간 초과')),20000);img.onload=()=>{clearTimeout(timer);resolve({width:img.naturalWidth,height:img.naturalHeight})};img.onerror=()=>{clearTimeout(timer);reject(new Error('원본을 읽을 수 없습니다.'))};img.src=src}));
  const cache=new Map(),originals=new Map();
  // Decode each source once; placements remain independently inspected.
  for(const item of inv.items){
   if(item.placeholder){results.push({...item,status:'review',message:'사용자 교체용 빈 프레임: 최종 출력 전에 이미지 입력 또는 삭제가 필요합니다.'});continue}
   try{
    let src=item.src;
    if(item.originalAssetId&&item.origin!=='graphic-library'&&root.ACDLAssetStore?.originalDataUrl){
     if(!originals.has(item.originalAssetId))originals.set(item.originalAssetId,(async()=>{
      try{return await root.ACDLAssetStore.originalDataUrl(item.originalAssetId)}catch(error){
       if(!root.ACDLTemplateRemotePersistence?.hydrateProjectData)throw error;
       const loaded=await root.ACDLTemplateRemotePersistence.hydrateProjectData({src:`acdl-asset://${item.originalAssetId}`});
       if(!loaded.src||loaded.src.startsWith('acdl-asset://'))throw error;return loaded.src;
      }
     })());
     src=await originals.get(item.originalAssetId);
    }
    if(!src)throw new Error('사용 이미지 원본이 없습니다.');
    if(!cache.has(src))cache.set(src,load(src));
    const dim=await cache.get(src),dpi=resolution(item,dim.width,dim.height);
    results.push({...item,originalSrc:src,width:dim.width,height:dim.height,dpi,status:dpi===null?'review':dpi<300?'failed':'passed',message:dpi===null?'배치 크기를 확인해야 합니다.':`배치 기준 ${Math.floor(dpi)} DPI`});
   }catch(error){results.push({...item,status:'failed',message:error.message})}
  }
  const result={signature:inv.signature,items:results};probes.set(inv.signature,result);return result;
 }
 function inspect(project,check){
  const inv=inventory(project),probeResult=probes.get(inv.signature),fresh=check?.criteriaVersion===VERSION&&check?.evidence?.inventorySignature===inv.signature;
  const definitions=[...COMMON,...(inv.aiCount?AI:[])];
  const criteria=definitions.map(([key,label])=>{
   let status='not_run',message='검사 전',evidence=null;
   if(key==='identity'){status=inv.items.every(i=>i.pageId&&i.objectId)?'passed':'failed';message=`사용 이미지·프레임 ${inv.count}개 위치 확인`}
   if(probeResult&&key==='frameSuitability'){status=probeResult.items.some(i=>!i.src&&!i.placeholder||i.status==='failed'&&!i.width)?'failed':probeResult.items.some(i=>i.placeholder)?'review':'passed';message='사용 원본 파일 접근·이미지 디코딩 검사'}
   if(probeResult&&key==='effectiveResolution'){status=probeResult.items.some(i=>i.status==='failed')?'failed':probeResult.items.every(i=>i.status==='passed')?'passed':'review';message='각 사용 위치의 크기·맞춤·확대 배율을 반영한 해상도 검사';evidence={placements:probeResult.items.map(({id,width,height,dpi,status,message})=>({id,width,height,dpi,status,message}))}}
   if(key==='generationStandard'){const ai=inv.items.filter(i=>i.ai);status=ai.every(i=>i.generationEvidence?.quality==='high'&&i.generationEvidence?.status==='passed')?'passed':'review';message='생성 근거가 부족한 AI 이미지는 생성 기준을 직접 확인해야 합니다.'}
   if(fresh&&['placementIntegrity','visualArtifacts','contentLegibility','generationStandard'].includes(key)){const saved=check.criteria?.[key];if(saved){status=saved.status;message=saved.message;evidence=saved.evidence}}
   return {key,label,status,message,evidence,source:'template-image-print-quality'};
  });
  const empty=!inv.count,complete=empty||criteria.every(c=>c.status==='passed'),blocked=criteria.some(c=>c.status==='failed');
  return {status:complete?'passed':blocked?'blocked':'pending',disposition:empty?'not-applicable':'required',required:!empty,criteriaComplete:complete,criteriaVersion:VERSION,inventorySignature:inv.signature,imageCount:inv.count,aiImageCount:inv.aiCount,images:inv.items,placements:probeResult?.items||[],criteria:empty?[]:criteria,criteriaSummary:{passed:criteria.filter(c=>c.status==='passed').length,review:criteria.filter(c=>c.status==='review').length,failed:criteria.filter(c=>c.status==='failed').length,notRun:criteria.filter(c=>c.status==='not_run').length},evidenceMode:fresh?'dedicated':'current-inventory',result:fresh?check:null};
 }
 root.ACDLTemplateImageInspection=Object.freeze({inventory,resolution,probe,inspect,VERSION});
})(typeof window!=='undefined'?window:globalThis);
