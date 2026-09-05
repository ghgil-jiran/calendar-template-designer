(function(root){
 const VERSION='0.1.0',SCHEMA_VERSION='ai-design-spec.v1',RESOURCE_KEY='aiDesignSpec';
 const expressionDefaults=Object.freeze({decoration:'medium',photoMode:'mixed',seasonal:'medium',density:'medium'});
 const protectedContent=Object.freeze(['calendar-data','school-text','school-logo','school-photos','event-text']);
 function allowed(value,items,fallback){return items.includes(value)?value:fallback}
 function normalize(input={},catalog=root.ACDLDesignTypeCatalog){
  if(!catalog)throw new Error('Design type catalog is required');
  const styles=catalog.styles||[],roles=catalog.roles||{},sourceRoles=input.pageTypes||{};
  const pageTypes=Object.fromEntries(Object.entries(roles).map(([role,meta])=>{
   const values=(meta.options||[]).map(option=>option[0]);
   return [role,allowed(sourceRoles[role],values,values[0]||'')]
  }));
  const expression=input.expression||{};
  return {
   schemaVersion:SCHEMA_VERSION,
   version:VERSION,
   catalog:{id:catalog.id,version:catalog.version},
   styleId:allowed(input.styleId,styles.map(style=>style.id),styles[0]?.id||''),
   pageTypes,
   expression:{
    decoration:allowed(expression.decoration,['low','medium','high'],expressionDefaults.decoration),
    photoMode:allowed(expression.photoMode,['mixed','photo','illustration'],expressionDefaults.photoMode),
    seasonal:allowed(expression.seasonal,['low','medium','high'],expressionDefaults.seasonal),
    density:allowed(expression.density,['low','medium','high'],expressionDefaults.density)
   },
   protectedContent:[...protectedContent]
  }
 }
 function read(project,catalog=root.ACDLDesignTypeCatalog){return normalize(project?.template?.settings?.[RESOURCE_KEY]||{},catalog)}
 function write(project,input,catalog=root.ACDLDesignTypeCatalog){
  if(!project?.template)throw new Error('Template project is required');
  project.template.settings=project.template.settings||{};
  project.template.settings[RESOURCE_KEY]=normalize(input,catalog);
  return project.template.settings[RESOURCE_KEY]
 }
 root.ACDLDesignSpec=Object.freeze({VERSION,SCHEMA_VERSION,RESOURCE_KEY,normalize,read,write});
})(typeof window!=='undefined'?window:globalThis);
