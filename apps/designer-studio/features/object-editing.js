"use strict";

function calendarRegion(){
 const calendar=project.template.masters.calendar;
 calendar.calendarRegionsByType ||= {};
 const type=project.productType?.category||project.settings?.type||"desk";
 if(type==="postcard"){
  calendar.calendarRegionsByType.postcard ||= {x:6,y:60,width:88,height:35};
  return calendar.calendarRegionsByType.postcard;
 }
 calendar.calendarRegion||={x:5,y:16,width:90,height:79};
 return calendar.calendarRegion
}
function startCalendarPointer(e){
 e.preventDefault();
 const r=calendarRegion(),node=e.currentTarget;
 snapshot();
 node.setPointerCapture(e.pointerId);
 calendarDrag={
  startX:e.clientX,
  startY:e.clientY,
  handle:e.target.dataset.calendarHandle||"move",
  original:{...r},
  pageRect:el("page").getBoundingClientRect(),
  node,
  changed:false
 };
 node.addEventListener("pointermove",moveCalendarPointer);
 node.addEventListener("pointerup",endCalendarPointer,{once:true});
 node.addEventListener("pointercancel",endCalendarPointer,{once:true})
}
function moveCalendarPointer(e){
 if(!calendarDrag)return;
 const r=calendarRegion(),o=calendarDrag.original;
 const dx=(e.clientX-calendarDrag.startX)/calendarDrag.pageRect.width*100;
 const dy=(e.clientY-calendarDrag.startY)/calendarDrag.pageRect.height*100;
 if(Math.abs(dx)>.05||Math.abs(dy)>.05)calendarDrag.changed=true;
 if(calendarDrag.handle==="move"){r.x=o.x+dx;r.y=o.y+dy}
 if(["e","se","ne"].includes(calendarDrag.handle))r.width=o.width+dx;
 if(["s","se","sw"].includes(calendarDrag.handle))r.height=o.height+dy;
 if(["w","nw","sw"].includes(calendarDrag.handle)){r.x=o.x+dx;r.width=o.width-dx}
 if(["n","nw","ne"].includes(calendarDrag.handle)){r.y=o.y+dy;r.height=o.height-dy}
 const minW=25,minH=25;
 if(r.width<minW){
  if(["w","nw","sw"].includes(calendarDrag.handle))r.x-=minW-r.width;
  r.width=minW
 }
 if(r.height<minH){
  if(["n","nw","ne"].includes(calendarDrag.handle))r.y-=minH-r.height;
  r.height=minH
 }
 r.width=Math.min(100,r.width);r.height=Math.min(100,r.height);
 r.x=Math.max(0,Math.min(r.x,100-r.width));
 r.y=Math.max(0,Math.min(r.y,100-r.height));
 const node=calendarDrag.node;
 node.style.left=r.x+"%";
 node.style.top=r.y+"%";
 node.style.width=r.width+"%";
 node.style.height=r.height+"%"
}
function endCalendarPointer(e){
 if(!calendarDrag)return;
 const node=calendarDrag.node;
 try{node.releasePointerCapture(e.pointerId)}catch{}
 node.removeEventListener("pointermove",moveCalendarPointer);
 node.removeEventListener("pointercancel",endCalendarPointer);
 const changed=calendarDrag.changed;
 calendarDrag=null;
 if(!changed)history.pop();
 markDirty();
 inspectorNotice={type:"success",message:changed?"월력 Master의 위치와 크기를 반영했습니다.":"월력 Master를 선택했습니다."};
 render()
}

function applyCalendarRegionPreset(preset){
 change(()=>{
  const r=calendarRegion();
  if(preset==="full"){Object.assign(r,{x:3,y:12,width:94,height:84})}
  if(preset==="standard"){Object.assign(r,{x:5,y:16,width:90,height:79})}
  if(preset==="compact"){Object.assign(r,{x:12,y:22,width:76,height:68})}
  if(preset==="center"){r.x=(100-r.width)/2;r.y=(100-r.height)/2}
 });
 calendarEditing=true;render()
}

function addBackWidget(type){
 if(type==="monthly-quote"&&selectedPage()?.role!=="monthly-back"){showEditorToast("월력용 명언 문구는 월력 뒷면에서 추가할 수 있습니다.");return}
 const plannerPresets={
  "planner-goal":{memoLayout:"goal",role:"monthly-goal",title:"MONTHLY GOAL",x:4,y:11,width:36,height:42},
  "planner-weekly":{memoLayout:"weekly",role:"weekly-planner",title:"WEEKLY PLANNER",weekCount:5,showMemo:true,x:42,y:11,width:54,height:84},
  "planner-checklist":{memoLayout:"checklist",role:"monthly-todo",title:"TO DO LIST",itemCount:9,x:4,y:55,width:36,height:40}
 },plannerPreset=plannerPresets[type],elementType=plannerPreset?"memo":type;
 if(plannerPreset&&selectedPage()?.role!=="monthly-back"){showEditorToast("플래너 개체는 월력 뒷면 Master에서 추가할 수 있습니다.");return}
 const scope=el("elementScope").value,arr=scope==="master"?masterElements():pageElements(),defaults=plannerPreset||{
  "mini-calendar":{x:8,y:12,width:35,height:40},
  "mini-calendar-prev":{x:8,y:12,width:24,height:26},
  "mini-calendar-next":{x:68,y:12,width:24,height:26},
  "year-calendar":{x:5,y:8,width:90,height:84},
  "memo":{x:47,y:12,width:45,height:72},
  "monthly-schedule":{x:8,y:56,width:35,height:28},
  "event-list":{x:68,y:12,width:27,height:76},
  "month-date-strip":{x:5,y:82,width:90,height:10},
  "monthly-quote":{x:7,y:18,width:38,height:32}
 }[type];
 if(!defaults)return;
 const elem={id:`element.${type}.${Date.now()}`,type:elementType,...defaults,zIndex:maxZ(scope)+1};
 if(type==="memo")Object.assign(elem,{memoLayout:"lines",title:"메모",lineCount:8});
 if(plannerPreset)Object.assign(elem,{required:true,permissions:{move:false,resize:false,rotate:false,color:false,replaceImage:false,delete:false,duplicate:false,layer:false,content:false}});
 if(type==="year-calendar")Object.assign(elem,{columns:4,startMonth:1,monthCount:12,rowsMode:"inherit",showWeekdayHeader:true});
 if(type==="monthly-schedule")Object.assign(elem,{title:"이달의 일정",maxItems:10});
 if(type==="event-list")Object.assign(elem,{title:"전체 학사일정",startMonth:project.settings.startMonth||1,monthCount:12,displayMode:"limit",maxItems:24,showEndDate:false,columns:1,fontSize:8,minFontSize:6,autoShrink:true});
 if(type==="month-date-strip")Object.assign(elem,{monthSource:"page",year:project.settings.year,month:project.settings.startMonth||1,showWeekday:true,showDate:true,equalCells:true,style:{weekdayColor:"#6b7280",dateColor:"#17202e",sundayColor:"#d04444",saturdayColor:"#3569b8",background:true}});
 if(type==="monthly-quote")Object.assign(elem,{title:"이 달의 명언",style:{titleSize:13,quoteKoSize:18,quoteEnSize:10,sourceSize:9,textAlign:"center",color:"#17202e",accentColor:"#315e9e",secondaryColor:"#667085",itemGap:7}});
 snapshot();arr.push(elem);selectedElementId=elem.id;selectedElementScope=scope;render()
}

function currentMonthEvents(p=selectedPage()){
 if(!p.calendarYear||!p.calendarMonth)return[];
 const prefix=`${p.calendarYear}-${String(p.calendarMonth).padStart(2,"0")}`;
 return project.book.events.filter(ev=>(ev.startDate||"").startsWith(prefix)||(ev.endDate||"").startsWith(prefix)).sort((a,b)=>a.startDate.localeCompare(b.startDate))
}
const MONTHLY_QUOTE_SEED=[
 {quoteKo:"작은 배움이 쌓여 큰 성장을 만듭니다.",quoteEn:"Small lessons add up to meaningful growth."},
 {quoteKo:"서로의 다름을 이해할 때 함께 더 멀리 갈 수 있습니다.",quoteEn:"Understanding our differences helps us go farther together."},
 {quoteKo:"실수는 멈춤의 이유가 아니라 다시 배우는 기회입니다.",quoteEn:"A mistake is a chance to learn again, not a reason to stop."},
 {quoteKo:"오늘의 성실함은 내일의 자신감을 만듭니다.",quoteEn:"Today's steady effort becomes tomorrow's confidence."},
 {quoteKo:"좋은 질문 하나가 새로운 길을 열어 줍니다.",quoteEn:"One thoughtful question can open a new path."},
 {quoteKo:"친절한 말 한마디는 교실을 더 따뜻하게 만듭니다.",quoteEn:"One kind word can make the classroom warmer."},
 {quoteKo:"쉬어 가는 시간도 앞으로 나아가는 과정입니다.",quoteEn:"Taking time to rest is also part of moving forward."},
 {quoteKo:"할 수 있다는 믿음은 도전을 시작하게 합니다.",quoteEn:"Believing you can is where every challenge begins."},
 {quoteKo:"함께 나눈 지식은 더 큰 지혜가 됩니다.",quoteEn:"Knowledge shared together grows into greater wisdom."},
 {quoteKo:"꾸준함은 재능이 빛날 시간을 만들어 줍니다.",quoteEn:"Consistency gives talent the time it needs to shine."},
 {quoteKo:"경청은 서로를 이해하는 가장 좋은 시작입니다.",quoteEn:"Listening is the best beginning of understanding."},
 {quoteKo:"한 해의 끝은 새로운 꿈을 준비하는 출발점입니다.",quoteEn:"The end of a year is a starting point for new dreams."}
];
function monthlyQuoteKey(p=selectedPage()){return p?.calendarYear&&p?.calendarMonth?`${p.calendarYear}-${String(p.calendarMonth).padStart(2,"0")}`:null}
function ensureMonthlyQuotes(){
 project.book.monthlyQuotes ||= {};
 const pages=(project.book.pageInstances||[]).filter(p=>p.role==="monthly-back"&&monthlyQuoteKey(p));
 pages.forEach((p,index)=>{const key=monthlyQuoteKey(p);if(project.book.monthlyQuotes[key])return;const seed=MONTHLY_QUOTE_SEED[index%MONTHLY_QUOTE_SEED.length];project.book.monthlyQuotes[key]={title:"이 달의 명언",...seed,source:"우리학교인쇄 교육 문구",sourceStatus:"original",translationType:"editorial"}})
}
function monthlyQuoteForPage(p=selectedPage()){ensureMonthlyQuotes();const key=monthlyQuoteKey(p);return key?project.book.monthlyQuotes[key]:{title:"이 달의 명언",quoteKo:"월력 뒷면에서 월별 명언을 편집하세요.",quoteEn:"Edit the monthly quote on a monthly back page.",source:""}}
function renderWidgetContent(view,p){
 if(["mini-calendar","mini-calendar-prev","mini-calendar-next"].includes(view.type)){
  const offset=view.type==="mini-calendar-prev"?-1:view.type==="mini-calendar-next"?1:0;
  const baseYear=Number(p.calendarYear||project.settings.year),baseMonth=Number(p.calendarMonth||project.settings.startMonth||1),target=new Date(baseYear,baseMonth-1+offset,1),year=target.getFullYear(),month=target.getMonth()+1;
  const rows=calendarRowCountFor(year,month);
  const monthNames=["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"],label=view.monthLabelStyle==="number-en"?`${month} <small>${monthNames[month-1]}</small>`:`${year}년 ${month}월`,weekdayRows=view.showWeekdayHeader===false?"":"auto ";
  const miniStyle=view.style||{},miniVars=`--mini-title-align:${miniStyle.titleAlign||"left"};--mini-title-size:${Number(miniStyle.titleSize||11)}px;--mini-primary:${miniStyle.primary||"#293878"};--mini-weekday:${miniStyle.weekdayColor||"#7a8291"};--mini-date:${miniStyle.dateColor||"#293878"};--mini-sunday:${miniStyle.sunday||"#ef3340"};--mini-saturday:${miniStyle.saturday||"#4777bd"};`,miniClass=miniStyle.gridLine?" mini-grid-lines":"";
  let inner=`<div class="widget-mini-calendar${miniClass}" style="${miniVars}"><strong>${label}</strong><div class="mini-grid" style="--mini-calendar-rows:${rows};grid-template-rows:${weekdayRows}repeat(${rows},1fr)">`;
  if(view.showWeekdayHeader!==false)weekDayHeaders().forEach(x=>inner+=`<span class="mh">${x}</span>`);
  calendarGridFor(year,month,rows).forEach(c=>inner+=`<span class="${[c.month!==month?"adj":"",c.dow===0?"sun":"",c.dow===6?"sat":""].filter(Boolean).join(" ")}">${c.day}${c.extra?` · ${c.extra.day}`:""}</span>`);
  return inner+"</div></div>"
 }
 if(view.type==="year-calendar"){
  const cols=Number(view.columns||4),count=Number(view.monthCount||12),start=Number(view.startMonth||1),seq=monthSequence(p.calendarYear||project.settings.year,start).slice(0,count);
  let inner=`<div class="year-calendar-object" style="--year-cols:${cols};--year-rows:${Math.ceil(count/cols)}">`;
  seq.forEach(mm=>{const rows=yearCalendarRowCountFor(view,mm.year,mm.month),monthNames=["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"],label=view.monthLabelStyle==="number-en"?`${mm.month} <small>${monthNames[mm.month-1]}</small>`:`${mm.month}월`,weekdayRows=view.showWeekdayHeader===false?"":"auto ";inner+=`<div class="year-month"><strong>${label}</strong><div class="year-month-grid" style="--year-calendar-rows:${rows};grid-template-rows:${weekdayRows}repeat(${rows},1fr)">`;if(view.showWeekdayHeader!==false)weekDayHeaders(true).forEach(x=>inner+=`<span class="mh">${x}</span>`);calendarGridFor(mm.year,mm.month,rows).forEach(c=>inner+=`<span class="${c.month!==mm.month?"adj":""}">${c.day}</span>`);inner+=`</div></div>`});
  return inner+"</div>"
 }
 if(view.type==="month-date-strip"){
  const usePage=view.monthSource!=="fixed"&&p.calendarYear&&p.calendarMonth,year=usePage?p.calendarYear:Number(view.year||project.settings.year),month=usePage?p.calendarMonth:Number(view.month||project.settings.startMonth||1),count=new Date(year,month,0).getDate();
  let inner=`<div class="month-date-strip" style="--date-count:${count};${view.style?.background===false?"background:transparent;border-color:transparent;":""}">`;
  for(let day=1;day<=count;day++){const dow=new Date(year,month-1,day).getDay(),letter="SMTWTFS"[dow];inner+=`<div class="month-date-cell ${dow===0?"sun":dow===6?"sat":""}">${view.showWeekday===false?"":`<span class="dow">${letter}</span>`}${view.showDate===false?"":`<span class="date">${day}</span>`}</div>`}
  return inner+"</div>"
 }
 if(view.type==="memo"){
  const layout=view.memoLayout||"lines",title=v21Escape(view.title||"메모");
  if(layout==="goal")return `<div class="widget-memo" data-memo-layout="goal"><strong class="planner-ribbon">${title}</strong><div class="planner-goal-box"></div></div>`;
  if(layout==="weekly"){
   const weeks=Math.max(1,Math.min(5,Number(view.weekCount||5))),ordinals=["1st","2nd","3rd","4th","5th"];
   const cards=Array.from({length:weeks},(_,index)=>`<div class="planner-week-card"><span class="planner-week-label">${ordinals[index]} WEEK</span><span class="planner-week-space"></span></div>`);
   if(view.showMemo!==false)cards.push(`<div class="planner-week-card memo"><span class="planner-week-label">MEMO</span><span class="planner-week-space"></span></div>`);
   return `<div class="widget-memo" data-memo-layout="weekly"><strong class="planner-ribbon">${title}</strong><div class="planner-week-list">${cards.join("")}</div></div>`
  }
  if(layout==="checklist"){
   const count=Math.max(1,Math.min(20,Number(view.itemCount||6)));
   return `<div class="widget-memo" data-memo-layout="checklist"><strong class="planner-ribbon">${title}</strong><div class="planner-check-list" style="grid-template-rows:auto repeat(${count},1fr)"><div class="planner-check-row header"><span>DATE</span><span>TO DO</span><span></span></div>${Array.from({length:count},()=>`<div class="planner-check-row"><span></span><span></span><span></span></div>`).join("")}</div></div>`
  }
  return `<div class="widget-memo" data-memo-layout="${layout}"><strong>${title}</strong><div class="memo-lines" style="--memo-line-count:${Math.max(3,Number(view.lineCount||8))}"></div></div>`
 }
 if(view.type==="monthly-quote"){
  const q=monthlyQuoteForPage(p),s=view.style||{},css=`--quote-title-size:${Number(s.titleSize||13)}px;--quote-ko-size:${Number(s.quoteKoSize||18)}px;--quote-en-size:${Number(s.quoteEnSize||10)}px;--quote-source-size:${Number(s.sourceSize||9)}px;--quote-align:${s.textAlign||"center"};--quote-color:${s.color||"#17202e"};--quote-accent:${s.accentColor||"#315e9e"};--quote-secondary:${s.secondaryColor||"#667085"};--quote-gap:${Number(s.itemGap||7)}px`;
  return `<div class="widget-monthly-quote" style="${css}"><div class="quote-title">${v21Escape(q.title||view.title||"이 달의 명언")}</div><div class="quote-ko">${v21Escape(q.quoteKo||"")}</div>${q.quoteEn?`<div class="quote-en">${v21Escape(q.quoteEn)}</div>`:""}${q.source?`<div class="quote-source">— ${v21Escape(q.source)}</div>`:""}</div>`
 }
 if(view.type==="monthly-schedule"){
  const sizeScale=Math.max(.62,Math.min(1.35,Math.min(Number(view.width||35)/35,Number(view.height||28)/28)));
  const items=currentMonthEvents(p).slice(0,view.maxItems||10);let inner=`<div class="widget-schedule" style="--schedule-pad:${(7*sizeScale).toFixed(1)}px;--schedule-title-size:${(12*sizeScale).toFixed(1)}px;--schedule-font-size:${(9*sizeScale).toFixed(1)}px;--schedule-date-width:${(26*sizeScale).toFixed(1)}px;--schedule-gap:${(4*sizeScale).toFixed(1)}px;--schedule-item-gap:${(4*sizeScale).toFixed(1)}px"><strong>${view.title||"이달의 일정"}</strong>`;
  inner+=items.length?items.map(ev=>`<div class="schedule-item"><time>${ev.startDate.slice(8,10)}일</time><span>${ev.title}</span></div>`).join(""):`<div class="schedule-empty">등록된 일정이 없습니다.</div>`;
  return inner+"</div>"
 }
 if(view.type==="event-list"){
  const year=p.calendarYear||project.settings.year,startMonth=Number(view.startMonth||project.settings.startMonth||1),count=Number(view.monthCount||12);
  const rangeStart=new Date(year,startMonth-1,1),rangeEnd=new Date(year,startMonth-1+count,0);
  const allItems=project.book.events.filter(ev=>{const a=new Date(ev.startDate+"T00:00:00"),b=new Date((ev.endDate||ev.startDate)+"T00:00:00");return a<=rangeEnd&&b>=rangeStart}).sort((a,b)=>a.startDate.localeCompare(b.startDate));
  const items=view.displayMode==="all"?allItems:allItems.slice(0,Number(view.maxItems||24));
  const requestedColumns=view.columns==="auto"?"auto":Math.max(1,Math.min(4,Number(view.columns||1))),fontSize=Math.max(5,Math.min(18,Number(view.fontSize||8))),minFontSize=Math.max(5,Math.min(fontSize,Number(view.minFontSize||6)));
  let inner=`<div class="widget-event-list" data-event-fit="${view.autoShrink===false?"manual":"auto"}" data-event-columns="${requestedColumns}" data-event-width="${Number(view.width||20)}" data-event-height="${Number(view.height||40)}" data-event-font-size="${fontSize}" data-event-min-font-size="${minFontSize}"><strong>${view.title||"전체 학사일정"}</strong><div class="annual-event-items" style="--event-list-columns:${requestedColumns==="auto"?1:requestedColumns};--event-list-font-size:${fontSize}px">`;
  inner+=items.length?items.map(ev=>{const end=view.showEndDate&&ev.endDate&&ev.endDate!==ev.startDate?`–${ev.endDate.slice(5).replace("-",".")}`:"";return `<div class="annual-event-item"><time>${ev.startDate.slice(5).replace("-",".")}${end}</time><span>${ev.title}</span></div>`}).join(""):`<div class="annual-event-empty">등록된 일정이 없습니다.</div>`;
  return inner+`</div><div class="event-list-overflow-warning" aria-hidden="true"></div></div>`
 }
 return ""
}


function createCoverElements(p){
 const isWall=project.productType.category==="wall";
 return [
  {
   id:`cover.school-image.${p.id}`,
   type:"image",
   role:"school-image",
   x:isWall?8:5,
   y:isWall?8:7,
   width:isWall?84:90,
   height:isWall?52:60,
   zIndex:1,
   src:"",
   alt:"학교 전경 이미지",
   fit:"cover"
  },
  {
   id:`cover.year.${p.id}`,
   type:"text",
   role:"year",
   x:isWall?12:9,
   y:isWall?64:69,
   width:isWall?76:28,
   height:isWall?9:13,
   zIndex:3,
   content:String(project.settings.year),
   style:{fontSize:isWall?36:38,textAlign:"left",background:false,color:"#17202e"}
  },
  {
   id:`cover.school-name.${p.id}`,
   type:"text",
   role:"school-name",
   x:isWall?12:39,
   y:isWall?74:70,
   width:isWall?76:52,
   height:isWall?7:11,
   zIndex:3,
   content:project.book.school.name,
   style:{fontSize:isWall?21:24,textAlign:isWall?"left":"right",background:false,color:"#17202e"}
  },
  {
   id:`cover.slogan.${p.id}`,
   type:"text",
   role:"slogan",
   x:isWall?12:39,
   y:isWall?83:82,
   width:isWall?76:52,
   height:isWall?6:8,
   zIndex:3,
   content:"배움으로 성장하고 함께 미래를 여는 학교",
   style:{fontSize:isWall?13:15,textAlign:isWall?"left":"right",background:false,color:"#667085"}
  }
 ]
}
function ensureEditableCover(){
 project.book.elementsByPage ||= {};
 project.book.coverElementsInitialized ||= {};
 project.book.pageInstances.filter(p=>p.role==="cover-front").forEach(p=>{
  if(project.book.coverElementsInitialized[p.id])return;
  const current=project.book.elementsByPage[p.id]||[];
  if(current.length===0)project.book.elementsByPage[p.id]=createCoverElements(p);
  project.book.coverElementsInitialized[p.id]=true
 })
}

function createPosterElements(p){
 const year=p.calendarYear||project.settings.year;
 return [
  {id:`poster.school-name.${p.id}`,type:"text",role:"school-name",binding:"school.name",x:5,y:3,width:65,height:7,zIndex:3,content:project.book.school.name,style:{fontSize:28,textAlign:"left",background:false,color:"#17202e"}},
  {id:`poster.year.${p.id}`,type:"text",role:"year",binding:"calendar.year",x:76,y:3,width:19,height:7,zIndex:3,content:String(year),style:{fontSize:28,textAlign:"right",background:false,color:"#17202e"}},
  {id:`poster.year-calendar.${p.id}`,type:"year-calendar",x:5,y:13,width:68,height:82,zIndex:1,columns:Number(project.settings.posterColumns||4),startMonth:project.settings.startMonth||1,monthCount:12,rowsMode:"inherit",showWeekdayHeader:true},
  {id:`poster.event-list.${p.id}`,type:"event-list",x:76,y:13,width:19,height:82,zIndex:2,title:"전체 학사일정",startMonth:project.settings.startMonth||1,monthCount:12,displayMode:"all",maxItems:24,showEndDate:false,columns:"auto",fontSize:8,minFontSize:6,autoShrink:true}
 ]
}
function ensureEditablePoster(){
 project.book.elementsByPage ||= {};
 project.book.posterElementsInitialized ||= {};
 project.book.pageInstances.filter(p=>p.role==="poster-annual").forEach(p=>{
  if(project.book.posterElementsInitialized[p.id])return;
  const current=project.book.elementsByPage[p.id]||[];
  if(current.length===0)project.book.elementsByPage[p.id]=createPosterElements(p);
  project.book.posterElementsInitialized[p.id]=true
 })
}
function schoolBindingValue(binding){
 const school=project?.book?.school||{};
 if(binding==="school.name")return school.name;
 if(binding==="school.englishName")return school.englishName;
 if(binding==="school.slogan")return school.slogan;
 if(binding==="school.address")return school.address;
 if(binding==="school.website")return school.website;
 if(binding==="school.profile.motto.description")return school.profile?.motto?.description;
 if(binding==="school.profile.song.description")return school.profile?.song?.description;
 if(binding==="school.contacts")return (school.contacts||[]).map(c=>{const label=c.label||"연락처",fax=c.fax?(String(label).includes("팩스")?` ${c.fax}`:` · 팩스 ${c.fax}`):"";return `${label}${c.phone?` ${c.phone}`:""}${fax}`}).join("\n");
 return "";
}
function resolveTextContent(view,p=selectedPage()){
 if(view.binding?.startsWith("school."))return schoolBindingValue(view.binding)||view.content||"학교 정보 입력";
 if(view.binding==="calendar.year")return String(p.calendarYear||project.settings.year||view.content||"");
 return view.content||""
}
function applyCoverTitleSize(size){
 const next=Math.max(8,Math.min(96,Number(size)||34));
 project.template.masters.cover.titleSize=next;
 project.book.pageInstances.filter(page=>page.role==="cover-front").forEach(page=>{
  const elements=[...(project.template.masterElements?.[page.masterId]||[]),...(project.book.elementsByPage?.[page.id]||[])];
  elements.filter(item=>item.type==="text"&&item.role==="school-name").forEach(item=>{item.style||={};item.style.fontSize=next})
 });
 return next
}


const SEMANTIC_DEFS={
 "school-logo":{label:"교표",kind:"image",defaultName:"교표",defaultDescription:""},
 "school-building":{label:"학교 전경",kind:"image-text",defaultName:"우리 학교",defaultDescription:"학교 전경과 교육 환경을 소개합니다."},
 "school-flower":{label:"교화",kind:"symbol",defaultName:"장미",defaultDescription:"사랑과 열정을 상징합니다."},
 "school-tree":{label:"교목",kind:"symbol",defaultName:"소나무",defaultDescription:"굳센 의지와 푸른 꿈을 상징합니다."},
 "school-motto":{label:"교훈",kind:"text",defaultName:"교훈",defaultDescription:"바르게 배우고 함께 성장하자"},
 "school-song":{label:"교가",kind:"song",defaultName:"우리 학교 교가",defaultDescription:"작사 미상 · 작곡 미상"},
 "school-custom-image":{label:"사용자 지정 이미지",kind:"image-text",defaultName:"사용자 지정 이미지",defaultDescription:"학교에서 추가로 사용하는 이미지 자산"}
};
function ensureSchoolProfile(){
 return window.ACDLDatasetDomain.ensureSchoolProfile(project.book.school)
}
function semanticProfileKey(role){return {"school-logo":"logo","school-building":"building","school-flower":"flower","school-tree":"tree","school-motto":"motto","school-song":"song"}[role]||null}
function defaultBindingForRole(role){const key=semanticProfileKey(role);return key?`school.profile.${key}`:(role==="school-custom-image"?"school.customAssets[]":`school.assets.${role}`)}
function defaultSampleForRole(role){
 ensureSchoolProfile();
 const key=semanticProfileKey(role);const base=key?project.book.school.profile[key]:{name:semanticRoleLabel(role),image:"",description:""};
 return structuredClone(base)
}
function ensureSemanticTemplateData(item){
 if(!item||item.type!=="semantic-object")return item;
 if(!Object.prototype.hasOwnProperty.call(item,"sampleContent")){
  const legacy={...defaultSampleForRole(item.role),...(item.contentOverride||{})};
  item.sampleContent=legacy
 }
 if(!Object.prototype.hasOwnProperty.call(item,"bindingEnabled"))item.bindingEnabled=item.binding!==null;
 if(item.bindingEnabled&&(!item.binding||item.binding===""))item.binding=defaultBindingForRole(item.role);
 if(!Object.prototype.hasOwnProperty.call(item,"fallbackToSample"))item.fallbackToSample=true;
 if(!Object.prototype.hasOwnProperty.call(item,"showCaption")&&["image","image-text"].includes(SEMANTIC_DEFS[item.role]?.kind))item.showCaption=false;
 delete item.contentOverride;
 return item
}
function semanticData(item){
 ensureSemanticTemplateData(item);
 return item.sampleContent||defaultSampleForRole(item.role)
}
function semanticBindingLabel(item){
 return item.bindingEnabled&&item.binding?"실제 학교 데이터 연결":"고정 콘텐츠"
}

let toastTimer=null;
function showEditorToast(message){
 if(document.querySelector('#entryScreen:not(.hidden), #designerHome:not(.hidden)'))return;
 const developerToast=/Shift 다중 선택|방향키 이동|Ctrl\+Z|개체를 드래그|크기 조절점|Inspector에서|Runtime|메모리|진단|디버그|현재 템플릿 설계 모드|월력을 선택했|Canvas에서 직접|Master를 선택|Binding|고정 콘텐츠 개체|페이지 .*개체|개발자/i.test(String(message||""));
 if(developerToast)return;
 const node=el("editorToast");if(!node)return;
 node.textContent=message;node.classList.add("show");
 clearTimeout(toastTimer);toastTimer=setTimeout(()=>node.classList.remove("show"),2600)
}
function switchEditMode(mode){
 editMode=mode;
 if(mode==="template")showEditorToast("템플릿 편집으로 전환했습니다. 개체를 드래그하거나 크기 조절점을 사용하세요.");
 render()
}
function findSemanticPlacement(base,arr){
 return {x:Math.max(0,Math.min(100-base.width,base.x)),y:Math.max(0,Math.min(100-base.height,base.y)),width:base.width,height:base.height}
}

function renderSampleAssetLibrary(){renderResourceAssetManager();renderRegisteredAssetLibrary()}
function renderRegisteredAssetLibrary(){
 const section=el("registeredAssetSection"),grid=el("registeredAssetGrid");if(!section||!grid||!project)return;
 const assets=projectSampleAssets();section.classList.toggle("hidden",!assets.length);
 grid.innerHTML=assets.map(a=>`<button type="button" class="registered-asset-card" data-drawer-asset="${a.id}"><img src="${a.image}" alt="${a.name}"><strong>${a.name}</strong><span>${semanticRoleLabel(a.role)}</span></button>`).join("");
 grid.querySelectorAll("[data-drawer-asset]").forEach(b=>b.addEventListener("click",()=>{createSemanticObjectFromAsset(b.dataset.drawerAsset);el("objectDrawer").classList.add("hidden")}));
}
function renderResourceAssetManager(){
 ensureAssetResources();const count=el("resourceAssetCount");if(count)count.textContent=`${allSampleAssets().length}개`;
 const grid=el("resourceAssetManagerGrid");if(!grid)return;
 const activeIds=new Set(Object.values(project.book.school?.profile||{}).map(v=>v?.assetId).filter(Boolean));
 const assets=[...BUILTIN_SAMPLE_ASSETS,...projectSampleAssets()];
 grid.innerHTML=assets.map(a=>{const builtin=BUILTIN_SAMPLE_ASSETS.some(x=>x.id===a.id),active=activeIds.has(a.id);return `<article class="asset-manager-card ${active?"is-active":""}"><div class="asset-manager-image"><img src="${a.image}" alt="${a.name}"></div><div class="asset-manager-body"><strong>${a.name}</strong><small>${semanticRoleLabel(a.role)} · ${a.binding||defaultBindingForRole(a.role)}</small><span class="resource-status">${active?"현재 연결됨":builtin?"기본 제공":"템플릿 등록"}</span><div class="asset-manager-actions"><button type="button" class="primary" data-add-managed-asset="${a.id}">개체로 추가</button>${builtin?`<button type="button" disabled>기본 자산</button>`:`<button type="button" class="danger" data-delete-managed-asset="${a.id}">삭제</button>`}</div></div></article>`}).join("");
 grid.querySelectorAll("[data-add-managed-asset]").forEach(b=>b.addEventListener("click",()=>{createSemanticObjectFromAsset(b.dataset.addManagedAsset);closeResourceModal()}));
 grid.querySelectorAll("[data-delete-managed-asset]").forEach(b=>b.addEventListener("click",()=>{if(!confirm("이 템플릿 자산을 삭제할까요?"))return;snapshot();ensureAssetResources();const id=b.dataset.deleteManagedAsset;project.template.resources.sampleAssets=projectSampleAssets().filter(a=>a.id!==id);Object.values(project.book.school.profile||{}).forEach(v=>{if(v?.assetId===id){v.assetId=null;v.image=""}});markDirty();renderResourceAssetManager();renderRegisteredAssetLibrary();showEditorToast("템플릿 자산을 삭제했습니다.")}));
}
function createSemanticObjectFromAsset(assetId){const asset=allSampleAssets().find(a=>a.id===assetId);if(!asset)return;createSemanticObject(asset.role,{asset})}
function createSemanticObject(role,{asset=null}={}){
 const scope=el("elementScope").value,arr=scope==="master"?masterElements():pageElements();
 const presets={
  "school-logo":{x:66,y:10,width:22,height:28,layout:"image-only"},
  "school-building":{x:20,y:14,width:58,height:52,layout:"image-top"},
  "school-flower":{x:12,y:20,width:34,height:47,layout:"image-top"},
  "school-tree":{x:52,y:20,width:34,height:47,layout:"image-top"},
  "school-motto":{x:18,y:34,width:64,height:28,layout:"center"},
  "school-song":{x:12,y:12,width:76,height:70,layout:"image-top"},
  "school-custom-image":{x:18,y:18,width:46,height:42,layout:"image-top"}
 };
 const p=presets[role],placed=findSemanticPlacement(p,arr);
 const sample=asset?{...defaultSampleForRole(role),name:asset.name,image:asset.image}:defaultSampleForRole(role);
 const item={id:`semantic.${role}.${Date.now()}`,type:"semantic-object",role,binding:asset?.binding||defaultBindingForRole(role),bindingEnabled:true,fallbackToSample:true,sampleAssetId:asset?.id||null,sampleContent:sample,x:placed.x,y:placed.y,width:placed.width,height:placed.height,zIndex:maxZ(scope)+1,layoutPreset:p.layout,style:{titleSize:18,descriptionSize:11,textAlign:"center",background:true,border:true}};
 snapshot();arr.push(item);selectedElementId=item.id;selectedElementScope=scope;
 semanticImageDraft=null;semanticImageDraftElementId=null;
 el("objectDrawer").classList.add("hidden");render();
 showEditorToast(editMode==="content"
  ? `${semanticRoleLabel(role)} 개체를 빈 공간에 추가했습니다. 위치 변경은 템플릿 편집에서 할 수 있습니다.`
  : `${semanticRoleLabel(role)} 개체를 추가했습니다. 바로 이동하거나 크기를 조절할 수 있습니다.`)
}
function semanticRoleLabel(role){return SEMANTIC_DEFS[role]?.label||role}
function renderSemanticObject(item){
 const d=semanticData(item),layout=item.layoutPreset||"image-top",role=item.role;
 const image=d.image?`<img src="${d.image}" alt="${semanticRoleLabel(role)} 이미지">`:`<span class="semantic-empty-visual non-output editor-only" aria-label="${semanticRoleLabel(role)} 이미지 슬롯"></span>`;
 if(role==="school-logo")return `<div class="semantic-object semantic-logo"><div class="semantic-media">${image}</div></div>`;
 if(layout==="desk-six-symbol-card"){
  if(role==="school-motto")return `<div class="semantic-object desk-six-symbol-card semantic-motto"><strong style="font-size:${item.style?.titleSize||15}px">${item.titleOverride||d.name||"교훈"}</strong><p style="font-size:${item.style?.descriptionSize||11}px">${d.description||""}</p></div>`;
  return `<div class="semantic-object desk-six-symbol-card ${role==="school-song"?"semantic-song":""}"><strong style="font-size:${item.style?.titleSize||14}px">${item.titleOverride||d.name||semanticRoleLabel(role)}</strong><div class="semantic-media">${image}</div>${item.showCaption===false?"":`<p style="font-size:${item.style?.descriptionSize||8}px">${d.description||""}</p>`}</div>`
 }
 if(role==="school-motto")return `<div class="semantic-object semantic-motto"><strong style="font-size:${item.style?.titleSize||18}px">${item.titleOverride||d.name||"교훈"}</strong><p style="font-size:${item.style?.descriptionSize||11}px">${d.description||""}</p></div>`;
 if(role==="school-song")return `<div class="semantic-object semantic-song"><div class="semantic-media">${image}</div><div class="semantic-copy"><strong style="font-size:${item.style?.titleSize||18}px">${item.titleOverride||d.name||"교가"}</strong><p style="font-size:${item.style?.descriptionSize||11}px">${d.description||""}</p></div></div>`;
 return `<div class="semantic-object ${layout==="image-left"?"semantic-layout-row":""}"><div class="semantic-media">${image}</div>${item.showCaption===true?`<div class="semantic-copy" style="text-align:${item.style?.textAlign||"center"}"><strong style="font-size:${item.style?.titleSize||18}px">${item.titleOverride||d.name||semanticRoleLabel(role)}</strong><p style="font-size:${item.style?.descriptionSize||11}px">${d.description||""}</p></div>`:""}</div>`
}
function pageRecommendations(p){
 if(p.role==="cover-front")return ["school-building","school-logo"];
 if(p.role.includes("front-insert")||p.role.includes("rear-insert"))return ["school-motto","school-flower","school-tree","school-song"];
 if(p.role==="monthly-front")return ["school-logo"];
 if(p.role==="monthly-back")return ["school-building"];
 return ["school-logo","school-motto"]
}
function renderObjectRecommendations(){
 const wrap=el("recommendedObjects");if(!wrap||!project)return;
 wrap.innerHTML=pageRecommendations(selectedPage()).map(role=>`<button type="button" data-recommend-role="${role}">${semanticRoleLabel(role)}</button>`).join("");
 wrap.querySelectorAll("[data-recommend-role]").forEach(b=>b.addEventListener("click",()=>createSemanticObject(b.dataset.recommendRole)))
}


function canonicalMasterIdForPage(p){
 const type=project?.productType?.category||project?.settings?.type;
 if(type==="postcard"&&p.role==="monthly-front")return "master.postcard.monthly.front";
 if(type==="wall"&&p.role==="monthly-front")return "master.wall.monthly.front";
 if(p.role==="monthly-front")return "master.monthly.front";
 if(p.role==="monthly-back")return "master.monthly.back";
 return p.masterId||`master.${p.role}`
}
function normalizeMonthlyMasterIds(){
 project.template.masterElements ||= {};
 project.book.pageInstances.forEach(p=>{
  if(p.role!=="monthly-front"&&p.role!=="monthly-back")return;
  const canonical=canonicalMasterIdForPage(p);
  const legacy=p.masterId;
  if(legacy&&legacy!==canonical&&project.template.masterElements[legacy]?.length){
   project.template.masterElements[canonical] ||= [];
   const existingIds=new Set(project.template.masterElements[canonical].map(x=>x.id));
   project.template.masterElements[legacy].forEach(item=>{
    if(!existingIds.has(item.id))project.template.masterElements[canonical].push(item)
   })
  }
  p.masterId=canonical
 })
}
function monthlyPagesForRole(role){
 return project.book.pageInstances.filter(p=>p.role===role)
}
function verifyMonthlyMasterPropagation(role,itemId){
 const canonical=role==="monthly-back"?"master.monthly.back":"master.monthly.front";
 const pages=monthlyPagesForRole(role);
 const masterItems=project.template.masterElements[canonical]||[];
 return {
  canonical,
  pageCount:pages.length,
  matchingPages:pages.filter(p=>canonicalMasterIdForPage(p)===canonical).length,
  itemExists:masterItems.some(item=>item.id===itemId)
 }
}

function normalizeElementData(){
 project.book.school ||= {name:"샘플 학교"};
 project.book.school.name ||= "샘플 학교";
 project.book.school.englishName ||= "";
 project.book.school.slogan ||= "배움으로 성장하고 함께 미래를 여는 학교";
 project.book.school.address ||= "";
 project.book.school.phone ||= "";
 project.book.school.website ||= "";
 project.settings.calendarRows=Number(project.settings.calendarRows||6);
 project.settings.showAdjacentMiniCalendars=project.settings.showAdjacentMiniCalendars!==false;
 normalizeMonthlyMasterIds();
 project.settings.weekStart=project.settings.weekStart||"sunday";
 ensureSchoolProfile();
 project.template.masterElements ||= {};
 project.book.elementsByPage ||= {};
 project.book.pageInstances.forEach(p=>{project.book.elementsByPage[p.id] ||= []});
 ensureMonthlyQuotes();
 Object.values(project.template.masterElements).flat().forEach(ensureSemanticTemplateData);
 Object.values(project.book.elementsByPage).flat().forEach(ensureSemanticTemplateData);
 project.template.editorType="academic-calendar-template-designer";
 project.template.sampleDataVersion=1;
 project.template.metadata ||= {name:"학교 학사달력 템플릿",description:"학교용 학사달력 템플릿",author:"",version:"1.0.0",language:"ko-KR"};
 project.template.publishing ||= {};
 project.template.publishing.schemaVersion ||= "template-publishing.v1";
 project.template.publishing.dataRequirements ||= defaultTemplateInputRequirements();
 project.template.resources ||= {};
 normalizeAIDesignBackgrounds();
 project.template.resources.sampleAssetLibraryVersion=2;
 project.template.resources.sampleAssets ||= [];
 project.template.masters.calendar.rangeEventStyle ||= {enabled:true,contractId:"user-service-v1.1",contractRevision:"1.0.0",labelMode:"every",labelPosition:"inside",barHeight:14,laneGap:1,maxLanes:4,continuationStyle:"arrow",overflowStyle:"count"};
 ensureEditableCover();
 ensureEditablePoster();
}
function normalizeAIDesignBackgrounds(){
 window.ACDLProjectAssetResolver?.normalize(project);
 const resources=project?.template?.resources?.aiDesignAssets||[];
 Object.values(project?.book?.elementsByPage||{}).flat().filter(item=>item?.role==="ai-design-background").forEach(item=>{
  const resourceId=item.assetId||item.aiDesign?.resourceId||item.aiDesign?.assetId;
  const resource=resources.find(candidate=>candidate.id===resourceId)||resources.find(candidate=>candidate.src&&candidate.src===item.src);
  if(resource){item.assetId=resource.id;item.aiDesign={...(item.aiDesign||{}),resourceId:resource.id,sourceAssetId:item.aiDesign?.sourceAssetId||resource.source?.assetId};delete item.src}
  item.zIndex=0;item.locked=true;item.selectable=false;
 });
}
function pageElements(p=selectedPage()){normalizeElementData();return project.book.elementsByPage[p.id]}
function masterElements(p=selectedPage()){
 normalizeElementData();
 const masterId=canonicalMasterIdForPage(p);
 p.masterId=masterId;
 project.template.masterElements[masterId] ||= [];
 return project.template.masterElements[masterId]
}
function isMonthBackCompositionElement(item){return ["image-frame","mini-calendar","mini-calendar-prev","mini-calendar-next","month-date-strip"].includes(item.type)||item.type==="memo"||["monthly-goal","monthly-todo","weekly-planner"].includes(item.role)}
function allVisibleElements(){const page=selectedPage(),pageItems=pageElements(),shadowed=new Set(pageItems.map(e=>e.shadowOfMasterElementId).filter(Boolean)),hideInheritedDecoration=page.aiDesignBase?.mode==="neutral",replaceMonthBackComposition=page.aiMonthBackComposition?.mode==="generated-layout";return [...masterElements().filter(e=>!shadowed.has(e.id)).filter(e=>!hideInheritedDecoration||!isInheritedDesignDecoration(e)).filter(e=>!replaceMonthBackComposition||!isMonthBackCompositionElement(e)).map(e=>({...e,_scope:"master"})),...pageItems.map(e=>({...e,_scope:"page"}))].sort((a,b)=>(a.zIndex||0)-(b.zIndex||0))}
function sourceElement(){
 if(!selectedElementId)return null;
 const arr=selectedElementScope==="master"?masterElements():pageElements();
 return arr.find(e=>e.id===selectedElementId)||null
}
function ensureCurrentPageEditTarget(id=selectedElementId,scope=selectedElementScope){
 const original=scope==="master"?masterElements().find(item=>item.id===id):pageElements().find(item=>item.id===id);
 if(!original||scope!=="master"||el("elementScope")?.value!=="page")return {id,scope,item:original,created:false};
 const pageItems=pageElements();let pageItem=pageItems.find(item=>item.shadowOfMasterElementId===id),created=false;
 if(!pageItem){
  pageItem=typeof structuredClone==="function"?structuredClone(original):JSON.parse(JSON.stringify(original));
  pageItem.id=`element.page-override.${Date.now()}.${Math.random().toString(36).slice(2,6)}`;
  pageItem.shadowOfMasterElementId=original.id;pageItem.originScope="master";pageItems.push(pageItem);created=true;
 }
 selectedElementId=pageItem.id;selectedElementScope="page";
 return {id:pageItem.id,scope:"page",item:pageItem,created}
}
function maxZ(scope){const arr=scope==="master"?masterElements():pageElements();return arr.reduce((m,e)=>Math.max(m,e.zIndex||0),0)}
function addElement(type){
 const scope=el("elementScope").value;const arr=scope==="master"?masterElements():pageElements();
 const elem={id:`element.${type}.${Date.now()}`,type,x:15,y:18,width:type==="text"?32:38,height:type==="text"?13:28,zIndex:maxZ(scope)+1};
 if(type==="text")Object.assign(elem,{content:"새 텍스트",style:{fontSize:18,textAlign:"left",background:false,color:"#17202e"}});
 else Object.assign(elem,{src:"",alt:"추가 이미지",fit:"cover"});
 snapshot();arr.push(elem);selectedElementId=elem.id;selectedElementScope=scope;pendingImageElementId=type==="image"?elem.id:null;pendingImageElementScope=type==="image"?scope:null;render();
 if(type==="image")el("elementImageInput").click()
}
function resolveElementImageSource(view){
 const common=window.ACDLProjectAssetResolver?.elementSource(project,view);if(common)return common;
 if(view?.src)return view.src;
 const resourceId=view?.assetId||view?.aiDesign?.resourceId;
 return resourceId?(project?.template?.resources?.aiDesignAssets||[]).find(item=>item.id===resourceId)?.src||"":"";
}
function renderFreeElements(pageNode){
 let layer=document.createElement("div");layer.className="free-layer";
 allVisibleElements().forEach(view=>{
  const box=document.createElement("div");box.className=`free-element ${view._scope==="master"?"master-element":""} ${view.id===selectedElementId&&view._scope===selectedElementScope?"active":""}`;
  box.dataset.elementId=view.id;box.dataset.scope=view._scope;box.dataset.elementType=view.type;box.dataset.elementRole=view.role||"";box.dataset.themeRole=["year","school-name"].includes(view.role)?"title":view.role==="slogan"?"secondary":"body";box.style.left=view.x+"%";box.style.top=view.y+"%";box.style.width=view.width+"%";box.style.height=view.height+"%";box.style.zIndex=view.zIndex||1;box.style.transform=`rotate(${view.rotation||0}deg)`;
  if(view.role){
   const badge=document.createElement("span");badge.className="cover-role-badge";badge.textContent={"school-image":"학교 전경","year":"연도","school-name":"학교명","slogan":"슬로건"}[view.role]||view.role;box.appendChild(badge)
  }
  if(["mini-calendar","mini-calendar-prev","mini-calendar-next","year-calendar","memo","monthly-schedule","event-list","month-date-strip","monthly-quote"].includes(view.type)){
   box.innerHTML=renderWidgetContent(view,selectedPage())
  }else if(view.type==="semantic-object"){
   box.innerHTML=renderSemanticObject(view);
   const badge=document.createElement("span");badge.className=`semantic-role-badge non-output editor-only ${view.bindingEnabled===false?"binding-off":""}`;badge.textContent=`${semanticRoleLabel(view.role)} · ${view.bindingEnabled===false?"고정":"연결"}`;box.appendChild(badge)
  }else if(view.type==="text"){
   const t=document.createElement("div");t.className="free-text";t.textContent=resolveTextContent(view,selectedPage());applyTextElementStyles(t,view);box.appendChild(t)
  }else if(resolveElementImageSource(view)){
   const img=document.createElement("img");img.className="free-image";img.src=resolveElementImageSource(view);img.alt=view.alt||"사용자 이미지";img.style.objectFit=view.fit||"cover";box.appendChild(img)
  }else{
   const empty=document.createElement("div");empty.className="free-image empty";empty.textContent="이미지를 선택하세요";box.appendChild(empty)
  }
  if(view.id===selectedElementId&&view._scope===selectedElementScope&&!preview){
   const lab=document.createElement("span");lab.className="elem-label";lab.textContent=view._scope==="master"?"MASTER":"PAGE";box.appendChild(lab);
   ["e","s","se"].forEach(pos=>{const h=document.createElement("span");h.className="elem-handle "+pos;h.dataset.handle=pos;box.appendChild(h)})
  }
  if(view.role!=="ai-design-background")box.addEventListener("pointerdown",startElementPointer);layer.appendChild(box)
 });pageNode.appendChild(layer)
}
function applyTextElementStyles(node,view){
 const style=view.style||{},size=style.fontSize||project.template.masters.cover.titleSize||18,align=style.textAlign||"left",vertical=style.verticalAlign||"top";
 node.style.fontSize=size+"px";node.style.setProperty("--element-font-size",String(size));node.style.fontFamily=style.fontFamily||(["year","school-name"].includes(view.role)?"var(--tpl-title-font)":"var(--tpl-body-font)");node.style.fontWeight=String(style.fontWeight||"normal");node.style.fontStyle=style.fontStyle||"normal";node.style.textDecoration=style.textDecoration||"none";node.style.textAlign=align;node.style.justifyContent=align==="center"?"center":align==="right"?"flex-end":"flex-start";node.style.alignItems=vertical==="middle"?"center":vertical==="bottom"?"flex-end":"flex-start";node.style.color=style.color||"#17202e";node.style.letterSpacing=Number(style.letterSpacing||0)+"px";node.style.lineHeight=String(style.lineHeight||1.2);node.style.opacity=String(style.opacity??1);node.style.background=style.background?(style.backgroundColor||"#ffffff"):"transparent";node.style.webkitTextStroke=Number(style.strokeWidth||0)+"px "+(style.strokeColor||"transparent");node.style.textShadow=style.shadow?`${Number(style.shadowX||0)}px ${Number(style.shadowY||0)}px ${Number(style.shadowBlur||0)}px ${style.shadowColor||"#000000"}`:"none"
}
function startElementPointer(e){
 const box=e.currentTarget,id=box.dataset.elementId,scope=box.dataset.scope;
 e.preventDefault();
 if((id!==selectedElementId||scope!==selectedElementScope)&&!confirmDiscardInspectorChanges())return;
 inspectorDirty=false;inspectorNotice={type:"ready",message:"선택한 개체의 설정을 변경할 수 있습니다."};
 selectedElementId=id;selectedElementScope=scope;
 let pageOverrideCreated=false;
 if(scope==="master"&&el("elementScope")?.value==="page"){
  const masterItem=sourceElement(),pageItems=pageElements(),existing=pageItems.find(item=>item.shadowOfMasterElementId===id);
  if(existing){selectedElementId=existing.id;selectedElementScope="page"}
  else if(masterItem){snapshot();const clone=typeof structuredClone==="function"?structuredClone(masterItem):JSON.parse(JSON.stringify(masterItem));clone.id=`element.page-override.${Date.now()}`;clone.shadowOfMasterElementId=masterItem.id;clone.originScope="master";pageItems.push(clone);selectedElementId=clone.id;selectedElementScope="page";pageOverrideCreated=true;showEditorToast("현재 페이지 전용 개체로 분리했습니다.")}
 }
 const item=sourceElement();if(!item)return;
 if(!pageOverrideCreated)snapshot();
 box.classList.add("active");
 box.setPointerCapture(e.pointerId);
 elementDrag={
  startX:e.clientX,
  startY:e.clientY,
  handle:e.target.dataset.handle||"move",
  original:{...item},
  pageRect:el("page").getBoundingClientRect(),
  node:box,
  changed:false,
  pageOverrideCreated
 };
 box.addEventListener("pointermove",moveElementPointer);
 box.addEventListener("pointerup",endElementPointer,{once:true});
 box.addEventListener("pointercancel",endElementPointer,{once:true})
}
function moveElementPointer(e){
 if(!elementDrag)return;
 const item=sourceElement();if(!item)return;
 const dx=(e.clientX-elementDrag.startX)/elementDrag.pageRect.width*100;
 const dy=(e.clientY-elementDrag.startY)/elementDrag.pageRect.height*100;
 const o=elementDrag.original;
 if(Math.abs(dx)>.05||Math.abs(dy)>.05)elementDrag.changed=true;
 if(elementDrag.handle==="move"){item.x=o.x+dx;item.y=o.y+dy}
 if(elementDrag.handle==="e"||elementDrag.handle==="se")item.width=o.width+dx;
 if(elementDrag.handle==="s"||elementDrag.handle==="se")item.height=o.height+dy;
 item.width=Math.max(3,Math.min(100,item.width));
 item.height=Math.max(3,Math.min(100,item.height));
 item.x=Math.max(0,Math.min(item.x,100-item.width));
 item.y=Math.max(0,Math.min(item.y,100-item.height));
 const node=elementDrag.node;
 node.style.left=item.x+"%";
 node.style.top=item.y+"%";
 node.style.width=item.width+"%";
 node.style.height=item.height+"%"
}
function endElementPointer(e){
 if(!elementDrag)return;
 const node=elementDrag.node;
 try{node.releasePointerCapture(e.pointerId)}catch{}
 node.removeEventListener("pointermove",moveElementPointer);
 node.removeEventListener("pointercancel",endElementPointer);
 const changed=elementDrag.changed,overrideCreated=elementDrag.pageOverrideCreated;
 elementDrag=null;
 if(!changed&&!overrideCreated){
  history.pop();
  el("undoBtn").disabled=!history.length;
 }
 markDirty();
 inspectorNotice={type:"success",message:overrideCreated?"현재 페이지 전용 개체로 분리했습니다.":changed?"Canvas에서 변경한 개체 위치와 크기를 반영했습니다.":"개체를 선택했습니다."};
 render()
}

function monthlyMasterLabel(p=selectedPage()){
 return p.role==="monthly-back"?"모든 월력 뒷면":"모든 월력 앞면"
}
function canPromoteSelectedToMonthlyMaster(){
 const p=selectedPage(),item=sourceElement();
 return item&&selectedElementScope==="page"&&(p.role==="monthly-front"||p.role==="monthly-back")
}
function promoteSelectedToMonthlyMaster(){
 if(!canPromoteSelectedToMonthlyMaster())return;
 const p=selectedPage(),role=p.role,pageArr=pageElements(p),idx=pageArr.findIndex(x=>x.id===selectedElementId);
 if(idx<0)return;
 snapshot();
 const item=structuredClone(pageArr[idx]);
 const targetMasterId=role==="monthly-back"?"master.monthly.back":"master.monthly.front";
 item.id=`${targetMasterId}.${item.type}.${Date.now()}`;
 item.masterRole=role;
 item.masterId=targetMasterId;
 pageArr.splice(idx,1);
 project.template.masterElements[targetMasterId] ||= [];
 project.template.masterElements[targetMasterId].push(item);
 monthlyPagesForRole(role).forEach(page=>page.masterId=targetMasterId);
 selectedElementId=item.id;selectedElementScope="master";
 const verification=verifyMonthlyMasterPropagation(role,item.id);
 markDirty();
 inspectorNotice={
  type:verification.itemExists&&verification.matchingPages===verification.pageCount?"success":"error",
  message:verification.itemExists&&verification.matchingPages===verification.pageCount
   ?`${verification.pageCount}개 ${role==="monthly-back"?"월력 뒷면":"월력 앞면"}에 공통 적용했습니다.`
   :"Master 적용 확인 중 문제가 발견되었습니다."
 };
 render();
 showEditorToast(inspectorNotice.message)
}

function duplicateSelected(){
 const item=sourceElement();if(!item)return;const scope=selectedElementScope,arr=scope==="master"?masterElements():pageElements();snapshot();const copy=structuredClone(item);copy.id=`element.${item.type}.${Date.now()}`;copy.x=Math.min(item.x+3,100-item.width);copy.y=Math.min(item.y+3,100-item.height);copy.zIndex=maxZ(scope)+1;arr.push(copy);selectedElementId=copy.id;render()
}
function deleteSelected(){
 const item=sourceElement();if(!item)return;snapshot();const arr=selectedElementScope==="master"?masterElements():pageElements();arr.splice(arr.findIndex(e=>e.id===selectedElementId),1);selectedElementId=null;selectedElementScope=null;render()
}
function elementInspectorPanels(){
 const item=sourceElement();
 const panels={content:"",design:"",layout:""};
 if(!item)return panels;
 const roleNames={"school-image":"학교 전경 이미지","year":"연도","school-name":"학교명","slogan":"학교 슬로건"};
 const roleName=item.type==="semantic-object"?semanticRoleLabel(item.role):roleNames[item.role];
 const head=`<div class="section element-inspector"><span class="layer-chip">${selectedElementScope==="master"?"Master 공통 요소":"현재 페이지 요소"}${roleName?" · "+roleName:""}</span>`;
 if(item.type==="semantic-object"){
  ensureSemanticTemplateData(item);
  const d=semanticData(item),draftImage=semanticImageDraftElementId===item.id?semanticImageDraft:null,previewImage=draftImage||d.image||"";
  let c=head+`<div class="template-help-card">이 개체에는 템플릿 선택 화면에서 보여줄 <strong>샘플 콘텐츠</strong>와 실제 학교 정보가 들어올 <strong>데이터 연결</strong>이 함께 저장됩니다.</div>`;
  c+=`<div class="inspector-group"><div class="inspector-group-title"><span>샘플 콘텐츠</span><span class="sample-badge">TEMPLATE SAMPLE</span></div>`;
  if(item.role!=="school-motto")c+=`<label>${semanticRoleLabel(item.role)} 샘플 이미지</label><div class="semantic-image-preview">${previewImage?`<img src="${previewImage}" alt="${semanticRoleLabel(item.role)} 샘플 이미지">`:"샘플 이미지를 선택하세요."}</div><button id="replaceSemanticImage" class="action secondary">${previewImage?"샘플 이미지 교체":"샘플 이미지 선택"}</button>`;
  if(item.role!=="school-logo"){
   c+=`<label>${item.role==="school-song"?"샘플 교가 제목":"샘플 명칭"}<input id="semanticName" value="${d.name||""}"></label>`;
   c+=`<label>${item.role==="school-song"?"샘플 작사·작곡/설명":"샘플 설명"}<textarea id="semanticDescription" rows="4">${d.description||""}</textarea></label>`;
  }
  c+=`<button id="applySemanticSample" class="action">샘플 콘텐츠 저장</button></div>`;
  c+=`<div class="inspector-group"><div class="inspector-group-title"><span>데이터 연결</span><span class="${item.bindingEnabled?"binding-badge":"fixed-badge"}">${item.bindingEnabled?"BOUND DATA":"FIXED"}</span></div><label>개체 동작<select id="semanticBindingMode"><option value="bound" ${item.bindingEnabled?"selected":""}>실제 학교 데이터와 연결</option><option value="fixed" ${!item.bindingEnabled?"selected":""}>고정 콘텐츠로 사용</option></select></label><label>연결 대상<select id="semanticBindingPath"><option value="${defaultBindingForRole(item.role)}">${semanticRoleLabel(item.role)} · ${defaultBindingForRole(item.role)}</option></select></label><div class="binding-path">${item.bindingEnabled?(item.binding||defaultBindingForRole(item.role)):"Binding 없음 — 샘플 콘텐츠가 최종 콘텐츠로 유지됩니다."}</div><label class="inline-check"><input id="semanticFallback" type="checkbox" ${item.fallbackToSample!==false?"checked":""}><span>실제 학교 데이터가 없으면 샘플 콘텐츠 표시</span></label><button id="applySemanticBinding" class="action">데이터 연결 저장</button></div></div>`;
  panels.content=c;
  let dsg=head+`<div class="inspector-group"><div class="inspector-group-title"><span>레이아웃과 스타일</span><small>표현 방식</small></div>`;
  if(!["school-logo","school-motto"].includes(item.role))dsg+=`<label>내부 배치<select id="semanticLayout"><option value="image-top" ${item.layoutPreset==="image-top"?"selected":""}>이미지 위 · 설명 아래</option><option value="image-left" ${item.layoutPreset==="image-left"?"selected":""}>이미지 왼쪽 · 설명 오른쪽</option></select></label>`;
  dsg+=`<div class="grid2"><label>제목 크기<input id="semanticTitleSize" type="number" min="8" max="60" value="${item.style?.titleSize||18}"></label><label>설명 크기<input id="semanticDescriptionSize" type="number" min="7" max="32" value="${item.style?.descriptionSize||11}"></label></div><label>텍스트 정렬<select id="semanticTextAlign"><option value="left" ${item.style?.textAlign==="left"?"selected":""}>왼쪽</option><option value="center" ${item.style?.textAlign==="center"?"selected":""}>가운데</option><option value="right" ${item.style?.textAlign==="right"?"selected":""}>오른쪽</option></select></label><button id="applySemanticTemplate" class="action">레이아웃·스타일 저장</button></div></div>`;
  panels.design=dsg;
 }else if(item.type==="text"){
  const boundText=!!item.binding,resolvedText=resolveTextContent(item,selectedPage());
  const yearFormat=item.binding==="calendar.year"?`<label>연도 형식<select id="elemYearFormat"><option value="year-plain" ${!item.format||item.format==="year-plain"?"selected":""}>2028</option><option value="year-ko" ${item.format==="year-ko"?"selected":""}>2028년</option><option value="academic-year" ${item.format==="academic-year"?"selected":""}>2028학년도</option><option value="year-range" ${item.format==="year-range"?"selected":""}>2028–2029</option></select></label>`:"";
  panels.content=head+`<label>표시 방식<select id="elemTextBinding"><option value="" ${!item.binding?"selected":""}>고정 텍스트 · 아래 입력값 표시</option><option value="school.name" ${item.binding==="school.name"?"selected":""}>학교 이름과 연결</option><option value="school.englishName" ${item.binding==="school.englishName"?"selected":""}>영문 학교명과 연결</option><option value="school.slogan" ${item.binding==="school.slogan"?"selected":""}>슬로건과 연결</option><option value="school.address" ${item.binding==="school.address"?"selected":""}>학교 주소와 연결</option><option value="school.website" ${item.binding==="school.website"?"selected":""}>홈페이지와 연결</option><option value="school.contacts" ${item.binding==="school.contacts"?"selected":""}>연락처 목록과 연결</option><option value="school.profile.motto.description" ${item.binding==="school.profile.motto.description"?"selected":""}>교훈과 연결</option><option value="school.profile.song.description" ${item.binding==="school.profile.song.description"?"selected":""}>교가 정보와 연결</option><option value="calendar.year" ${item.binding==="calendar.year"?"selected":""}>달력 연도와 연결</option></select></label>${yearFormat}<label>${boundText?"데이터가 없을 때 표시할 대체 텍스트":"표시할 텍스트"}<textarea id="elemText" rows="4">${item.content||""}</textarea></label>${boundText?`<div class="binding-path">현재 화면 표시: ${v21Escape(resolvedText||"연결 데이터 없음")}</div><div class="hint">연결된 프로젝트 데이터가 우선이며, 위 문구는 연도 데이터가 없을 때만 표시됩니다.</div>`:`<div class="hint">입력한 문구가 편집 화면과 출력물에 그대로 표시됩니다.</div>`}<button id="applyTextContent" class="action">표시 방식·텍스트 저장</button></div>`;
  const s=item.style||{},decoration=String(s.textDecoration||"");
  panels.design=head+`<div class="inspector-group"><div class="inspector-group-title"><span>글꼴과 글자</span><small>모든 텍스트 공통</small></div><label>글꼴<select id="elemFontFamily"><option value="" ${!s.fontFamily?"selected":""}>템플릿 기본 글꼴</option><option value="Pretendard" ${s.fontFamily==="Pretendard"?"selected":""}>Pretendard</option><option value="Noto Sans KR" ${s.fontFamily==="Noto Sans KR"?"selected":""}>Noto Sans KR</option><option value="Noto Serif KR" ${s.fontFamily==="Noto Serif KR"?"selected":""}>Noto Serif KR</option><option value="Nanum Gothic" ${s.fontFamily==="Nanum Gothic"?"selected":""}>나눔고딕</option><option value="Nanum Myeongjo" ${s.fontFamily==="Nanum Myeongjo"?"selected":""}>나눔명조</option><option value="Arial" ${s.fontFamily==="Arial"?"selected":""}>Arial</option><option value="Times New Roman" ${s.fontFamily==="Times New Roman"?"selected":""}>Times New Roman</option><option value="Playfair Display" ${s.fontFamily==="Playfair Display"?"selected":""}>Playfair Display</option></select></label><div class="grid2"><label>글자 크기<input id="elemFontSize" type="number" min="1" max="240" step=".5" value="${s.fontSize||18}"></label><label>글자 굵기<select id="elemFontWeight">${[100,200,300,400,500,600,700,800,900].map(weight=>`<option value="${weight}" ${Number(s.fontWeight||400)===weight?"selected":""}>${weight}${weight===400?" · 보통":weight===700?" · 굵게":""}</option>`).join("")}</select></label></div><div class="text-style-checks"><label><input id="elemItalic" type="checkbox" ${s.fontStyle==="italic"?"checked":""}>기울임</label><label><input id="elemUnderline" type="checkbox" ${decoration.includes("underline")?"checked":""}>밑줄</label><label><input id="elemStrike" type="checkbox" ${decoration.includes("line-through")?"checked":""}>취소선</label></div><div class="grid2"><label>가로 정렬<select id="elemAlign"><option value="left" ${s.textAlign==="left"?"selected":""}>왼쪽</option><option value="center" ${s.textAlign==="center"?"selected":""}>가운데</option><option value="right" ${s.textAlign==="right"?"selected":""}>오른쪽</option><option value="justify" ${s.textAlign==="justify"?"selected":""}>양쪽</option></select></label><label>세로 정렬<select id="elemVerticalAlign"><option value="top" ${!s.verticalAlign||s.verticalAlign==="top"?"selected":""}>위</option><option value="middle" ${s.verticalAlign==="middle"?"selected":""}>가운데</option><option value="bottom" ${s.verticalAlign==="bottom"?"selected":""}>아래</option></select></label><label>자간(px)<input id="elemLetterSpacing" type="number" min="-20" max="100" step=".1" value="${s.letterSpacing||0}"></label><label>행간<input id="elemLineHeight" type="number" min=".5" max="4" step=".05" value="${s.lineHeight||1.2}"></label></div><div class="grid2"><label>글자색<input id="elemColor" type="color" value="${s.color||"#17202e"}"></label><label>불투명도<input id="elemOpacity" type="number" min="0" max="1" step=".05" value="${s.opacity??1}"></label></div><div class="text-effect-group"><strong>배경</strong><div class="text-style-checks"><label><input id="elemBackground" type="checkbox" ${s.background?"checked":""}>배경 표시</label></div><label>배경색<input id="elemBackgroundColor" type="color" value="${s.backgroundColor||"#ffffff"}"></label></div><div class="text-effect-group"><strong>외곽선</strong><div class="grid2"><label>두께(px)<input id="elemStrokeWidth" type="number" min="0" max="10" step=".1" value="${s.strokeWidth||0}"></label><label>색상<input id="elemStrokeColor" type="color" value="${s.strokeColor||"#ffffff"}"></label></div></div><div class="text-effect-group"><strong>그림자</strong><div class="text-style-checks"><label><input id="elemShadow" type="checkbox" ${s.shadow?"checked":""}>그림자 표시</label></div><div class="grid2"><label>X(px)<input id="elemShadowX" type="number" min="-50" max="50" step=".5" value="${s.shadowX||0}"></label><label>Y(px)<input id="elemShadowY" type="number" min="-50" max="50" step=".5" value="${s.shadowY||0}"></label><label>흐림(px)<input id="elemShadowBlur" type="number" min="0" max="50" step=".5" value="${s.shadowBlur||0}"></label><label>색상<input id="elemShadowColor" type="color" value="${s.shadowColor||"#000000"}"></label></div></div><button id="applyElementStyle" class="action">텍스트 스타일 적용</button></div></div>`;
 }else if(item.type==="monthly-quote"){
  const q=monthlyQuoteForPage(selectedPage()),monthLabel=selectedPage()?.calendarMonth?`${selectedPage().calendarMonth}월`:"현재 월";
  panels.content=head+`<div class="template-help-card"><strong>${monthLabel} 문구</strong>만 수정됩니다. 다른 달의 명언과 Master 배치·스타일은 그대로 유지됩니다.</div><label>제목<input id="quoteTitle" value="${escapeAttr(q.title||"이 달의 명언")}"></label><label>한글 명언<textarea id="quoteKo" rows="4">${v21Escape(q.quoteKo||"")}</textarea></label><label>영문 원문·번역<textarea id="quoteEn" rows="4">${v21Escape(q.quoteEn||"")}</textarea></label><label>출처<input id="quoteSource" value="${escapeAttr(q.source||"")}"></label><button id="applyMonthlyQuoteContent" class="action">${monthLabel} 명언 저장</button></div>`;
  const s=item.style||{};
  panels.design=head+`<div class="grid2"><label>제목 크기<input id="quoteTitleSize" type="number" min="7" max="48" value="${s.titleSize||13}"></label><label>한글 크기<input id="quoteKoSize" type="number" min="8" max="72" value="${s.quoteKoSize||18}"></label><label>영문 크기<input id="quoteEnSize" type="number" min="6" max="48" value="${s.quoteEnSize||10}"></label><label>출처 크기<input id="quoteSourceSize" type="number" min="6" max="36" value="${s.sourceSize||9}"></label></div><label>정렬<select id="quoteAlign"><option value="left" ${s.textAlign==="left"?"selected":""}>왼쪽</option><option value="center" ${s.textAlign!=="left"&&s.textAlign!=="right"?"selected":""}>가운데</option><option value="right" ${s.textAlign==="right"?"selected":""}>오른쪽</option></select></label><div class="grid2"><label>본문 색<input id="quoteColor" type="color" value="${s.color||"#17202e"}"></label><label>제목 색<input id="quoteAccentColor" type="color" value="${s.accentColor||"#315e9e"}"></label><label>보조 색<input id="quoteSecondaryColor" type="color" value="${s.secondaryColor||"#667085"}"></label><label>항목 간격<input id="quoteItemGap" type="number" min="0" max="40" value="${s.itemGap||7}"></label></div><button id="applyMonthlyQuoteStyle" class="action">명언 공통 스타일 저장</button></div>`;
 }else if(item.type==="memo"){
  const layout=item.memoLayout||"lines";
  panels.content=head+`<label>개체 유형<select id="memoLayout"><option value="lines" ${layout==="lines"?"selected":""}>자유 메모</option><option value="goal" ${layout==="goal"?"selected":""}>월 목표</option><option value="weekly" ${layout==="weekly"?"selected":""}>주간 계획</option><option value="checklist" ${layout==="checklist"?"selected":""}>할 일</option></select></label><label>제목<input id="widgetTitle" value="${item.title||"메모"}"></label>${layout==="weekly"?`<label>주차 수<input id="memoWeekCount" type="number" min="1" max="5" value="${item.weekCount||5}"></label><label><input id="memoShowMemo" type="checkbox" ${item.showMemo!==false?"checked":""} style="width:auto;height:auto"> 마지막 칸을 MEMO로 사용</label>`:layout==="checklist"?`<label>할 일 행 수<input id="memoItemCount" type="number" min="1" max="20" value="${item.itemCount||9}"></label>`:layout==="lines"?`<label>줄 수<input id="memoLineCount" type="number" min="3" max="20" value="${item.lineCount||8}"></label>`:""}<div class="hint">월력 뒷면 Master에서 설정하면 12개월에 공통 적용됩니다. 사용자 서비스에서는 이 구조와 제목을 편집할 수 없습니다.</div><button id="applyMemoWidget" class="action">플래너 설정 적용</button></div>`;
 }
 else if(item.type==="monthly-schedule")panels.content=head+`<label>일정 제목<input id="widgetTitle" value="${item.title||"이달의 일정"}"></label><label>최대 표시 일정<input id="scheduleMaxItems" type="number" min="1" max="30" value="${item.maxItems||10}"></label><button id="applyScheduleWidget" class="action">일정 설정 적용</button></div>`;
 else if(item.type==="year-calendar"){
  panels.content=head+`<label>시작월<input id="yearCalendarStartMonth" type="number" min="1" max="12" value="${item.startMonth||1}"></label><button id="applyYearCalendarContent" class="action">연간 월력 콘텐츠 저장</button></div>`;
  panels.design=head+`<label>배열<select id="yearCalendarColumns"><option value="3" ${item.columns===3?"selected":""}>3열 × 4행</option><option value="4" ${item.columns!==3?"selected":""}>4열 × 3행</option><option value="6" ${item.columns===6?"selected":""}>6열 × 2행</option></select></label><label>월 표시 행 수<select id="yearCalendarRowsMode"><option value="inherit" ${(item.rowsMode||"inherit")==="inherit"?"selected":""}>월력 설정 따름</option><option value="adaptive" ${item.rowsMode==="adaptive"?"selected":""}>월별 자동 · 5/6주</option><option value="5" ${item.rowsMode==="5"?"selected":""}>항상 5주</option><option value="6" ${item.rowsMode==="6"?"selected":""}>항상 6주</option></select></label><button id="applyYearCalendarLayout" class="action">연간 월력 배열·행 수 저장</button></div>`;
 }else if(item.type==="month-date-strip"){
  panels.content=head+`<label>월 연결<select id="dateStripMonthSource"><option value="page" ${item.monthSource!=="fixed"?"selected":""}>현재 페이지 월 자동 연결</option><option value="fixed" ${item.monthSource==="fixed"?"selected":""}>연·월 직접 선택</option></select></label><div class="grid2"><label>연도<input id="dateStripYear" type="number" value="${item.year||project.settings.year}"></label><label>월<input id="dateStripMonth" type="number" min="1" max="12" value="${item.month||project.settings.startMonth||1}"></label></div><label><input id="dateStripShowWeekday" type="checkbox" ${item.showWeekday!==false?"checked":""} style="width:auto;height:auto"> 요일(SMTWTFS) 표시</label><label><input id="dateStripShowDate" type="checkbox" ${item.showDate!==false?"checked":""} style="width:auto;height:auto"> 일자 표시</label><button id="applyDateStripContent" class="action">날짜 띠 콘텐츠 저장</button></div>`;
  panels.design=head+`<div class="hint">요일은 영문 한 글자(SMTWTFS), 날짜는 아래 줄에 표시됩니다. 일요일과 토요일은 자동 구분됩니다.</div><label><input id="dateStripBackground" type="checkbox" ${item.style?.background!==false?"checked":""} style="width:auto;height:auto"> 배경·구분선 표시</label><button id="applyDateStripDesign" class="action">날짜 띠 디자인 저장</button></div>`;
 }else if(item.type==="event-list"){const allMode=item.displayMode==="all";panels.content=head+`<label>목록 제목<input id="eventListTitle" value="${item.title||"전체 학사일정"}"></label><div class="grid2"><label>시작월<input id="eventListStartMonth" type="number" min="1" max="12" value="${item.startMonth||1}"></label><label>표시 개월<input id="eventListMonthCount" type="number" min="1" max="24" value="${item.monthCount||12}"></label></div><label>일정 표시 범위<select id="eventListDisplayMode"><option value="limit" ${!allMode?"selected":""}>최대 개수 표시</option><option value="all" ${allMode?"selected":""}>전체 일정 표시</option></select></label><label id="eventListMaxItemsField" ${allMode?'class="hidden"':''}>최대 표시 일정<input id="eventListMaxItems" type="number" min="1" max="500" value="${item.maxItems||24}"></label><label><input id="eventListShowEndDate" type="checkbox" ${item.showEndDate?"checked":""} style="width:auto;height:auto"> 종료일 함께 표시</label><button id="applyEventListWidget" class="action">전체 학사일정 설정 적용</button></div>`;panels.design=head+`<label>단 구성<select id="eventListColumns"><option value="auto" ${item.columns==="auto"?"selected":""}>자동 · 개체 크기에 맞춤</option><option value="1" ${item.columns!=="auto"&&Number(item.columns||1)===1?"selected":""}>1단 · 세로 목록</option><option value="2" ${Number(item.columns||1)===2?"selected":""}>2단</option><option value="3" ${Number(item.columns||1)===3?"selected":""}>3단</option><option value="4" ${Number(item.columns||1)===4?"selected":""}>4단</option></select></label><div class="grid2"><label>기본 글자 크기<input id="eventListFontSize" type="number" min="5" max="18" step="0.5" value="${item.fontSize||8}"></label><label>최소 글자 크기<input id="eventListMinFontSize" type="number" min="5" max="18" step="0.5" value="${item.minFontSize||6}"></label></div><label><input id="eventListAutoShrink" type="checkbox" ${item.autoShrink!==false?"checked":""} style="width:auto;height:auto"> 내용에 맞게 자동 축소</label><div class="hint">자동은 먼저 단 수를 조정하고, 필요할 때만 설정한 최소 크기까지 글자를 줄입니다. 그래도 넘치면 편집 화면에 안내가 표시됩니다.</div><button id="applyEventListLayout" class="action">단 구성·글자 적용</button></div>`;}
 else if(["mini-calendar","mini-calendar-prev","mini-calendar-next"].includes(item.type)){
  const label=item.type==="mini-calendar-prev"?"이전 달":item.type==="mini-calendar-next"?"다음 달":"현재 달",s=item.style||{};
  panels.content=head+`<div class="hint">이 개체는 월력 뒷면의 ${label}을 자동 표시합니다. 빈 날짜 셀용 미니 월력과 별개의 독립 디자인 개체입니다.</div><label>월 표시 형식<select id="miniMonthLabelStyle"><option value="number-en" ${item.monthLabelStyle==="number-en"?"selected":""}>3 MAR · 숫자+영문월</option><option value="year-month-ko" ${item.monthLabelStyle!=="number-en"?"selected":""}>2028년 3월</option></select></label><label><input id="miniShowWeekday" type="checkbox" ${item.showWeekdayHeader!==false?"checked":""} style="width:auto;height:auto"> 요일 머리글 표시</label><button id="applyMiniCalendarContent" class="action">미니 월력 콘텐츠 저장</button></div>`;
  panels.design=head+`<div class="template-help-card"><strong>월 표시를 포함한 미니 월력 스타일</strong>월 제목·요일·날짜·주말색과 구분선을 이 개체에 저장합니다.</div><div class="grid2"><label>월 제목 크기<input id="miniTitleSize" type="number" min="6" max="36" step=".5" value="${s.titleSize||11}"></label><label>월 제목 정렬<select id="miniTitleAlign"><option value="left" ${s.titleAlign!=="center"&&s.titleAlign!=="right"?"selected":""}>왼쪽</option><option value="center" ${s.titleAlign==="center"?"selected":""}>가운데</option><option value="right" ${s.titleAlign==="right"?"selected":""}>오른쪽</option></select></label><label>월 제목색<input id="miniPrimary" type="color" value="${s.primary||"#293878"}"></label><label>요일색<input id="miniWeekdayColor" type="color" value="${s.weekdayColor||"#7a8291"}"></label><label>평일 날짜색<input id="miniDateColor" type="color" value="${s.dateColor||"#293878"}"></label><label>일요일색<input id="miniSunday" type="color" value="${s.sunday||"#ef3340"}"></label><label>토요일색<input id="miniSaturday" type="color" value="${s.saturday||"#4777bd"}"></label></div><label><input id="miniGridLine" type="checkbox" ${s.gridLine?"checked":""} style="width:auto;height:auto"> 날짜 행 구분선 표시</label><button id="applyMiniCalendarStyle" class="action">미니 월력 스타일 저장</button></div>`;
 }
 else panels.content=head+`<button id="replaceImageBtn" class="action">이미지 파일 선택</button><label style="margin-top:8px">이미지 맞춤<select id="elemFit"><option value="cover" ${item.fit==="cover"?"selected":""}>영역 채우기</option><option value="contain" ${item.fit==="contain"?"selected":""}>전체 이미지 보기</option></select></label><label>비율 유지<select id="elemLockAspect"><option value="true" ${item.lockAspect!==false?"selected":""}>유지</option><option value="false" ${item.lockAspect===false?"selected":""}>자유 변형</option></select></label><div class="grid2"><label>밝기 %<input id="elemBrightness" type="number" min="0" max="300" value="${item.imageStyle?.brightness??100}"></label><label>대비 %<input id="elemContrast" type="number" min="0" max="300" value="${item.imageStyle?.contrast??100}"></label><label>채도 %<input id="elemSaturation" type="number" min="0" max="300" value="${item.imageStyle?.saturation??100}"></label><label>투명도<input id="elemImageOpacity" type="number" min="0" max="1" step=".05" value="${item.opacity??1}"></label></div><div class="grid2"><label>좌우 반전<select id="elemImageFlipX"><option value="false" ${!item.imageStyle?.flipX?"selected":""}>아니오</option><option value="true" ${item.imageStyle?.flipX?"selected":""}>예</option></select></label><label>상하 반전<select id="elemImageFlipY"><option value="false" ${!item.imageStyle?.flipY?"selected":""}>아니오</option><option value="true" ${item.imageStyle?.flipY?"selected":""}>예</option></select></label></div><label>대체 텍스트<input id="elemAlt" value="${item.alt||""}"></label><button id="applyImageStyle" class="action">이미지 설정 적용</button></div>`;
 panels.layout=head+`<div class="grid2"><label>X (%)<input id="elemX" type="number" step=".5" value="${item.x.toFixed(1)}"></label><label>Y (%)<input id="elemY" type="number" step=".5" value="${item.y.toFixed(1)}"></label><label>폭 (%)<input id="elemW" type="number" step=".5" value="${item.width.toFixed(1)}"></label><label>높이 (%)<input id="elemH" type="number" step=".5" value="${item.height.toFixed(1)}"></label></div><button id="applyElementGeometry" class="action secondary">좌표·크기 저장</button><div class="row"><button id="sendBackward" class="secondary">뒤로</button><button id="bringForward" class="secondary">앞으로</button></div><div class="row"><button id="duplicateFromInspector" class="secondary">복제</button><button id="deleteFromInspector" class="danger">삭제</button></div></div>`;
 return panels
}
function inspectorTabsHTML(){
 return `<div class="inspector-tabs" role="tablist" aria-label="Inspector 설정 분류"><button type="button" class="inspector-tab ${inspectorActiveTab==="content"?"active":""}" data-tab="content">콘텐츠</button><button type="button" class="inspector-tab ${inspectorActiveTab==="design"?"active":""}" data-tab="design">디자인</button><button type="button" class="inspector-tab ${inspectorActiveTab==="layout"?"active":""}" data-tab="layout">배치</button></div>`
}
function setupInspectorTabs(){
 document.querySelectorAll(".inspector-tab").forEach(button=>button.addEventListener("click",()=>{
  inspectorActiveTab=button.dataset.tab;
  document.querySelectorAll(".inspector-tab").forEach(node=>node.classList.toggle("active",node.dataset.tab===inspectorActiveTab));
  document.querySelectorAll(".inspector-tab-panel").forEach(node=>node.classList.toggle("active",node.dataset.panel===inspectorActiveTab));
 }))
}

function renderPage(){
 const p=selectedPage(),page=el("page"),ps=project.productType.pageSize,neutralBase=p.aiDesignBase?.mode==="neutral";page.className=`page ${project.productType.category} ${p.role}-surface ${isInsertPage(p)?"template-insert-page":""} ${p.role==="monthly-back"?"planner-back-surface":""}`;page.dataset.surfaceRole=p.role;page.dataset.standardFamily=project.template?.metadata?.sampleFamily||"";page.dataset.aiDesignBase=neutralBase?"neutral":"inherited";page.dataset.editableBackground=pageElements(p).some(item=>item.role==="background-decoration")?"true":"false";page.style.aspectRatio=`${ps.width}/${ps.height}`;const derivedMonthKey=p.monthKey||p.calendarYear&&p.calendarMonth?`${p.calendarYear}-${String(p.calendarMonth).padStart(2,"0")}`:null,monthlyStyles=project.book.monthlyStyleOverrides||[],monthPageIndex=project.book.pageInstances.filter(item=>item.role==="monthly-front").findIndex(item=>item.id===p.id||item.calendarYear===p.calendarYear&&item.calendarMonth===p.calendarMonth),monthStyle=monthlyStyles.find(item=>item.monthKey===derivedMonthKey)||monthlyStyles[monthPageIndex]||null,monthPrimary=monthStyle?.tokens?.primary||project.template.resources?.colorTheme?.primary||"#315e9e";page.style.setProperty("--month-primary",monthPrimary);page.style.setProperty("--planner-background",monthStyle?.tokens?.plannerBackground||"#eef5f2");page.style.background=p.role==="monthly-back"?(monthStyle?.tokens?.plannerBackground||"#eef5f2"):"#fff";let html='<div class="binding"></div><div class="surface-content">';
 if(p.role==="monthly-front"){
  window.ACDLScheduleApiClient?.ensureCalendarReferences?.(project).catch(()=>{});
  const g=groupedEvents(),max=project.template.masters.calendar.eventMaxVisiblePerDay,title=p.overrides.monthTitle||`${p.calendarYear}년 ${p.calendarMonth}월`,cr=calendarRegion(),rows=calendarRowCountFor(p.calendarYear,p.calendarMonth),grid=calendarGridFor(p.calendarYear,p.calendarMonth,rows),design=project.template.masters.calendar.design||{},vertical=calendarVerticalLayout(design),preset=vertical.preset,presentation=preset?.presentation||design,chrome=calendarChromeLayout(presentation,vertical,cr),monthNames=["JANUARY","FEBRUARY","MARCH","APRIL","MAY","JUNE","JULY","AUGUST","SEPTEMBER","OCTOBER","NOVEMBER","DECEMBER"],monthTitleStyles=["number-stack","number-inline","number-only","year-month-korean","month-korean","english-month"],monthTitleStyle=monthTitleStyles.includes(presentation.monthTitleStyle)?presentation.monthTitleStyle:"number-stack",stackTitle=`<span class="month-number">${p.calendarMonth}</span><span class="month-meta"><span>${p.calendarYear}</span><span class="month-en">${monthNames[p.calendarMonth-1]}</span></span>`,inlineTitle=`<span class="month-year">${p.calendarYear}</span><span class="month-number">${p.calendarMonth}</span><span class="month-en">${monthNames[p.calendarMonth-1]}</span>`,titleMarkups={"number-stack":stackTitle,"number-inline":inlineTitle,"number-only":`<span class="month-number">${p.calendarMonth}</span>`,"year-month-korean":`${p.calendarYear}년 ${p.calendarMonth}월`,"month-korean":`${p.calendarMonth}월`,"english-month":`<span class="month-en">${monthNames[p.calendarMonth-1]}</span><span class="month-year">${p.calendarYear}</span>`},titleMarkup=p.overrides.monthTitle?title:titleMarkups[monthTitleStyle],gridClass={"open-rows":"grid-open-rows",minimal:"grid-minimal","detached-cards":"grid-detached-cards",boxed:"grid-boxed"}[presentation.gridStyle]||"grid-boxed",calendarClasses=[presentation.monthTitleAlign==="center"?"month-title-center":"month-title-left",presentation.weekdayStyle==="outlined-pills"?"weekday-outlined-pills":"weekday-filled-tabs",gridClass].join(" "),presetAttr=preset?` data-calendar-preset="${preset.presetId}"`:"",presetVars=preset?`--calendar-cell-padding-x:${presentation.cellPaddingX}mm;--calendar-cell-padding-y:${presentation.cellPaddingY}mm;--calendar-line-width:${presentation.lineWidth}mm;--calendar-line-color:${presentation.lineColor};--calendar-weekday-radius:${presentation.weekdayCornerRadius}mm;--calendar-title-weekday-gap:${presentation.titleWeekdayGap}mm;`:"";
  html+=`<div id="calendarRegion" class="calendar-region ${calendarClasses} ${calendarEditing?"editing":""}"${presetAttr} data-calendar-composition="${chrome.contract?.schemaVersion||"monthly-calendar-composition.v1"}" style="left:${cr.x}%;top:${cr.y}%;width:${cr.width}%;height:${cr.height}%;--calendar-title-share:${vertical.title}%;--calendar-weekday-track:${chrome.weekdayStage}%;--calendar-weekday-grid-gap:${chrome.gridGapMm/Math.max(.01,chrome.trackMm)*100}%;--calendar-title-responsive:${project.template.masters.calendar.monthTitleSize/8.5}cqw;${presetVars}"><div class="month-title ${monthTitleStyle}" style="font-size:${project.template.masters.calendar.monthTitleSize}px;color:var(--month-primary)">${titleMarkup}</div><div class="calendar-stage"><div class="calendar" style="--calendar-rows:${rows}">`;
  weekDayHeaders().forEach(h=>html+=`<div class="cell head">${h}</div>`);
  const miniCells=project.settings.showAdjacentMiniCalendars?selectAdjacentMiniCells(grid,p.calendarMonth):[];
  const hiddenScheduleByDate=assignRangeLanes(grid).hiddenByDate||{};
  grid.forEach((c,cellIndex)=>{
   const renderDay=(day,extra=false)=>{
    const hideAdjacent=day.month!==p.calendarMonth&&project.template.masters.calendar.showAdjacentMonths===false;
    const refs=calendarReferenceForDate(day.date),holiday=refs.holidays.find(item=>item.isHoliday!==false);
    const auxiliary=[...refs.lunars,...refs.solarTerms].map(item=>item.name).filter(Boolean).join(" / ");
    const special=[...refs.holidays,...refs.anniversaries].map(item=>item.name).filter(Boolean).join(" · ");
    let part=`<div class="day-block ${extra?"compact-extra":""} ${holiday?"public-holiday":""}" data-date="${day.date}"><div class="day-head-row"><div class="day">${hideAdjacent?"":day.day}</div>`;
    if(!hideAdjacent&&auxiliary)part+=`<span class="calendar-reference auxiliary" title="${escapeAttr(auxiliary)}">${escapeAttr(auxiliary)}</span>`;
    part+="</div>";
    if(!hideAdjacent&&special)part+=`<span class="calendar-reference special" title="${escapeAttr(special)}">${escapeAttr(special)}</span>`;
    const hiddenCount=Number(hiddenScheduleByDate[day.date]||0);
    if(!hideAdjacent&&hiddenCount>0)part+=`<span class="calendar-overflow-count" title="표시 공간을 넘은 일정">+${hiddenCount}</span>`;
    return part+"</div>"
   };
   const selected=selectedDate===c.date||(c.extra&&selectedDate===c.extra.date);
   if(miniCells.includes(cellIndex)){const rel=cellIndex===miniCells[0]?-1:1,d=new Date(p.calendarYear,p.calendarMonth-1+rel,1);html+=`<div class="cell mini-host">${renderCellMiniCalendar(d.getFullYear(),d.getMonth()+1)}</div>`;return}
   html+=`<div class="cell ${c.month!==p.calendarMonth?"adj":""} ${c.dow===0?"sun":c.dow===6?"sat":""} ${selected?"selected":""} ${c.extra?"compact-pair":""}"><div class="day-stack">${renderDay(c)}${c.extra?renderDay(c.extra,true):""}</div></div>`
  });
  html+=`</div>${renderRangeEventLayer(grid,rows)}</div></div>`;
 }else if(p.role==="poster-annual"){
  if((project.book.elementsByPage?.[p.id]||[]).length===0)html+=`<div class="poster-empty-guide non-output editor-only">개체 추가에서 연간 월력, 학교 정보, 일정 목록을 배치하세요.</div>`;
 }else if(p.role==="monthly-back"){
  if(project.template.metadata?.sampleFamily!=="desk-6")html+=`<div class="editor-guide non-output editor-only">${p.calendarYear}년 ${p.calendarMonth}월의 뒷면</div>`;
 }else if(p.role.includes("cover-front")){
  html+=`<div class="cover-art cover-base"></div>`;
 }else if(p.role.includes("intro-front")){
  html+=`<div class="cover-art"><h3>${p.overrides.title||"우리 학교의 한 해"}</h3><p>${project.book.school.name}</p></div>`;
 }else if(isInsertPage(p)){
  const insertKind=p.role.includes("front-insert")?"앞 간지":"뒤 간지",side=p.role.endsWith("-back")?"뒷면":"앞면";
  html+=`<div class="template-surface-guide non-output editor-only"><div class="template-surface-guide-inner"><span class="guide-kicker">FREE TEMPLATE SURFACE</span><strong>${insertKind} ${p.insertIndex||1} · ${side}</strong><p>이 문구는 실제 출력 콘텐츠가 아닌 템플릿 제작용 작업면 안내입니다.<br>학교 개체, 텍스트, 이미지 등을 배치해 이 면의 구성을 설계하세요.</p><div class="guide-meta"><span>자유 배치</span><span>페이지 전용 개체</span><span>Master 개체 지원</span></div></div></div>`;
 }else if(p.role.includes("back-cover-front")){
  if((project.book.elementsByPage?.[p.id]||[]).length===0)html+=`<div class="cover-art"><h3>${p.overrides.title||"함께 만든 학교의 기록"}</h3><p>${project.book.school.name}</p></div>`;
 }else if((project.book.elementsByPage?.[p.id]||[]).length===0)html+=`<div class="backface"><div><strong>${roleLabel(p)}</strong><br>실제 인쇄되는 뒷면 Surface</div></div>`;
 html+="</div>";page.innerHTML=html;
 if(p.role==="monthly-front"){const align=project.template.masters.calendar.calendarOverrides?.monthTitleAlign||project.template.masters.calendar.design?.monthTitleAlign||"left",regionNode=page.querySelector(".calendar-region");regionNode?.classList.remove("month-title-left","month-title-center","month-title-right");regionNode?.classList.add(`month-title-${["left","center","right"].includes(align)?align:"left"}`)}
 if(p.role==="monthly-front"&&calendarEditing&&!preview){
  const region=el("calendarRegion");if(region){
   const label=document.createElement("span");label.className="calendar-region-label";label.textContent="MONTHLY MASTER";region.appendChild(label);
   const dragBar=document.createElement("span");dragBar.className="calendar-drag-bar";dragBar.dataset.calendarHandle="move";dragBar.textContent="월력 Master · 드래그하여 이동";region.appendChild(dragBar);
   ["n","e","s","w","nw","ne","se","sw"].forEach(pos=>{const h=document.createElement("span");h.className="calendar-handle "+pos;h.dataset.calendarHandle=pos;region.appendChild(h)});
   region.addEventListener("pointerdown",e=>{
    if(e.target.closest("[data-date]")&&!e.target.dataset.calendarHandle)return;
    startCalendarPointer(e)
   })
  }
 }
 renderFreeElements(page);
 const selectMonthlyCalendar=e=>{
  if(calendarEditing)return false;
  e?.stopPropagation();calendarEditing=true;selectedElementId=null;selectedElementScope=null;render();
  showEditorToast("월력을 선택했습니다. 테두리 조절점이나 Inspector에서 크기를 변경하세요.");return true
 };
 const calendarRegionNode=page.querySelector(".calendar-region");
 if(calendarRegionNode)calendarRegionNode.addEventListener("click",e=>{if(!e.target.closest("[data-date]"))selectMonthlyCalendar(e)});
 page.querySelectorAll("[data-date]").forEach(c=>c.addEventListener("click",e=>{if(selectMonthlyCalendar(e))return;e.stopPropagation();selectedDate=c.dataset.date;renderPage();renderInspector()}));
}
function dateEvents(){return selectedDate?project.book.events.filter(ev=>selectedDate>=ev.startDate&&selectedDate<=(ev.endDate||ev.startDate)):[]}

const INSPECTOR_SAVE_MESSAGES={
 applySemanticSample:"샘플 콘텐츠를 저장했습니다.",
 applySemanticBinding:"데이터 연결 설정을 저장했습니다.",
 applySemanticTemplate:"개체 레이아웃과 스타일을 저장했습니다.",
 applyCalendarRegion:"월력 위치와 크기를 저장했습니다.",
 applyMemoWidget:"메모 설정을 저장했습니다.",
 applyScheduleWidget:"일정 위젯 설정을 저장했습니다.",
 applyTextContent:"텍스트 콘텐츠를 저장했습니다.",
 applyElementStyle:"텍스트 디자인을 저장했습니다.",
 applyYearCalendarContent:"연간 월력 콘텐츠를 저장했습니다.",
 applyYearCalendarLayout:"연간 월력 배열을 저장했습니다.",
 applyImageStyle:"이미지 설정을 저장했습니다.",
 applyElementGeometry:"개체 위치와 크기를 저장했습니다.",
 applyMaster:"월력 기본 설정을 저장했습니다.",
 applyRangeEventStyle:"구간 일정 스타일을 저장했습니다.",
 applyCoverMaster:"표지 Master 설정을 저장했습니다."
};
const INSPECTOR_SAVE_IDS=Object.keys(INSPECTOR_SAVE_MESSAGES);

function setInspectorNotice(type,message){
 inspectorNotice={type,message};
 const node=el("inspectorFeedback");
 if(node){node.className=`inspector-feedback ${type}`;node.querySelector("span").textContent=message}
}
function inspectorContainerFor(button){
 return button.closest(".inspector-group")||button.closest(".section")||el("inspector")
}
function inspectorSignature(container){
 return window.ACDLInspectorForm.signature(container)
}
function validateInspectorContainer(container){
 return window.ACDLInspectorForm.validate(container)
}
function setupInspectorFeedback(){
 const feedback=el("inspectorFeedback");
 if(feedback)setInspectorNotice(inspectorNotice.type,inspectorNotice.message);
 const tracked=[];
 INSPECTOR_SAVE_IDS.forEach(id=>{
  const button=el(id);if(!button)return;
  const container=inspectorContainerFor(button),initial=inspectorSignature(container);
  button.classList.add("inspector-save");
  button.dataset.initialSignature=initial;
  tracked.push({button,container,initial});
  const update=()=>{
   const draftChanged=id==="applySemanticSample"&&semanticImageDraftElementId===sourceElement()?.id&&!!semanticImageDraft;
   const changed=inspectorSignature(container)!==initial||draftChanged;
   button.classList.toggle("has-changes",changed);
   container.classList.toggle("is-dirty",changed);
   inspectorDirty=tracked.some(item=>item.button.classList.contains("has-changes"));
   if(changed)setInspectorNotice("dirty","변경사항이 있습니다. 해당 영역의 저장 버튼을 눌러 반영하세요.");
   else if(!inspectorDirty&&inspectorNotice.type==="dirty")setInspectorNotice("ready","변경된 값을 원래대로 되돌렸습니다. 저장할 내용이 없습니다.")
  };
  container.querySelectorAll("input,select,textarea").forEach(node=>{
   node.addEventListener("input",update);
   node.addEventListener("change",update)
  });
  update();
  button.addEventListener("click",event=>{
   const validation=validateInspectorContainer(container);
   if(!validation.valid){
    event.preventDefault();event.stopImmediatePropagation();
    setInspectorNotice("error",validation.message);
    showEditorToast(validation.message);
    return
   }
   const changed=button.classList.contains("has-changes");
   if(!changed){
    event.preventDefault();event.stopImmediatePropagation();
    const message="변경된 내용이 없습니다. 먼저 설정값을 변경하세요.";
    setInspectorNotice("info",message);showEditorToast(message);
    return
   }
   inspectorDirty=false;
   inspectorNotice={type:"success",message:INSPECTOR_SAVE_MESSAGES[id]};
   setTimeout(()=>showEditorToast("저장되었습니다."),0);
  },true)
 })
}
function confirmDiscardInspectorChanges(){
 if(!inspectorDirty)return true;
 const ok=confirm("Inspector에 저장하지 않은 변경사항이 있습니다.\n변경사항을 버리고 이동하시겠습니까?");
 if(!ok){
  setInspectorNotice("dirty","현재 변경사항을 먼저 저장하거나 입력값을 원래대로 되돌리세요.");
  showEditorToast("페이지 이동을 취소했습니다. Inspector 변경사항을 먼저 저장하세요.")
 }
 return ok
}

function renderInspector(){
 const p=selectedPage(),ins=el("inspector"),panels=elementInspectorPanels();
 let content=panels.content||"",design=panels.design||"",layout=panels.layout||"";
 if(p.role==="monthly-front"&&calendarEditing){
  const r=calendarRegion();layout=`<div class="section"><span class="layer-chip">월력 앞면 Master · 달력 영역</span><div class="calendar-master-note">위치와 크기 변경은 12개월 모든 월력 앞면에 적용됩니다. Canvas의 파란 테두리를 드래그하거나 아래 값을 입력하세요.</div><div class="grid2"><label>X (%)<input id="calX" type="number" step=".5" value="${r.x.toFixed(1)}"></label><label>Y (%)<input id="calY" type="number" step=".5" value="${r.y.toFixed(1)}"></label><label>폭 (%)<input id="calW" type="number" step=".5" value="${r.width.toFixed(1)}"></label><label>높이 (%)<input id="calH" type="number" step=".5" value="${r.height.toFixed(1)}"></label></div><button id="applyCalendarRegion" class="action">월력 위치·크기 저장</button><div class="calendar-size-presets"><button id="calendarPresetFull" class="secondary">크게</button><button id="calendarPresetStandard" class="secondary">기본</button><button id="calendarPresetCompact" class="secondary">작게</button><button id="calendarPresetCenter" class="secondary">가운데 정렬</button></div><button id="closeCalendarEditing" class="action secondary" style="margin-top:6px">월력 선택 해제</button></div>`+layout
 }
 if(!sourceElement()){
  content+=isInsertPage(p)?`<div class="section template-help-card"><strong>${p.role.includes("front-insert")?"앞 간지":"뒤 간지"} 자유 템플릿 면</strong><br>가운데 안내는 편집 화면에서만 보이며 출력되지 않습니다. 개체를 추가해 이 페이지의 실제 템플릿 구성을 만드세요.</div>`:`<div class="section template-help-card"><strong>템플릿 설계 안내</strong><br>개체를 선택하면 샘플 콘텐츠, 실제 학교 데이터 Binding, 레이아웃을 탭으로 나누어 편집할 수 있습니다.</div>`;
 }
 if(!sourceElement()){
 const calendarDesign=project.template.masters.calendar.design||{};
 const designPreset=calendarDesign.monthTitleStyle==="number-inline"&&calendarDesign.monthTitleAlign==="center"&&calendarDesign.weekdayStyle==="outlined-pills"&&calendarDesign.gridStyle==="open-rows"?"sample-3":calendarDesign.monthTitleStyle!=="number-inline"&&calendarDesign.monthTitleStyle!=="korean-label"&&calendarDesign.monthTitleAlign!=="center"&&calendarDesign.weekdayStyle!=="outlined-pills"&&calendarDesign.gridStyle!=="open-rows"?"sample-6":"custom";
  design+=`<div class="section designer-only-control"><span class="layer-chip">12개월 공통 월력 디자인</span><label>빠른 디자인 조합<select id="masterCalendarDesignPreset"><option value="sample-6" ${designPreset==="sample-6"?"selected":""}>6번 원본형 · 큰 숫자/채움 탭/박스 셀</option><option value="sample-3" ${designPreset==="sample-3"?"selected":""}>3번 원본형 · 가로 제목/테두리 요일/가로줄</option><option value="custom" ${designPreset==="custom"?"selected":""}>사용자 조합</option></select></label><label>월 표시 형식<select id="masterMonthTitleStyle"><option value="number-stack" ${calendarDesign.monthTitleStyle!=="number-inline"&&calendarDesign.monthTitleStyle!=="korean-label"?"selected":""}>큰 숫자 + 연도·영문월 · 6번 방식</option><option value="number-inline" ${calendarDesign.monthTitleStyle==="number-inline"?"selected":""}>숫자 + 연도·영문월 가로형 · 3번 방식</option><option value="korean-label" ${calendarDesign.monthTitleStyle==="korean-label"?"selected":""}>연도년 월월 한글형</option></select></label><label>월 표시 위치<select id="masterMonthTitleAlign"><option value="left" ${calendarDesign.monthTitleAlign!=="center"?"selected":""}>왼쪽 · 6번 방식</option><option value="center" ${calendarDesign.monthTitleAlign==="center"?"selected":""}>가운데 · 3번 방식</option></select></label><label>요일 표시<select id="masterWeekdayStyle"><option value="filled-tabs" ${calendarDesign.weekdayStyle!=="outlined-pills"?"selected":""}>연결형 채움 탭 · 6번 방식</option><option value="outlined-pills" ${calendarDesign.weekdayStyle==="outlined-pills"?"selected":""}>독립 테두리 캡슐 · 3번 방식</option></select></label><label>날짜 격자<select id="masterGridStyle"><option value="boxed" ${calendarDesign.gridStyle==="boxed"||!["open-rows","minimal","detached-cards"].includes(calendarDesign.gridStyle)?"selected":""}>전체 박스 격자 · 6번 방식</option><option value="open-rows" ${calendarDesign.gridStyle==="open-rows"?"selected":""}>독립 밑줄 · 첨부 디자인 1</option><option value="minimal" ${calendarDesign.gridStyle==="minimal"?"selected":""}>미니멀 무선 · 첨부 디자인 2</option><option value="detached-cards" ${calendarDesign.gridStyle==="detached-cards"?"selected":""}>개별 사각 셀</option></select></label><label>월 제목 크기<input id="masterTitleSize" type="number" min="14" max="36" value="${project.template.masters.calendar.monthTitleSize}"></label><label>단일 일정 표시 개수<select id="masterMaxEvents">${[1,2,3,4].map(n=>`<option ${n===project.template.masters.calendar.eventMaxVisiblePerDay?"selected":""}>${n}</option>`).join("")}</select></label><button id="applyMaster" class="action">월력 공통 디자인 저장</button></div>`;
 design=design.replace("큰 숫자 + 연도·영문월 · 6번 방식","큰 월 숫자 + 연도·영문월 세로").replace("숫자 + 연도·영문월 가로형 · 3번 방식","연도 + 큰 월 숫자 + 영문월 가로").replace(/<option value="korean-label"[^>]*>연도년 월월 한글형<\/option>/,`<option value="number-only" ${calendarDesign.monthTitleStyle==="number-only"?"selected":""}>큰 월 숫자만</option><option value="year-month-korean" ${["year-month-korean","korean-label"].includes(calendarDesign.monthTitleStyle)?"selected":""}>연도년 월월 한글형</option><option value="month-korean" ${calendarDesign.monthTitleStyle==="month-korean"?"selected":""}>월월 한글형</option><option value="english-month" ${calendarDesign.monthTitleStyle==="english-month"?"selected":""}>영문 월 + 연도</option>`).replace(/(<option value="center"[^>]*>가운데 · 3번 방식<\/option>)/,`$1<option value="right" ${calendarDesign.monthTitleAlign==="right"?"selected":""}>오른쪽</option>`);if(["number-only","year-month-korean","month-korean","english-month"].includes(calendarDesign.monthTitleStyle))design=design.replace(/(<option value="number-stack") selected/,"$1");if(calendarDesign.monthTitleAlign==="right")design=design.replace(/(<option value="left") selected/,"$1");
 const rs=project.template.masters.calendar.rangeEventStyle;
 design+=`<div class="section"><span class="layer-chip">구간 일정 자동 조판</span><div class="range-event-legend">시작일과 종료일이 다른 일정은 주 단위 막대로 자동 분할합니다. 겹치는 일정은 Lane에 자동 배치하고 다음 주나 다른 달로 이어지는 구간도 표시합니다.</div><div class="range-style-preview"><div class="demo-bar">교육과정 집중 운영기간</div></div><label class="inline-check"><input id="rangeEnabled" type="checkbox" ${rs.enabled?"checked":""}><span>구간 일정을 막대 형태로 표시</span></label><div class="range-style-grid"><label>일정명 표시<select id="rangeLabelMode"><option value="first" ${rs.labelMode==="first"?"selected":""}>첫 구간만</option><option value="every" ${rs.labelMode==="every"?"selected":""}>매주 반복</option><option value="continued" ${rs.labelMode==="continued"?"selected":""}>후속 구간에 계속 표시</option><option value="none" ${rs.labelMode==="none"?"selected":""}>표시 안 함</option></select></label><label>일정명 위치<select id="rangeLabelPosition"><option value="inside" ${rs.labelPosition==="inside"?"selected":""}>막대 안</option><option value="above" ${rs.labelPosition==="above"?"selected":""}>막대 위</option></select></label><label>막대 높이(px)<input id="rangeBarHeight" type="number" min="6" max="24" value="${rs.barHeight}"></label><label>Lane 간격(px)<input id="rangeLaneGap" type="number" min="0" max="10" value="${rs.laneGap}"></label><label>최대 Lane<input id="rangeMaxLanes" type="number" value="4" readonly><small>사용자 서비스 표준 · 단일/기간 일정 공통</small></label><label>초과 일정<select id="rangeOverflowStyle"><option value="count" ${rs.overflowStyle==="count"?"selected":""}>+N개 표시</option><option value="hide" ${rs.overflowStyle==="hide"?"selected":""}>숨김</option></select></label></div><button id="applyRangeEventStyle" class="action">구간 일정 스타일 저장</button></div>`;
 design+=`<div class="section"><label>표지 제목 크기<input id="coverTitleSize" type="number" min="20" max="50" value="${project.template.masters.cover.titleSize}"></label><button id="applyCoverMaster" class="action">표지 Master 설정 저장</button></div>`;
 const validationMessages=validate();
 if(validationMessages.length)content+=`<div class="section validation warn">${validationMessages.join("<br>")}</div>`;
 }
 if(canPromoteSelectedToMonthlyMaster())layout+=`<div class="section master-apply-card"><strong>선택 개체를 Master로 전환</strong><p>현재 페이지의 개체를 제거하고 같은 면을 사용하는 12개월 전체에 공통으로 표시합니다.</p><button id="promoteToMonthlyMaster" class="action">선택 개체를 ${monthlyMasterLabel(p)}에 적용</button><div class="master-scope-note">적용 대상: ${canonicalMasterIdForPage(p)} · ${monthlyPagesForRole(p.role).length}개 면</div></div>`;
 else if(sourceElement()&&selectedElementScope==="master"&&(p.role==="monthly-front"||p.role==="monthly-back"))layout+=`<div class="section hint"><strong style="display:block;color:var(--text);margin-bottom:4px">Master 공통 개체</strong>이 개체는 ${monthlyMasterLabel(p)} ${monthlyPagesForRole(p.role).length}개 면에 표시됩니다. Master ID: ${canonicalMasterIdForPage(p)}. 샘플 콘텐츠·Binding·배치 변경도 전체 해당 월에 반영됩니다.</div>`;
 const empty=tab=>`<div class="inspector-tab-empty">${tab==="content"?"선택한 개체의 콘텐츠 설정이 없습니다.":tab==="design"?"선택한 개체의 디자인 설정이 없습니다.":"선택한 개체의 배치 설정이 없습니다."}</div>`;
 ins.innerHTML=`${inspectorTabsHTML()}<div class="inspector-tab-panel ${inspectorActiveTab==="content"?"active":""}" data-panel="content">${content||empty("content")}</div><div class="inspector-tab-panel ${inspectorActiveTab==="design"?"active":""}" data-panel="design">${design||empty("design")}</div><div class="inspector-tab-panel ${inspectorActiveTab==="layout"?"active":""}" data-panel="layout">${layout||empty("layout")}</div>`;
 setupInspectorTabs();bindInspector();setupInspectorFeedback();
}

function bindInspector(){
 const bind=(id,fn)=>{if(el(id))el(id).addEventListener("click",fn)};
 if(project.template?.metadata?.sampleFamily==="desk-6")el("masterCalendarDesignPreset")?.querySelector('option[value="sample-3"]')?.remove();
 bind("applySemanticSample",()=>{
  const i=sourceElement();if(!i||i.type!=="semantic-object")return;
  change(()=>{
   ensureSemanticTemplateData(i);
   const next={...(i.sampleContent||{})};
   if(el("semanticName"))next.name=el("semanticName").value;
   if(el("semanticDescription"))next.description=el("semanticDescription").value;
   if(semanticImageDraftElementId===i.id&&semanticImageDraft)next.image=semanticImageDraft;
   i.sampleContent=next;
   semanticImageDraft=null;semanticImageDraftElementId=null
  });
  showEditorToast("템플릿 샘플 콘텐츠를 저장했습니다.")
 });
 bind("applySemanticBinding",()=>{
  const i=sourceElement();if(!i||i.type!=="semantic-object")return;
  change(()=>{
   i.bindingEnabled=el("semanticBindingMode").value==="bound";
   i.binding=i.bindingEnabled?el("semanticBindingPath").value:null;
   i.fallbackToSample=el("semanticFallback").checked
  });
  showEditorToast(i.bindingEnabled?"실제 학교 데이터 Binding을 저장했습니다.":"고정 콘텐츠 개체로 변경했습니다.")
 });
 bind("applySemanticTemplate",()=>change(()=>{
  const i=sourceElement();i.style||={};
  if(el("semanticLayout"))i.layoutPreset=el("semanticLayout").value;
  i.style.titleSize=Number(el("semanticTitleSize").value);
  i.style.descriptionSize=Number(el("semanticDescriptionSize").value);
  i.style.textAlign=el("semanticTextAlign").value
 }));
 bind("replaceSemanticImage",()=>{pendingSemanticRole=sourceElement()?.role;el("semanticImageInput").click()});
 bind("applyCalendarRegion",()=>change(()=>{const r=calendarRegion();r.x=Number(el("calX").value);r.y=Number(el("calY").value);r.width=Number(el("calW").value);r.height=Number(el("calH").value);r.width=Math.max(25,Math.min(100,r.width));r.height=Math.max(25,Math.min(100,r.height));r.x=Math.max(0,Math.min(r.x,100-r.width));r.y=Math.max(0,Math.min(r.y,100-r.height))}));
 bind("resetCalendarRegion",()=>change(()=>project.template.masters.calendar.calendarRegion={x:5,y:16,width:90,height:79}));
 bind("calendarPresetFull",()=>applyCalendarRegionPreset("full"));
 bind("calendarPresetStandard",()=>applyCalendarRegionPreset("standard"));
 bind("calendarPresetCompact",()=>applyCalendarRegionPreset("compact"));
 bind("calendarPresetCenter",()=>applyCalendarRegionPreset("center"));
 bind("closeCalendarEditing",()=>{calendarEditing=false;render()});
 bind("applyMemoWidget",()=>changeElement(i=>{i.memoLayout=el("memoLayout")?.value||"lines";i.title=el("widgetTitle").value;if(el("memoLineCount"))i.lineCount=Number(el("memoLineCount").value);if(el("memoWeekCount"))i.weekCount=Number(el("memoWeekCount").value);if(el("memoShowMemo"))i.showMemo=el("memoShowMemo").checked;if(el("memoItemCount"))i.itemCount=Number(el("memoItemCount").value)}));
 bind("applyMonthlyQuoteContent",()=>change(()=>{const key=monthlyQuoteKey(selectedPage());if(!key)return;ensureMonthlyQuotes();const current=project.book.monthlyQuotes[key]||{};project.book.monthlyQuotes[key]={...current,title:el("quoteTitle").value.trim()||"이 달의 명언",quoteKo:el("quoteKo").value.trim(),quoteEn:el("quoteEn").value.trim(),source:el("quoteSource").value.trim(),sourceStatus:"edited",translationType:current.translationType||"editorial"}}));
 bind("applyMonthlyQuoteStyle",()=>changeElement(i=>{i.style||={};i.style.titleSize=Number(el("quoteTitleSize").value);i.style.quoteKoSize=Number(el("quoteKoSize").value);i.style.quoteEnSize=Number(el("quoteEnSize").value);i.style.sourceSize=Number(el("quoteSourceSize").value);i.style.textAlign=el("quoteAlign").value;i.style.color=el("quoteColor").value;i.style.accentColor=el("quoteAccentColor").value;i.style.secondaryColor=el("quoteSecondaryColor").value;i.style.itemGap=Number(el("quoteItemGap").value)}));
 bind("applyYearCalendarContent",()=>change(()=>{const i=sourceElement();i.startMonth=Number(el("yearCalendarStartMonth").value)}));
 bind("applyYearCalendarLayout",()=>change(()=>{const i=sourceElement();i.columns=Number(el("yearCalendarColumns").value);i.rowsMode=el("yearCalendarRowsMode")?.value||"inherit"}));
 bind("applyMiniCalendarContent",()=>changeElement(i=>{i.monthLabelStyle=el("miniMonthLabelStyle").value;i.showWeekdayHeader=el("miniShowWeekday").checked}));
 bind("applyMiniCalendarStyle",()=>changeElement(i=>{i.style||={};i.style.titleSize=Number(el("miniTitleSize").value);i.style.titleAlign=el("miniTitleAlign").value;i.style.primary=el("miniPrimary").value;i.style.weekdayColor=el("miniWeekdayColor").value;i.style.dateColor=el("miniDateColor").value;i.style.sunday=el("miniSunday").value;i.style.saturday=el("miniSaturday").value;i.style.gridLine=el("miniGridLine").checked}));
 bind("applyScheduleWidget",()=>change(()=>{const i=sourceElement();i.title=el("widgetTitle").value;i.maxItems=Number(el("scheduleMaxItems").value)}));
 bind("applyEventListWidget",()=>change(()=>{const i=sourceElement();i.title=el("eventListTitle").value;i.startMonth=Number(el("eventListStartMonth").value);i.monthCount=Number(el("eventListMonthCount").value);i.displayMode=el("eventListDisplayMode")?.value||"limit";i.maxItems=Number(el("eventListMaxItems")?.value||i.maxItems||24);i.showEndDate=el("eventListShowEndDate").checked}));
 bind("applyEventListLayout",()=>change(()=>{const i=sourceElement(),columns=el("eventListColumns").value;i.columns=columns==="auto"?"auto":Number(columns||1);i.fontSize=Number(el("eventListFontSize").value||8);i.minFontSize=Math.min(i.fontSize,Number(el("eventListMinFontSize").value||6));i.autoShrink=el("eventListAutoShrink").checked}));
 bind("applyDateStripContent",()=>change(()=>{const i=sourceElement();i.monthSource=el("dateStripMonthSource").value;i.year=Number(el("dateStripYear").value);i.month=Number(el("dateStripMonth").value);i.showWeekday=el("dateStripShowWeekday").checked;i.showDate=el("dateStripShowDate").checked}));
 bind("applyDateStripDesign",()=>change(()=>{const i=sourceElement();i.style||={};i.style.background=el("dateStripBackground").checked}));
 bind("applyTextContent",()=>changeElement(item=>{window.ACDLInspectorElement.apply(item,"text-content",{content:el("elemText").value,binding:el("elemTextBinding")?.value});if(item.binding==="calendar.year")item.format=el("elemYearFormat")?.value||"year-plain"}));
 bind("applyElementStyle",()=>changeElement(item=>window.ACDLInspectorElement.apply(item,"text-style",{fontFamily:el("elemFontFamily").value,fontSize:el("elemFontSize").value,fontWeight:el("elemFontWeight").value,fontStyle:el("elemItalic").checked?"italic":"normal",underline:el("elemUnderline").checked,strike:el("elemStrike").checked,textAlign:el("elemAlign").value,verticalAlign:el("elemVerticalAlign").value,color:el("elemColor").value,letterSpacing:el("elemLetterSpacing").value,lineHeight:el("elemLineHeight").value,opacity:el("elemOpacity").value,background:el("elemBackground").checked,backgroundColor:el("elemBackgroundColor").value,strokeWidth:el("elemStrokeWidth").value,strokeColor:el("elemStrokeColor").value,shadow:el("elemShadow").checked,shadowX:el("elemShadowX").value,shadowY:el("elemShadowY").value,shadowBlur:el("elemShadowBlur").value,shadowColor:el("elemShadowColor").value})));
 bind("applyImageStyle",()=>changeElement(item=>window.ACDLInspectorElement.apply(item,"image-style",{fit:el("elemFit").value,alt:el("elemAlt").value,lockAspect:el("elemLockAspect")?.value,brightness:el("elemBrightness")?.value,contrast:el("elemContrast")?.value,saturation:el("elemSaturation")?.value,opacity:el("elemImageOpacity")?.value,flipX:el("elemImageFlipX")?.value,flipY:el("elemImageFlipY")?.value})));
 bind("replaceImageBtn",()=>{pendingImageElementId=selectedElementId;pendingImageElementScope=selectedElementScope;el("elementImageInput").click()});
 bind("applyElementGeometry",()=>changeElement(item=>window.ACDLInspectorElement.apply(item,"geometry",{x:el("elemX").value,y:el("elemY").value,width:el("elemW").value,height:el("elemH").value})));
 bind("bringForward",()=>changeElement(item=>item.zIndex=(item.zIndex||0)+1));
 bind("sendBackward",()=>changeElement(item=>item.zIndex=Math.max(0,(item.zIndex||0)-1)));
 bind("duplicateFromInspector",duplicateSelected);bind("deleteFromInspector",deleteSelected);

 bind("applyPageTitle",()=>change(()=>selectedPage().overrides.monthTitle=el("pageTitle").value.trim()));
 bind("applySurfaceTitle",()=>change(()=>selectedPage().overrides.title=el("surfaceTitle").value.trim()));
 el("masterCalendarDesignPreset")?.addEventListener("change",event=>{let preset=event.target.value;if(project.template?.metadata?.sampleFamily==="desk-6"&&preset==="sample-3"){preset="sample-6";event.target.value=preset;showEditorToast("6번 템플릿에는 6번 원본형 조합만 적용할 수 있습니다. 개별 스타일은 아래에서 수정할 수 있습니다.")}const map={"sample-6":{title:"number-stack",align:"left",weekday:"filled-tabs",grid:"boxed"},"sample-3":{title:"number-inline",align:"center",weekday:"outlined-pills",grid:"open-rows"}}[preset];if(!map)return;el("masterMonthTitleStyle").value=map.title;el("masterMonthTitleAlign").value=map.align;el("masterWeekdayStyle").value=map.weekday;el("masterGridStyle").value=map.grid});
 bind("applyMaster",()=>change(()=>{const calendar=project.template.masters.calendar;calendar.design||={};calendar.design.monthTitleAlign=el("masterMonthTitleAlign")?.value||calendar.design.monthTitleAlign||"left";calendar.design.monthTitleStyle=el("masterMonthTitleStyle")?.value||calendar.design.monthTitleStyle||"number-stack";calendar.design.weekdayStyle=el("masterWeekdayStyle")?.value||calendar.design.weekdayStyle||"filled-tabs";calendar.design.gridStyle=el("masterGridStyle")?.value||calendar.design.gridStyle||"boxed";calendar.design.presetId=el("masterCalendarDesignPreset")?.value||"custom";calendar.design.eventStyle="strong-bars";calendar.calendarOverrides={...(calendar.calendarOverrides||{}),monthTitleAlign:calendar.design.monthTitleAlign,monthTitleStyle:calendar.design.monthTitleStyle,weekdayStyle:calendar.design.weekdayStyle,gridStyle:calendar.design.gridStyle,eventStyle:calendar.design.eventStyle};calendar.monthTitleSize=Number(el("masterTitleSize").value);calendar.eventMaxVisiblePerDay=Number(el("masterMaxEvents").value)}));
 bind("applyRangeEventStyle",()=>change(()=>{
  const s=project.template.masters.calendar.rangeEventStyle;
  s.enabled=el("rangeEnabled").checked;
  s.labelMode=el("rangeLabelMode").value;
  s.labelPosition=el("rangeLabelPosition").value;
  s.barHeight=Number(el("rangeBarHeight").value);
  s.laneGap=Number(el("rangeLaneGap").value);
  s.maxLanes=window.ACDLCalendarDomain.SCHEDULE_MAX_LANES;
  s.overflowStyle=el("rangeOverflowStyle").value
 }));
 bind("promoteToMonthlyMaster",promoteSelectedToMonthlyMaster);
 bind("applyCoverMaster",()=>change(()=>applyCoverTitleSize(Number(el("coverTitleSize").value))));
 bind("addEvent",()=>openEventDialog());
 document.querySelectorAll("[data-delete-event]").forEach(b=>b.addEventListener("click",()=>change(()=>project.book.events=project.book.events.filter(e=>e.id!==b.dataset.deleteEvent))));
 document.querySelectorAll("[data-edit-event]").forEach(b=>b.addEventListener("click",()=>openEventDialog(project.book.events.find(e=>e.id===b.dataset.editEvent))));
}
