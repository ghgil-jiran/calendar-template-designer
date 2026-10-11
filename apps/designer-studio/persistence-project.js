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
 function effectiveAdditions(project,page){return Object.fromEntries(ADDITIONS.map(key=>[key,typeof page?.userEditing?.additions?.[key]==='boolean'?page.userEditing.additions[key]:project?.template?.userEditing?.additions?.[key]===true]))}
 root.ACDLUserEditingPolicy=Object.freeze({schemaVersion:POLICY_SCHEMA,actions:Object.freeze(ACTIONS),isImage,managedImage,normalizeElement,normalizeProject:normalizeUserEditing,effectiveAdditions});
 function serialize(project){return JSON.stringify(normalizeUserEditing(project))}
 function deserialize(text){return normalizeUserEditing(JSON.parse(text))}
 function clone(project){return deserialize(serialize(project))}
 function hash(project){return JSON.stringify(normalizeUserEditing(project),(_key,value)=>typeof value==='string'&&value.startsWith('data:image/')&&value.length>512?`data-image:${value.length}:${value.slice(0,96)}:${value.slice(-96)}`:value)}
 function createRecoveryRecord(project,selectedPageId,options={}){
  const compact=typeof options.compact==="function"?options.compact:value=>value;
  const now=typeof options.now==="function"?options.now:()=>new Date();
  return {id:"latest",project:compact(project),selectedPageId:selectedPageId||null,updatedAt:now().toISOString()}
 }
 root.ACDLPersistenceProject=Object.freeze({serialize,deserialize,clone,hash,createRecoveryRecord})
})(typeof window!=="undefined"?window:globalThis);
