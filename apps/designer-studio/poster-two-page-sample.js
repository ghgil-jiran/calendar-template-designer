(function(root){
 const STABLE_KEY='poster-two-page-academic-2027',NAME='2027학년도 · 벽보형 샘플 · 2페이지 일정형';
 function create(source={},definition){
  const type=definition||root.ACDLCalendarTypeDomain.definition('poster-two-page'),p=root.ACDLPosterOnePageSample.create(source,type),base=structuredClone(p.book.pageInstances[0]),elements=p.book.elementsByPage[base.id],grid=elements.find(e=>e.academicPoster),logo=elements.find(e=>e.role==='school-logo');
  p.template.metadata={...p.template.metadata,name:NAME,description:'6개월씩 2페이지 · 페이지당 2열×3행 · 날짜 칸 일정과 기간 색 띠 · 디자인 적용 전 구조 검증용',posterSample:'two-page.v1'};
  p.settings.posterPageCount=2;p.settings.posterColumns=2;p.productType.id='poster-annual-double';
  p.template.publishing.dataRequirements=p.template.publishing.dataRequirements.filter(item=>!['school.profile.building','school.contacts'].includes(item.path));
  const text=(id,binding,x,y,width,height,size,content='')=>({id,type:'text',binding,bindingEnabled:true,x,y,width,height,zIndex:3,content,style:{fontSize:size,fontReferenceWidthPx:1000,fontFamily:'Pretendard',color:'#17202e',background:false,textAlign:'left',verticalAlign:'middle',fontWeight:700}});
  p.book.pageInstances=[];p.book.elementsByPage={};p.book.posterElementsInitialized={};
  for(let index=0;index<2;index++){
   const id=index?'page.poster.annual.2':'page.poster.annual',page={...structuredClone(base),id,number:index+1,posterMonthOffset:index*6};p.book.pageInstances.push(page);
   p.book.elementsByPage[id]=[
    {...structuredClone(logo),id:'poster.logo.'+index,x:4,y:3,width:10,height:6},text('poster.name.'+index,'school.name',16,3,40,4,31),text('poster.english.'+index,'school.englishName',16,7,40,2,12),text('poster.year.'+index,'calendar.year',59,3,15,5,35),text('poster.heading.'+index,'',75,3,21,5,29,'학사일정'),
    {...structuredClone(grid),id:'poster.calendar.'+index,x:4,y:13,width:92,height:83,columns:2,monthCount:6,posterMonthOffset:index*6,posterShowList:false,posterGridStyle:'boxed',posterEventSize:8,posterColors:index?['#9bcfc7','#80bfc1','#7db4cb']:['#e9a9c0','#d9a8ce','#e9a4b7'],style:{...grid.style,dateSize:21,titleSize:30,columnGap:20,rowGap:22}}
   ];p.book.posterElementsInitialized[id]=true;
  }
  p.book.sheets=p.book.pageInstances.map((page,index)=>({id:'poster.sheet.'+(index+1),sheetNumber:index+1,role:'poster-annual',surfaces:[page]}));root.ACDLNativePrintAuthoring?.syncProject(p);return p;
 }
 root.ACDLPosterTwoPageSample=Object.freeze({STABLE_KEY,NAME,create});
})(typeof window!=='undefined'?window:globalThis);
