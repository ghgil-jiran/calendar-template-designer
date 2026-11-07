(function(root){
 const VERSION='ai-generation-context.v1@0.1.0';
 const ROLE_POLICY={cover:'cover',annual:'annualSingle','school-symbols':'schoolSymbols',month:'monthlyFront','month-back':'monthlyBack','back-cover':'backCover'};
 const DEFAULT_SAFE_MARGIN_MM=5;
 const ESTIMATED_IMAGE_USD=Object.freeze({low:0.013,medium:0.05});
 function clone(value){return JSON.parse(JSON.stringify(value))}
 function definition(project){return project?.template?.calendarTypeSnapshot?.definition||null}
 function policyFor(type,role){
  if(role==='school-symbols')return (type?.pageRules||[]).some(rule=>rule.role==='school-symbols')?'optional':'unsupported';
  return type?.policies?.[ROLE_POLICY[role]]||'unsupported';
 }
 function pagesFor(project,role){
  const pages=project?.book?.pageInstances||[];
  return pages.filter(page=>{
   if(role==='cover')return page.role==='cover-front'||page.role==='cover';
   if(role==='annual')return ['cover-back','poster-annual','annual'].includes(page.role)||page.semanticPageRole==='yearly-calendar';
   if(role==='school-symbols')return page.role==='school-symbols'||page.semanticPageRole==='school-symbols';
   if(role==='month')return page.role==='monthly-front';
   if(role==='month-back')return page.role==='monthly-back';
   if(role==='back-cover')return ['back-cover-front','back-cover-back'].includes(page.role);
   return false;
  });
 }
 function build(project){
  const type=definition(project),finished=clone(type?.finishedSize||project?.productType?.pageSize||{}),production=clone(type?.productionSize||finished),roles=['cover','annual','school-symbols','month','month-back','back-cover'].map(role=>{const pages=pagesFor(project,role),policy=type?policyFor(type,role):(pages.length?'required':'unsupported');return {role,policy,pageCount:pages.length,enabled:policy!=='unsupported'&&pages.length>0,required:policy==='required',pageIds:pages.map(page=>page.id)}}),safeMarginMm=Number(project?.template?.resources?.exportSettings?.safeMargin)||DEFAULT_SAFE_MARGIN_MM;
  return {schemaVersion:VERSION,calendarType:{id:type?.id||project?.productType?.calendarTypeId||project?.productType?.category||null,family:type?.family?clone(type.family):{id:project?.productType?.category||null,name:''},orientation:type?.orientation||(Number(finished.width)>=Number(finished.height)?'landscape':'portrait'),printSides:type?.printSides||(project?.productType?.duplex?'duplex':'simplex'),binding:clone(type?.binding||{}),finishedSize:finished,productionSize:production},print:{bleedMm:Math.max(0,(Number(production.width)-Number(finished.width))/2)||Number(project?.template?.resources?.exportSettings?.bleed)||3,safeMarginMm,targetDpi:Number(project?.template?.resources?.exportSettings?.dpi)||300,colorMode:project?.template?.resources?.exportSettings?.colorMode||'cmyk'},roles,enabledRoles:roles.filter(item=>item.enabled).map(item=>item.role),monthlyRoles:roles.filter(item=>item.enabled&&['month','month-back'].includes(item.role)).map(item=>item.role)};
 }
 function plan(context,{monthCount=12,quality='low'}={}){
  const enabledRoles=context?.enabledRoles||[],monthlyRoles=context?.monthlyRoles||[],months=monthlyRoles.length?Math.max(0,Number(monthCount)||0):0,representativeCount=enabledRoles.length,monthlyAssetCount=months*monthlyRoles.length,generationCount=representativeCount+Math.max(0,months-1)*monthlyRoles.length,unitCostUsd=ESTIMATED_IMAGE_USD[quality]??ESTIMATED_IMAGE_USD.low;
  return {familyId:context?.calendarType?.family?.id||null,enabledRoles:[...enabledRoles],monthlyRoles:[...monthlyRoles],representativeCount,monthCount:months,monthlyAssetCount,generationCount,estimatedCostUsd:Number((generationCount*unitCostUsd).toFixed(3)),unitCostUsd,quality,priceBasis:'gpt-image-1.5 · 1536x1024 · 2026-09-08 estimate'};
 }
 root.ACDLAIGenerationContext=Object.freeze({VERSION,ROLE_POLICY,DEFAULT_SAFE_MARGIN_MM,ESTIMATED_IMAGE_USD,definition,policyFor,pagesFor,build,plan});
})(typeof window==='undefined'?globalThis:window);
