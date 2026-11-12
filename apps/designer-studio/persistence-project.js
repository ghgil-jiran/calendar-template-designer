(function(root){
 const POLICY_SCHEMA='template-user-editing.v1';
 const ACTIONS=['move','resize','rotate','color','replaceImage','imageFit','delete','duplicate','layer','content'];
 const ADDITIONS=['image','text'];
 const USER_ADDED=Object.fromEntries(ACTIONS.map(key=>[key,true]));
 function isImage(item){return ['image','image-frame'].includes(item?.type)||item?.type==='semantic-object'&&(['school-logo','school-building','school-flower','school-tree','school-song'].includes(item.role)||Boolean(item.image))}
 function imageBinding(item){return item?.image?.binding||item?.binding||''}
 function managedImage(item){return imageBinding(item)==='school.profile.logo'||item?.role==='school-logo'||(item?.replacementPolicy||item?.image?.replacementPolicy)==='managed-school-asset'}
 function imageReplaceable(item){
  if(!isImage(item)||managedImage(item))return false;
  if(item.permissions?.replaceImage===false||item.userReplaceable===false||item.replaceable===false)return false;
  if(item.permissions?.replaceImage===true||item.userReplaceable===true||item.replaceable===true)return true;
  const binding=imageBinding(item);
  return (item.mediaPurpose||item.image?.mediaPurpose)==='user-replaceable-photo'||(item.replacementPolicy||item.image?.replacementPolicy)==='replace-source-preserve-frame'||/^monthlyImages\./.test(binding)||['assets.coverPhoto','assets.endPhoto'].includes(binding);
 }
 function normalizeElement(item){
  if(!item||typeof item!=='object')return item;
  const previous=item.permissions||{},replace=imageReplaceable(item),permissions={...previous};
  const protectedPlacement=item.userEditingSchemaVersion!==POLICY_SCHEMA&&(item.locked===true||item.selectable===false);
  for(const key of ACTIONS)permissions[key]=typeof previous[key]==='boolean'?previous[key]:false;
  if(protectedPlacement)for(const key of ['move','resize','rotate','color','delete','duplicate','layer'])permissions[key]=false;
  permissions.replaceImage=replace;
  permissions.imageFit=isImage(item)&&(typeof previous.imageFit==='boolean'?previous.imageFit:replace);
  if(isImage(item)&&typeof previous.content!=='boolean')permissions.content=replace;
  if(item.required===true)permissions.delete=false;
  item.permissions=permissions;
  if(isImage(item))item.userReplaceable=replace;
  item.userEditingSchemaVersion=POLICY_SCHEMA;
  for(const child of item.children||[])normalizeElement(child);
  return item;
 }
 function normalizeUserEditing(project){
  if(project?.format!=='acdl-project'||!project.template||!project.book||project.productionCorrection)return project;
  const old=project.template.userEditing||{},additions={};
  for(const key of ADDITIONS)additions[key]=old.additions?.[key]===true;
  project.template.userEditing={...old,schemaVersion:POLICY_SCHEMA,additions,userAddedPermissions:{...USER_ADDED},pageStructure:{add:false,delete:false,reorder:false,resize:false}};
  for(const page of project.book.pageInstances||[]){
   const prior=page.userEditing||{},overrides={};
   for(const key of ADDITIONS)if(typeof prior.additions?.[key]==='boolean')overrides[key]=prior.additions[key];
   page.userEditing={...prior,schemaVersion:POLICY_SCHEMA,additions:overrides};
  }
  for(const items of [...Object.values(project.template.masterElements||{}),...Object.values(project.book.elementsByPage||{})])for(const item of items||[])normalizeElement(item);
  return project;
 }
 // Presets are evaluated on export, leaving authored individual rights intact.
 const PRESETS=['individual','basic','minimal'];
 function preset(project){const value=project?.template?.userEditing?.preset;return PRESETS.includes(value)?value:'individual'}
 function bindings(item){return [item?.binding,item?.image?.binding,item?.bindingPattern,item?.targetBindingPattern,item?.sourceBinding].filter(value=>typeof value==='string')}
 const SCHOOL_BINDING=/^school\.(?:name|englishName|slogan|address|contacts|phone|fax|website|profile\.(?:logo|building|motto|song|tree|flower))(?:\.|$)/;
 function userPhoto(item){return isImage(item)&&!managedImage(item)&&((item.mediaPurpose||item.image?.mediaPurpose)==='user-replaceable-photo'||(item.replacementPolicy||item.image?.replacementPolicy)==='replace-source-preserve-frame'||bindings(item).some(value=>/^(?:monthlyImages\.|calendar\.monthlyImages\.)/.test(value)||['assets.coverPhoto','assets.endPhoto','school.profile.building'].includes(value)))}
 function userLinked(item){
  if(!item||['calendar','calendar-grid','year-calendar','mini-calendar','month-date-strip','monthly-schedule','planner-daily','monthly-quote'].includes(item.type))return false;
  if(bindings(item).some(value=>/^(?:calendar\.(?!monthlyImages\.)|monthlyQuotes\.)/.test(value))||item.metadata?.coverYearPart)return false;
  if(item.role==='graphic-package-background'||item.graphicSource?.pdfSource)return false;
  return bindings(item).some(value=>SCHOOL_BINDING.test(value))||userPhoto(item)||['school-name','school-english-name','school-slogan','school-address','school-contact','school-contacts','school-website','school-logo','school-building','school-motto','school-song','school-tree','school-flower'].includes(item.role);
 }
 function pageElements(project,page){const key=Object.hasOwn(project?.book?.elementsByPage||{},page?.id)?page.id:page?.sourcePageId;return [...(project?.template?.masterElements?.[page?.masterId]||[]),...(project?.book?.elementsByPage?.[key]||[])]}
 function pageContext(project,page){
  const role=page?.surfaceRole||page?.role||'',spec=project?.template?.settings?.aiDesignSpec||{},settings=spec.pageSettings||{};
  const key=role==='cover-front'?'cover':role==='cover-back'?'cover-inside':role;
  const composition=settings.roleCompositions?.[key]||{},divider=spec.dividerPages?.[page?.sourcePageId||page?.id]||{};
  const purpose=page?.contentPurpose||page?.semanticPageRole||divider.purpose||composition.typeId||'';
  return {role,purpose,mode:settings.monthBackMediaMode||settings.monthBackComposition?.mediaMode||'',elements:pageElements(project,page)};
 }
 function eligiblePage(project,page){
  const mode=preset(project);if(mode==='individual')return false;
  const context=pageContext(project,page),{role,purpose,elements}=context;
  if(['cover-front','back-cover-front','back-cover-back'].includes(role))return true;
  if(role==='monthly-back')return !['template-design','school-asset'].includes(context.mode)&&elements.some(userPhoto);
  return mode==='basic'&&(role==='cover-back'||/^(front|rear)-insert-(front|back)$/.test(role))&&purpose==='school-symbols';
 }
 function effectivePermissions(project,page,item){
  if(preset(project)==='individual')return {...item?.permissions};
  const rights=Object.fromEntries(ACTIONS.map(key=>[key,false]));
  if(!eligiblePage(project,page)||!userLinked(item))return rights;
  if(pageContext(project,page).role!=='monthly-back'){rights.move=true;rights.resize=true;}
  // Crop/fit is inside the fixed photo frame; no frame geometry is changed.
  if(userPhoto(item)){rights.replaceImage=true;rights.imageFit=true;}
  return rights;
 }
 function effectiveAdditions(project,page){if(preset(project)!=='individual'){const allowed=eligiblePage(project,page);return {image:allowed,text:allowed}}return Object.fromEntries(ADDITIONS.map(key=>[key,typeof page?.userEditing?.additions?.[key]==='boolean'?page.userEditing.additions[key]:project?.template?.userEditing?.additions?.[key]===true]))}
 root.ACDLUserEditingPolicy=Object.freeze({schemaVersion:POLICY_SCHEMA,actions:Object.freeze(ACTIONS),isImage,managedImage,normalizeElement,normalizeProject:normalizeUserEditing,preset,userLinked,userPhoto,eligiblePage,effectivePermissions,effectiveAdditions});
 function normalizedCopy(project){const copy=JSON.parse(JSON.stringify(project));root.ACDLPageObjectModel?.normalizeProject(copy);root.ACDLSharedCalendarAnnotations?.normalizeProject(copy);return normalizeUserEditing(copy)}
 function serialize(project){return JSON.stringify(normalizedCopy(project))}
 function deserialize(text){const project=JSON.parse(text);root.ACDLPageObjectModel?.normalizeProject(project);root.ACDLSharedCalendarAnnotations?.normalizeProject(project);return normalizeUserEditing(project)}
 function clone(project){return deserialize(serialize(project))}
 function hash(project){return JSON.stringify(normalizedCopy(project),(_key,value)=>typeof value==='string'&&value.startsWith('data:image/')&&value.length>512?`data-image:${value.length}:${value.slice(0,96)}:${value.slice(-96)}`:value)}
 function createRecoveryRecord(project,selectedPageId,options={}){
  const compact=typeof options.compact==="function"?options.compact:value=>value;
  const now=typeof options.now==="function"?options.now:()=>new Date();
  return {id:"latest",project:compact(project),selectedPageId:selectedPageId||null,updatedAt:now().toISOString()}
 }
 root.ACDLPersistenceProject=Object.freeze({serialize,deserialize,clone,hash,createRecoveryRecord})
})(typeof window!=="undefined"?window:globalThis);
