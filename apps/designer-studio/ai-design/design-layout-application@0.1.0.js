(function(root){
 const VERSION='0.1.0',SCHEMA_VERSION='ai-design-layout-application.v1';
 const PAGE_ROLE_MAP=Object.freeze({
  cover:['cover-front'],annual:['cover-back','poster-annual'],
  'school-symbols':['school-symbols','front-insert-front'],month:['monthly-front'],
  'month-back':['monthly-back'],'back-cover':['back-cover-front','back-cover-back']
 });
 const layouts={
  cover:{
   'large-photo':{image:[15,12,70,55],year:[35,70,30,12],identity:[15,84,70,9]},
   'photo-collage':{image:[8,12,55,62],year:[67,20,25,15],identity:[67,42,25,27]},
   typography:{image:[58,48,34,34],year:[10,18,70,30],identity:[10,70,42,18]},
   illustration:{image:[48,12,44,72],year:[10,22,34,22],identity:[10,60,34,22]},
   split:{image:[8,12,56,76],year:[68,20,24,18],identity:[68,55,24,28]}
  },
  annual:{
   'balanced-4x3':{title:[34,4,32,13],calendar:[7,20,86,72],info:[7,93,86,4]},
   'open-grid':{title:[38,6,24,11],calendar:[10,23,80,64],info:[10,90,80,5]},
   'header-band':{title:[6,5,88,13],calendar:[7,23,86,67],info:[7,92,86,4]},
   'split-info':{title:[7,7,58,12],calendar:[7,23,62,67],info:[73,23,20,67]}
  },
  'school-symbols':{
   'editorial-cards':{hero:[6,10,27,28],primary:[36,10,58,28],secondary:[6,43,88,48]},
   'section-panels':{hero:[6,10,20,80],primary:[29,10,65,35],secondary:[29,49,65,41]},
   'heritage-document':{hero:[39,8,22,20],primary:[12,32,76,25],secondary:[12,61,76,30]},
   'symbol-photo':{hero:[6,10,50,80],primary:[60,10,34,30],secondary:[60,44,34,46]}
  },
  month:{
   'calendar-led':{calendar:[5,16,90,79],title:[5,5,90,10]},
   'large-month-number':{calendar:[5,24,90,71],title:[5,4,90,18]},
   'top-image-band':{calendar:[5,32,90,63],title:[5,21,90,9],image:[5,5,90,14]},
   'split-calendar-image':{calendar:[38,15,57,80],title:[38,5,57,8],image:[5,5,29,90]},
   'open-editorial':{calendar:[10,22,80,68],title:[10,8,80,10]}
  },
  'month-back':{
   'image-calendar':{image:[5,10,55,80],calendar:[64,10,31,55],support:[64,69,31,21]},
   'large-image':{image:[5,8,90,65],calendar:[5,77,44,18],support:[52,77,43,18]},
   'photo-collage':{image:[5,10,60,80],calendar:[69,10,26,38],support:[69,52,26,38]},
   planner:{image:[5,10,30,38],calendar:[5,52,30,38],support:[39,10,56,80]},
   'memo-calendar':{image:[5,10,38,80],calendar:[47,10,48,35],support:[47,49,48,41]}
  },
  'back-cover':{
   'school-info':{image:[6,10,38,80],identity:[48,10,46,80]},
   'cover-continuation':{image:[6,10,58,80],identity:[68,20,26,60]},
   'photo-closing':{image:[6,10,88,64],identity:[18,78,64,15]},
   'minimal-brand':{image:[62,55,28,30],identity:[10,20,45,55]}
  }
 };
 function pageRole(page){return Object.entries(PAGE_ROLE_MAP).find(([,roles])=>roles.includes(page.role)||(page.semanticPageRole&&roles.includes(page.semanticPageRole)))?.[0]||null}
 function box(value){return {x:value[0],y:value[1],width:value[2],height:value[3]}}
 function distribute(items,zone){
  if(!items.length||!zone)return;
  const gap=items.length>1?1.5:0,h=Math.max(3,(zone[3]-gap*(items.length-1))/items.length);
  items.forEach((item,index)=>Object.assign(item,{x:zone[0],y:zone[1]+index*(h+gap),width:zone[2],height:h,zIndex:Math.max(2,Number(item.zIndex)||2)}))
 }
 function classify(role,item){
  const token=`${item.role||''} ${item.type||''} ${item.id||''}`.toLowerCase();
  if(item.role==='ai-design-background'||token.includes('background-decoration'))return 'background';
  if(role==='annual')return token.includes('year-calendar')?'calendar':token.includes('year')||token.includes('title')?'title':'info';
  if(role==='month')return token.includes('image')||token.includes('photo')?'image':token.includes('month-title')||token.includes('month-number')?'title':'support';
  if(role==='month-back')return token.includes('image')||token.includes('photo')?'image':token.includes('calendar')||token.includes('date-strip')?'calendar':'support';
  if(role==='school-symbols')return token.includes('logo')||token.includes('building')?'hero':token.includes('motto')||token.includes('song')?'primary':'secondary';
  if(role==='cover')return token.includes('image')||token.includes('photo')||token.includes('building')?'image':token.includes('year')?'year':'identity';
  if(role==='back-cover')return token.includes('image')||token.includes('photo')||token.includes('building')?'image':'identity';
  return 'support'
 }
 function applyPage(project,page,role,typeId){
  const profile=layouts[role]?.[typeId];if(!profile)return null;
  const elements=project.book?.elementsByPage?.[page.id]||[],groups={};
  elements.forEach(item=>{const group=classify(role,item);if(group==='background')return;(groups[group]||=[]).push(item)});
  Object.entries(groups).forEach(([group,items])=>distribute(items,profile[group]||profile.support||profile.identity));
  if(role==='month'){
   page.overrides=page.overrides||{};page.overrides.calendarRegion=box(profile.calendar);page.overrides.monthTitleRegion=box(profile.title);
   project.template.masters=project.template.masters||{};project.template.masters.calendar=project.template.masters.calendar||{};
   project.template.masters.calendar.calendarRegion=box(profile.calendar);
  }
  page.aiDesignLayout={schemaVersion:SCHEMA_VERSION,version:VERSION,designRole:role,typeId,editable:true};
  return {pageId:page.id,role,typeId,elementCount:elements.filter(item=>classify(role,item)!=='background').length}
 }
 function apply(project,spec){
  if(!project?.book?.pageInstances||!spec?.pageTypes)throw new Error('Project and design spec are required');
  const pages=[];project.book.elementsByPage=project.book.elementsByPage||{};
  project.book.pageInstances.forEach(page=>{const role=pageRole(page),typeId=role&&spec.pageTypes[role];if(role&&typeId){const result=applyPage(project,page,role,typeId);if(result)pages.push(result)}});
  const application={schemaVersion:SCHEMA_VERSION,version:VERSION,specVersion:spec.version||null,catalogVersion:spec.catalog?.version||null,editable:true,pages};
  project.template.settings=project.template.settings||{};project.template.settings.aiDesignLayoutApplication=application;
  return application
 }
 root.ACDLDesignLayoutApplication=Object.freeze({VERSION,SCHEMA_VERSION,PAGE_ROLE_MAP,layouts,pageRole,classify,applyPage,apply});
})(typeof window!=='undefined'?window:globalThis);
