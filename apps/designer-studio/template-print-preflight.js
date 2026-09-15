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
 function analyze(project,{templateId=null,version=null}={}){
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
  const errors=problems.filter(item=>item.severity==='error').length,warnings=problems.filter(item=>item.severity==='warning').length;
  return Object.freeze({schemaVersion:'template-preflight-report.v1',generatedAt:new Date().toISOString(),identity:{templateId:text(template.id||templateId)||null,version:text(template.version||version)||null},status:errors?'blocked':warnings?'review':'passed',summary:{pages:pages.length,pageRoles:pageRoles.size,elements:[...elementTypes.values()].reduce((sum,count)=>sum+count,0),elementTypes:elementTypes.size,styles:styleKeys.size,bindings:bindings.size,assets:assets.size,errors,warnings,issueGroups:groupIssues(problems).length},inventory:{pageRoles:Object.fromEntries(pageRoles),elementTypes:Object.fromEntries(elementTypes),styleKeys:Object.fromEntries(styleKeys),bindings:[...bindings].sort(),capabilities:[...capabilities].sort()},issueGroups:groupIssues(problems),issues:problems});
 }
 globalThis.ACDLTemplatePrintPreflight=Object.freeze({analyze,catalog:Object.freeze({pageRoles:[...PAGE_ROLES],elementTypes:[...ELEMENT_TYPES],styleKeys:[...STYLE_KEYS]})});
})();
