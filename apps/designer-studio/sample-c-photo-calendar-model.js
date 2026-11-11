(function(root){
 const REV='sample-c-photo-calendar-v2';
 function apply(source,photos){
  const p=structuredClone(source),backs=p.book?.pageInstances?.filter(page=>page.role==='monthly-back')||[];
  if(backs.length!==12||p.book.pageInstances.length!==28)throw Error('샘플 C의 28면·월력 뒷면 12면 구성을 확인해주세요.');
  const photoPages=photos.book?.pageInstances?.filter(page=>page.role==='monthly-back')||[];
  for(const page of backs){
   const key=page.monthKey||`${page.calendarYear}-${String(page.calendarMonth).padStart(2,'0')}`,old=p.book.elementsByPage[page.id]||[];
   const bg=old.find(e=>e.id===`c.${key}.planner.bg`)||old.find(e=>e.role==='background-decoration'&&e.type==='shape'&&e.width>=95&&e.height>=90);
   if(!bg||!/^#[0-9a-f]{6}$/i.test(bg.style?.fill||''))throw Error(`${key}: 기존 단색 배경을 확인할 수 없습니다. 변경을 중단했습니다.`);
   const photoPage=photoPages.find(q=>q.calendarMonth===page.calendarMonth&&q.calendarYear===page.calendarYear),candidates=(photos.book.elementsByPage[photoPage?.id]||[]).filter(e=>e.type==='image-frame'&&e.role==='monthly-image'&&e.image?.src).sort((a,b)=>b.width*b.height-a.width*a.height),photo=candidates[0];
   if(!photo)throw Error(`${key}: 샘플 B 사진이 없습니다.`);
   const primary=old.find(e=>e.role==='monthly-week')?.style?.color||p.template.resources?.colorTheme?.primary||'#36523b';
   const permissions={move:false,resize:false,delete:false,content:false},base={monthSource:'page',calendarRows:6,rows:6,calendarRowsMode:'fixed',weekStart:p.settings.weekStart||'sunday',monthLabelStyle:'number-en',showWeekdayHeader:false,showAdjacentMonths:false,permissions,style:{fontFamily:'Pretendard',primary,dateColor:'#39413e',sunday:'#d92d20',saturday:'#175cd3',weekdayColor:'#737b76',lineColor:'#cbd5cc',background:false,gridLine:false,preset:'reference-photo',titleAlign:'left',dateWeight:30,titleGap:10,rowGap:0,lineColor:'#d8d7e6',ruleWidth:1,ruleGap:10}};
   const mini=(type,suffix,x,y,width,height,dateSize,titleSize)=>({...structuredClone(base),id:`c.${key}.photo-calendar.${suffix}`,type,x,y,width,height,zIndex:3,style:{...base.style,dateSize,titleSize,monthNumberSize:titleSize,monthEnglishSize:titleSize*.48,bottomRule:true}});
   const frame={id:`c.${key}.photo-calendar.photo`,type:'image-frame',role:'monthly-image',x:5,y:12,width:57,height:80,zIndex:2,fit:'cover',image:{...structuredClone(photo.image),fit:'cover'},style:{background:false,stroke:'#ffffff',strokeWidth:2,shadow:false},permissions:{move:false,resize:false,delete:false,replaceImage:true},metadata:{photoCalendarSource:photo.id,photoCalendarRevision:REV}};
   p.book.elementsByPage[page.id]=[structuredClone(bg),frame,mini('mini-calendar','current',66,28,30,38,14,27),mini('mini-calendar-prev','previous',66,72,14,20,8,14),mini('mini-calendar-next','next',82,72,14,20,8,14)];
   page.photoLayout='photo-calendar-split';page.aiMonthBackComposition={components:['image','current-calendar','previous-mini-calendar','next-mini-calendar'],layoutId:'photo-calendar-split',revision:REV};
  }
  p.template.settings||={};const spec=p.template.settings.aiDesignSpec||={};spec.pageTypes={...spec.pageTypes,'month-back':'image-led'};spec.pageSettings={...spec.pageSettings,monthBackComponents:['image','current-calendar','previous-mini-calendar','next-mini-calendar'],monthBackCustomized:true,monthBackMediaMode:'sample-replaceable',monthBackLayoutId:'photo-calendar-split',monthBackImageCount:1,monthBackOverlap:false};
  p.template.metadata={...p.template.metadata,sampleCPhotoCalendar:REV};return p;
 }
 root.ACDLSampleCPhotoCalendar=Object.freeze({REV,apply});
})(typeof window==='undefined'?globalThis:window);
