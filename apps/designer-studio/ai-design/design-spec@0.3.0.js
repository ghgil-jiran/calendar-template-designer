(function(root){
 const VERSION='0.3.0',SCHEMA_VERSION='ai-design-spec.v2',RESOURCE_KEY='aiDesignSpec';
 const expressionDefaults=Object.freeze({monthFrontMode:'color-accent',monthBackMode:'auto-match'});
 const protectedContent=Object.freeze(['calendar-data','school-text','school-logo','school-photos','event-text']);
 const dividerObjectIds=Object.freeze(['school-name','school-building','school-logo','school-motto','school-song','school-tree','school-flower','image-slot','annual-calendar','mini-calendar','schedule-list','history-list','vision','yearly-plan','yearly-checklist','title','body']);
 const dividerImageSources=Object.freeze(['school-assets','user-assets','template-assets','none']);
 const monthBackComponentIds=Object.freeze(['image','current-calendar','previous-mini-calendar','next-mini-calendar','planner-monthly-goal','planner-checklist','planner-weekly','memo','month-date-strip']);
 const defaultMonthBackComponents=Object.freeze(['image','current-calendar','previous-mini-calendar','next-mini-calendar','planner-checklist','memo']);
 function clone(value){return JSON.parse(JSON.stringify(value))}
 function allowed(value,items,fallback){return items.includes(value)?value:fallback}
 function optionIds(catalog,key){return (catalog.expressionOptions?.[key]||[]).map(option=>option[0])}
 function defaultStyleSnapshot(catalog){return (catalog.styles||[]).map(style=>({id:style.id,name:style.name,description:style.description,colors:[...(style.colors||[])],guidance:Object.fromEntries(Object.entries(style.guidance||{}).map(([role,value])=>[role,{description:value?.[0]||'',keywords:value?.[1]||'',forbidden:''}]))}))}
 function normalizeSnapshots(input,catalog,preserveGuidance){const defaults=defaultStyleSnapshot(catalog),source=Array.isArray(input)?input:[];return defaults.map(base=>{const saved=source.find(item=>item?.id===base.id)||{},guidance={};Object.keys(catalog.roles||{}).forEach(role=>{const legacyRole=role==='divider'?'school-symbols':role,entry=preserveGuidance?(saved.guidance?.[role]||saved.guidance?.[legacyRole]||base.guidance[role]||{}):(base.guidance[role]||{});guidance[role]={description:String(entry.description||''),keywords:String(entry.keywords||''),forbidden:String(entry.forbidden||'')}});return {...base,name:String(saved.name||base.name),description:String(saved.description||base.description),colors:Array.isArray(saved.colors)&&saved.colors.length?saved.colors.slice(0,4):base.colors,guidance}})}
 function normalize(input={},catalog=root.ACDLDesignTypeCatalog){
  if(!catalog)throw new Error('Design type catalog is required');
  const styles=catalog.styles||[],roles=catalog.roles||{},sourceRoles={...(input.pageTypes||{})},expression=input.expression||{};
  if(!sourceRoles.divider&&sourceRoles['school-symbols'])sourceRoles.divider=sourceRoles['school-symbols'];
  const pageTypes=Object.fromEntries(Object.entries(roles).map(([role,meta])=>{const values=(meta.options||[]).map(option=>option[0]);return [role,allowed(sourceRoles[role],values,values[0]||'')]}));
  const promptCompositionVersion='simple-front-back.v1',preserveGuidance=input.promptCompositionVersion===promptCompositionVersion,styleSnapshots=normalizeSnapshots(input.styleSnapshots,catalog,preserveGuidance),styleIds=styleSnapshots.map(style=>style.id);
  const dividerPages=Object.fromEntries(Object.entries(input.dividerPages||{}).map(([pageId,entry])=>[pageId,{purpose:String(entry?.purpose||'free'),layoutId:allowed(entry?.layoutId,(roles.divider?.options||[]).map(option=>option[0]),pageTypes.divider),imageSource:allowed(entry?.imageSource,dividerImageSources,'none'),fallbackPreset:entry?.fallbackPreset==null?null:String(entry.fallbackPreset),objects:[...new Set((entry?.objects||[]).filter(id=>dividerObjectIds.includes(id)))]}]));
  const pageSettingsInput=input.pageSettings||{},monthBackSource=Array.isArray(pageSettingsInput.monthBackComponents)?pageSettingsInput.monthBackComponents:defaultMonthBackComponents;
  const pageSettings={monthBackComponents:[...new Set(monthBackSource.filter(id=>monthBackComponentIds.includes(id)))],monthBackCustomized:pageSettingsInput.monthBackCustomized===true,monthBackMediaMode:allowed(pageSettingsInput.monthBackMediaMode,['sample-replaceable','school-asset','template-design'],'sample-replaceable')};
  return {schemaVersion:SCHEMA_VERSION,version:VERSION,promptCompositionVersion,catalog:{id:catalog.id,version:catalog.version},scope:'desk-first',intent:'editable-start-for-designer',commonGuideline:String(preserveGuidance&&input.commonGuideline||catalog.commonGuideline?.text||''),styleId:allowed(input.styleId,styleIds,styles[0]?.id||''),styleSnapshots,pageTypes,dividerPages,pageSettings,expression:{monthFrontMode:allowed(expression.monthFrontMode,optionIds(catalog,'monthFrontMode'),expressionDefaults.monthFrontMode),monthBackMode:allowed(expression.monthBackMode,optionIds(catalog,'monthBackMode'),expressionDefaults.monthBackMode)},protectedContent:[...protectedContent]};
 }
 function read(project,catalog=root.ACDLDesignTypeCatalog){return normalize(project?.template?.settings?.[RESOURCE_KEY]||{},catalog)}
 function write(project,input,catalog=root.ACDLDesignTypeCatalog){if(!project?.template)throw new Error('Template project is required');project.template.settings=project.template.settings||{};project.template.settings[RESOURCE_KEY]=normalize(input,catalog);return project.template.settings[RESOURCE_KEY]}
 function selectedStyle(spec){return spec?.styleSnapshots?.find(style=>style.id===spec.styleId)||null}
 root.ACDLDesignSpec=Object.freeze({VERSION,SCHEMA_VERSION,RESOURCE_KEY,dividerObjectIds,dividerImageSources,monthBackComponentIds,defaultMonthBackComponents,clone,normalize,read,write,selectedStyle});
})(typeof window!=='undefined'?window:globalThis);
