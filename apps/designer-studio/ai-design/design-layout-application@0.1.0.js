(function(root){
 const VERSION='0.1.0',SCHEMA_VERSION='ai-design-layout-application.v1';
 const PAGE_ROLE_MAP=Object.freeze({
  cover:['cover-front'],annual:['cover-back','poster-annual'],
  'school-symbols':['school-symbols','front-insert-front'],month:['monthly-front'],
  'month-back':['monthly-back'],'back-cover':['back-cover-front','back-cover-back']
 });
 const layouts={
  cover:{
   'large-photo':{image:[15,10,70,50],year:[35,63,30,12],identity:[15,77,70,18]},
   'photo-collage':{image:[8,10,55,58],year:[67,18,25,15],identity:[67,40,25,45]},
   typography:{image:[58,46,34,32],year:[10,16,70,27],identity:[10,63,42,28]},
   illustration:{image:[48,10,44,68],year:[10,20,34,20],identity:[10,55,34,36]},
   split:{image:[8,10,56,74],year:[68,18,24,16],identity:[68,49,24,42]}
  },
  annual:{
   'balanced-4x3':{title:[34,4,32,13],calendar:[7,20,86,72],info:[7,93,86,4]},
   'open-grid':{title:[38,6,24,11],calendar:[10,23,80,64],info:[10,90,80,5]},
   'header-band':{title:[6,5,88,13],calendar:[7,23,86,67],info:[7,92,86,4]},
   'split-info':{title:[7,7,58,12],calendar:[7,23,62,67],info:[73,23,20,67]}
  },
  'school-symbols':{
   'song-led-split':{title:[8,7,84,9],motto:[8,20,42,20],symbols:[8,45,42,47],song:[55,20,39,72],hero:[8,20,42,20]},
   'editorial-cards':{title:[8,7,84,9],hero:[6,20,22,25],motto:[6,20,22,25],song:[55,20,39,35],symbols:[6,60,88,32]},
   'section-panels':{title:[8,7,84,9],hero:[6,20,20,72],motto:[6,20,20,25],song:[30,20,64,34],symbols:[30,59,64,33]},
   'heritage-document':{title:[8,7,84,9],hero:[39,20,22,18],motto:[39,20,22,18],song:[12,42,76,22],symbols:[12,68,76,24]},
   'symbol-photo':{title:[8,7,84,9],hero:[6,20,46,72],motto:[57,20,37,15],song:[57,40,37,52],symbols:[6,20,46,72]}
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
 function distributeGrid(items,zone){
  if(!items.length||!zone)return;
  const columns=Math.min(2,items.length),rows=Math.ceil(items.length/columns),gap=2;
  const width=(zone[2]-gap*(columns-1))/columns,height=(zone[3]-gap*(rows-1))/rows;
  items.forEach((item,index)=>Object.assign(item,{x:zone[0]+index%columns*(width+gap),y:zone[1]+Math.floor(index/columns)*(height+gap),width,height,zIndex:Math.max(2,Number(item.zIndex)||2)}))
 }
 function classify(role,item){
  const token=`${item.role||''} ${item.type||''} ${item.id||''}`.toLowerCase();
  if(item.role==='ai-design-background'||token.includes('background-decoration'))return 'background';
  if(role==='annual')return token.includes('year-calendar')?'calendar':token.includes('year')||token.includes('title')?'title':'info';
  if(role==='month')return token.includes('image')||token.includes('photo')?'image':token.includes('month-title')||token.includes('month-number')?'title':'support';
  if(role==='month-back')return token.includes('image')||token.includes('photo')?'image':token.includes('calendar')||token.includes('date-strip')?'calendar':'support';
  if(role==='school-symbols')return token.includes('symbols-title')||token.includes('insert-title')?'title':token.includes('song')?'song':token.includes('motto')?'motto':token.includes('tree')||token.includes('flower')?'symbols':token.includes('logo')||token.includes('building')?'hero':'symbols';
  if(role==='cover')return token.includes('image')||token.includes('photo')||token.includes('building')?'image':token.includes('year')?'year':'identity';
  if(role==='back-cover')return token.includes('image')||token.includes('photo')||token.includes('building')?'image':'identity';
  return 'support'
 }
 function applyPage(project,page,role,typeId){
  const profile=layouts[role]?.[typeId];if(!profile)return null;
  const elements=project.book?.elementsByPage?.[page.id]||[],groups={};
  elements.forEach(item=>{const group=classify(role,item);if(group==='background')return;(groups[group]||=[]).push(item)});
  Object.entries(groups).forEach(([group,items])=>role==='school-symbols'&&['symbols','secondary'].includes(group)?distributeGrid(items,profile[group]||profile.secondary):distribute(items,profile[group]||profile.primary||profile.support||profile.identity));
  if(role==='school-symbols')elements.filter(item=>classify(role,item)==='song').forEach(item=>{item.imageFit='contain';item.minimumReadableSizeMm={width:90,height:95};item.contentPriority='readability-first';item.cropAllowed=false});
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
