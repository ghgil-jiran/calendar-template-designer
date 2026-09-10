(function(root){
 const VERSION='0.1.0',SCHEMA_VERSION='ai-design-layout-application.v1';
 const PAGE_ROLE_MAP=Object.freeze({
  cover:['cover-front','cover-continuation'],annual:['cover-back','poster-annual'],
  divider:['school-symbols','front-insert-front','front-insert-back','rear-insert-front','rear-insert-back'],month:['monthly-front'],
  'month-back':['monthly-back'],'back-cover':['back-cover-front','back-cover-back']
 });
 const layouts={
  cover:{
   'center-photo':{image:[29,34,42,43],year:[28,8,44,18],identity:[8,80,84,14]},
   'left-photo':{image:[5,7,66,86],year:[75,8,21,20],identity:[75,34,21,56]},
   'right-photo':{image:[48,24,47,68],year:[8,7,38,17],identity:[8,70,36,22]},
   free:{image:null,year:[8,12,42,20],identity:[8,76,84,16]},
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
  divider:{
   'content-led':{title:[8,7,84,9],hero:[8,20,38,72],motto:[51,20,41,18],song:[51,42,41,50],symbols:[51,42,41,50]},
   'song-led-split':{title:[8,7,84,9],hero:[8,20,14,20],motto:[25,20,25,20],symbols:[8,45,42,47],song:[55,20,39,72]},
   'editorial-cards':{title:[8,7,84,9],hero:[6,20,22,25],motto:[31,20,20,25],song:[55,20,39,35],symbols:[6,60,88,32]},
   'heritage-document':{title:[8,7,84,9],hero:[39,20,22,18],motto:[39,20,22,18],song:[12,42,76,22],symbols:[12,68,76,24]},
   'open-gallery':{title:[8,7,84,9],hero:[8,22,50,68],motto:[63,22,29,18],song:[63,44,29,46],symbols:[63,44,29,46]},
   'individual-cards':{title:[8,6,84,9],hero:[6,19,12,16],motto:[6,19,42,20],symbols:[6,44,42,48],song:[53,19,41,73]},
   'split-panels':{title:[8,6,84,9],hero:[6,19,12,16],motto:[7,21,39,18],symbols:[7,44,39,45],song:[52,18,42,74]},
   'open-editorial':{title:[8,6,84,9],hero:[7,19,11,15],motto:[7,20,40,17],symbols:[7,43,40,47],song:[53,19,40,72]},
   'ruled-editorial':{title:[8,6,84,9],hero:[7,19,11,15],motto:[7,20,40,17],symbols:[7,43,40,47],song:[53,19,40,72]}
  },
  month:{
   'calendar-led':{calendar:[5,11,90,84],title:[5,3,90,7]},
   'large-month-number':{calendar:[5,18,90,77],title:[5,3,90,13]},
   'top-image-band':{calendar:[5,32,90,63],title:[5,21,90,9],image:[5,5,90,14]},
   'split-calendar-image':{calendar:[38,15,57,80],title:[38,5,57,8],image:[5,5,29,90]},
   'open-editorial':{calendar:[10,15,80,75],title:[10,5,80,8]}
  },
  'month-back':{
   'image-calendar':{image:[5,10,55,80],calendar:[64,10,31,55],support:[64,69,31,21]},
   'large-image':{image:[5,8,90,65],calendar:[5,77,44,18],support:[52,77,43,18]},
   'photo-collage':{image:[5,10,60,80],calendar:[69,10,26,38],support:[69,52,26,38]},
   planner:{image:[5,10,30,38],calendar:[5,52,30,38],support:[39,10,56,80]},
   'memo-calendar':{image:[5,10,38,80],calendar:[47,10,48,35],support:[47,49,48,41]},
   'illustration-led':{calendar:[64,10,31,50],support:[64,65,31,25]}
  },
  'back-cover':{
   'school-info':{image:[6,10,38,80],identity:[48,10,46,80]},
   'cover-continuation':{image:[6,10,58,80],identity:[68,20,26,60]},
   'photo-closing':{image:[6,10,88,64],identity:[18,78,64,15]},
   'minimal-brand':{image:[62,55,28,30],identity:[10,20,45,55]}
  }
 };
 const clone=value=>JSON.parse(JSON.stringify(value));
 const text=(id,role,binding,content)=>({id,type:'text',role,binding,x:10,y:10,width:30,height:7,zIndex:3,content,style:{fontSize:12,textAlign:'left',background:false,color:'#17202e'}});
 const semantic=(id,role,binding,name)=>({id,type:'semantic-object',role,binding,bindingEnabled:true,fallbackToSample:role==='school-building',x:10,y:10,width:30,height:24,zIndex:2,showTitle:['school-motto','school-song','school-tree','school-flower'].includes(role),showCaption:false,sampleContent:{name:'',description:'',image:''},emptyStateLabel:name,replaceable:true,style:{}});
 const imageFrame=(id,role,binding='calendar.monthlyImages.current')=>({id,type:'image-frame',role,x:10,y:10,width:30,height:24,zIndex:2,frameType:'rect',image:{src:'',fit:'cover',scale:1,offsetX:0,offsetY:0,flipX:false,flipY:false,binding},emptyBehavior:'placeholder',replaceable:true,style:{stroke:'#ffffff',strokeWidth:2,background:'#eef2f7'}});
 const eventList=(id,role='schedule-list')=>({id,type:'event-list',role,binding:'calendar.events',x:10,y:20,width:80,height:65,zIndex:2,title:'전체 학사일정',startMonth:1,monthCount:12,displayMode:'all',maxItems:24,showEndDate:true,columns:'auto',fontSize:8,minFontSize:6,autoShrink:true,style:{}});
 const DIVIDER_PRESETS=Object.freeze({
  'school-introduction':['school-building','school-logo','school-name','body'],'school-symbols':['school-logo','school-motto','school-song','school-tree','school-flower'],'annual-calendar':['annual-calendar'],'academic-schedule':['title','schedule-list'],'school-history':['title','history-list'],'education-vision':['title','vision','body'],'user-image':['image-slot'],'yearly-plan':['yearly-plan'],'yearly-checklist':['title','yearly-checklist'],free:[],blank:[]
 });
 function dividerDataAvailable(project,purpose){const school=project?.book?.school||{},profile=school.profile||{},resources=project?.template?.resources||{};if(purpose==='school-symbols')return ['logo','motto','song','tree','flower'].some(key=>{const value=profile[key];return Boolean(value&&(typeof value==='string'?value:value.image||value.name||value.description))});if(purpose==='school-introduction')return Boolean(school.name||profile.building?.image||school.description);if(purpose==='academic-schedule')return Boolean(project?.book?.events?.length);if(purpose==='school-history')return Boolean(school.history?.length||school.history);if(purpose==='education-vision')return Boolean(school.vision||school.educationVision);if(purpose==='user-image')return Boolean((school.customAssets||[]).length||(resources.sampleAssets||[]).some(item=>item.role==='school-custom-image'));return true}
 function resolvedDividerConfig(project,page){const saved=project.template?.settings?.aiDesignSpec?.dividerPages?.[page.id],initialPurpose=saved?.purpose||(page.side==='back'?'school-introduction':'school-symbols'),purpose=saved&&!dividerDataAvailable(project,initialPurpose)?(saved.fallbackPreset||'blank'):initialPurpose,fallbackUsed=purpose!==initialPurpose;return {...(saved||{}),purpose,requestedPurpose:initialPurpose,fallbackUsed,objects:fallbackUsed?(DIVIDER_PRESETS[purpose]||[]):(Array.isArray(saved?.objects)?saved.objects:(DIVIDER_PRESETS[purpose]||[]))}}
 function scaffold(role,page,project,typeId,spec){
  const year=String(project.settings?.year||new Date().getFullYear()),startMonth=Number(project.settings?.startMonth||3),config=resolvedDividerConfig(project,page),selected=new Set(config.objects),titleByPurpose={'school-symbols':'우리학교 상징','school-introduction':'학교 소개','annual-calendar':'연력','academic-schedule':'학사일정','school-history':'학교 연혁','education-vision':'교육 목표와 비전','user-image':'학교 사진','yearly-plan':'Yearly Plan','yearly-checklist':'Yearly Checklist',free:'',blank:''},dividerCatalog={title:text('ai.divider.title','symbols-title',null,titleByPurpose[config.purpose]||''),'school-name':text('ai.divider.school','school-name','school.name',''),'school-building':semantic('ai.divider.building','school-building','school.profile.building','학교 전경'),'school-logo':semantic('ai.divider.logo','school-logo','school.profile.logo','교표'),'school-motto':semantic('ai.divider.motto','school-motto','school.profile.motto','교훈'),'school-song':semantic('ai.divider.song','school-song','school.profile.song','교가'),'school-tree':semantic('ai.divider.tree','school-tree','school.profile.tree','교목'),'school-flower':semantic('ai.divider.flower','school-flower','school.profile.flower','교화'),'image-slot':{id:'ai.divider.image',type:'image-frame',role:'user-image-slot',x:10,y:20,width:38,height:60,zIndex:2,image:{src:'',fit:'cover',binding:'user.selectedImage'},emptyBehavior:'hide',style:{}},'annual-calendar':{id:'ai.divider.annual',type:'year-calendar',role:'year-calendar',x:10,y:20,width:80,height:65,zIndex:2,startMonth,monthCount:12,columns:4,rowsMode:'inherit',style:{}},'mini-calendar':{id:'ai.divider.mini',type:'mini-calendar',role:'mini-calendar',x:55,y:20,width:35,height:32,zIndex:2,calendarYear:Number(year),calendarMonth:startMonth,style:{}},'schedule-list':eventList('ai.divider.schedule'),'history-list':{id:'ai.divider.history',type:'memo',role:'school-history',binding:'school.history',x:10,y:20,width:80,height:65,zIndex:2,title:'학교 연혁',lineCount:12,style:{}},vision:text('ai.divider.vision','education-vision','school.educationVision',''),'yearly-plan':{id:'ai.divider.yearly-plan',type:'memo',role:'yearly-plan',x:7,y:14,width:86,height:78,zIndex:2,title:'Yearly Plan',memoLayout:'yearly-grid',yearlyColumns:4,monthLabelStyle:'number-en',linesPerMonth:4,style:{}},'yearly-checklist':{id:'ai.divider.yearly-checklist',type:'memo',role:'yearly-checklist',x:10,y:20,width:80,height:65,zIndex:2,title:'Yearly Checklist',lineCount:12,checklist:true,style:{}},body:text('ai.divider.body','school-introduction',null,'')},dividerItems=Object.entries(dividerCatalog).filter(([id])=>selected.has(id)).map(([,item])=>item),coverFrames=typeId==='photo-collage'?[imageFrame('ai.cover.photo-2','cover-photo-secondary-1','school.coverPhotos.1'),imageFrame('ai.cover.photo-3','cover-photo-secondary-2','school.coverPhotos.2')]:[],annualInfo=typeId==='split-info'?[eventList('ai.annual.schedule','annual-schedule-list')]:[],monthImage=['top-image-band','split-calendar-image'].includes(typeId)?[imageFrame('ai.month.image','monthly-image')]:[],items={
   cover:[semantic('ai.cover.building','school-building','school.profile.building','학교 전경'),...coverFrames,text('ai.cover.year','year','calendar.year',year),semantic('ai.cover.logo','school-logo','school.profile.logo','교표'),text('ai.cover.school','school-name','school.name',''),text('ai.cover.english','school-english-name','school.englishName',''),text('ai.cover.slogan','school-slogan','school.slogan',''),text('ai.cover.address','school-contact','school.address',''),text('ai.cover.contacts','school-contact','school.contacts','')],
   annual:[text('ai.annual.year','year','calendar.year',year),{id:'ai.annual.calendar',type:'year-calendar',role:'year-calendar',x:8,y:20,width:84,height:70,zIndex:2,startMonth,monthCount:12,columns:4,rowsMode:'inherit',showWeekdayHeader:true,style:{}},...annualInfo],
   divider:dividerItems,
   month:[...monthImage,semantic('ai.month.logo','school-logo','school.profile.logo','교표'),text('ai.month.motto','school-motto','school.profile.motto',''),text('ai.month.slogan','school-slogan','school.slogan',''),imageFrame('ai.month.extra-image','monthly-extra-image',''),text('ai.month.address','school-contact','school.address',''),text('ai.month.contacts','school-contact','school.contacts','')],
   'back-cover':page.side==='front'?[semantic('ai.back-front.building','school-building','school.profile.building','학교 전경'),text('ai.back-front.year','year','calendar.year',year)]:[semantic('ai.back.building','school-building','school.profile.building','학교 전경'),semantic('ai.back.logo','school-logo','school.profile.logo','교표'),text('ai.back.school','school-name','school.name',''),text('ai.back.english','school-english-name','school.englishName',''),text('ai.back.address','school-contact','school.address',''),text('ai.back.contacts','school-contact','school.contacts',''),text('ai.back.website','school-contact','school.website','')]
  }[role]||[],componentId=item=>item.binding==='calendar.year'?'year':item.type==='year-calendar'?'year-calendar':item.binding==='school.profile.building'?'school-building':item.binding==='school.profile.logo'?'school-logo':item.binding==='school.name'?'school-name':item.binding==='school.englishName'?'school-english-name':item.binding==='school.profile.motto'?'school-motto':item.binding==='school.slogan'?'school-slogan':item.binding==='school.address'?'school-address':item.binding==='school.contacts'?'school-contacts':item.binding==='school.website'?'school-website':item.role==='monthly-extra-image'?'image-frame':null,compositionKey=role==='back-cover'?(page.side==='front'?'back-cover-front':'back-cover-back'):role,composition=spec?.pageSettings?.roleCompositions?.[compositionKey];
  const filteredItems=composition&&role!=='divider'?items.filter(item=>{const id=componentId(item);return !id||(composition.components||[]).includes(id)}):items;
  const elements=project.book.elementsByPage[page.id]||=[];
  if(composition&&role!=='divider'){const allowed=new Set(composition.components||[]);for(let index=elements.length-1;index>=0;index-=1){const id=componentId(elements[index]);if(id&&!allowed.has(id)&&String(elements[index].id||'').startsWith('ai.'))elements.splice(index,1)}}
  if(role==='divider'){for(let index=elements.length-1;index>=0;index-=1){const id=String(elements[index].id||'').split(`.${page.id}`)[0],baseId=Object.values(dividerCatalog).find(item=>item.id===id)?.id;if(id.startsWith('ai.divider.')&&(!baseId||!dividerItems.some(item=>item.id===baseId)))elements.splice(index,1)}page.aiDividerComposition={requestedPurpose:config.requestedPurpose,resolvedPurpose:config.purpose,fallbackUsed:config.fallbackUsed,imageSource:config.imageSource||'none'}}
  const aliases={'school.slogan':['school-slogan','slogan'],'school.name':['school-name'],'school.englishName':['school-english-name'],'calendar.year':['year']};
  filteredItems.forEach(item=>{const existing=elements.find(candidate=>item.binding&&candidate.binding===item.binding||item.binding&&aliases[item.binding]?.includes(candidate.role)||item.role!=='school-contact'&&candidate.role===item.role);if(existing){if(item.binding&&!existing.binding)existing.binding=item.binding;return}elements.push(clone({...item,id:`${item.id}.${page.id}`}))});
  if(role==='cover'||role==='back-cover'){const seen=new Map();for(let index=elements.length-1;index>=0;index-=1){const item=elements[index],key=item.binding||(['school-logo','school-building','year','school-name'].includes(item.role)?item.role:null);if(!key)continue;const prior=seen.get(key);if(!prior){seen.set(key,item);continue}const remove=item.id?.startsWith('ai.')?index:prior.id?.startsWith('ai.')?elements.indexOf(prior):-1;if(remove>=0){elements.splice(remove,1);if(remove!==index)seen.set(key,item)}}}
  elements.forEach(item=>{if(item.binding==='calendar.year'){const value=composition||{};item.content=value.yearFormat==='number-calendar'?(value.yearLines==='two'?`${year}\nCALENDAR`:`${year} CALENDAR`):year;item.style=item.style||{};item.style.textAlign=value.yearAlign||'center';item.style.whiteSpace='pre-line';item.style.fontSize=Math.max(18,Number(item.style.fontSize)||0);item.yearFormat=value.yearFormat||'number';item.yearLines=value.yearLines||'one'}if(item.type==='year-calendar'){const value=composition||{};item.startMonth=startMonth;item.monthCount=12;item.columns=value.annualColumns||4;item.monthLabelStyle=value.annualMonthLabel||'number-ko';item.showWeekdayHeader=value.annualWeekdays!==false;item.style=item.style||{};item.style.gridLine=value.annualGrid!==false;item.showHolidayColor=true;item.showWeekendColor=true}});
 }
 function pageRole(page){return Object.entries(PAGE_ROLE_MAP).find(([,roles])=>roles.includes(page.role)||(page.semanticPageRole&&roles.includes(page.semanticPageRole)))?.[0]||null}
 function box(value){return {x:value[0],y:value[1],width:value[2],height:value[3]}}
 function distribute(items,zone){
  if(!items.length||!zone)return;
  const gap=items.length>4?.6:items.length>1?1.5:0,h=Math.max(1.5,(zone[3]-gap*(items.length-1))/items.length);
  items.forEach((item,index)=>{const y=zone[1]+index*(h+gap);Object.assign(item,{x:zone[0],y,width:zone[2],height:Math.max(1.5,Math.min(h,zone[1]+zone[3]-y)),zIndex:Math.max(2,Number(item.zIndex)||2)})})
 }
 function distributeGrid(items,zone){
  if(!items.length||!zone)return;
  const columns=Math.min(2,items.length),rows=Math.ceil(items.length/columns),gap=2;
  const width=(zone[2]-gap*(columns-1))/columns,height=(zone[3]-gap*(rows-1))/rows;
  items.forEach((item,index)=>Object.assign(item,{x:zone[0]+index%columns*(width+gap),y:zone[1]+Math.floor(index/columns)*(height+gap),width,height,zIndex:Math.max(2,Number(item.zIndex)||2)}))
 }
 function applySchoolSymbolLayout(elements,typeId){
  if(!['individual-cards','split-panels','open-editorial','ruled-editorial'].includes(typeId))return;
  const byRole=role=>elements.find(item=>item.role===role),title=byRole('symbols-title'),logo=byRole('school-logo'),motto=byRole('school-motto'),song=byRole('school-song'),symbols=['school-tree','school-flower'].map(byRole).filter(Boolean),hasSong=Boolean(song);
  if(title)Object.assign(title,{x:8,y:6,width:84,height:9});
  if(logo)Object.assign(logo,{x:7,y:6,width:10,height:10,imageFit:'contain',cropAllowed:false});
  const left=hasSong?[7,20,40,70]:[8,20,84,70],songZone=[53,18,40,74];
  if(motto)Object.assign(motto,{x:left[0],y:left[1],width:left[2],height:hasSong?18:20});
  const symbolZone=[left[0],left[1]+(motto?24:0),left[2],left[3]-(motto?24:0)];
  distributeGrid(symbols,symbolZone);
  if(song)Object.assign(song,{x:songZone[0],y:songZone[1],width:songZone[2],height:songZone[3],imageFit:'contain',cropAllowed:false,minimumReadableSizeMm:{width:90,height:95},contentPriority:'readability-first'});
  const presentation={
   'individual-cards':{containerStyle:'individual-card',sectionDivider:'none'},
   'split-panels':{containerStyle:'split-panel',sectionDivider:'panel-gap'},
   'open-editorial':{containerStyle:'none',sectionDivider:'none'},
   'ruled-editorial':{containerStyle:'none',sectionDivider:'title-rule'}
  }[typeId];
  [motto,song,...symbols].filter(Boolean).forEach(item=>{item.style=item.style||{};item.style.containerStyle=presentation.containerStyle;item.style.sectionDivider=presentation.sectionDivider;item.editablePresentation=true});
 }
 function classify(role,item){
  const token=`${item.role||''} ${item.type||''} ${item.id||''}`.toLowerCase();
  if(item.role==='ai-design-background'||token.includes('background-decoration'))return 'background';
  if(role==='annual')return token.includes('year-calendar')?'calendar':token.includes('year')||token.includes('title')?'title':'info';
  if(role==='month')return token.includes('image')||token.includes('photo')?'image':token.includes('month-title')||token.includes('month-number')?'title':'support';
  if(role==='month-back')return token.includes('image')||token.includes('photo')?'image':token.includes('calendar')||token.includes('date-strip')?'calendar':'support';
  if(role==='divider')return token.includes('symbols-title')||token.includes('insert-title')||token.includes('title')?'title':token.includes('song')?'song':token.includes('motto')?'motto':token.includes('tree')||token.includes('flower')?'symbols':token.includes('logo')||token.includes('building')||token.includes('image')?'hero':'symbols';
  if(role==='cover')return token.includes('image')||token.includes('photo')||token.includes('building')?'image':token.includes('year')?'year':'identity';
  if(role==='back-cover')return token.includes('image')||token.includes('photo')||token.includes('building')?'image':'identity';
  return 'support'
 }
 function applyPage(project,page,role,typeId,spec){
  const compositionKey=role==='back-cover'?(page.side==='front'?'back-cover-front':'back-cover-back'):role,composition=spec?.pageSettings?.roleCompositions?.[compositionKey],profile=layouts[role]?.[typeId];if(!profile)return null;
  scaffold(role,page,project,typeId,spec);
  const elements=project.book?.elementsByPage?.[page.id]||[],groups={};
  elements.forEach(item=>{const group=classify(role,item);if(group==='background')return;(groups[group]||=[]).push(item)});
 Object.entries(groups).forEach(([group,items])=>role==='divider'&&['symbols','secondary'].includes(group)?distributeGrid(items,profile[group]||profile.secondary):distribute(items,profile[group]||profile.primary||profile.support||profile.identity));
  if(role==='divider')applySchoolSymbolLayout(elements,typeId);
  if(role==='divider'&&elements.some(item=>item.type==='event-list'&&item.role==='schedule-list')){
   const title=elements.find(item=>classify(role,item)==='title'),schedule=elements.find(item=>item.type==='event-list'&&item.role==='schedule-list');
   if(title)Object.assign(title,{x:8,y:7,width:84,height:9});
   Object.assign(schedule,{x:8,y:20,width:84,height:70,fontSize:9,minFontSize:7,maxItems:60,contentPriority:'readability-first'});
  }
  if(role==='divider'&&elements.some(item=>item.role==='yearly-plan')){
   const title=elements.find(item=>classify(role,item)==='title'),plan=elements.find(item=>item.role==='yearly-plan');
   if(title)Object.assign(title,{x:7,y:4,width:86,height:7});
   Object.assign(plan,{x:5,y:title?13:5,width:90,height:title?82:90,memoLayout:'yearly-grid',contentPriority:'primary-full-page',minimumReadableSizeMm:{width:220,height:145}});
  }
  if(role==='cover'){
   const coverProfiles={
    'center-photo':{photoLow:{image:[25,39,50,37],year:[31,9,38,17],identity:[8,80,84,14]},photoWide:{image:[18,31,64,46],year:[32,8,36,16],identity:[8,81,84,13]},photoFeature:{image:[12,27,76,51],year:[34,7,32,15],identity:[8,82,84,12]}},
    'left-photo':{photoLow:{image:[5,12,58,76],year:[68,10,27,18],identity:[68,36,27,50]},photoWide:{image:[5,7,66,86],year:[75,8,20,18],identity:[75,34,20,56]},photoFeature:{image:[5,5,72,90],year:[80,8,16,18],identity:[80,34,16,56]}},
    'right-photo':{photoLow:{image:[53,28,42,62],year:[8,9,40,18],identity:[8,68,40,20]},photoWide:{image:[46,23,49,69],year:[8,8,34,18],identity:[8,67,34,22]},photoFeature:{image:[39,17,56,76],year:[7,8,28,18],identity:[7,65,28,25]}},
    free:{photoLow:{image:null,year:[29,18,42,22],identity:[8,78,84,15]},photoWide:{image:null,year:[8,16,42,22],identity:[8,76,84,16]},photoFeature:{image:null,year:[8,12,50,25],identity:[8,72,84,20]}}
   },layoutKey=composition?.layoutId==='photo-wide'?'photoWide':composition?.layoutId==='photo-feature'?'photoFeature':'photoLow',coverProfile=coverProfiles[typeId]?.[layoutKey]||profile;
   ['image','year'].forEach(group=>{if(coverProfile[group])distribute(groups[group]||[],coverProfile[group]);else (groups[group]||[]).filter(item=>String(item.id||'').startsWith('ai.')).forEach(item=>elements.splice(elements.indexOf(item),1))});
   const zone=coverProfile.identity||[15,77,70,18],identity=(groups.identity||[]).filter(item=>item.role!=='school-logo'),logo=(groups.identity||[]).find(item=>item.role==='school-logo');
   if(logo){Object.assign(logo,{x:zone[0],y:zone[1],width:Math.min(22,zone[2]*.28),height:Math.min(14,zone[3]),imageFit:'contain',cropAllowed:false});}
   const textX=logo?zone[0]+Math.min(25,zone[2]*.32):zone[0],textWidth=logo?Math.max(10,zone[2]-Math.min(25,zone[2]*.32)):zone[2],gap=.8,height=Math.max(2.4,(zone[3]-gap*Math.max(0,identity.length-1))/Math.max(1,identity.length));
   identity.forEach((item,index)=>{Object.assign(item,{x:textX,y:zone[1]+index*(height+gap),width:textWidth,height:Math.min(height,zone[1]+zone[3]-(zone[1]+index*(height+gap)))});item.style=item.style||{};item.style.fontSize=Math.min(Number(item.style.fontSize)||12,item.role==='school-name'?16:item.role==='school-english-name'?9:7)});
  }
  elements.filter(item=>item.role==='school-logo').forEach(item=>{item.imageFit='contain';item.cropAllowed=false});
  if(role==='divider')elements.filter(item=>classify(role,item)==='song').forEach(item=>{item.imageFit='contain';item.minimumReadableSizeMm={width:90,height:95};item.contentPriority='readability-first';item.cropAllowed=false});
  if(role==='month'){
   page.overrides=page.overrides||{};page.overrides.calendarRegion=box(profile.calendar);page.overrides.monthTitleRegion=box(profile.title);
   project.template.masters=project.template.masters||{};project.template.masters.calendar=project.template.masters.calendar||{};
   project.template.masters.calendar.calendarRegion=box(profile.calendar);
  }
  const protectedObjects=elements.filter(item=>classify(role,item)!=='background').map(item=>({id:item.id,role:item.role||item.type,x:item.x,y:item.y,width:item.width,height:item.height,importance:['year','school-logo','school-name','school-building','school-song'].includes(item.role)?'high':'normal',readability:item.type==='text'||item.type==='year-calendar'||item.role==='school-song'?'required':'visual',padding:item.role==='school-song'?3:2,containerStyle:item.style?.containerStyle||'none',sectionDivider:item.style?.sectionDivider||'none'}));
  page.aiDesignLayout={schemaVersion:SCHEMA_VERSION,version:VERSION,designRole:role,typeId,layoutId:composition?.layoutId||null,editable:true,protectedObjects};
  return {pageId:page.id,role,typeId,elementCount:elements.filter(item=>classify(role,item)!=='background').length}
 }
 function apply(project,spec){
  if(!project?.book?.pageInstances||!spec?.pageTypes)throw new Error('Project and design spec are required');
  const pages=[];project.book.elementsByPage=project.book.elementsByPage||{};
  project.book.pageInstances.forEach(page=>{const role=pageRole(page),compositionKey=role==='back-cover'?(page.side==='front'?'back-cover-front':'back-cover-back'):role,composition=spec.pageSettings?.roleCompositions?.[compositionKey],typeId=role==='divider'?spec.dividerPages?.[page.id]?.layoutId||spec.pageTypes[role]:role&&(composition?.typeId||spec.pageTypes[role]);if(role&&typeId){const result=applyPage(project,page,role,typeId,spec);if(result)pages.push(result)}});
  const application={schemaVersion:SCHEMA_VERSION,version:VERSION,specVersion:spec.version||null,catalogVersion:spec.catalog?.version||null,editable:true,pages};
  project.template.settings=project.template.settings||{};project.template.settings.aiDesignLayoutApplication=application;
  return application
 }
 root.ACDLDesignLayoutApplication=Object.freeze({VERSION,SCHEMA_VERSION,PAGE_ROLE_MAP,layouts,pageRole,classify,applyPage,apply});
})(typeof window!=='undefined'?window:globalThis);
