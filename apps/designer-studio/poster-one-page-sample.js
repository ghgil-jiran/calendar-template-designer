(function(root){
 const STABLE_KEY='poster-one-page-academic-2027',NAME='2027학년도 · 벽보형 샘플 · 1페이지 일정형';
 function create(source={},definition){
  const options={type:'poster',year:2027,startMonth:3,template:'school-basic',frontInsertCount:0,rearInsertCount:0,calendarRows:6,calendarRowsMode:'adaptive',weekStart:'sunday',showAdjacentMiniCalendars:false,posterColumns:3,sizePresetId:'poster-a2'},type=definition||root.ACDLCalendarTypeDomain.definition('poster-standard');
  const project=root.ACDLProjectDocument.createProject(options,{buildMonths:(year,start)=>Array.from({length:12},(_,i)=>({year:year+Math.floor((start-1+i)/12),month:(start-1+i)%12+1})),sizePresets:{poster:[{id:'poster-a2',label:'A2',width:type.finishedSize.width,height:type.finishedSize.height}]}});
  root.ACDLCalendarTypeDomain.attachSnapshot(project,type);root.ACDLCalendarTypeDomain.applyProjectSize(project,type);
  project.template.metadata={name:NAME,description:'12개월 3열×4행 · 날짜 안 일정과 월별 상세 목록 · 디자인 적용 전 구조 검증용',edition:2027,state:'draft',isStandard:false,posterSample:'one-page.v2'};
  project.template.userEditing={preset:'minimal'};project.settings.calendarData={includeHolidays:true,includeAnniversaries:true,includeSolarTerms:true,includeLunar:true};
  if(source.book?.school){const defaults=project.book.school;project.book.school={...defaults,...structuredClone(source.book.school),profile:{...defaults.profile,...structuredClone(source.book.school.profile||{})}};for(const key of ['building','logo'])if(!project.book.school.profile[key]?.image)project.book.school.profile[key]=structuredClone(defaults.profile[key])}
  project.book.events=structuredClone(source.book?.events||[]);project.book.calendarReference=structuredClone(source.book?.calendarReference||{schemaVersion:'calendar-reference.v1',years:{}});
  project.template.resources.sampleAssets=structuredClone((source.template?.resources?.sampleAssets||project.template.resources.sampleAssets).filter(item=>['school-building','school-logo'].includes(item.role)));
  project.template.publishing={dataRequirements:[['school.name','학교명','text'],['calendar.year','학사연도','year'],['calendar.events','학사일정','schedule-import'],['school.profile.logo','교표','image'],['school.profile.building','학교전경','image'],['school.contacts','학교 연락처','contact']].map(([path,label,input])=>({path,label,input,stage:['school.name','calendar.events'].includes(path)?'project-create-required':'optional',...(input==='image'?{slot:path.endsWith('logo')?'school-symbol':'cover-photo'}:{}),...(!['school.name','calendar.events'].includes(path)?{fallback:'sample'}:{})}))};
  const page=project.book.pageInstances[0];page.overrides={backgroundColor:'#ffffff'};
  const text=(id,binding,x,y,width,height,size,content='')=>({id,type:'text',binding,bindingEnabled:true,x,y,width,height,zIndex:3,content,style:{fontSize:size,fontReferenceWidthPx:1000,fontFamily:'Pretendard',color:'#17202e',background:false,textAlign:'left',verticalAlign:'middle',fontWeight:700}});
  const semantic=(role,x,y,width,height)=>({id:'poster.'+role,type:'semantic-object',role,binding:'school.profile.'+(role==='school-logo'?'logo':'building'),bindingEnabled:true,fallbackToSample:true,showTitle:false,showCaption:false,x,y,width,height,zIndex:2,layoutPreset:'image-only',style:{background:false,border:false}});
  project.book.elementsByPage[page.id]=[
   semantic('school-building',4,2.5,27,9),text('poster.slogan','school.slogan',34,2.5,62,2.5,17),text('poster.name','school.name',34,5,62,4.5,42),text('poster.year','calendar.year',34,9.5,12,2.5,24),text('poster.title','',47,9.5,49,2.5,24,'학년도 학사일정'),
   {id:'poster.calendar',type:'year-calendar',academicPoster:true,x:4,y:14,width:92,height:78,zIndex:1,columns:3,startMonth:3,monthCount:12,rowsMode:'adaptive',showWeekdayHeader:true,posterShowList:true,posterEventSize:6,posterListSize:7.5,posterColors:['#e9bccb','#b3d3e5','#b9d6c2','#cfc2df'],style:{fontFamily:'Pretendard',fontReferenceWidthPx:1000,dateSize:15,titleSize:22,columnGap:14,rowGap:16,sunday:'#d92d20',saturday:'#175cd3',dateColor:'#17202e',background:false}},
   semantic('school-logo',5,94,6,4),text('poster.footer-name','school.name',13,94,29,2.1,18),text('poster.footer-english','school.englishName',13,96.1,29,1.5,8.5),text('poster.address','school.address',44,94,51,1.5,9),text('poster.website','school.website',44,95.5,51,1.2,9),text('poster.contacts','school.contacts',44,96.7,51,1.3,8.5)
  ];
  project.book.posterElementsInitialized={[page.id]:true};project.template.masterElements={};
  // Native print readiness remains visible for sample photos; no approval is fabricated.
  root.ACDLNativePrintAuthoring?.initializeProject(project);return project;
 }
 root.ACDLPosterOnePageSample=Object.freeze({STABLE_KEY,NAME,create});
})(typeof window!=='undefined'?window:globalThis);
