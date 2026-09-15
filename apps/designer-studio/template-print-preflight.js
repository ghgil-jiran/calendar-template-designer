(()=>{
 const PAGE_ROLES=new Set(['cover','cover-front','cover-back','cover-inside','front-cover-inside','inside-cover','divider','divider-front','divider-back','front-divider','front-divider-front','front-divider-back','front-insert-front','front-insert-back','rear-divider','rear-divider-front','rear-divider-back','rear-insert-front','rear-insert-back','yearly-calendar','yearly-plan','school-symbol','school-symbols','school-introduction','academic-schedule','monthly-calendar','monthly-front','monthly-back','back-cover-inside','rear-cover-inside','back-cover','back-cover-front','back-cover-back','back-cover-information','back-contact','poster-annual','page']);
 const ELEMENT_TYPES=new Set(['text','year-text','image','image-frame','frame','shape','line','vector','graphic','calendar','calendar-grid','mini-calendar','mini-calendar-prev','mini-calendar-next','year-calendar','monthly-schedule','event-list','month-date-strip','monthly-quote','planner-goal','planner-weekly','planner-checklist','memo','semantic-object','contact-card','group']);
 const STYLE_KEYS=new Set(['fontFamily','fontSize','fontWeight','fontStyle','lineHeight','letterSpacing','textAlign','verticalAlign','whiteSpace','textDecoration','color','background','backgroundColor','border','borderColor','borderWidth','borderStyle','borderRadius','stroke','strokeColor','strokeWidth','lineColor','gridLine','primary','titleColor','dateColor','weekdayColor','sunday','sundayColor','saturday','saturdayColor','opacity','rotation','rotate','transform','boxShadow','shadow','shadowColor','shadowX','shadowY','shadowBlur','fit','objectFit','objectPosition','focalPoint','clipPath','mask','overflow','zIndex','legacyRole','containerStyle','sectionDivider','protectedClearArea','titleAlign','titleSize','descriptionSize','padding','paddingTop','paddingRight','paddingBottom','paddingLeft']);
 const issue=(severity,code,message,path='')=>({severity,code,message,path});
 const objectOf=value=>value&&typeof value==='object'&&!Array.isArray(value)?value:{};
 const listOf=value=>Array.isArray(value)?value:[];
 const text=value=>String(value??'').trim();
 const pageRole=page=>text(page?.semanticPageRole||page?.surfaceRole||page?.role||page?.pageRole||'page').toLowerCase();
 const elementType=element=>text(element?.type||element?.kind||'').toLowerCase();
 const elementsFor=(project,page)=>{
  const pageId=text(page?.id),masterId=text(page?.masterId);
  return [...listOf(project?.template?.masterElements?.[masterId]),...listOf(project?.book?.elementsByPage?.[pageId]),...listOf(page?.elements),...listOf(page?.objects)];
 };
 function styleEntries(element){const style=objectOf(element?.style);return Object.keys(style).map(key=>[key,style[key]])}
 function imageSource(element){const image=objectOf(element?.image),value=objectOf(element?.value);return text(element?.src||element?.assetRef||element?.assetId||image.src||image.assetRef||image.assetId||value.src||value.assetRef||value.assetId)}
 function isRequiredImage(element){const role=text(element?.role||element?.semanticRole||element?.style?.legacyRole).toLowerCase();return element?.required===true||element?.print?.required===true||role.includes('background')||role.includes('ai-')}
 function bleedValue(project,template){const print=objectOf(project?.print||template?.print||project?.settings?.print),resources=objectOf(template?.resources),exportSettings=objectOf(resources.exportSettings),bleed=print.bleed;return Number(typeof bleed==='object'?(bleed.top??bleed.left):bleed??print.bleedMm??exportSettings.bleed??project?.productType?.bleed??0)}
 function groupIssues(items){
  const groups=new Map();
  items.forEach(item=>{const detail=item.message.includes(':')?item.message.slice(item.message.lastIndexOf(':')+1).trim():item.message,key=`${item.severity}|${item.code}|${detail}`,group=groups.get(key)||{severity:item.severity,code:item.code,message:item.message,count:0,paths:[]};group.count+=1;if(item.path&&group.paths.length<5)group.paths.push(item.path);groups.set(key,group)});
  return [...groups.values()].sort((a,b)=>a.severity===b.severity?b.count-a.count:a.severity==='error'?-1:1);
 }
 function runtimeIssues(project,runtimeDocument){
  const problems=[],sourcePages=listOf(project?.book?.pageInstances||project?.pages),runtimePages=listOf(runtimeDocument?.pages);
  if(!runtimeDocument)return [issue('error','RUNTIME_DOCUMENT_MISSING','공통 Runtime 문서를 생성하지 못했습니다.','runtime.document')];
  if(runtimePages.length!==sourcePages.length)problems.push(issue('error','RUNTIME_SURFACE_COUNT_MISMATCH',`원본 ${sourcePages.length}면과 Runtime ${runtimePages.length}면이 다릅니다.`,'runtime.pages'));
  const runtimeById=new Map(runtimePages.map(page=>[text(page.sourcePageId||page.id),page]));
  sourcePages.forEach((page,pageIndex)=>{
   const sourceId=text(page.sourcePageId||page.id),resolved=runtimeById.get(sourceId);
   if(!resolved){problems.push(issue('error','RUNTIME_SURFACE_MISSING',`Runtime에서 페이지가 누락됐습니다: ${sourceId}`,`pages[${pageIndex}]`));return;}
   const sourceRole=text(page.surfaceRole||page.role||'page'),resolvedRole=text(resolved.surfaceRole||resolved.role||'page');
   if(sourceRole!==resolvedRole)problems.push(issue('error','RUNTIME_SURFACE_ROLE_MISMATCH',`페이지 역할이 달라졌습니다: ${sourceRole} → ${resolvedRole}`,`runtime.pages[${pageIndex}].role`));
   const ids=new Set(listOf(resolved.objects).map(object=>text(object.sourceObjectId||object.id)));
   listOf(project?.book?.elementsByPage?.[sourceId]).filter(element=>element?.visible!==false).forEach(element=>{const id=text(element?.id);if(id&&!ids.has(id))problems.push(issue('error','RUNTIME_OBJECT_MISSING',`Runtime에서 개체가 누락됐습니다: ${id}`,`pages[${pageIndex}].elements`));});
  });
  listOf(runtimeDocument.diagnostics).forEach((item,index)=>problems.push(issue(item.severity==='error'?'error':'warning',`RUNTIME_${text(item.code||'DIAGNOSTIC')}`,text(item.message||'Runtime 진단 항목입니다.'),item.pageId?`runtime.pages.${item.pageId}${item.objectId?`.objects.${item.objectId}`:''}`:`runtime.diagnostics[${index}]`)));
  return problems;
 }
 function renderParityIssues(renderParity){
  if(renderParity===undefined)return [];
  if(!renderParity?.generated)return [issue('error','RENDER_PARITY_NOT_GENERATED','화면·RGB PDF 비교 결과를 생성하지 못했습니다.','render.parity')];
  return listOf(renderParity.issues).map(item=>issue(item.severity==='warning'?'warning':'error',text(item.code||'RENDER_PARITY_FAILED'),text(item.message||'화면·RGB PDF 비교 항목입니다.'),text(item.path)));
 }
 function printOutputIssues(printOutput){
  if(printOutput===undefined)return [];
  if(!printOutput)return [issue('error','PRINT_PREFLIGHT_NOT_GENERATED','인쇄 출력 계약 검사 결과를 생성하지 못했습니다.','print.output')];
  return listOf(printOutput.issues).map(item=>issue(item.severity==='warning'?'warning':'error',text(item.code||'PRINT_PREFLIGHT_FAILED'),text(item.message||'인쇄 출력 검사 항목입니다.'),text(item.path)));
 }
 function analyze(project,{templateId=null,version=null,runtimeDocument=undefined,renderParity=undefined,printOutput=undefined}={}){
  const problems=[],capabilities=new Set(),pages=listOf(project?.book?.pageInstances||project?.pages),size=objectOf(project?.productType?.pageSize||project?.print?.pageSize),template=objectOf(project?.template);
  if(!project||typeof project!=='object')problems.push(issue('error','PROJECT_MISSING','템플릿 문서를 불러오지 못했습니다.'));
  if(!text(template.id||templateId))problems.push(issue('warning','TEMPLATE_ID_MISSING','Package ID가 아직 고정되지 않았습니다.','template.id'));
  if(!pages.length)problems.push(issue('error','SURFACE_PLAN_EMPTY','출력할 페이지가 없습니다.','book.pageInstances'));
  if(!(Number(size.width)>0&&Number(size.height)>0))problems.push(issue('error','PAGE_SIZE_INVALID','제작 페이지 크기가 올바르지 않습니다.','productType.pageSize'));
  else capabilities.add(`page-size.${Number(size.width)}x${Number(size.height)}.${text(size.unit||'mm')}`);
  const pageRoles=new Map(),elementTypes=new Map(),styleKeys=new Map(),bindings=new Set(),assets=new Set();
  pages.forEach((page,pageIndex)=>{
   const role=pageRole(page);pageRoles.set(role,(pageRoles.get(role)||0)+1);capabilities.add(`page.${role}`);
   if(!PAGE_ROLES.has(role))problems.push(issue('error','PAGE_ROLE_UNSUPPORTED',`지원 목록에 없는 페이지 역할입니다: ${role}`,`pages[${pageIndex}].role`));
   const elements=elementsFor(project,page);
   elements.forEach((element,elementIndex)=>{
    const type=elementType(element),path=`pages[${pageIndex}].elements[${elementIndex}]`;
    if(!type){problems.push(issue('error','ELEMENT_TYPE_MISSING','개체 종류가 없습니다.',path));return}
    elementTypes.set(type,(elementTypes.get(type)||0)+1);capabilities.add(`element.${type}`);
    if(!ELEMENT_TYPES.has(type))problems.push(issue('error','ELEMENT_TYPE_UNSUPPORTED',`공통 Runtime 지원 목록에 없는 개체입니다: ${type}`,`${path}.type`));
    const binding=text(element?.binding||element?.dataBinding||element?.bindingPath);if(binding){bindings.add(binding);capabilities.add(`binding.${binding.split('.')[0]}`)}
    styleEntries(element).forEach(([key])=>{styleKeys.set(key,(styleKeys.get(key)||0)+1);capabilities.add(`style.${key}`);if(!STYLE_KEYS.has(key))problems.push(issue('warning','STYLE_NOT_CATALOGED',`아직 공식 스타일 목록에 등록되지 않은 속성입니다: ${key}`,`${path}.style.${key}`))});
    if(['image','image-frame','frame'].includes(type)){const source=imageSource(element);if(source)assets.add(source);else if(isRequiredImage(element))problems.push(issue('error','REQUIRED_IMAGE_MISSING','필수 이미지 또는 AI 배경 자산이 없습니다.',path))}
   });
  });
  const expected=Number(project?.settings?.surfaceCount||project?.template?.surfacePlan?.surfaceCount||0);if(expected&&expected!==pages.length)problems.push(issue('error','SURFACE_COUNT_MISMATCH',`페이지 구성 ${expected}면과 실제 ${pages.length}면이 다릅니다.`,'book.pageInstances'));
  const bleed=bleedValue(project,template);
  if(!(bleed>0))problems.push(issue('warning','BLEED_NOT_DECLARED','도련 값이 Package 인쇄 정보에 명시되지 않았습니다.','print.bleed'));
  const contractIssueCount=problems.length;if(runtimeDocument!==undefined)problems.push(...runtimeIssues(project,runtimeDocument));const runtimeIssueCount=problems.length;if(renderParity!==undefined)problems.push(...renderParityIssues(renderParity));const renderIssueCount=problems.length;if(printOutput!==undefined)problems.push(...printOutputIssues(printOutput));
  const errors=problems.filter(item=>item.severity==='error').length,warnings=problems.filter(item=>item.severity==='warning').length;
  const stage=(name,items)=>({name,status:items.some(item=>item.severity==='error')?'blocked':items.some(item=>item.severity==='warning')?'review':'passed',errors:items.filter(item=>item.severity==='error').length,warnings:items.filter(item=>item.severity==='warning').length});
  return Object.freeze({schemaVersion:'template-preflight-report.v4',generatedAt:new Date().toISOString(),identity:{templateId:text(template.id||templateId)||null,version:text(template.version||version)||null},status:errors?'blocked':warnings?'review':'passed',summary:{pages:pages.length,pageRoles:pageRoles.size,elements:[...elementTypes.values()].reduce((sum,count)=>sum+count,0),elementTypes:elementTypes.size,styles:styleKeys.size,bindings:bindings.size,assets:assets.size,errors,warnings,issueGroups:groupIssues(problems).length},stages:[stage('Package 계약',problems.slice(0,contractIssueCount)),stage('Runtime 문서',runtimeDocument===undefined?[issue('warning','NOT_RUN','실행 전')]:problems.slice(contractIssueCount,runtimeIssueCount)),renderParity===undefined?{name:'화면·RGB PDF',status:'pending',errors:0,warnings:0}:stage('화면·RGB PDF',problems.slice(runtimeIssueCount,renderIssueCount)),printOutput===undefined?{name:'CMYK·PDF/X-4',status:'pending',errors:0,warnings:0}:stage('CMYK·PDF/X-4',problems.slice(renderIssueCount))],runtime:runtimeDocument===undefined?null:{generated:Boolean(runtimeDocument),pages:listOf(runtimeDocument?.pages).length,objects:listOf(runtimeDocument?.pages).reduce((sum,page)=>sum+listOf(page.objects).length,0),diagnostics:listOf(runtimeDocument?.diagnostics).length,version:text(runtimeDocument?.runtimeVersion)||null},renderParity:renderParity===undefined?null:{generated:Boolean(renderParity?.generated),pages:Number(renderParity?.pages)||0,screenObjects:Number(renderParity?.screenObjects)||0,rgbObjects:Number(renderParity?.rgbObjects)||0},printOutput:printOutput===undefined?null:{contractReady:Boolean(printOutput?.contractReady),artifactVerified:Boolean(printOutput?.artifactVerified),worker:text(printOutput?.worker)||null,profile:printOutput?.profile||null},inventory:{pageRoles:Object.fromEntries(pageRoles),elementTypes:Object.fromEntries(elementTypes),styleKeys:Object.fromEntries(styleKeys),bindings:[...bindings].sort(),capabilities:[...capabilities].sort()},issueGroups:groupIssues(problems),issues:problems});
 }
 globalThis.ACDLTemplatePrintPreflight=Object.freeze({analyze,catalog:Object.freeze({pageRoles:[...PAGE_ROLES],elementTypes:[...ELEMENT_TYPES],styleKeys:[...STYLE_KEYS]})});
})();
