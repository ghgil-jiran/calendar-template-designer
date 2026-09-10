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
 inspectorNotice={type:"success",message:changed?"ì›”ë ¥ Masterì˜ ìœ„ì¹˜ì™€ í¬ê¸°ë¥¼ ë°˜ì˜í–ˆìŠµë‹ˆë‹¤.":"ì›”ë ¥ Masterë¥¼ ì„ íƒí–ˆìŠµë‹ˆë‹¤."};
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
 if(type==="monthly-quote"&&selectedPage()?.role!=="monthly-back"){showEditorToast("ì›”ë ¥ìš© ëª…ì–¸ ë¬¸êµ¬ëŠ” ì›”ë ¥ ë’·ë©´ì—ì„œ ì¶”ê°€í•  ìˆ˜ ìˆìŠµë‹ˆë‹¤.");return}
 const plannerPresets={
  "planner-goal":{memoLayout:"goal",role:"monthly-goal",title:"MONTHLY GOAL",x:4,y:11,width:36,height:42},
  "planner-weekly":{memoLayout:"weekly",role:"weekly-planner",title:"WEEKLY PLANNER",weekCount:5,showMemo:true,x:42,y:11,width:54,height:84},
  "planner-checklist":{memoLayout:"checklist",role:"monthly-todo",title:"TO DO LIST",itemCount:9,x:4,y:55,width:36,height:40}
 },plannerPreset=plannerPresets[type],elementType=plannerPreset?"memo":type;
 if(plannerPreset&&selectedPage()?.role!=="monthly-back"){showEditorToast("í”Œë˜ë„ˆ ê°œì²´ëŠ” ì›”ë ¥ ë’·ë©´ Masterì—ì„œ ì¶”ê°€í•  ìˆ˜ ìˆìŠµë‹ˆë‹¤.");return}
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
 if(type==="memo")Object.assign(elem,{memoLayout:"lines",title:"ë©”ëª¨",lineCount:8});
 if(plannerPreset)Object.assign(elem,{required:true,permissions:{move:false,resize:false,rotate:false,color:false,replaceImage:false,delete:false,duplicate:false,layer:false,content:false}});
 if(type==="year-calendar")Object.assign(elem,{columns:4,startMonth:1,monthCount:12,rowsMode:"inherit",showWeekdayHeader:true});
 if(type==="monthly-schedule")Object.assign(elem,{title:"ì´ë‹¬ì˜ ì¼ì •",maxItems:10});
 if(type==="event-list")Object.assign(elem,{title:"ì „ì²´ í•™ì‚¬ì¼ì •",startMonth:project.settings.startMonth||1,monthCount:12,displayMode:"limit",maxItems:24,showEndDate:false,columns:1,fontSize:8,minFontSize:6,autoShrink:true});
 if(type==="month-date-strip")Object.assign(elem,{monthSource:"page",year:project.settings.year,month:project.settings.startMonth||1,showWeekday:true,showDate:true,equalCells:true,style:{weekdayColor:"#6b7280",dateColor:"#17202e",sundayColor:"#d04444",saturdayColor:"#3569b8",background:true}});
 if(type==="monthly-quote")Object.assign(elem,{title:"ì´ ë‹¬ì˜ ëª…ì–¸",style:{titleSize:13,quoteKoSize:18,quoteEnSize:10,sourceSize:9,textAlign:"center",color:"#17202e",accentColor:"#315e9e",secondaryColor:"#667085",itemGap:7}});
 snapshot();arr.push(elem);selectedElementId=elem.id;selectedElementScope=scope;render()
}

function currentMonthEvents(p=selectedPage()){
 if(!p.calendarYear||!p.calendarMonth)return[];
 const prefix=`${p.calendarYear}-${String(p.calendarMonth).padStart(2,"0")}`;
 return project.book.events.filter(ev=>(ev.startDate||"").startsWith(prefix)||(ev.endDate||"").startsWith(prefix)).sort((a,b)=>a.startDate.localeCompare(b.startDate))
}
const MONTHLY_QUOTE_SEED=[
 {quoteKo:"ì‘ì€ ë°°ì›€ì´ ìŒ“ì—¬ í° ì„±ì¥ì„ ë§Œë“­ë‹ˆë‹¤.",quoteEn:"Small lessons add up to meaningful growth."},
 {quoteKo:"ì„œë¡œì˜ ë‹¤ë¦„ì„ ì´í•´í•  ë•Œ í•¨ê»˜ ë” ë©€ë¦¬ ê°ˆ ìˆ˜ ìˆìŠµë‹ˆë‹¤.",quoteEn:"Understanding our differences helps us go farther together."},
 {quoteKo:"ì‹¤ìˆ˜ëŠ” ë©ˆì¶¤ì˜ ì´ìœ ê°€ ì•„ë‹ˆë¼ ë‹¤ì‹œ ë°°ìš°ëŠ” ê¸°íšŒì…ë‹ˆë‹¤.",quoteEn:"A mistake is a chance to learn again, not a reason to stop."},
 {quoteKo:"ì˜¤ëŠ˜ì˜ ì„±ì‹¤í•¨ì€ ë‚´ì¼ì˜ ìì‹ ê°ì„ ë§Œë“­ë‹ˆë‹¤.",quoteEn:"Today's steady effort becomes tomorrow's confidence."},
 {quoteKo:"ì¢‹ì€ ì§ˆë¬¸ í•˜ë‚˜ê°€ ìƒˆë¡œìš´ ê¸¸ì„ ì—´ì–´ ì¤ë‹ˆë‹¤.",quoteEn:"One thoughtful question can open a new path."},
 {quoteKo:"ì¹œì ˆí•œ ë§ í•œë§ˆë””ëŠ” êµì‹¤ì„ ë” ë”°ëœ»í•˜ê²Œ ë§Œë“­ë‹ˆë‹¤.",quoteEn:"One kind word can make the classroom warmer."},
 {quoteKo:"ì‰¬ì–´ ê°€ëŠ” ì‹œê°„ë„ ì•ìœ¼ë¡œ ë‚˜ì•„ê°€ëŠ” ê³¼ì •ì…ë‹ˆë‹¤.",quoteEn:"Taking time to rest is also part of moving forward."},
 {quoteKo:"í•  ìˆ˜ ìˆë‹¤ëŠ” ë¯¿ìŒì€ ë„ì „ì„ ì‹œì‘í•˜ê²Œ í•©ë‹ˆë‹¤.",quoteEn:"Believing you can is where every challenge begins."},
 {quoteKo:"í•¨ê»˜ ë‚˜ëˆˆ ì§€ì‹ì€ ë” í° ì§€í˜œê°€ ë©ë‹ˆë‹¤.",quoteEn:"Knowledge shared together grows into greater wisdom."},
 {quoteKo:"ê¾¸ì¤€í•¨ì€ ì¬ëŠ¥ì´ ë¹›ë‚  ì‹œê°„ì„ ë§Œë“¤ì–´ ì¤ë‹ˆë‹¤.",quoteEn:"Consistency gives talent the time it needs to shine."},
 {quoteKo:"ê²½ì²­ì€ ì„œë¡œë¥¼ ì´í•´í•˜ëŠ” ê°€ì¥ ì¢‹ì€ ì‹œì‘ì…ë‹ˆë‹¤.",quoteEn:"Listening is the best beginning of understanding."},
 {quoteKo:"í•œ í•´ì˜ ëì€ ìƒˆë¡œìš´ ê¿ˆì„ ì¤€ë¹„í•˜ëŠ” ì¶œë°œì ì…ë‹ˆë‹¤.",quoteEn:"The end of a year is a starting point for new dreams."}
];
function monthlyQuoteKey(p=selectedPage()){return p?.calendarYear&&p?.calendarMonth?`${p.calendarYear}-${String(p.calendarMonth).padStart(2,"0")}`:null}
function ensureMonthlyQuotes(){
 project.book.monthlyQuotes ||= {};
 const pages=(project.book.pageInstances||[]).filter(p=>p.role==="monthly-back"&&monthlyQuoteKey(p));
 pages.forEach((p,index)=>{const key=monthlyQuoteKey(p);if(project.book.monthlyQuotes[key])return;const seed=MONTHLY_QUOTE_SEED[index%MONTHLY_QUOTE_SEED.length];project.book.monthlyQuotes[key]={title:"ì´ ë‹¬ì˜ ëª…ì–¸",...seed,source:"ìš°ë¦¬í•™êµì¸ì‡„ êµìœ¡ ë¬¸êµ¬",sourceStatus:"original",translationType:"editorial"}})
}
function monthlyQuoteForPage(p=selectedPage()){ensureMonthlyQuotes();const key=monthlyQuoteKey(p);return key?project.book.monthlyQuotes[key]:{title:"ì´ ë‹¬ì˜ ëª…ì–¸",quoteKo:"ì›”ë ¥ ë’·ë©´ì—ì„œ ì›”ë³„ ëª…ì–¸ì„ í¸ì§‘í•˜ì„¸ìš”.",quoteEn:"Edit the monthly quote on a monthly back page.",source:""}}
function renderWidgetContent(view,p){
 if(["mini-calendar","mini-calendar-prev","mini-calendar-next"].includes(view.type)){
  const offset=view.type==="mini-calendar-prev"?-1:view.type==="mini-calendar-next"?1:0;
  const baseYear=Number(p.calendarYear||project.settings.year),baseMonth=Number(p.calendarMonth||project.settings.startMonth||1),target=new Date(baseYear,baseMonth-1+offset,1),year=target.getFullYear(),month=target.getMonth()+1;
  const rows=calendarRowCountFor(year,month);
  const monthNames=["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"],label=view.monthLabelStyle==="number-en"?`${month} <small>${monthNames[month-1]}</small>`:`${year}ë…„ ${month}ì›”`,weekdayRows=view.showWeekdayHeader===false?"":"auto ";
  const miniStyle=view.style||{},miniVars=`--mini-title-align:${miniStyle.titleAlign||"left"};--mini-title-size:${Number(miniStyle.titleSize||11)}px;--mini-primary:${miniStyle.primary||"#293878"};--mini-weekday:${miniStyle.weekdayColor||"#7a8291"};--mini-date:${miniStyle.dateColor||"#293878"};--mini-sunday:${miniStyle.sunday||"#ef3340"};--mini-saturday:${miniStyle.saturday||"#4777bd"};`,miniClass=miniStyle.gridLine?" mini-grid-lines":"";
  let inner=`<div class="widget-mini-calendar${miniClass}" style="${miniVars}"><strong>${label}</strong><div class="mini-grid" style="--mini-calendar-rows:${rows};grid-template-rows:${weekdayRows}repeat(${rows},1fr)">`;
  if(view.showWeekdayHeader!==false)weekDayHeaders().forEach(x=>inner+=`<span class="mh">${x}</span>`);
  calendarGridFor(year,month,rows).forEach(c=>{const date=`${c.year}-${String(c.month).padStart(2,"0")}-${String(c.day).padStart(2,"0")}`,holiday=(project.book.events||[]).some(event=>event.startDate===date&&event.category==="holiday");inner+=`<span class="${[c.month!==month?"adj":"",c.dow===0?"sun":"",c.dow===6?"sat":"",holiday?"holiday":""].filter(Boolean).join(" ")}">${c.day}${c.extra?` Â· ${c.extra.day}`:""}</span>`});
  return inner+"</div></div>"
 }
 if(view.type==="year-calendar"){
  const cols=Number(view.columns||4),count=Number(view.monthCount||12),start=Number(view.startMonth||1),seq=monthSequence(p.calendarYear||project.settings.year,start).slice(0,count);
  let inner=`<div class="year-calendar-object" style="--year-cols:${cols};--year-rows:${Math.ceil(count/cols)}">`;
  seq.forEach(mm=>{const rows=yearCalendarRowCountFor(view,mm.year,mm.month),monthNames=["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"],label=view.monthLabelStyle==="number-en"?`${mm.month} <small>${monthNames[mm.month-1]}</small>`:`${mm.month}ì›”`,weekdayRows=view.showWeekdayHeader===false?"":"auto ";inner+=`<div class="year-month"><strong>${label}</strong><div class="year-month-grid" style="--year-calendar-rows:${rows};grid-template-rows:${weekdayRows}repeat(${rows},1fr)">`;if(view.showWeekdayHeader!==false)weekDayHeaders(true).forEach(x=>inner+=`<span class="mh">${x}</span>`);calendarGridFor(mm.year,mm.month,rows).forEach(c=>inner+=`<span class="${c.month!==mm.month?"adj":""}">${c.day}</span>`);inner+=`</div></div>`});
  return inner+"</div>"
 }
 if(view.type==="month-date-strip"){
  const usePage=view.monthSource!=="fixed"&&p.calendarYear&&p.calendarMonth,year=usePage?p.calendarYear:Number(view.year||project.settings.year),month=usePage?p.calendarMonth:Number(view.month||project.settings.startMonth||1),count=new Date(year,month,0).getDate();
  let inner=`<div class="month-date-strip" style="--date-count:${count};${view.style?.background===false?"background:transparent;border-color:transparent;":""}">`;
  for(let day=1;day<=count;day++){const dow=new Date(year,month-1,day).getDay(),letter="SMTWTFS"[dow];inner+=`<div class="month-date-cell ${dow===0?"sun":dow===6?"sat":""}">${view.showWeekday===false?"":`<span class="dow">${letter}</span>`}${view.showDate===false?"":`<span class="date">${day}</span>`}</div>`}
  return inner+"</div>"
 }
 if(view.type==="memo"){
  const layout=view.memoLayout||"lines",title=v21Escape(view.title||"ë©”ëª¨");
  if(layout==="yearly-grid"){
   const columns=Math.max(2,Math.min(6,Number(view.yearlyColumns||4))),lines=Math.max(0,Math.min(12,Number(view.linesPerMonth??4))),months=["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
   return `<div class="widget-memo yearly-plan-grid" style="--yearly-cols:${columns}"><strong class="yearly-plan-title">${title}</strong><div class="yearly-plan-months">${months.map((name,index)=>`<section><b>${view.monthLabelStyle==="number-ko"?`${index+1}ì›”`:`${index+1} ${name}`}</b><div>${Array.from({length:lines},()=>"<i></i>").join("")}</div></section>`).join("")}</div></div>`
  }
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
  return `<div class="widget-monthly-quote" style="${css}"><div class="quote-title">${v21Escape(q.title||view.title||"ì´ ë‹¬ì˜ ëª…ì–¸")}</div><div class="quote-ko">${v21Escape(q.quoteKo||"")}</div>${q.quoteEn?`<div class="quote-en">${v21Escape(q.quoteEn)}</div>`:""}${q.source?`<div class="quote-source">â€” ${v21Escape(q.source)}</div>`:""}</div>`
 }
 if(view.type==="monthly-schedule"){
  const sizeScale=Math.max(.62,Math.min(1.35,Math.min(Number(view.width||35)/35,Number(view.height||28)/28)));
  const items=currentMonthEvents(p).slice(0,view.maxItems||10);let inner=`<div class="widget-schedule" style="--schedule-pad:${(7*sizeScale).toFixed(1)}px;--schedule-title-size:${(12*sizeScale).toFixed(1)}px;--schedule-font-size:${(9*sizeScale).toFixed(1)}px;--schedule-date-width:${(26*sizeScale).toFixed(1)}px;--schedule-gap:${(4*sizeScale).toFixed(1)}px;--schedule-item-gap:${(4*sizeScale).toFixed(1)}px"><strong>${view.title||"ì´ë‹¬ì˜ ì¼ì •"}</strong>`;
  inner+=items.length?items.map(ev=>`<div class="schedule-item"><time>${ev.startDate.slice(8,10)}ì¼</time><span>${ev.title}</span></div>`).join(""):`<div class="schedule-empty">ë“±ë¡ëœ ì¼ì •ì´ ì—†ìŠµë‹ˆë‹¤.</div>`;
  return inner+"</div>"
 }
 if(view.type==="event-list"){
  const year=p.calendarYear||project.settings.year,startMonth=Number(view.startMonth||project.settings.startMonth||1),count=Number(view.monthCount||12);
  const rangeStart=new Date(year,startMonth-1,1),rangeEnd=new Date(year,startMonth-1+count,0);
  const allItems=project.book.events.filter(ev=>{const a=new Date(ev.startDate+"T00:00:00"),b=new Date((ev.endDate||ev.startDate)+"T00:00:00");return a<=rangeEnd&&b>=rangeStart}).sort((a,b)=>a.startDate.localeCompare(b.startDate));
  const items=view.displayMode==="all"?allItems:allItems.slice(0,Number(view.maxItems||24));
  const requestedColumns=view.columns==="auto"?"auto":Math.max(1,Math.min(4,Number(view.columns||1))),fontSize=Math.max(5,Math.min(18,Number(view.fontSize||8))),minFontSize=Math.max(5,Math.min(fontSize,Number(view.minFontSize||6)));
  let inner=`<div class="widget-event-list" data-event-fit="${view.autoShrink===false?"manual":"auto"}" data-event-columns="${requestedColumns}" data-event-width="${Number(view.width||20)}" data-event-height="${Number(view.height||40)}" data-event-font-size="${fontSize}" data-event-min-font-size="${minFontSize}"><strong>${view.title||"ì „ì²´ í•™ì‚¬ì¼ì •"}</strong><div class="annual-event-items" style="--event-list-columns:${requestedColumns==="auto"?1:requestedColumns};--event-list-font-size:${fontSize}px">`;
  inner+=items.length?items.map(ev=>{const end=view.showEndDate&&ev.endDate&&ev.endDate!==ev.startDate?`â€“${ev.endDate.slice(5).replace("-",".")}`:"";return `<div class="annual-event-item"><time>${ev.startDate.slice(5).replace("-",".")}${end}</time><span>${ev.title}</span></div>`}).join(""):`<div class="annual-event-empty">ë“±ë¡ëœ ì¼ì •ì´ ì—†ìŠµë‹ˆë‹¤.</div>`;
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
   alt:"í•™êµ ì „ê²½ ì´ë¯¸ì§€",
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
   content:"ë°°ì›€ìœ¼ë¡œ ì„±ì¥í•˜ê³  í•¨ê»˜ ë¯¸ë˜ë¥¼ ì—¬ëŠ” í•™êµ",
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
  {id:`poster.event-list.${p.id}`,type:"event-list",x:76,y:13,width:19,height:82,zIndex:2,title:"ì „ì²´ í•™ì‚¬ì¼ì •",startMonth:project.settings.startMonth||1,monthCount:12,displayMode:"all",maxItems:24,showEndDate:false,columns:"auto",fontSize:8,minFontSize:6,autoShrink:true}
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
 if(binding==="school.contacts")return (school.contacts||[]).map(c=>{const label=c.label||"ì—°ë½ì²˜",fax=c.fax?(String(label).includes("íŒ©ìŠ¤")?` ${c.fax}`:` Â· íŒ©ìŠ¤ ${c.fax}`):"";return `${label}${c.phone?` ${c.phone}`:""}${fax}`}).join("\n");
 return "";
}
function resolveTextContent(view,p=selectedPage()){
 if(view.binding?.startsWith("school."))return schoolBindingValue(view.binding)||view.content||"í•™êµ ì •ë³´ ì…ë ¥";
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
 "school-logo":{label:"êµí‘œ",kind:"image",defaultName:"êµí‘œ",defaultDescription:""},
 "school-building":{label:"í•™êµ ì „ê²½",kind:"image-text",defaultName:"ìš°ë¦¬ í•™êµ",defaultDescription:"í•™êµ ì „ê²½ê³¼ êµìœ¡ í™˜ê²½ì„ ì†Œê°œí•©ë‹ˆë‹¤."},
 "school-flower":{label:"êµí™”",kind:"symbol",defaultName:"ì¥ë¯¸",defaultDescription:"ì‚¬ë‘ê³¼ ì—´ì •ì„ ìƒì§•í•©ë‹ˆë‹¤."},
 "school-tree":{label:"êµëª©",kind:"symbol",defaultName:"ì†Œë‚˜ë¬´",defaultDescription:"êµ³ì„¼ ì˜ì§€ì™€ í‘¸ë¥¸ ê¿ˆì„ ìƒì§•í•©ë‹ˆë‹¤."},
 "school-motto":{label:"êµí›ˆ",kind:"text",defaultName:"êµí›ˆ",defaultDescription:"ë°”ë¥´ê²Œ ë°°ìš°ê³  í•¨ê»˜ ì„±ì¥í•˜ì"},
 "school-song":{label:"êµê°€",kind:"song",defaultName:"ìš°ë¦¬ í•™êµ êµê°€",defaultDescription:"ì‘ì‚¬ ë¯¸ìƒ Â· ì‘ê³¡ ë¯¸ìƒ"},
 "school-custom-image":{label:"ì‚¬ìš©ì ì§€ì • ì´ë¯¸ì§€",kind:"image-text",defaultName:"ì‚¬ìš©ì ì§€ì • ì´ë¯¸ì§€",defaultDescription:"í•™êµì—ì„œ ì¶”ê°€ë¡œ ì‚¬ìš©í•˜ëŠ” ì´ë¯¸ì§€ ìì‚°"}
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
 return item.bindingEnabled&&item.binding?"ì‹¤ì œ í•™êµ ë°ì´í„° ì—°ê²°":"ê³ ì • ì½˜í…ì¸ "
}

let toastTimer=null;
function showEditorToast(message){
 if(document.querySelector('#entryScreen:not(.hidden), #designerHome:not(.hidden)'))return;
 const developerToast=/Shift ë‹¤ì¤‘ ì„ íƒ|ë°©í–¥í‚¤ ì´ë™|Ctrl\+Z|ê°œì²´ë¥¼ ë“œë˜ê·¸|í¬ê¸° ì¡°ì ˆì |Inspectorì—ì„œ|Runtime|ë©”ëª¨ë¦¬|ì§„ë‹¨|ë””ë²„ê·¸|í˜„ì¬ í…œí”Œë¦¿ ì„¤ê³„ ëª¨ë“œ|ì›”ë ¥ì„ ì„ íƒí–ˆ|Canvasì—ì„œ ì§ì ‘|Masterë¥¼ ì„ íƒ|Binding|ê³ ì • ì½˜í…ì¸  ê°œì²´|í˜ì´ì§€ .*ê°œì²´|ê°œë°œì/i.test(String(message||""));
 if(developerToast)return;
 const node=el("editorToast");if(!node)return;
 node.textContent=message;node.classList.add("show");
 clearTimeout(toastTimer);toastTimer=setTimeout(()=>node.classList.remove("show"),2600)
}
function switchEditMode(mode){
 editMode=mode;
 if(mode==="template")showEditorToast("í…œí”Œë¦¿ í¸ì§‘ìœ¼ë¡œ ì „í™˜í–ˆìŠµë‹ˆë‹¤. ê°œì²´ë¥¼ ë“œë˜ê·¸í•˜ê±°ë‚˜ í¬ê¸° ì¡°ì ˆì ì„ ì‚¬ìš©í•˜ì„¸ìš”.");
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
 ensureAssetResources();const count=el("resourceAssetCount");if(count)count.textContent=`${allSampleAssets().length}ê°œ`;
 const grid=el("resourceAssetManagerGrid");if(!grid)return;
 const activeIds=new Set(Object.values(project.book.school?.profile||{}).map(v=>v?.assetId).filter(Boolean));
 const assets=[...BUILTIN_SAMPLE_ASSETS,...projectSampleAssets()];
 grid.innerHTML=assets.map(a=>{const builtin=BUILTIN_SAMPLE_ASSETS.some(x=>x.id===a.id),active=activeIds.has(a.id);return `<article class="asset-manager-card ${active?"is-active":""}"><div class="asset-manager-image"><img src="${a.image}" alt="${a.name}"></div><div class="asset-manager-body"><strong>${a.name}</strong><small>${semanticRoleLabel(a.role)} Â· ${a.binding||defaultBindingForRole(a.role)}</small><span class="resource-status">${active?"í˜„ì¬ ì—°ê²°ë¨":builtin?"ê¸°ë³¸ ì œê³µ":"í…œí”Œë¦¿ ë“±ë¡"}</span><div class="asset-manager-actions"><button type="button" class="primary" data-add-managed-asset="${a.id}">ê°œì²´ë¡œ ì¶”ê°€</button>${builtin?`<button type="button" disabled>ê¸°ë³¸ ìì‚°</button>`:`<button type="button" class="danger" data-delete-managed-asset="${a.id}">ì‚­ì œ</button>`}</div></div></article>`}).join("");
 grid.querySelectorAll("[data-add-managed-asset]").forEach(b=>b.addEventListener("click",()=>{createSemanticObjectFromAsset(b.dataset.addManagedAsset);closeResourceModal()}));
 grid.querySelectorAll("[data-delete-managed-asset]").forEach(b=>b.addEventListener("click",()=>{if(!confirm("ì´ í…œí”Œë¦¿ ìì‚°ì„ ì‚­ì œí• ê¹Œìš”?"))return;snapshot();ensureAssetResources();const id=b.dataset.deleteManagedAsset;project.template.resources.sampleAssets=projectSampleAssets().filter(a=>a.id!==id);Object.values(project.book.school.profile||{}).forEach(v=>{if(v?.assetId===id){v.assetId=null;v.image=""}});markDirty();renderResourceAssetManager();renderRegisteredAssetLibrary();showEditorToast("í…œí”Œë¦¿ ìì‚°ì„ ì‚­ì œí–ˆìŠµë‹ˆë‹¤.")}));
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
  ? `${semanticRoleLabel(role)} ê°œì²´ë¥¼ ë¹ˆ ê³µê°„ì— ì¶”ê°€í–ˆìŠµë‹ˆë‹¤. ìœ„ì¹˜ ë³€ê²½ì€ í…œí”Œë¦¿ í¸ì§‘ì—ì„œ í•  ìˆ˜ ìˆìŠµë‹ˆë‹¤.`
  : `${semanticRoleLabel(role)} ê°œì²´ë¥¼ ì¶”ê°€í–ˆìŠµë‹ˆë‹¤. ë°”ë¡œ ì´ë™í•˜ê±°ë‚˜ í¬ê¸°ë¥¼ ì¡°ì ˆí•  ìˆ˜ ìˆìŠµë‹ˆë‹¤.`)
}
function semanticRoleLabel(role){return SEMANTIC_DEFS[role]?.label||role}
function semanticTitleVisible(item){return item.showTitle===true||(!Object.prototype.hasOwnProperty.call(item,"showTitle")&&["school-motto","school-song","school-tree","school-flower"].includes(item.role))}
function renderSemanticObject(item){
 const d=semanticData(item),layout=item.layoutPreset||"image-top",role=item.role;
 const image=d.image?`<img src="${d.image}" alt="${semanticRoleLabel(role)} ì´ë¯¸ì§€">`:`<span class="semantic-empty-visual non-output editor-only" aria-label="${semanticRoleLabel(role)} ì´ë¯¸ì§€ ìŠ¬ë¡¯"></span>`;
 const showTitle=semanticTitleVisible(item),title=showTitle?`<strong style="font-size:${item.style?.titleSize||18}px">${item.titleOverride||semanticRoleLabel(role)}</strong>`:"";
 if(role==="school-logo")return `<div class="semantic-object semantic-logo"><div class="semantic-media">${image}</div></div>`;
 if(layout==="desk-six-symbol-card"){
  if(role==="school-motto")return `<div class="semantic-object desk-six-symbol-card semantic-motto"><strong style="font-size:${item.style?.titleSize||15}px">${item.titleOverride||d.name||"êµí›ˆ"}</strong><p style="font-size:${item.style?.descriptionSize||11}px">${d.description||""}</p></div>`;
  return `<div class="semantic-object desk-~;Û]m¢G§²ÚîÆ­yÒ’ ôğ½Íµ…±°øğ½‘¥Øù€¤¹©½¥¸ œœ¤èœñ‘¥Ø±…ÍÌô‰‘•Í¥¸µÑåÁ”µÕ¹ÍÕÁÁ½ÉÑ•ˆû¶b²z°$ƒ®RS²zC²vàƒ²*“¶²vğƒªÎƒ®>¶fS®*Pƒ¶²®.³®‚—²^C®0ƒ²‚²j§®B§®.#®.¸ğ½‘¥Øøô(€™Õ¹Ñ¥½¸İÉ¥Ñ•MÁ•Œ¡ÍÁ•Œ±±…‰•°¥í‘•Í¥¹MÁ•Á¤¹İÉ¥Ñ”¡ÁÉ½©•Ğ±ÍÁ•Œ±‘•Í¥¹QåÁ•…Ñ…±½œ¤íµ…É­¥ÉÑä ¤íÉ•¹‘•É•Í¥¹MÁ•MÑ…ÑÕÌ¡±…‰•±ñğŸ¶b²z°ƒ¶s¶R3®šÿ²^@ƒ²‚²z—®B œ¤íİ¥¹‘½Ü¹1Q•µÁ±…Ñ•QåÁ•IÕ±•Ìü¹Á•ÉÍ¥ÍÑÕÉÉ•¹ÑQ•µÁ±…Ñ•M•ÑÑ¥¹Ìü¸¡±…‰•±ñğ$ƒ®RS²zC²vàƒ²*“¶²vğœ¥ô(€Á…•M•ÑÑ¥¹Ì¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ¡…¹”œ±•Ù•¹Ğôùí½¹ÍĞÍ•±•Ğõ•Ù•¹Ğ¹Ñ…É•Ğ¹±½Í•ÍĞ m‘…Ñ„µ‘•Í¥¸µÁ…”µÑåÁ•tœ¤í¥˜ …Í•±•Ğ¥É•ÑÕÉ¸í½¹ÍĞÍÁ•ŒõÕÉÉ•¹ÑMÁ•Œ ¤±É½±”õÍ•±•Ğ¹‘…Ñ…Í•Ğ¹‘•Í¥¹A…•QåÁ”íÍÁ•Œ¹Á…•QåÁ•ÍmÉ½±•tõÍ•±•Ğ¹Ù…±Õ”í¥˜¡É½±”ôôôµ½¹Ñ µ‰…¬œ¥íÍÁ•Œ¹Á…•M•ÑÑ¥¹Ìõì¸¸¸¡ÍÁ•Œ¹Á…•M•ÑÑ¥¹Íññíô¤±µ½¹Ñ¡	…­½µÁ½¹•¹ÑÌél¸¸¸¡5=9Q!}	-}U1QMmÍ•±•Ğ¹Ù…±Õ•uññ‘•Í¥¹MÁ•Á¤¹‘•™…Õ±Ñ5½¹Ñ¡	…­½µÁ½¹•¹ÑÍññmt¥t±µ½¹Ñ¡	…­ÕÍÑ½µ¥é•é™…±Í”±µ½¹Ñ¡	…­5•‘¥…5½‘”éÍ•±•Ğ¹Ù…±Õ”ôôô¥±±ÕÍÑÉ…Ñ¥½¸µ±•œüÑ•µÁ±…Ñ”µ‘•Í¥¸œéÍÁ•Œ¹Á…•M•ÑÑ¥¹Ìü¹µ½¹Ñ¡	…­5•‘¥…5½‘•ñğÍ…µÁ±”µÉ•Á±…•…‰±”õõİÉ¥Ñ•MÁ•Œ¡ÍÁ•Œ°Ÿ¶:c²vÓ²®Îƒ².s²zDƒªÖ³²Äœ¤íÉ•¹‘•É•Í¥¹QåÁ••Ñ…¥±Ì ¤íÉ•¹‘•ÉA…•M•ÑÑ¥¹Ì ¤íÉ•¹‘•ÉY¥ÍÕ…±5½‘•…É‘Ì ¥ô¤ì(€Á…¹•°¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ¡…¹”œ±•Ù•¹Ğôùí½¹ÍĞÍ•±•Ğõ•Ù•¹Ğ¹Ñ…É•Ğ¹±½Í•ÍĞ m‘…Ñ„µ‘•Í¥¸µÁ…”µÑåÁ•tœ¤í¥˜ …Í•±•Ğ¥É•ÑÕÉ¸í½¹ÍĞÍÁ•ŒõÕÉÉ•¹ÑMÁ•Œ ¤íÍÁ•Œ¹Á…•QåÁ•ÍmÍ•±•Ğ¹‘…Ñ…Í•Ğ¹‘•Í¥¹A…•QåÁ•tõÍ•±•Ğ¹Ù…±Õ”í¥˜¡Í•±•Ğ¹‘…Ñ…Í•Ğ¹‘•Í¥¹A…•QåÁ”ôôôµ½¹Ñ µ‰…¬œ˜˜…ÍÁ•Œ¹Á…•M•ÑÑ¥¹Ìü¹µ½¹Ñ¡	…­ÕÍÑ½µ¥é•¥ÍÁ•Œ¹Á…•M•ÑÑ¥¹Ìõíµ½¹Ñ¡	…­½µÁ½¹•¹ÑÌél¸¸¸¡5=9Q!}	-}U1QMmÍ•±•Ğ¹Ù…±Õ•uññ‘•Í¥¹MÁ•Á¤¹‘•™…Õ±Ñ5½¹Ñ¡	…­½µÁ½¹•¹ÑÍññmt¥t±µ½¹Ñ¡	…­ÕÍÑ½µ¥é•é™…±Í•ôíİÉ¥Ñ•MÁ•Œ¡ÍÁ•Œ°Ÿ¶:c²vÓ²®Îƒ².s²zDƒªÖ³²Äœ¤íÉ•¹‘•É•Í¥¹QåÁ••Ñ…¥±Ì ¤íÕÁ‘…Ñ••Í¥¹QåÁ•AÉ•Ù¥•Ü ¤íÉ•¹‘•ÉA…•M•ÑÑ¥¹Ì ¥ô¤ì(€™Õ¹Ñ¥½¸É•¹‘•ÉMÑå±•…É‘Ì ¥í½¹ÍĞÍÁ•ŒõÕÉÉ•¹ÑMÁ•Œ ¤±¡½ÍĞô •‘¥Ñ…‰±••Í¥¹MÑå±•É¥œ¤ì ‘•Í¥¹½µµ½¹Õ¥‘•±¥¹”œ¤¹Ù…±Õ”õÍÁ•Œ¹½µµ½¹Õ¥‘•±¥¹”í¡½ÍĞ¹¥¹¹•É!Q50õÍÁ•Œ¹ÍÑå±•M¹…ÁÍ¡½ÑÌ¹µ…À¡ÍÑå±”ôù€ñ…ÉÑ¥±”±…ÍÌô‰‘•Í¥¸µ¡½¥”µ…É•‘¥Ñ…‰±”µ‘•Í¥¸µ…É‘íÍÑå±”¹¥ôôõÍÁ•Œ¹ÍÑå±•%üœÍ•±•Ñ•œèœôˆ‘…Ñ„µÍÑå±”µ¥ôˆ‘íØÈÅÍ…Á”¡ÍÑå±”¹¥¥ôˆøñ‘¥Ø±…ÍÌô‰‘•Í¥¸µÍÑå±”µÍİ…Ñ¡•Ìˆø‘íÍÑå±”¹½±½ÉÌ¹µ…À¡½±½Èôù€ñ¤ÍÑå±”ô‰‰…­É½Õ¹è‘íØÈÅÍ…Á”¡½±½È¥ôˆøğ½¤ù€¤¹©½¥¸ œœ¥ôğ½‘¥ØøñÍÑÉ½¹œø‘íØÈÅÍ…Á”¡ÍÑå±”¹¹…µ”¥ôğ½ÍÑÉ½¹œøñÍÁ…¸ø‘íØÈÅÍ…Á”¡ÍÑå±”¹‘•ÍÉ¥ÁÑ¥½¸¥ôğ½ÍÁ…¸øñ‘¥Ø±…ÍÌô‰‘•Í¥¸µÍÑå±”µ…Éµ…Ñ¥½¹Ìˆøñ‰ÕÑÑ½¸ÑåÁ”ô‰‰ÕÑÑ½¸ˆ‘…Ñ„µÍ•±•Ğµ‘•Í¥¸µÍÑå±”ôˆ‘íØÈÅÍ…Á”¡ÍÑå±”¹¥¥ôˆø‘íÍÑå±”¹¥ôôõÍÁ•Œ¹ÍÑå±•%üŸ²ƒ¶w®B œèŸ²vĞƒ²*“¶²vğƒ²ƒ¶tôğ½‰ÕÑÑ½¸øñ‰ÕÑÑ½¸ÑåÁ”ô‰‰ÕÑÑ½¸ˆ‘…Ñ„µ•‘¥Ğµ‘•Í¥¸µÍÑå±”ôˆ‘íØÈÅÍ…Á”¡ÍÑå±”¹¥¥ôˆû¶:ã²Dğ½‰ÕÑÑ½¸øğ½‘¥Øøğ½…ÉÑ¥±”ù€¤¹©½¥¸ œœ¤íÉ•¹‘•ÉÑÕ…±A…•Ì ¤íÉ•¹‘•ÉY¥ÍÕ…±5½‘•…É‘Ì ¥ô(€™Õ¹Ñ¥½¸ÍÑ½É•I½±•É…™Ğ ¥í¥˜ …İ½É­¥¹MÑå±”¥É•ÑÕÉ¸íİ½É­¥¹MÑå±”¹Õ¥‘…¹•m•‘¥Ñ¥¹I½±•tõí‘•ÍÉ¥ÁÑ¥½¸è ‘•Í¥¹MÑå±•I½±••ÍÉ¥ÁÑ¥½¸œ¤¹Ù…±Õ”¹ÑÉ¥´ ¤±­•åİ½É‘Ìè ‘•Í¥¹MÑå±•I½±•-•åİ½É‘Ìœ¤¹Ù…±Õ”¹ÑÉ¥´ ¤±™½É‰¥‘‘•¸è ‘•Í¥¹MÑå±•I½±•½É‰¥‘‘•¸œ¤¹Ù…±Õ”¹ÑÉ¥´ ¥õô(€™Õ¹Ñ¥½¸É•¹‘•ÉI½±•‘¥Ñ½È ¥í½¹ÍĞÉ½±•Ìõ=‰©•Ğ¹­•åÌ¡‘•Í¥¹QåÁ•…Ñ…±½œ¹É½±•Ì¤±•¹ÑÉäõİ½É­¥¹MÑå±”¹Õ¥‘…¹•m•‘¥Ñ¥¹I½±•uññíôì ‘•Í¥¹MÑå±•I½±•Q…‰Ìœ¤¹¥¹¹•É!Q50õÉ½±•Ì¹µ…À¡É½±”ôù€ñ‰ÕÑÑ½¸ÑåÁ”ô‰‰ÕÑÑ½¸ˆ‘…Ñ„µ•‘¥ĞµÍÑå±”µÉ½±”ôˆ‘íÉ½±•ôˆ±…ÍÌôˆ‘íÉ½±”ôôõ•‘¥Ñ¥¹I½±”ü…Ñ¥Ù”œèœôˆø‘íØÈÅÍ…Á”¡‘•Í¥¹QåÁ•…Ñ…±½œ¹É½±•ÍmÉ½±•t¹±…‰•°¥ôğ½‰ÕÑÑ½¸ù€¤¹©½¥¸ œœ¤ì ‘•Í¥¹MÑå±•I½±••ÍÉ¥ÁÑ¥½¸œ¤¹Ù…±Õ”õ•¹ÑÉä¹‘•ÍÉ¥ÁÑ¥½¹ñğœœì ‘•Í¥¹MÑå±•I½±•-•åİ½É‘Ìœ¤¹Ù…±Õ”õ•¹ÑÉä¹­•åİ½É‘Íñğœœì ‘•Í¥¹MÑå±•I½±•½É‰¥‘‘•¸œ¤¹Ù…±Õ”õ•¹ÑÉä¹™½É‰¥‘‘•¹ñğœô(€™Õ¹Ñ¥½¸½Á•¹MÑå±•‘¥Ñ½È¡ÍÑå±•%¥í½¹ÍĞÍ½ÕÉ”õÕÉÉ•¹ÑMÁ•Œ ¤¹ÍÑå±•M¹…ÁÍ¡½ÑÌ¹™¥¹¡ÍÑå±”ôùÍÑå±”¹¥ôôõÍÑå±•%¤í¥˜ …Í½ÕÉ”¥É•ÑÕÉ¸í•‘¥Ñ¥¹MÑå±•%õÍÑå±•%í•‘¥Ñ¥¹I½±”ô½Ù•Èœíİ½É­¥¹MÑå±”õ)M=8¹Á…ÉÍ”¡)M=8¹ÍÑÉ¥¹¥™ä¡Í½ÕÉ”¤¤ì ‘•Í¥¹MÑå±•‘¥Ñ½ÉQ¥Ñ±”œ¤¹Ñ•áÑ½¹Ñ•¹Ğõ€‘íÍ½ÕÉ”¹¹…µ•ôƒ¶:ã²E€ì ‘•Í¥¹MÑå±•‘¥Ñ9…µ”œ¤¹Ù…±Õ”õÍ½ÕÉ”¹¹…µ”ì ‘•Í¥¹MÑå±•‘¥Ñ•ÍÉ¥ÁÑ¥½¸œ¤¹Ù…±Õ”õÍ½ÕÉ”¹‘•ÍÉ¥ÁÑ¥½¸íÉ•¹‘•ÉI½±•‘¥Ñ½È ¤íµ½‘…°¹±…ÍÍ1¥ÍĞ¹É•µ½Ù” ¡¥‘‘•¸œ¥ô(€™Õ¹Ñ¥½¸±½Í•MÑå±•‘¥Ñ½È ¥íµ½‘…°¹±…ÍÍ1¥ÍĞ¹…‘ ¡¥‘‘•¸œ¤í•‘¥Ñ¥¹MÑå±•%õ¹Õ±°íİ½É­¥¹MÑå±”õ¹Õ±±ô(€Á…¹•°¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ¡…¹”œ±•Ù•¹Ğôù•Ù•¹Ğ¹ÍÑ½ÁAÉ½Á……Ñ¥½¸ ¤¤íÁ…¹•°¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ±¥¬œ±•Ù•¹Ğôù•Ù•¹Ğ¹ÍÑ½ÁAÉ½Á……Ñ¥½¸ ¤¤ì(€Á…¹•°¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ±¥¬œ±•Ù•¹Ğôùí½¹ÍĞÍ•±•Ğõ•Ù•¹Ğ¹Ñ…É•Ğ¹±½Í•ÍĞ m‘…Ñ„µÍ•±•Ğµ‘•Í¥¸µÍÑå±•tœ¤±•‘¥Ğõ•Ù•¹Ğ¹Ñ…É•Ğ¹±½Í•ÍĞ m‘…Ñ„µ•‘¥Ğµ‘•Í¥¸µÍÑå±•tœ¤±µ½‘”õ•Ù•¹Ğ¹Ñ…É•Ğ¹±½Í•ÍĞ m‘…Ñ„µ‘•Í¥¸µÙ¥ÍÕ…°µµ½‘•tœ¤í¥˜¡Í•±•Ğ¥í½¹ÍĞÍÁ•ŒõÕÉÉ•¹ÑMÁ•Œ ¤íÍÁ•Œ¹ÍÑå±•%õÍ•±•Ğ¹‘…Ñ…Í•Ğ¹Í•±•Ñ•Í¥¹MÑå±”íİÉ¥Ñ•MÁ•Œ¡ÍÁ•Œ°Ÿ®RS²zC²vàƒ²*“¶²vğƒ²ƒ¶tœ¤íÉ•¹‘•ÉMÑå±•…É‘Ì ¥õ•±Í”¥˜¡•‘¥Ğ¥½Á•¹MÑå±•‘¥Ñ½È¡•‘¥Ğ¹‘…Ñ…Í•Ğ¹•‘¥Ñ•Í¥¹MÑå±”¤í•±Í”¥˜¡µ½‘”¥í½¹ÍĞÍÁ•ŒõÕÉÉ•¹ÑMÁ•Œ ¤íÍÁ•Œ¹•áÁÉ•ÍÍ¥½¹mµ½‘”¹‘…Ñ…Í•Ğ¹‘•Í¥¹Y¥ÍÕ…±5½‘•tõµ½‘”¹‘…Ñ…Í•Ğ¹Ù…±Õ”íİÉ¥Ñ•MÁ•Œ¡ÍÁ•Œ±µ½‘”¹‘…Ñ…Í•Ğ¹‘•Í¥¹Y¥ÍÕ…±5½‘”ôôôµ½¹Ñ¡É½¹Ñ5½‘”œüŸ²nS®‚”ƒ²V{®¦Ğƒ®RS²zC²vàƒ®Î¶fPœèŸ²nS®‚”ƒ®Jß®¦Ğƒ®RS²zC²vàƒ®Î¶fPœ¤íÉ•¹‘•ÉY¥ÍÕ…±5½‘•…É‘Ì ¥õô¤ì(€€ Í…Ù••Í¥¹½µµ½¹Õ¥‘•±¥¹•	Ñ¸œ¤¹½¹±¥¬ô ¤ôùí½¹ÍĞÍÁ•ŒõÕÉÉ•¹ÑMÁ•Œ ¤íÍÁ•Œ¹½µµ½¹Õ¥‘•±¥¹”ô ‘•Í¥¹½µµ½¹Õ¥‘•±¥¹”œ¤¹Ù…±Õ”¹ÑÉ¥´ ¤íİÉ¥Ñ•MÁ•Œ¡ÍÁ•Œ°ŸªÎ×¶Ô$ƒ®RS²zC²vàƒ²²æ œ¤íÉ•¹‘•ÉMÑå±•…É‘Ì ¥ôì(€€ Í…Ù••Í¥¹5½¹Ñ¡=ÁÑ¥½¹Í	Ñ¸œ¤¹½¹±¥¬ô ¤ôùí½¹ÍĞÍÁ•ŒõÕÉÉ•¹ÑMÁ•Œ ¤íÍÁ•Œ¹•áÁÉ•ÍÍ¥½¸õíÙ…É¥…Ñ¥½¹I¡åÑ¡´è ‘•Í¥¹5½¹Ñ¡Y…É¥…Ñ¥½¹I¡åÑ¡´œ¤¹Ù…±Õ”±µ½¹Ñ¡½±½ÉY…É¥…Ñ¥½¸è ‘•Í¥¹5½¹Ñ¡½±½ÉY…É¥…Ñ¥½¸œ¤¹Ù…±Õ”±µ½¹Ñ¡½µÁ½Í¥Ñ¥½¹Y…É¥…Ñ¥½¸è ‘•Í¥¹5½¹Ñ¡½µÁ½Í¥Ñ¥½¹Y…É¥…Ñ¥½¸œ¤¹Ù…±Õ”±µ½¹Ñ¡5½Ñ¥™Y…É¥…Ñ¥½¸è ‘•Í¥¹5½¹Ñ¡5½Ñ¥™Y…É¥…Ñ¥½¸œ¤¹Ù…±Õ”±µ½¹Ñ¡•½É…Ñ¥½¹Y…É¥…Ñ¥½¸è ‘•Í¥¹5½¹Ñ¡•½É…Ñ¥½¹Y…É¥…Ñ¥½¸œ¤¹Ù…±Õ”±µ½¹Ñ¡	…­A¡½Ñ¼è ‘•Í¥¹5½¹Ñ¡	…­A¡½Ñ¼œ¤¹Ù…±Õ”±µ½¹Ñ¡	…­M•…Í½¸è ‘•Í¥¹5½¹Ñ¡	…­M•…Í½¸œ¤¹Ù…±Õ•ôíİÉ¥Ñ•MÁ•Œ¡ÍÁ•Œ°Ÿ²nS®‚”ƒ®RS²zC²vàƒ®Î¶fPœ¤íÉ•¹‘•ÉMÑå±•…É‘Ì ¥ôì(€µ½‘…°¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ±¥¬œ±•Ù•¹Ğôùí¥˜¡•Ù•¹Ğ¹Ñ…É•Ğ¹±½Í•ÍĞ m‘…Ñ„µ±½Í”µ‘•Í¥¸µÍÑå±•tœ¥ññ•Ù•¹Ğ¹Ñ…É•Ğôôõµ½‘…°¥í±½Í•MÑå±•‘¥Ñ½È ¤íÉ•ÑÕÉ¹õ½¹ÍĞÉ½±”õ•Ù•¹Ğ¹Ñ…É•Ğ¹±½Í•ÍĞ m‘…Ñ„µ•‘¥ĞµÍÑå±”µÉ½±•tœ¤í¥˜¡É½±”¥íÍÑ½É•I½±•É…™Ğ ¤í•‘¥Ñ¥¹I½±”õÉ½±”¹‘…Ñ…Í•Ğ¹•‘¥ÑMÑå±•I½±”íÉ•¹‘•ÉI½±•‘¥Ñ½È ¥õô¤ì(€€ Í…Ù••Í¥¹MÑå±•	Ñ¸œ¤¹½¹±¥¬ô ¤ôùíÍÑ½É•I½±•É…™Ğ ¤í½¹ÍĞÍÁ•ŒõÕÉÉ•¹ÑMÁ•Œ ¤±¥¹‘•àõÍÁ•Œ¹ÍÑå±•M¹…ÁÍ¡½ÑÌ¹™¥¹‘%¹‘•à¡ÍÑå±”ôùÍÑå±”¹¥ôôõ•‘¥Ñ¥¹MÑå±•%¤íİ½É­¥¹MÑå±”¹¹…µ”ô ‘•Í¥¹MÑå±•‘¥Ñ9…µ”œ¤¹Ù…±Õ”¹ÑÉ¥´ ¥ññİ½É­¥¹MÑå±”¹¹…µ”íİ½É­¥¹MÑå±”¹‘•ÍÉ¥ÁÑ¥½¸ô ‘•Í¥¹MÑå±•‘¥Ñ•ÍÉ¥ÁÑ¥½¸œ¤¹Ù…±Õ”¹ÑÉ¥´ ¥ññİ½É­¥¹MÑå±”¹‘•ÍÉ¥ÁÑ¥½¸í¥˜¡¥¹‘•àøôÀ¥ÍÁ•Œ¹ÍÑå±•M¹…ÁÍ¡½ÑÍm¥¹‘•átõİ½É­¥¹MÑå±”íİÉ¥Ñ•MÁ•Œ¡ÍÁ•Œ±€‘íİ½É­¥¹MÑå±”¹¹…µ•ôƒ²*“¶²vñ€¤í±½Í•MÑå±•‘¥Ñ½È ¤íÉ•¹‘•ÉMÑå±•…É‘Ì ¥ôì(€É•¹‘•ÉMÑå±•…É‘Ì ¤íİ¥¹‘½Ü¹1•Í­MÑå±•‘¥Ñ½ÈõíÉ•¹‘•ÈéÉ•¹‘•ÉMÑå±•…É‘Íôì(ô(¥¹ÍÑ…±±•Í­MÑå±•‘¥Ñ½È ¤ì(½¹ÍĞÍ¡½½°õ‘½Õµ•¹Ğ¹ÅÕ•ÉåM•±•Ñ½È m‘…Ñ„µÉ•Í½ÕÉ”µ½¹Ñ•¹Ğô‰Í¡½½°‰tœ¤±½±½ÉÌõ‘½Õµ•¹Ğ¹ÅÕ•ÉåM•±•Ñ½È m‘…Ñ„µÉ•Í½ÕÉ”µ½¹Ñ•¹Ğô‰½±½ÉÌ‰tœ¤±™½¹ÑÌõ‘½Õµ•¹Ğ¹ÅÕ•ÉåM•±•Ñ½È m‘…Ñ„µÉ•Í½ÕÉ”µ½¹Ñ•¹Ğô‰™½¹ÑÌ‰tœ¤±•Ù•¹ÑÌõ‘½Õµ•¹Ğ¹ÅÕ•ÉåM•±•Ñ½È m‘…Ñ„µÉ•Í½ÕÉ”µ½¹Ñ•¹Ğô‰•Ù•¹ÑÌ‰tœ¤ì(¥˜¡½±½ÉÌ˜™™½¹ÑÌ¥í½±½ÉÌ¹ÅÕ•ÉåM•±•Ñ½È  Ìœ¤¹Ñ•áÑ½¹Ñ•¹ĞôŸ²'²
ß¶>Ã¶*àƒ¶3® œí½±½ÉÌ¹ÅÕ•ÉåM•±•Ñ½È œéÍ½Á”ø¹É•Í½ÕÉ”µ‘•ÍÉ¥ÁÑ¥½¸œ¤¹Ñ•áÑ½¹Ñ•¹ĞôŸ¶s¶R3®šüƒ²‚²ÊÓ²^C²pƒªÎ×²rƒ¶Vc®*Pƒ²'²ªÎğƒªâªòÓ²vƒ¶Vpƒ¶fS®¦Ó²^C²pƒ²“²‚W¶V§®.#®.¸œí½¹ÍĞ™½¹Ñ…Éõ™½¹ÑÌ¹ÅÕ•ÉåM•±•Ñ½È œ¹Í•ÑÑ¥¹Ìµ…Éœ¤í¥˜¡™½¹Ñ…É¥í™½¹Ñ…É¹±…ÍÍ1¥ÍĞ¹…‘ Ñ¡•µ”µ½µ‰¥¹•µ…Éœ¤í½±½ÉÌ¹…ÁÁ•¹‘¡¥±¡™½¹Ñ…É¥õ™½¹ÑÌ¹É•µ½Ù” ¥ô(¥˜¡Í¡½½°¥íÍ¡½½°¹ÅÕ•ÉåM•±•Ñ½È œéÍ½Á”ù Ìœ¤¹Ñ•áÑ½¹Ñ•¹ĞôŸ¶VgªÖ@ƒ²‚W®ÎĞƒ®Â<ƒ²^C²,œíÍ¡½½°¹ÅÕ•ÉåM•±•Ñ½È œéÍ½Á”ø¹É•Í½ÕÉ”µ‘•ÍÉ¥ÁÑ¥½¸œ¤¹Ñ•áÑ½¹Ñ•¹ĞôŸ¶:ã²DƒªÂ®*—¶Vpƒ¶VgªÖ@ƒ¶7²*“¶*àƒ²‚W®ÎÓ²f ƒ²^·¶Vƒ®Îƒ²c¶R0ƒ²vÓ®¾ã²®–ğƒªÖ³®Ú¶VĞƒªÒ®š³¶V§®.#®.¸œí½¹ÍĞ…É‘Ìõl¸¸¹Í¡½½°¹ÅÕ•ÉåM•±•Ñ½É±° œéÍ½Á”ø¹Í•ÑÑ¥¹Ìµ…Éœ¥t±¥¹™½…Éõ…É‘Ì¹™¥¹¡…Éôù…É¹ÅÕ•ÉåM•±•Ñ½È  Ğœ¤ü¹Ñ•áÑ½¹Ñ•¹Ğ¹¥¹±Õ‘•Ì Ÿ¶VgªÖ@ƒªâÃ®Îàƒ²‚W®ÎĞœ¤¤±…ÍÍ•Ñ…Éõ…É‘Ì¹™¥¹¡…Éôù…É¹ÅÕ•ÉåM•±•Ñ½È  Ğœ¤ü¹Ñ•áÑ½¹Ñ•¹Ğ¹¥¹±Õ‘•Ì Ÿ¶VgªÖ@ƒ²vÓ®¾ã² œ¤¤±Í¡•‘Õ±•…Éõ…É‘Ì¹™¥¹¡…Éôù…É¹ÅÕ•ÉåM•±•Ñ½È  Ğœ¤ü¹Ñ•áÑ½¹Ñ•¹Ğ¹¥¹±Õ‘•Ì Ÿ¶Vg²
³²vó²‚Tœ¤¤í¥˜¡¥¹™½…É¥í¥¹™½…É¹ÅÕ•ÉåM•±•Ñ½È  Ğœ¤¹Ñ•áÑ½¹Ñ•¹ĞôŸ¶VgªÖ@ƒªâÃ®Îàƒ²‚W®ÎĞƒ®Â<ƒ²c¶R3ªÂHœí¥¹™½…É¹ÅÕ•ÉåM•±•Ñ½È œ¹Í•ÑÑ¥¹ÌµÉ¥œ¤ü¹±…ÍÍ1¥ÍĞ¹…‘ Í¡½½°µÑ•áĞµÉ¥œ¤í½¹ÍĞÍ½¹œõ¥¹™½…É¹ÅÕ•ÉåM•±•Ñ½È œÉ•Í½ÕÉ•M¡½½±M½¹œœ¤ü¹±½Í•ÍĞ ±…‰•°œ¤í¥˜¡Í½¹œ¥Í½¹œ¹±…ÍÍ1¥ÍĞ¹…‘ ¡¥‘‘•¸œ¤í½¹ÍĞ½¹Ñ…Ğõ¥¹™½…É¹ÅÕ•ÉåM•±•Ñ½È œÉ•Í½ÕÉ•½¹Ñ…Ñ‘¥Ñ½Èœ¤ü¹Á…É•¹Ñ±•µ•¹Ğí¥˜¡½¹Ñ…Ğ¥í½¹ÍĞÑ¥Ñ±”õ½¹Ñ…Ğ¹ÅÕ•ÉåM•±•Ñ½È ÍÑÉ½¹œœ¤±…‘õ½¹Ñ…Ğ¹ÅÕ•ÉåM•±•Ñ½È œ…‘‘I•Í½ÕÉ•½¹Ñ…Ñ	Ñ¸œ¤±¡•…õ‘½Õµ•¹Ğ¹É•…Ñ•±•µ•¹Ğ ‘¥Øœ¤í¡•…¹±…ÍÍ9…µ”ôÍ•ÑÑ¥¹ÌµÍ•Ñ¥½¸µ¡•…œí¥˜¡Ñ¥Ñ±”¥¡•…¹…ÁÁ•¹‘¡¥±¡Ñ¥Ñ±”¤í¥˜¡…‘¥¡•…¹…ÁÁ•¹‘¡¥±¡…‘¤í½¹Ñ…Ğ¹ÁÉ•Á•¹¡¡•…¥õõ¥˜¡…ÍÍ•Ñ…É¥í…ÍÍ•Ñ…É¹±…ÍÍ1¥ÍĞ¹…‘ …ÍÍ•Ğµ½¹ÑÉ½±ÌµÍ½ÕÉ”œ¤í…ÍÍ•Ñ…É¹ÅÕ•ÉåM•±•Ñ½È  Ğœ¤¹Ñ•áÑ½¹Ñ•¹ĞôŸ²vÓ®¾ã² ƒ²zC²
Àƒ®NÇ®†tœí½¹ÍĞ‰Õ¥±‘¥¹œõ…ÍÍ•Ñ…É¹ÅÕ•ÉåM•±•Ñ½È ½ÁÑ¥½¹mÙ…±Õ”ô‰Í¡½½°µ‰Õ¥±‘¥¹œ‰tœ¤í¥˜¡‰Õ¥±‘¥¹œ¥‰Õ¥±‘¥¹œ¹Ñ•áÑ½¹Ñ•¹ĞôŸ¶VgªÖC²‚ªÊô¿¶Fs² œí½¹ÍĞÕÍÑ½´õ…ÍÍ•Ñ…É¹ÅÕ•ÉåM•±•Ñ½È ½ÁÑ¥½¹mÙ…±Õ”ô‰Í¡½½°µÕÍÑ½´µ¥µ…”‰tœ¤í¥˜¡ÕÍÑ½´¥ÕÍÑ½´¹Ñ•áÑ½¹Ñ•¹ĞôŸ²ÚSªÂ ƒ²vÓ®¾ã² ƒ®NÇ®†tõ¥˜¡Í¡•‘Õ±•…É¥Í¡•‘Õ±•…É¹É•µ½Ù” ¤í½¹ÍĞ…ÍÍ•Ñ5…¹…•Èô É•Í½ÕÉ•ÍÍ•Ñ5…¹…•ÉÉ¥œ¤í¥˜¡…ÍÍ•Ñ5…¹…•È¥…ÍÍ•Ñ5…¹…•È¹±…ÍÍ1¥ÍĞ¹…‘ ¡¥‘‘•¸œ¤í½¹ÍĞÉ½ÕÁÌõ‘½Õµ•¹Ğ¹É•…Ñ•±•µ•¹Ğ ‘¥Øœ¤íÉ½ÕÁÌ¹¥ôÍ•ÑÑ¥¹ÍÍÍ•ÑÉ½ÕÁÌœíÉ½ÕÁÌ¹±…ÍÍ9…µ”ôÍ•ÑÑ¥¹Ìµ…É…ÍÍ•ĞµÉ½ÕÁÌœíÉ½ÕÁÌ¹¥¹¹•É!Q50ôœñ‘¥Ø±…ÍÌô‰…ÍÍ•ĞµÉ½ÕÀˆøñ‘¥Ø±…ÍÌô‰…ÍÍ•ĞµÉ½ÕÀµ¡•…ˆøñ‘¥ØøñÍÑÉ½¹œûªâÃ®Îàƒ²c¶R0ƒ²vÓ®¾ã² ğ½ÍÑÉ½¹œøñÍµ…±°û¶:c²vÓ² ƒ²^·¶Vƒ²^@ƒ²^ÃªÊÃ®Bc®*Pƒ®2¶Fpƒ²vÓ®¾ã²®–ğƒ¶V·®ª§®Î®†pƒ®NÇ®†w¶V§®.#®.¸ğ½Íµ…±°øğ½‘¥Øøğ½‘¥Øøñ‘¥Ø¥ô‰ÁÉ¥µ…ÉåÍÍ•ÑI½±•É¥ˆ±…ÍÌô‰…ÍÍ•ĞµÉ½±”µÉ¥ˆøğ½‘¥Øøğ½‘¥Øøñ‘¥Ø±…ÍÌô‰…ÍÍ•ĞµÉ½ÕÀˆøñ‘¥Ø±…ÍÌô‰…ÍÍ•ĞµÉ½ÕÀµ¡•…ˆøñ‘¥ØøñÍÑÉ½¹œû²ÚSªÂ ƒ²vÓ®¾ã² ğ½ÍÑÉ½¹œøñÍµ…±°û¶s¶R3®šüƒ¶:ã²G²zCªÂ ƒ®ÎÓªÒ¶VĞƒ®FCªÎ€ƒ¶:ã²Dƒ¶fS®¦Ó²^C²pƒ²zC²rƒ®†·ªÊ0ƒ²
³²j§¶V€ƒ²vÓ®¾ã²²z®.#®.¸ğ½Íµ…±°øğ½‘¥Øøñ‰ÕÑÑ½¸ÑåÁ”ô‰‰ÕÑÑ½¸ˆ±…ÍÌô‰ÁÉ¥µ…Éäˆ‘…Ñ„µ½Á•¸µ…ÍÍ•ĞµÉ½±”ô‰Í¡½½°µÕÍÑ½´µ¥µ…”ˆû²ÚSªÂ ƒ²vÓ®¾ã² ƒ®NÇ®†tğ½‰ÕÑÑ½¸øğ½‘¥Øøñ‘¥Ø¥ô‰…‘‘¥Ñ¥½¹…±ÍÍ•ÑÉ¥ˆ±…ÍÌô‰…ÍÍ•ĞµÉ½±”µÉ¥ˆøğ½‘¥Øøğ½‘¥ØøœíÍ¡½½°¹…ÁÁ•¹‘¡¥±¡É½ÕÁÌ¥ô(½¹ÍĞÍ¡•‘Õ±”õ‘½Õµ•¹Ğ¹É•…Ñ•±•µ•¹Ğ Í•Ñ¥½¸œ¤íÍ¡•‘Õ±”¹±…ÍÍ9…µ”ôÉ•Í½ÕÉ”µÁ…”œíÍ¡•‘Õ±”¹‘…Ñ…Í•Ğ¹É•Í½ÕÉ•½¹Ñ•¹ĞôÍ¡•‘Õ±”œíÍ¡•‘Õ±”¹¥¹¹•É!Q50ôœñ Ìû²vó²‚Tƒ®NÇ®†tğ½ ÌøñÀ±…ÍÌô‰É•Í½ÕÉ”µ‘•ÍÉ¥ÁÑ¥½¸ˆû¶s¶R3®šÿ²^C²pƒ²
³²j§¶V€ƒ²c¶R0ƒ²vó²‚W²vƒ®NÇ®†w¶VcªÎ€ƒ®Î¶f`ƒªÊÃªÎó®–ğƒ¶fW²vã¶V§®.#®.¸ğ½Àøñ‘¥Ø±…ÍÌô‰Í•ÑÑ¥¹Ìµ…Éˆøñ‘¥Ø±…ÍÌô‰Í•ÑÑ¥¹ÌµÍ•Ñ¥½¸µ¡•…ˆøñ‘¥Øøñ Ğû®NÇ®†tƒ²vó²‚Tğ½ ĞøñÀ±…ÍÌô‰É•Í½ÕÉ”µ‘•ÍÉ¥ÁÑ¥½¸ˆùa1Mc
İM[
İQaPƒ¶23²vó²v`ƒ²vó²‚W²vĞƒ®.³®‚”ƒ®6Ã²vÓ¶Ã®†pƒ®Î¶fc®B§®.#®.¸ğ½Àøğ½‘¥Øøğ½‘¥Øøñ‘¥Ø¥ô‰Í•ÑÑ¥¹ÍM¡•‘Õ±•=Ù•ÉÙ¥•Üˆ±…ÍÌô‰Í¡•‘Õ±”µ½Ù•ÉÙ¥•Üˆøğ½‘¥Øøñ‘¥Ø¥ô‰Í•ÑÑ¥¹ÍM¡•‘Õ±•5½Õ¹Ğˆøğ½‘¥Øøğ½‘¥Øøñ‘•Ñ…¥±Ì±…ÍÌô‰Í•ÑÑ¥¹Ìµ‘¥Í±½ÍÕÉ”ˆøñÍÕµµ…Éäû²vó²‚Tƒ®Ú®–`ƒ²“²‚Tğ½ÍÕµµ…Éäøñ‘¥Ø¥ô‰Í•ÑÑ¥¹ÍÙ•¹Ñ…Ñ•½Éå5½Õ¹Ğˆ±…ÍÌô‰Í•ÑÑ¥¹Ìµ‘¥Í±½ÍÕÉ”µ‰½‘äˆøğ½‘¥Øøğ½‘•Ñ…¥±Ìøœí¥˜¡½±½ÉÌ¥µ…¥¸¹¥¹Í•ÉÑ	•™½É”¡Í¡•‘Õ±”±½±½ÉÌ¤í•±Í”µ…¥¸¹…ÁÁ•¹‘¡¥±¡Í¡•‘Õ±”¤ì(½¹ÍĞÍ½ÕÉ•M¡•‘Õ±”õÍ¡½½°ü¹ÅÕ•ÉåM•±•Ñ½È œ¹Í•ÑÑ¥¹Ìµ…É Ğœ¤ü¹Ñ•áÑ½¹Ñ•¹Ğ¹¥¹±Õ‘•Ì Ÿ¶Vg²
³²vó²‚Tœ¤ıÍ¡½½°¹ÅÕ•ÉåM•±•Ñ½È œ¹Í•ÑÑ¥¹Ìµ…Éœ¤é¹Õ±°±±•…åM¡•‘Õ±”õl¸¸¹‘½Õµ•¹Ğ¹ÅÕ•ÉåM•±•Ñ½É±° œ¹Í•ÑÑ¥¹Ìµ…Éœ¥t¹™¥¹¡…Éôù…É¹ÅÕ•ÉåM•±•Ñ½È  Ğœ¤ü¹Ñ•áÑ½¹Ñ•¹Ğ¹¥¹±Õ‘•Ì Ÿ¶Vg²
³²vó²‚Tƒ®6Ã²vÓ¶Àœ¤¤í¥˜¡±•…åM¡•‘Õ±”¤ Í•ÑÑ¥¹ÍM¡•‘Õ±•5½Õ¹Ğœ¤¹…ÁÁ•¹‘¡¥±¡±•…åM¡•‘Õ±”¤í¥˜¡•Ù•¹ÑÌ¥í½¹ÍĞµ½Õ¹Ğô Í•ÑÑ¥¹ÍÙ•¹Ñ…Ñ•½Éå5½Õ¹Ğœ¤íl¸¸¹•Ù•¹ÑÌ¹¡¥±‘É•¹t¹™¥±Ñ•È¡¹½‘”ôø…¹½‘”¹µ…Ñ¡•Ì  Ì°¹É•Í½ÕÉ”µ‘•ÍÉ¥ÁÑ¥½¸œ¤¤¹™½É… ¡¹½‘”ôùµ½Õ¹Ğ¹…ÁÁ•¹‘¡¥±¡¹½‘”¤¤í•Ù•¹ÑÌ¹É•µ½Ù” ¥ô(¥˜ „ É•Í½ÕÉ•M¡•‘Õ±•%¹ÁÕĞœ¤¥ì Í•ÑÑ¥¹ÍM¡•‘Õ±•5½Õ¹Ğœ¤¹¥¹¹•É!Q50ôœñ‘¥Ø±…ÍÌô‰Í¡•‘Õ±”µÍ¡•µ„µÉ¥ˆøñÍÁ…¸û®.£²vğƒ²vó²‚T€ñ½‘”û²nP¿²vğƒ²vó²‚W®ªğ½½‘”øğ½ÍÁ…¸øñÍÁ…¸ûªÖ³ªÂƒ²vó²‚T€ñ½‘”û²nP¿²vğ€´ƒ²nP¿²vğƒ²vó²‚W®ªğ½½‘”øğ½ÍÁ…¸øñÍÁ…¸û¶Vc® ƒ²vó²‚T€ñÍÑÉ½¹œø×ªÂpƒ²vÓ²ƒ¶^#²j¤ğ½ÍÑÉ½¹œøğ½ÍÁ…¸øğ½‘¥Øøñ‘¥Ø±…ÍÌô‰Í¡•‘Õ±”µÕÁ±½…µ…Éˆøñ‘¥ØøñÍÑÉ½¹œ¥ô‰É•Í½ÕÉ•M¡•‘Õ±•¥±•9…µ”ˆû²c¶R0ƒ²vó²‚Tƒ¶23²vğƒ²^²v0ğ½ÍÑÉ½¹œøñÍµ…±°¥ô‰É•Í½ÕÉ•M¡•‘Õ±•¥±•MÑ…ÑÕÌˆùa1Mc
İM[
İQaPƒ®NÇ®†tƒªÂ®*”ğ½Íµ…±°øğ½‘¥Øøñ‰ÕÑÑ½¸¥ô‰É•Í½ÕÉ•M¡•‘Õ±•UÁ±½…‘	Ñ¸ˆ±…ÍÌô‰Í…Ù”ˆÑåÁ”ô‰‰ÕÑÑ½¸ˆû²vó²‚Tƒ¶23²vğƒ®NÇ®†tğ½‰ÕÑÑ½¸øñ¥¹ÁÕĞ¥ô‰É•Í½ÕÉ•M¡•‘Õ±•%¹ÁÕĞˆ±…ÍÌô‰¡¥‘‘•¸ˆÑåÁ”ô‰™¥±”ˆ…•ÁĞôˆ¹á±Íà°¹ÍØ°¹ÑáĞˆøğ½‘¥Øøñ‘¥Ø¥ô‰É•Í½ÕÉ•M¡•‘Õ±•AÉ•Ù¥•Üˆ±…ÍÌô‰Í¡•‘Õ±”µÁÉ•Ù¥•Ü¡¥‘‘•¸ˆøğ½‘¥Øøœì É•Í½ÕÉ•M¡•‘Õ±•UÁ±½…‘	Ñ¸œ¤¹½¹±¥¬ô ¤ôø É•Í½ÕÉ•M¡•‘Õ±•%¹ÁÕĞœ¤¹±¥¬ ¤ì É•Í½ÕÉ•M¡•‘Õ±•%¹ÁÕĞœ¤¹½¹¡…¹”õ…Íå¹Œ•Ù•¹Ğôùí½¹ÍĞ™¥±”õ•Ù•¹Ğ¹Ñ…É•Ğ¹™¥±•Ìü¹lÁtí¥˜¡™¥±”¥…İ…¥ĞÉ•¥ÍÑ•ÉM¡•‘Õ±•¥±”¡™¥±”°É•Í½ÕÉ”œ¤íÉ•¹‘•ÉM¡•‘Õ±•=Ù•ÉÙ¥•Ü ¤íİ¥¹‘½Ü¹1Q•µÁ±…Ñ•QåÁ•IÕ±•Ìü¹Á•ÉÍ¥ÍÑÕÉÉ•¹ÑQ•µÁ±…Ñ•M•ÑÑ¥¹Ìü¸ Ÿ²vó²‚Tƒ®NÇ®†tœ¥õô(™Õ¹Ñ¥½¸…ÍÍ•ÑÌ ¥íÉ•ÑÕÉ¸ÑåÁ•½˜ÁÉ½©•ÑM…µÁ±•ÍÍ•ÑÌôôô™Õ¹Ñ¥½¸œıÁÉ½©•ÑM…µÁ±•ÍÍ•ÑÌ ¤éÁÉ½©•Ğü¹Ñ•µÁ±…Ñ”ü¹É•Í½ÕÉ•Ìü¹Í…µÁ±•ÍÍ•ÑÍññmuô(½¹ÍĞÉ½±•ÌõmlÍ¡½½°µ‰Õ¥±‘¥¹œœ°Ÿ¶VgªÖC²‚ªÊô¿¶Fs² t±lÍ¡½½°µ±½¼œ°ŸªÖC¶Fpt±lÍ¡½½°µ™±½İ•Èœ°ŸªÖC¶fPt±lÍ¡½½°µÑÉ•”œ°ŸªÖC®ª¤t±lÍ¡½½°µÍ½¹œœ°ŸªÖCªÂ utì(™Õ¹Ñ¥½¸…ÍÍ•Ñ½È¡É½±”¥í½¹ÍĞ™½Õ¹õ…ÍÍ•ÑÌ ¤¹™¥±Ñ•È¡¥Ñ•´ôù¥Ñ•´¹É½±”ôôõÉ½±”¤íÉ•ÑÕÉ¸É½±”ôôôÍ¡½½°µÕÍÑ½´µ¥µ…”œı™½Õ¹é™½Õ¹¹Í±¥” ´Ä¥ô(™Õ¹Ñ¥½¸…ÍÍ•Ñ…É¡É½±”±±…‰•°±¥Ñ•´¥íÉ•ÑÕÉ¸€ñ…ÉÑ¥±”±…ÍÌô‰…ÍÍ•ĞµÉ½±”µ…Éˆøñ‘¥Ø±…ÍÌô‰…ÍÍ•ĞµÉ½±”µÑ¡Õµˆˆø‘í¥Ñ•´ü¹¥µ…”ı€ñ¥µœÍÉŒôˆ‘í¥Ñ•´¹¥µ…•ôˆ…±Ğôˆˆù€èŸ®¾ã®NÇ®†tôğ½‘¥Øøñ‘¥Ø±…ÍÌô‰…ÍÍ•ĞµÉ½±”µ¥¹™¼ˆøñÍÑÉ½¹œø‘íØÈÅÍ…Á”¡±…‰•°¥ôğ½ÍÑÉ½¹œøñÍµ…±°ø‘íØÈÅÍ…Á”¡¥Ñ•´ü¹¹…µ•ñğŸ®NÇ®†w®Bpƒ²vÓ®¾ã² ƒ²^²v0œ¥ôğ½Íµ…±°øñ‰ÕÑÑ½¸ÑåÁ”ô‰‰ÕÑÑ½¸ˆ‘…Ñ„µ½Á•¸µ…ÍÍ•ĞµÉ½±”ôˆ‘íÉ½±•ôˆø‘í¥Ñ•´üŸªÒ®š°œèŸ®NÇ®†tôğ½‰ÕÑÑ½¸øğ½‘¥Øøğ½…ÉÑ¥±”ùô(™Õ¹Ñ¥½¸É•¹‘•ÉÍÍ•Ñ…É‘Ì ¥í½¹ÍĞÁÉ¥µ…Éäô ÁÉ¥µ…ÉåÍÍ•ÑI½±•É¥œ¤±…‘‘¥Ñ¥½¹…°ô …‘‘¥Ñ¥½¹…±ÍÍ•ÑÉ¥œ¤í¥˜¡ÁÉ¥µ…Éä¥ÁÉ¥µ…Éä¹¥¹¹•É!Q50õÉ½±•Ì¹µ…À ¡mÉ½±”±±…‰•±t¤ôù…ÍÍ•Ñ…É¡É½±”±±…‰•°±…ÍÍ•Ñ½È¡É½±”¥lÁt¤¤¹©½¥¸ œœ¤í½¹ÍĞ•áÑÉ„õ…ÍÍ•Ñ½È Í¡½½°µÕÍÑ½´µ¥µ…”œ¤í¥˜¡…‘‘¥Ñ¥½¹…°¥…‘‘¥Ñ¥½¹…°¹¥¹¹•É!Q50õ•áÑÉ„¹±•¹Ñ ı•áÑÉ„¹µ…À¡¥Ñ•´ôù…ÍÍ•Ñ…É Í¡½½°µÕÍÑ½´µ¥µ…”œ°Ÿ²ÚSªÂ ƒ²vÓ®¾ã² œ±¥Ñ•´¤¤¹©½¥¸ œœ¤èœñ‘¥Ø±…ÍÌô‰…ÍÍ•Ğµ•µÁÑäˆû®NÇ®†w®Bpƒ²ÚSªÂ ƒ²vÓ®¾ã²ªÂ ƒ²^²*×®.#®.¸ğ½‘¥Øøô(½¹ÍĞµ½‘…°õ‘½Õµ•¹Ğ¹É•…Ñ•±•µ•¹Ğ ‘¥Øœ¤íµ½‘…°¹¥ôÍ•ÑÑ¥¹ÍÍÍ•Ñ5½‘…°œíµ½‘…°¹±…ÍÍ9…µ”ô…ÍÍ•Ğµ•‘¥Ñ½Èµµ½‘…°¡¥‘‘•¸œíµ½‘…°¹¥¹¹•É!Q50ôœñ‘¥Ø±…ÍÌô‰…ÍÍ•Ğµ•‘¥Ñ½Èµ‘¥…±½œˆÉ½±”ô‰‘¥…±½œˆ…É¥„µµ½‘…°ô‰ÑÉÕ”ˆøñ‘¥Ø±…ÍÌô‰…ÍÍ•Ğµ•‘¥Ñ½Èµ¡•…ˆøñ Ì¥ô‰Í•ÑÑ¥¹ÍÍÍ•Ñ5½‘…±Q¥Ñ±”ˆû²vÓ®¾ã² ƒ®NÇ®†tğ½ Ìøñ‰ÕÑÑ½¸ÑåÁ”ô‰‰ÕÑÑ½¸ˆ‘…Ñ„µ±½Í”µ…ÍÍ•Ğµµ½‘…°û\ğ½‰ÕÑÑ½¸øğ½‘¥Øøñ‘¥Ø±…ÍÌô‰…ÍÍ•Ğµ•‘¥Ñ½Èµ‰½‘äˆøñ‘¥Ø¥ô‰Í•ÑÑ¥¹ÍÍÍ•ÑAÉ•Ù¥•Üˆ±…ÍÌô‰…ÍÍ•Ğµ•‘¥Ñ½ÈµÁÉ•Ù¥•Üˆû®NÇ®†w®Bpƒ²vÓ®¾ã²ªÂ ƒ²^²*×®.#®.¸ğ½‘¥Øøñ±…‰•°û²zC²
Àƒ²vÓ®šñ¥¹ÁÕĞ¥ô‰Í•ÑÑ¥¹ÍÍÍ•Ñ9…µ”ˆÁ±…•¡½±‘•Èô‹²vÓ®¾ã² ƒ²vÓ®šˆøğ½±…‰•°øğ½‘¥Øøñ‘¥Ø±…ÍÌô‰…ÍÍ•Ğµ•‘¥Ñ½Èµ…Ñ¥½¹Ìˆøñ‰ÕÑÑ½¸¥ô‰‘•±•Ñ•M•ÑÑ¥¹ÍÍÍ•Ñ	Ñ¸ˆÑåÁ”ô‰‰ÕÑÑ½¸ˆ±…ÍÌô‰‘…¹•Èˆû²vÓ®¾ã² ƒ²
·²‚pğ½‰ÕÑÑ½¸øñ‰ÕÑÑ½¸ÑåÁ”ô‰‰ÕÑÑ½¸ˆ‘…Ñ„µ±½Í”µ…ÍÍ•Ğµµ½‘…°û²Ş£²0ğ½‰ÕÑÑ½¸øñ‰ÕÑÑ½¸¥ô‰¡½½Í•M•ÑÑ¥¹ÍÍÍ•Ñ	Ñ¸ˆÑåÁ”ô‰‰ÕÑÑ½¸ˆ±…ÍÌô‰ÁÉ¥µ…Éäˆû²vÓ®¾ã² ƒ²ƒ¶tğ½‰ÕÑÑ½¸øğ½‘¥Øøğ½‘¥Øøœí‘½Õµ•¹Ğ¹‰½‘ä¹…ÁÁ•¹‘¡¥±¡µ½‘…°¤í±•Ğ…Ñ¥Ù•I½±”õ¹Õ±°ì(™Õ¹Ñ¥½¸±½Í•ÍÍ•Ñ5½‘…° ¥íµ½‘…°¹±…ÍÍ1¥ÍĞ¹…‘ ¡¥‘‘•¸œ¤í…Ñ¥Ù•I½±”õ¹Õ±±õ™Õ¹Ñ¥½¸½Á•¹ÍÍ•Ñ5½‘…°¡É½±”¥í…Ñ¥Ù•I½±”õÉ½±”í½¹ÍĞ±…‰•°õÉ½±•Ì¹™¥¹¡¥Ñ•´ôù¥Ñ•µlÁtôôõÉ½±”¤ü¹lÅuñğŸ²ÚSªÂ ƒ²vÓ®¾ã² œ±¥Ñ•´õ…ÍÍ•Ñ½È¡É½±”¥lÁtì Í•ÑÑ¥¹ÍÍÍ•Ñ5½‘…±Q¥Ñ±”œ¤¹Ñ•áÑ½¹Ñ•¹Ğõ€‘í±…‰•±ôƒ²vÓ®¾ã² ƒªÒ®š±€ì Í•ÑÑ¥¹ÍÍÍ•Ñ9…µ”œ¤¹Ù…±Õ”õ¥Ñ•´ü¹¹…µ•ñğœœì Í•ÑÑ¥¹ÍÍÍ•ÑAÉ•Ù¥•Üœ¤¹¥¹¹•É!Q50õ¥Ñ•´ü¹¥µ…”ı€ñ¥µœÍÉŒôˆ‘í¥Ñ•´¹¥µ…•ôˆ…±Ğôˆˆù€èŸ®NÇ®†w®Bpƒ²vÓ®¾ã²ªÂ ƒ²^²*×®.#®.¸œì ‘•±•Ñ•M•ÑÑ¥¹ÍÍÍ•Ñ	Ñ¸œ¤¹‘¥Í…‰±•ô…¥Ñ•´íµ½‘…°¹±…ÍÍ1¥ÍĞ¹É•µ½Ù” ¡¥‘‘•¸œ¥ô(‘½Õµ•¹Ğ¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ±¥¬œ±•Ù•¹Ğôùí½¹ÍĞ½Á•¸õ•Ù•¹Ğ¹Ñ…É•Ğ¹±½Í•ÍĞ m‘…Ñ„µ½Á•¸µ…ÍÍ•ĞµÉ½±•tœ¤í¥˜¡½Á•¸¥í½Á•¹ÍÍ•Ñ5½‘…°¡½Á•¸¹‘…Ñ…Í•Ğ¹½Á•¹ÍÍ•ÑI½±”¤íÉ•ÑÕÉ¹õ¥˜¡•Ù•¹Ğ¹Ñ…É•Ğ¹±½Í•ÍĞ m‘…Ñ„µ±½Í”µ…ÍÍ•Ğµµ½‘…±tœ¥ññ•Ù•¹Ğ¹Ñ…É•Ğôôõµ½‘…°¥±½Í•ÍÍ•Ñ5½‘…° ¥ô¤ì(€ ¡½½Í•M•ÑÑ¥¹ÍÍÍ•Ñ	Ñ¸œ¤¹½¹±¥¬ô ¤ôùí¥˜ ……Ñ¥Ù•I½±”¥É•ÑÕÉ¸ì É•Í½ÕÉ•ÍÍ•ÑI½±”œ¤¹Ù…±Õ”õ…Ñ¥Ù•I½±”ì É•Í½ÕÉ•ÍÍ•Ñ9…µ”œ¤¹Ù…±Õ”ô Í•ÑÑ¥¹ÍÍÍ•Ñ9…µ”œ¤¹Ù…±Õ”¹ÑÉ¥´ ¤ì É•Í½ÕÉ•ÍÍ•Ñ%¹ÁÕĞœ¤¹±¥¬ ¥ôì(€ ‘•±•Ñ•M•ÑÑ¥¹ÍÍÍ•Ñ	Ñ¸œ¤¹½¹±¥¬ô ¤ôùí¥˜ ……Ñ¥Ù•I½±”¥É•ÑÕÉ¸í½¹ÍĞ±¥ÍĞõÁÉ½©•Ğ¹Ñ•µÁ±…Ñ”¹É•Í½ÕÉ•Ì¹Í…µÁ±•ÍÍ•ÑÍññmt±¥¹‘•àõ±¥ÍĞ¹™¥¹‘%¹‘•à¡¥Ñ•´ôù¥Ñ•´¹É½±”ôôõ…Ñ¥Ù•I½±”¤í¥˜¡¥¹‘•àğÀ¥É•ÑÕÉ¸íÍ¹…ÁÍ¡½Ğ ¤í½¹ÍĞÉ•µ½Ù•õ±¥ÍĞ¹ÍÁ±¥”¡¥¹‘•à°Ä¥lÁt±­•äõÍ•µ…¹Ñ¥AÉ½™¥±•-•ä¡…Ñ¥Ù•I½±”¤í¥˜¡­•ä˜™ÁÉ½©•Ğ¹‰½½¬¹Í¡½½°¹ÁÉ½™¥±”ü¹m­•åt¥íÁÉ½©•Ğ¹‰½½¬¹Í¡½½°¹ÁÉ½™¥±•m­•åt¹¥µ…”ôœœí‘•±•Ñ”ÁÉ½©•Ğ¹‰½½¬¹Í¡½½°¹ÁÉ½™¥±•m­•åt¹…ÍÍ•Ñ%‘õ•±Í”¥˜¡…Ñ¥Ù•I½±”ôôôÍ¡½½°µÕÍÑ½´µ¥µ…”œ¥ÁÉ½©•Ğ¹‰½½¬¹Í¡½½°¹ÕÍÑ½µÍÍ•ÑÌô¡ÁÉ½©•Ğ¹‰½½¬¹Í¡½½°¹ÕÍÑ½µÍÍ•ÑÍññmt¤¹™¥±Ñ•È¡¥Ñ•´ôù¥Ñ•´¹¥„ôõÉ•µ½Ù•¹¥¤íµ…É­¥ÉÑä ¤íÉ•¹‘•ÉÍÍ•Ñ…É‘Ì ¤íÉ•¹‘•ÉI•¥ÍÑ•É•‘ÍÍ•Ñ1¥‰É…Éä ¤í±½Í•ÍÍ•Ñ5½‘…° ¤íİ¥¹‘½Ü¹1Q•µÁ±…Ñ•QåÁ•IÕ±•Ìü¹Á•ÉÍ¥ÍÑÕÉÉ•¹ÑQ•µÁ±…Ñ•M•ÑÑ¥¹Ìü¸ Ÿ²vÓ®¾ã² ƒ²zC²
Àƒ²
·²‚pœ¥ôì(€ É•Í½ÕÉ•ÍÍ•Ñ%¹ÁÕĞœ¤ü¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ¡…¹”œ° ¤ôùÍ•ÑQ¥µ•½ÕĞ  ¤ôùíÉ•¹‘•ÉÍÍ•Ñ…É‘Ì ¤í±½Í•ÍÍ•Ñ5½‘…° ¥ô°äÀÀ¤¤ì(™Õ¹Ñ¥½¸É•¹‘•ÉM¡•‘Õ±•=Ù•ÉÙ¥•Ü ¥í½¹ÍĞ…±°õÁÉ½©•Ğü¹‰½½¬ü¹•Ù•¹ÑÍññmt±É…¹•Ìõ…±°¹™¥±Ñ•È¡¥Ñ•´ôù¥Ñ•´¹•¹‘…Ñ”˜™¥Ñ•´¹•¹‘…Ñ”„ôõ¥Ñ•´¹ÍÑ…ÉÑ…Ñ”¤¹±•¹Ñ ±Í½ÕÉ”õÁÉ½©•Ğü¹‰½½¬ü¹Í¡•‘Õ±•%µÁ½ÉĞì Í•ÑÑ¥¹ÍM¡•‘Õ±•=Ù•ÉÙ¥•Üœ¤¹¥¹¹•É!Q50õ€ñ‘¥ØøñÍÑÉ½¹œø‘í…±°¹±•¹Ñ¡ôğ½ÍÑÉ½¹œøñÍµ…±°û®NÇ®†tƒ²vó²‚Tğ½Íµ…±°øğ½‘¥Øøñ‘¥ØøñÍÑÉ½¹œø‘íÉ…¹•Íôğ½ÍÑÉ½¹œøñÍµ…±°ûªâÃªÂƒ²vó²‚Tğ½Íµ…±°øğ½‘¥Øøñ‘¥ØøñÍÑÉ½¹œø‘íÍ½ÕÉ”ü¹™¥±•9…µ”üœÄœèœÀôğ½ÍÑÉ½¹œøñÍµ…±°û®NÇ®†tƒ¶23²vğğ½Íµ…±°øğ½‘¥Øùô(½¹ÍĞ‰…Í•Mİ¥Ñ õÍİ¥Ñ¡I•Í½ÕÉ•A…”íÍİ¥Ñ¡I•Í½ÕÉ•A…”õ™Õ¹Ñ¥½¸¡Á…”¥í‰…Í•Mİ¥Ñ ¡Á…”¤í¥˜¡Á…”ôôôÍ¡½½°œ¥É•¹‘•ÉÍÍ•Ñ…É‘Ì ¤í¥˜¡Á…”ôôôÍ¡•‘Õ±”œ¥É•¹‘•ÉM¡•‘Õ±•=Ù•ÉÙ¥•Ü ¤í¥˜¡Á…”ôôô‘•Í¥¸µÑåÁ•Ìœ¥íÉ•ÍÑ½É••Í¥¹MÁ•Œ ¤íİ¥¹‘½Ü¹1•Í­MÑå±•‘¥Ñ½Èü¹É•¹‘•Èü¸ ¥õôì(½¹ÍĞ‰…Í•¹ÍÕÉ”õ•¹ÍÕÉ•%•Í¥¹å¹…µ¥½¹ÑÉ½±Ìí•¹ÍÕÉ•%•Í¥¹å¹…µ¥½¹ÑÉ½±Ìõ™Õ¹Ñ¥½¸ ¥í‰…Í•¹ÍÕÉ” ¤í½¹ÍĞ‰½àõ‘½Õµ•¹Ğ¹ÅÕ•ÉåM•±•Ñ½È œ¹…¤µÍ•É•ĞµÍ•ÑÑ¥¹Ìœ¤í¥˜ …‰½áññ‰½à¹‘…Ñ…Í•Ğ¹É•™É•Í¡•¥É•ÑÕÉ¸í‰½à¹‘…Ñ…Í•Ğ¹É•™É•Í¡•ôÑÉÕ”œí‰½à¹¥¹¹•É!Q50ôœñ‘¥Ø±…ÍÌô‰…¤µÍ•É•ĞµÍÑ…ÑÕÌµÉ½Üˆøñ‘¥Ø±…ÍÌô‰…¤µÍ•É•ĞµÍÑ…ÑÕÌµ½ÁäˆøñÍÑÉ½¹œù=Á•¹$A$ƒ²^ÃªÊÀğ½ÍÑÉ½¹œøñÀ¥ô‰…¥•Í¥¹=Á•¹%-•åMÑ…ÑÕÌˆû²^ÃªÊÀƒ²¶s®–ğƒ¶fW²vã¶V§®.#®.“Š˜ğ½Àøğ½‘¥Øøñ‰ÕÑÑ½¸¥ô‰¡…¹•%•Í¥¹=Á•¹%-•å	Ñ¸ˆÑåÁ”ô‰‰ÕÑÑ½¸ˆû¶
ƒ®ÎªÊôğ½‰ÕÑÑ½¸øğ½‘¥Øøñ‘¥Ø¥ô‰…¥•Í¥¹=Á•¹%-•å¡…¹•½É´ˆ±…ÍÌô‰…¤µÍ•É•Ğµ¡…¹”µ™½É´¡¥‘‘•¸ˆøñ±…‰•°û² =Á•¹$A$ƒ¶
ñ¥¹ÁÕĞ¥ô‰…¥•Í¥¹=Á•¹%-•äˆÑåÁ”ô‰Á…ÍÍİ½Éˆ…ÕÑ½½µÁ±•Ñ”ô‰¹•ÜµÁ…ÍÍİ½ÉˆÁ±…•¡½±‘•Èô‹² ƒ¶
“®–ğƒ²z®‚—¶Vc²ã²jPˆøğ½±…‰•°øñ‘¥Ø±…ÍÌô‰…¤µÍ•É•Ğµ¡…¹”µ…Ñ¥½¹Ìˆøñ‰ÕÑÑ½¸¥ô‰…¹•±%•Í¥¹=Á•¹%-•å	Ñ¸ˆÑåÁ”ô‰‰ÕÑÑ½¸ˆû²Ş£²0ğ½‰ÕÑÑ½¸øñ‰ÕÑÑ½¸¥ô‰Í…Ù•%•Í¥¹=Á•¹%-•å	Ñ¸ˆÑåÁ”ô‰‰ÕÑÑ½¸ˆ±…ÍÌô‰ÁÉ¥µ…Éäˆû®ÎªÊôƒ²‚²z”ğ½‰ÕÑÑ½¸øğ½‘¥Øøğ½‘¥ØøœíÉ•™É•Í¡%•Í¥¹=Á•¹%-•åMÑ…ÑÕÌ ¥ôì(‘½Õµ•¹Ğ¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ±¥¬œ±•Ù•¹Ğôùí¥˜¡•Ù•¹Ğ¹Ñ…É•Ğ¹±½Í•ÍĞ œ¡…¹•%•Í¥¹=Á•¹%-•å	Ñ¸œ¤¥ì …¥•Í¥¹=Á•¹%-•å¡…¹•½É´œ¤¹±…ÍÍ1¥ÍĞ¹É•µ½Ù” ¡¥‘‘•¸œ¤ì …¥•Í¥¹=Á•¹%-•äœ¤¹™½ÕÌ ¥õ¥˜¡•Ù•¹Ğ¹Ñ…É•Ğ¹±½Í•ÍĞ œ…¹•±%•Í¥¹=Á•¹%-•å	Ñ¸œ¤¥ì …¥•Í¥¹=Á•¹%-•äœ¤¹Ù…±Õ”ôœœì …¥•Í¥¹=Á•¹%-•å¡…¹•½É´œ¤¹±…ÍÍ1¥ÍĞ¹…‘ ¡¥‘‘•¸œ¥õ¥˜¡•Ù•¹Ğ¹Ñ…É•Ğ¹±½Í•ÍĞ œÍ…Ù•%•Í¥¹=Á•¹%-•å	Ñ¸œ¤¥Í•ÑQ¥µ•½ÕĞ  ¤ôùí¥˜  …¥•Í¥¹=Á•¹%-•åMÑ…ÑÕÌœ¤ü¹±…ÍÍ1¥ÍĞ¹½¹Ñ…¥¹Ì ½¹¹•Ñ•œ¤¤ …¥•Í¥¹=Á•¹%-•å¡…¹•½É´œ¤ü¹±…ÍÍ1¥ÍĞ¹…‘ ¡¥‘‘•¸œ¥ô°ÄÈÀÀ¥ô¤ì(É•¹‘•ÉÍÍ•Ñ…É‘Ì ¤íÉ•¹‘•ÉM¡•‘Õ±•=Ù•ÉÙ¥•Ü ¤ì)ô¤ ¤ì