(function(root){
 const VERSION='0.1.0',SCHEMA_VERSION='ai-design-layout-application.v1';
 const PAGE_ROLE_MAP=Object.freeze({
  cover:['cover-front','cover-continuation'],annual:['cover-back','poster-annual','yearly-calendar'],
  divider:['divider','school-symbols','front-insert-front','front-insert-back','rear-insert-front','rear-insert-back'],month:['monthly-front'],
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
   'open-grid':{title:[34,5,32,11],calendar:[7,20,86,73],info:[7,5,12,11]},
   'individual-month-boxes':{title:[34,5,32,11],calendar:[7,20,86,73],info:[7,5,12,11]},
   'vertical-three-month-groups':{title:[34,5,32,11],calendar:[6,20,88,73],info:[6,5,12,11]},
   'horizontal-four-month-groups':{title:[34,5,32,11],calendar:[7,20,86,73],info:[7,5,12,11]}
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
   'ruled-editorial':{title:[8,6,84,9],hero:[7,19,11,15],motto:[7,20,40,17],symbols:[7,43,40,47],song:[53,19,40,72]},
   'school-intro-center-image':{title:[7,6,86,9],hero:[16,20,68,65],motto:[40,87,22,8]},
   'school-intro-left-image':{title:[7,6,86,9],hero:[7,20,54,70],motto:[66,48,27,24]},
   'school-intro-background-image':{title:[10,9,80,10],hero:[5,5,90,88],motto:[72,49,18,21]},
   'yearly-open-grid':{symbols:[5,5,90,90]},
   'yearly-month-cards':{symbols:[5,5,90,90]},
   'yearly-vertical-groups':{symbols:[5,5,90,90]},
   'yearly-horizontal-groups':{symbols:[5,5,90,90]},
   'schedule-open-grid':{title:[7,5,86,8],symbols:[5,15,90,80]},
   'schedule-month-cards':{title:[7,5,86,8],symbols:[5,15,90,80]},
   'schedule-vertical-groups':{title:[7,5,86,8],symbols:[5,15,90,80]},
   'schedule-horizontal-groups':{title:[7,5,86,8],symbols:[5,15,90,80]}
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
   'school-information':{identity:[25,35,50,48]},
   'year-school-information':{year:[29,18,42,18],identity:[25,48,50,38]},
   'school-photo-information':{year:[32,7,36,13],image:[24,24,52,42],identity:[20,72,60,20]}
  }
 };
 const clone=value=>JSON.parse(JSON.stringify(value));
 const text=(id,role,binding,content)=>({id,type:'text',role,binding,x:10,y:10,width:30,height:7,zIndex:3,content,style:{fontSize:12,textAlign:'left',background:false,color:'#17202e'}});
 const semantic=(id,role,binding,name)=>({id,type:'semantic-object',role,binding,bindingEnabled:true,fallbackToSample:role==='school-building',x:10,y:10,width:30,height:24,zIndex:2,showTitle:['school-motto','school-song','school-tree','school-flower'].includes(role),showCaption:false,sampleContent:{name:'',description:'',image:''},emptyStateLabel:name,replaceable:true,style:{}});
 const imageFrame=(id,role,binding='calendar.monthlyImages.current')=>({id,type:'image-frame',role,x:10,y:10,width:30,height:24,zIndex:2,frameType:'rect',image:{src:'',fit:'cover',scale:1,offsetX:0,offsetY:0,flipX:false,flipY:false,binding},emptyBehavior:'placeholder',replaceable:true,style:{stroke:'#ffffff',strokeWidth:2,background:'#eef2f7'}});
 const eventList=(id,role='schedule-list')=>({id,type:'event-list',role,binding:'calendar.events',x:10,y:20,width:80,height:65,zIndex:2,title:'전체 학사일정',startMonth:1,monthCount:12,displayMode:'year-by-month',scheduleLayoutType:'schedule-open-grid',showTitle:false,maxItems:120,showEndDate:true,columns:4,fontSize:8,minFontSize:6,autoShrink:true,emptyStatePresentation:'blank',style:{}});
 const DIVIDER_PRESETS=Object.freeze({
  'school-introduction':['title','school-building'],'school-symbols':['school-logo','school-motto','school-song','school-tree','school-flower'],'annual-calendar':['annual-calendar'],'academic-schedule':['title','schedule-list'],'user-image':['image-slot'],'yearly-plan':['yearly-plan'],free:[],blank:[]
 });
 function dividerDataAvailable(project,purpose){const school=project?.book?.school||{},profile=school.profile||{},resources=project?.template?.resources||{};if(purpose==='school-symbols')return ['logo','motto','song','tree','flower'].some(key=>{const value=profile[key];return Boolean(value&&(typeof value==='string'?value:value.image||value.name||value.description))});if(purpose==='school-introduction')return Boolean(profile.building?.image);if(purpose==='academic-schedule')return Boolean(project?.book?.events?.length);if(purpose==='user-image')return Boolean((school.customAssets||[]).length||(resources.sampleAssets||[]).some(item=>item.role==='school-custom-image'));return true}
 function resolvedDividerConfig(project,page){const saved=project.template?.settings?.aiDesignSpec?.dividerPages?.[page.id],purpose=saved?.purpose||(page.side==='back'?'school-introduction':'school-symbols'),dataAvailable=dividerDataAvailable(project,purpose);return {...(saved||{}),purpose,requestedPurpose:purpose,fallbackUsed:false,dataAvailable,objects:Array.isArray(saved?.objects)?saved.objects:(DIVIDER_PRESETS[purpose]||[])}}
 function scaffold(role,page,project,typeId,spec){
  const year=String(project.settings?.year||new Date().getFullYear()),startMonth=Number(project.settings?.startMonth||3),config=resolvedDividerConfig(project,page),selected=new Set(config.objects),titleByPurpose={'school-symbols':'우리학교 상징','school-introduction':'학교 소개','annual-calendar':'연력','academic-schedule':'학사일정','user-image':'학교 사진','yearly-plan':'Yearly Plan',free:'',blank:''},dividerCatalog={title:text('ai.divider.title','symbols-title',null,titleByPurpose[config.purpose]||''),'school-name':text('ai.divider.school','school-name','school.name',''),'school-building':semantic('ai.divider.building','school-building','school.profile.building','학교 전경'),'school-logo':semantic('ai.divider.logo','school-logo','school.profile.logo','교표'),'school-motto':semantic('ai.divider.motto','school-motto','school.profile.motto','교훈'),'school-song':semantic('ai.divider.song','school-song','school.profile.song','교가'),'school-tree':semantic('ai.divider.tree','school-tree','school.profile.tree','교목'),'school-flower':semantic('ai.divider.flower','school-flower','school.profile.flower','교화'),'image-slot':{id:'ai.divider.image',type:'image-frame',role:'user-image-slot',x:10,y:20,width:38,height:60,zIndex:2,image:{src:'',fit:'cover',binding:'user.selectedImage'},emptyBehavior:'hide',style:{}},'annual-calendar':{id:'ai.divider.annual',type:'year-calendar',role:'year-calendar',x:10,y:20,width:80,height:65,zIndex:2,startMonth,monthCount:12,columns:4,rowsMode:'inherit',style:{}},'mini-calendar':{id:'ai.divider.mini',type:'mini-calendar',role:'mini-calendar',x:55,y:20,width:35,height:32,zIndex:2,calendarYear:Number(year),calendarMonth:startMonth,style:{}},'schedule-list':eventList('ai.divider.schedule'),'yearly-plan':{id:'ai.divider.yearly-plan',type:'memo',role:'yearly-plan',x:5,y:5,width:90,height:90,zIndex:2,title:'Yearly Plan',memoLayout:'yearly-grid',yearlyColumns:4,startMonth,baseYear:Number(year),monthLabelStyle:'number-en',linesPerMonth:4,style:{}}},dividerItems=Object.entries(dividerCatalog).filter(([id])=>selected.has(id)).map(([,item])=>item),coverFrames=typeId==='photo-collage'?[imageFrame('ai.cover.photo-2','cover-photo-secondary-1','school.coverPhotos.1'),imageFrame('ai.cover.photo-3','cover-photo-secondary-2','school.coverPhotos.2')]:[],monthImage=['top-image-band','split-calendar-image'].includes(typeId)?[imageFrame('ai.month.image','monthly-image')]:[],items={
   cover:[semantic('ai.cover.building','school-building','school.profile.building','학교 전경'),...coverFrames,text('ai.cover.year','year','calendar.year',year),semantic('ai.cover.logo','school-logo','school.profile.logo','교표'),text('ai.cover.school','school-name','school.name',''),text('ai.cover.english','school-english-name','school.englishName',''),text('ai.cover.slogan','school-slogan','school.slogan',''),text('ai.cover.address','school-contact','school.address',''),text('ai.cover.contacts','school-contact','school.contacts','')],
   annual:[text('ai.annual.year','year','calendar.year',year),{id:'ai.annual.calendar',type:'year-calendar',role:'year-calendar',x:8,y:20,width:84,height:70,zIndex:2,startMonth,monthCount:12,columns:4,rowsMode:'inherit',showWeekdayHeader:true,layoutType:typeId,showTransitionYear:true,style:{}},semantic('ai.annual.logo','school-logo','school.profile.logo','교표')],
   divider:dividerItems,
   month:[...monthImage,semantic('ai.month.logo','school-logo','school.profile.logo','교표'),text('ai.month.motto','school-motto','school.profile.motto',''),text('ai.month.slogan','school-slogan','school.slogan',''),imageFrame('ai.month.extra-image','monthly-extra-image',''),text('ai.month.address','school-contact','school.address',''),text('ai.month.contacts','school-contact','school.contacts','')],
   'back-cover':[text('ai.back.year','year','calendar.year',year),semantic('ai.back.building','school-building','school.profile.building','학교 전경'),semantic('ai.back.logo','school-logo','school.profile.logo','교표'),text('ai.back.school','school-name','school.name',''),text('ai.back.english','school-english-name','school.englishName',''),text('ai.back.slogan','school-slogan','school.slogan',''),text('ai.back.address','school-contact','school.address',''),text('ai.back.contacts','school-contact','school.contacts',''),text('ai.back.website','school-contact','school.website','')]
  }[role]||[],componentId=item=>item.binding==='calendar.year'?'year':item.type==='year-calendar'?'year-calendar':item.binding==='school.profile.building'?'school-building':item.binding==='school.profile.logo'?'school-logo':item.binding==='school.name'?'school-name':item.binding==='school.englishName'?'school-english-name':item.binding==='school.profile.motto'?'school-motto':item.binding==='school.slogan'?'school-slogan':item.binding==='school.address'?'school-address':item.binding==='school.contacts'?'school-contacts':item.binding==='school.website'?'school-website':item.role==='monthly-extra-image'?'image-frame':null,compositionKey=role==='back-cover'?(page.side==='front'?'back-cover-front':'back-cover-back'):role,composition=spec?.pageSettings?.roleCompositions?.[compositionKey];
  const filteredItems=composition&&role!=='divider'?items.filter(item=>{const id=componentId(item);return !id||(composition.components||[]).includes(id)}):items;
  const elements=project.book.elementsByPage[page.id]||=[];
  if(composition&&role!=='divider'){const allowed=new Set(composition.components||[]);for(let index=elements.length-1;index>=0;index-=1){const id=componentId(elements[index]);if(id&&!allowed.has(id)&&String(elements[index].id||'').startsWith('ai.'))elements.splice(index,1)}}
  if(role==='divider'){for(let index=elements.length-1;index>=0;index-=1){const id=String(elements[index].id||'').split(`.${page.id}`)[0],baseId=Object.values(dividerCatalog).find(item=>item.id===id)?.id;if(id.startsWith('ai.divider.')&&(!baseId||!dividerItems.some(item=>item.id===baseId)))elements.splice(index,1)}page.aiDividerComposition={requestedPurpose:config.requestedPurpose,resolvedPurpose:config.purpose,fallbackUsed:config.fallbackUsed,imageSource:config.imageSource||'none'}}
  const aliases={'school.slogan':['school-slogan','slogan'],'school.name':['school-name'],'school.englishName':['school-english-name'],'calendar.year':['year']};
  filteredItems.forEach(item=>{let existing=elements.find(candidate=>item.binding&&candidate.binding===item.binding||item.binding&&aliases[item.binding]?.includes(candidate.role)||item.role!=='school-contact'&&candidate.role===item.role);if(!existing&&role==='cover'&&item.binding==='school.profile.building'){existing=elements.find(candidate=>{const token=`${candidate.role||''} ${candidate.id||''}`.toLowerCase(),isPhoto=['image','image-frame','semantic-object'].includes(candidate.type);return isPhoto&&candidate.replaceable!==false&&!candidate.binding&&/cover[-_. ]?photo|photo[-_. ]?frame|image[-_. ]?slot/.test(token)});if(existing){existing.role='school-building';existing.binding='school.profile.building';existing.bindingEnabled=true;existing.replaceable=true}}if(existing){if(item.binding&&!existing.binding)existing.binding=item.binding;return}elements.push(clone({...item,id:`${item.id}.${page.id}`}))});
  if(role==='cover'||role==='back-cover'){const seen=new Map();for(let index=elements.length-1;index>=0;index-=1){const item=elements[index],key=item.binding||(['school-logo','school-building','year','school-name'].includes(item.role)?item.role:null);if(!key)continue;const prior=seen.get(key);if(!prior){seen.set(key,item);continue}const remove=item.id?.startsWith('ai.')?index:prior.id?.startsWith('ai.')?elements.indexOf(prior):-1;if(remove>=0){elements.splice(remove,1);if(remove!==index)seen.set(key,item)}}}
  if(role==='cover'&&elements.some(item=>item.binding==='school.profile.building')){for(let index=elements.length-1;index>=0;index-=1){const item=elements[index],token=`${item.role||''} ${item.id||''}`.toLowerCase(),src=item.image?.src||item.src||item.sampleContent?.image||'',secondary=String(item.role||'').startsWith('cover-photo-secondary-'),legacyPlaceholder=['image','image-frame','semantic-object'].includes(item.type)&&item.replaceable!==false&&!item.binding&&!src&&/cover[-_. ]?photo|photo[-_. ]?frame|image[-_. ]?slot/.test(token);if(legacyPlaceholder&&!secondary)elements.splice(index,1)}}
  elements.forEach(item=>{if(item.binding==='calendar.year'){const value=composition||{},minimum=role==='cover'?30:role==='back-cover'?28:18;item.content=value.yearFormat==='number-calendar'?(value.yearLines==='two'?`${year}\nCALENDAR`:`${year} CALENDAR`):year;item.style=item.style||{};item.style.textAlign=value.yearAlign||'center';item.style.whiteSpace='pre-line';item.style.fontSize=Math.max(minimum,Number(item.style.fontSize)||0);item.yearFormat=value.yearFormat||'number';item.yearLines=value.yearLines||'one'}if(item.type==='year-calendar'){const value=composition||{};item.startMonth=startMonth;item.monthCount=12;item.columns=4;item.monthLabelStyle=value.annualMonthLabel||'number-ko';item.showWeekdayHeader=value.annualWeekdays!==false;item.layoutType=typeId;item.showTransitionYear=true;item.style=item.style||{};item.style.gridLine=typeId!=='open-grid';item.showHolidayColor=true;item.showWeekendColor=true}});
 }
 function pageRole(page){return Object.entries(PAGE_ROLE_MAP).find(([,roles])=>page.semanticPageRole&&roles.includes(page.semanticPageRole))?.[0]||Object.entries(PAGE_ROLE_MAP).find(([,roles])=>roles.includes(page.role))?.[0]||null}
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
 function applySchoolIntroductionLayout(elements,typeId){
  if(!['school-intro-center-image','school-intro-left-image','school-intro-background-image'].includes(typeId))return;
  const byRole=role=>elements.find(item=>item.role===role),title=byRole('symbols-title'),photo=byRole('school-building'),logo=byRole('school-logo'),motto=byRole('school-motto');
  if(typeId==='school-intro-left-image'){
   if(title)Object.assign(title,{x:7,y:6,width:86,height:9,zIndex:4});
   if(photo)Object.assign(photo,{x:7,y:20,width:54,height:70,zIndex:2});
   if(logo)Object.assign(logo,{x:66,y:20,width:27,height:20,zIndex:3});
   if(motto)Object.assign(motto,{x:66,y:48,width:27,height:24,zIndex:3});
  }else if(typeId==='school-intro-background-image'){
   if(photo)Object.assign(photo,{x:5,y:5,width:90,height:88,zIndex:2});
   if(title)Object.assign(title,{x:10,y:9,width:80,height:10,zIndex:4});
   if(logo)Object.assign(logo,{x:72,y:24,width:18,height:16,zIndex:4});
   if(motto)Object.assign(motto,{x:72,y:49,width:18,height:21,zIndex:4});
  }else{
   if(title)Object.assign(title,{x:7,y:6,width:86,height:9,zIndex:4});
   if(photo)Object.assign(photo,{x:16,y:20,width:68,height:65,zIndex:2});
   const extras=[logo,motto].filter(Boolean),width=extras.length>1?22:30,start=50-width*extras.length/2;
   extras.forEach((item,index)=>Object.assign(item,{x:start+index*width,y:87,width:width-2,height:8,zIndex:3}));
  }
  if(photo)Object.assign(photo,{replaceable:true,showTitle:false,showCaption:false,imageFit:'cover',cropAllowed:true});
  if(logo)Object.assign(logo,{imageFit:'contain',cropAllowed:false,showTitle:false,showCaption:false});
  if(motto){motto.showTitle=true;motto.style={...(motto.style||{}),containerStyle:'none'};}
 }
 function applyMonthHeaderLayout(elements,layoutId,page,project){
  const profiles={
   'distributed-header':{title:[36,10,28,9],calendar:[5,8,90,87],left:[5,11,27,9],right:[68,11,27,9]},
   'center-title-school-left':{title:[37,10,30,9],calendar:[5,8,90,87],left:[5,11,28,9],right:[70,11,25,9]},
   'center-title-block':{title:[38,9,24,11],calendar:[5,8,90,87],left:[5,11,27,8],right:[68,11,27,8]},
   'left-title-split':{title:[5,10,25,9],calendar:[5,8,90,87],left:[34,11,28,9],right:[68,11,27,9]}
  },profile=profiles[layoutId]||profiles['distributed-header'],byRole=role=>elements.filter(item=>item.role===role),identity=[...byRole('school-logo'),...byRole('school-name')],message=[...byRole('school-motto'),...byRole('school-slogan')],photos=byRole('monthly-extra-image'),left=layoutId==='center-title-school-left'?identity:message,right=layoutId==='center-title-school-left'?[...message,...photos]:[...identity,...photos];
  distribute(left,profile.left);distribute(right,profile.right);
  identity.filter(item=>item.role==='school-logo').forEach(item=>{item.imageFit='contain';item.cropAllowed=false});
  page.overrides=page.overrides||{};page.overrides.calendarRegion=box(profile.calendar);page.overrides.monthTitleRegion=box(profile.title);
  project.template.masters=project.template.masters||{};project.template.masters.calendar=project.template.masters.calendar||{};project.template.masters.calendar.calendarRegion=box(profile.calendar);
 }
 function classify(role,item){
  const token=`${item.role||''} ${item.type||''} ${item.id||''}`.toLowerCase();
  if(item.role==='ai-design-background'||token.includes('background-decoration'))return 'background';
  if(role==='annual')return token.includes('year-calendar')?'calendar':token.includes('year')||token.includes('title')?'title':'info';
  if(role==='month')return token.includes('image')||token.includes('photo')?'image':token.includes('month-title')||token.includes('month-number')?'title':'support';
  if(role==='month-back')return token.includes('image')||token.includes('photo')?'image':token.includes('calendar')||token.includes('date-strip')?'calendar':'support';
  if(role==='divider')return token.includes('symbols-title')||token.includes('insert-title')||token.includes('title')?'title':token.includes('song')?'song':token.includes('motto')?'motto':token.includes('tree')||token.includes('flower')?'symbols':token.includes('logo')||token.includes('building')||token.includes('image')?'hero':'symbols';
  if(role==='cover')return token.includes('image')||token.includes('photo')||token.includes('building')?'image':token.includes('year')?'year':'identity';
  if(role==='back-cover')return token.includes('image')||token.includes('photo')||token.includes('building')?'image':token.includes('year')?'year':'identity';
  return 'support'
 }
 function applyPage(project,page,role,typeId,spec){
  const compositionKey=role==='back-cover'?(page.side==='front'?'back-cover-front':'back-cover-back'):role,composition=spec?.pageSettings?.roleCompositions?.[compositionKey],profile=layouts[role]?.[typeId];if(!profile)return null;
  scaffold(role,page,project,typeId,spec);
  const elements=project.book?.elementsByPage?.[page.id]||[],groups={};
  elements.forEach(item=>{const group=classify(role,item);if(group==='background')return;(groups[group]||=[]).push(item)});
 Object.entries(groups).forEach(([group,items])=>role==='divider'&&['symbols','secondary'].includes(group)?distributeGrid(items,profile[group]||profile.secondary):distribute(items,profile[group]||profile.primary||profile.support||profile.identity));
  if(role==='divider'){applySchoolSymbolLayout(elements,typeId);applySchoolIntroductionLayout(elements,typeId)}
  if(role==='annual'){
   const yearItem=(groups.title||[]).find(item=>item.binding==='calendar.year'||item.role==='year'),calendar=(groups.calendar||[]).find(item=>item.type==='year-calendar'),logo=(groups.info||[]).find(item=>item.role==='school-logo'),layoutId=composition?.layoutId||'centered';
   if(yearItem)Object.assign(yearItem,{x:34,y:5,width:32,height:11});
   if(calendar)Object.assign(calendar,{x:typeId==='vertical-three-month-groups'?6:7,y:20,width:typeId==='vertical-three-month-groups'?88:86,height:73,layoutType:typeId,columns:4,showTransitionYear:true});
   if(logo){const zones={centered:[7,5,12,11],'logo-left':[7,5,12,11],'logo-right':[81,5,12,11]},zone=zones[layoutId]||zones.centered;Object.assign(logo,{x:zone[0],y:zone[1],width:zone[2],height:zone[3],imageFit:'contain',cropAllowed:false,showTitle:false,showCaption:false});}
  }
  if(role==='divider'&&elements.some(item=>item.type==='event-list'&&item.role==='schedule-list')){
   const title=elements.find(item=>classify(role,item)==='title'),schedule=elements.find(item=>item.type==='event-list'&&item.role==='schedule-list');
   if(title)Object.assign(title,{x:7,y:5,width:86,height:8,content:`${project.settings?.year||new Date().getFullYear()}학년도 학사일정`});
   Object.assign(schedule,{x:5,y:15,width:90,height:80,startMonth:Number(project.settings?.startMonth||3),monthCount:12,displayMode:'year-by-month',scheduleLayoutType:resolvedDividerConfig(project,page).layoutId||'schedule-open-grid',showTitle:false,fontSize:8,minFontSize:6,maxItems:120,contentPriority:'readability-first',emptyStatePresentation:'blank'});
  }
  if(role==='divider'&&elements.some(item=>item.role==='yearly-plan')){
   const title=elements.find(item=>classify(role,item)==='title'),plan=elements.find(item=>item.role==='yearly-plan');
   if(title)Object.assign(title,{x:7,y:4,width:86,height:7});
   const layoutId=resolvedDividerConfig(project,page).layoutId||'yearly-open-grid',presentation={'yearly-open-grid':{containerStyle:'none',groupSize:0},'yearly-month-cards':{containerStyle:'individual-card',groupSize:1},'yearly-vertical-groups':{containerStyle:'vertical-group',groupSize:3},'yearly-horizontal-groups':{containerStyle:'horizontal-group',groupSize:4}}[layoutId]||{containerStyle:'none',groupSize:0};
   Object.assign(plan,{x:5,y:title?13:5,width:90,height:title?82:90,memoLayout:'yearly-grid',yearlyLayoutType:layoutId,yearlyContainerStyle:presentation.containerStyle,yearlyGroupSize:presentation.groupSize,startMonth:Number(project.settings?.startMonth||3),baseYear:Number(project.settings?.year||new Date().getFullYear()),contentPriority:'primary-full-page',minimumReadableSizeMm:{width:220,height:145}});
  }
  if(role==='cover'){
   const coverProfiles={
    'center-photo':{photoLow:{image:[25,39,50,37],year:[29,13,42,19],identity:[8,80,84,14]},photoWide:{image:[18,31,64,46],year:[29,12,42,18],identity:[8,81,84,13]},photoFeature:{image:[12,27,76,51],year:[31,11,38,17],identity:[8,82,84,12]}},
    'left-photo':{photoLow:{image:[5,12,58,76],year:[68,10,27,18],identity:[68,36,27,50]},photoWide:{image:[5,7,66,86],year:[75,8,20,18],identity:[75,34,20,56]},photoFeature:{image:[5,5,72,90],year:[80,8,16,18],identity:[80,34,16,56]}},
    'right-photo':{photoLow:{image:[53,28,42,62],year:[8,9,40,18],identity:[8,68,40,20]},photoWide:{image:[46,23,49,69],year:[8,8,34,18],identity:[8,67,34,22]},photoFeature:{image:[39,17,56,76],year:[7,8,28,18],identity:[7,65,28,25]}},
    free:{photoLow:{image:null,year:[29,18,42,22],identity:[8,78,84,15]},photoWide:{image:null,year:[8,16,42,22],identity:[8,76,84,16]},photoFeature:{image:null,year:[8,12,50,25],identity:[8,72,84,20]}}
   },layoutKey=composition?.layoutId==='photo-wide'?'photoWide':composition?.layoutId==='photo-feature'?'photoFeature':'photoLow',coverProfile=coverProfiles[typeId]?.[layoutKey]||profile;
   ['image','year'].forEach(group=>{if(coverProfile[group])distribute(groups[group]||[],coverProfile[group]);else (groups[group]||[]).filter(item=>String(item.id||'').startsWith('ai.')).forEach(item=>elements.splice(elements.indexOf(item),1))});
   const zone=coverProfile.identity||[15,77,70,18],identity=(groups.identity||[]).filter(item=>item.role!=='school-logo'),logo=(groups.identity||[]).find(item=>item.role==='school-logo');
   if(logo){Object.assign(logo,{x:zone[0],y:zone[1],width:Math.min(22,zone[2]*.28),height:Math.min(14,zone[3]),imageFit:'contain',cropAllowed:false});}
   const textX=logo?zone[0]+Math.min(25,zone[2]*.32):zone[0],textWidth=logo?Math.max(10,zone[2]-Math.min(25,zone[2]*.32)):zone[2],gap=.8,height=Math.max(2.4,(zone[3]-gap*Math.max(0,identity.length-1))/Math.max(1,identity.length));
   identity.forEach((item,index)=>{Object.assign(item,{x:textX,y:zone[1]+index*(height+gap),width:textWidth,height:Math.min(height,zone[1]+zone[3]-(zone[1]+index*(height+gap)))});item.style=item.style||{};const limits=item.role==='school-name'?[10,16]:item.role==='school-english-name'?[7,9]:[6,8];item.style.fontSize=Math.max(limits[0],Math.min(Number(item.style.fontSize)||limits[1],limits[1]));item.identityGroup='school-identity'});
   if(logo)logo.identityGroup='school-identity';
  }
  if(role==='back-cover'){
   const profiles={
    'school-information':{'centered-information':{primary:[35,22,30,20],identity:[25,54,50,32]},'lower-information':{primary:[36,25,28,20],identity:[18,69,64,19]},'left-information':{primary:[8,27,34,36],identity:[51,25,41,50]}},
    'year-school-information':{'centered-year':{year:[29,17,42,18],identity:[25,48,50,38]},'split-year-information':{year:[8,25,38,24],identity:[55,24,37,56]},'top-year-information':{year:[26,8,48,19],identity:[20,58,60,29]}},
    'school-photo-information':{'center-photo':{year:[32,6,36,13],image:[24,23,52,43],identity:[20,72,60,20]},'left-photo':{year:[61,8,31,16],image:[7,14,48,67],identity:[61,35,31,48]},'right-photo':{year:[8,8,31,16],image:[45,14,48,67],identity:[8,35,31,48]}}
   },defaults={'school-information':'centered-information','year-school-information':'centered-year','school-photo-information':'center-photo'},layoutId=composition?.layoutId||defaults[typeId],backProfile=profiles[typeId]?.[layoutId]||profiles[typeId]?.[defaults[typeId]]||profile;
   const yearItems=groups.year||[],allIdentity=groups.identity||[],hasYear=yearItems.length>0,promotedLogo=!hasYear?allIdentity.find(item=>item.role==='school-logo'):null,primaryItems=hasYear?yearItems:(promotedLogo?[promotedLogo]:[]);if(primaryItems.length&&backProfile.primary)distribute(primaryItems,backProfile.primary);else if(yearItems.length&&backProfile.year)distribute(yearItems,backProfile.year);else yearItems.filter(item=>String(item.id||'').startsWith('ai.')).forEach(item=>elements.splice(elements.indexOf(item),1));const imageItems=groups.image||[];if(backProfile.image)distribute(imageItems,backProfile.image);else imageItems.filter(item=>String(item.id||'').startsWith('ai.')).forEach(item=>elements.splice(elements.indexOf(item),1));
   const identity=allIdentity.filter(item=>item!==promotedLogo),zone=backProfile.identity||[20,58,60,30],logo=identity.find(item=>item.role==='school-logo'),texts=identity.filter(item=>item!==logo),nameItems=texts.filter(item=>['school-name','school-english-name'].includes(item.role)),detailItems=texts.filter(item=>!nameItems.includes(item));
   const sideBySide=layoutId==='left-information'||layoutId==='split-year-information';
   if(promotedLogo)Object.assign(promotedLogo,{imageFit:'contain',cropAllowed:false,identityGroup:'school-identity'});if(logo){const logoWidth=Math.min(22,zone[2]*.44),logoHeight=Math.min(12,Math.max(9,zone[3]*.32));Object.assign(logo,{x:sideBySide?zone[0]:zone[0]+(zone[2]-logoWidth)/2,y:zone[1],width:logoWidth,height:logoHeight,imageFit:'contain',cropAllowed:false,identityGroup:'school-identity'});}
   const offset=sideBySide&&logo?Math.min(24,zone[2]*.48):0,textX=zone[0]+offset,textWidth=zone[2]-offset,nameY=!sideBySide&&logo?logo.y+logo.height+1:zone[1],nameHeight=Math.min(12,Math.max(7,zone[3]*.30)),detailY=nameY+nameHeight+1,detailHeight=Math.max(3,zone[1]+zone[3]-detailY);
   distribute(nameItems,[textX,nameY,textWidth,nameHeight]);distribute(detailItems,[textX,detailY,textWidth,detailHeight]);
   texts.forEach(item=>{item.style=item.style||{};const limits=item.role==='school-name'?[10,15]:item.role==='school-english-name'?[7,9]:[6.5,8];item.style.fontSize=Math.max(limits[0],Math.min(Number(item.style.fontSize)||limits[1],limits[1]));item.style.textAlign=sideBySide?'left':'center';item.identityGroup='school-identity'});
   (groups.image||[]).forEach(item=>{item.replaceable=true;item.showTitle=false;item.showCaption=false;item.imageFit='cover';item.cropAllowed=true});
  }
  elements.filter(item=>item.role==='school-logo').forEach(item=>{item.imageFit='contain';item.cropAllowed=false});
  if(role==='divider')elements.filter(item=>classify(role,item)==='song').forEach(item=>{item.imageFit='contain';item.minimumReadableSizeMm={width:90,height:95};item.contentPriority='readability-first';item.cropAllowed=false});
  if(role==='month'){
   const selected=composition?.components||[],legacyContact=elements.filter(item=>String(item.id||'').startsWith('ai.month.')&&['school.address','school.contacts','school.website'].includes(item.binding));legacyContact.forEach(item=>elements.splice(elements.indexOf(item),1));
   if(selected.includes('school-name')&&!elements.some(item=>item.role==='school-name'))elements.push(text(`ai.month.school.${page.id}`,'school-name','school.name',''));
   applyMonthHeaderLayout(elements,composition?.layoutId,page,project);
  }
  const protectedObjects=elements.filter(item=>classify(role,item)!=='background').map(item=>{const functional=['year-calendar','event-list','memo'].includes(item.type)||['year-calendar','yearly-plan','schedule-list'].includes(item.role);return {id:item.id,role:item.role||item.type,x:item.x,y:item.y,width:item.width,height:item.height,importance:functional?'critical':['year','school-logo','school-name','school-building','school-song'].includes(item.role)?'high':'normal',readability:functional||item.type==='text'||item.role==='school-song'?'required':'visual',padding:functional?4:item.role==='school-song'?3:2,continuousClearArea:functional,containerStyle:item.style?.containerStyle||'none',sectionDivider:item.style?.sectionDivider||'none'}});
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
