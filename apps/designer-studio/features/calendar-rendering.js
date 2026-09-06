"use strict";

function calendarReferenceItems(date,category){
 const year=String(date||"").slice(0,4),bucket=project.book.calendarReference?.years?.[year]?.[category];
 return Array.isArray(bucket?.items)?bucket.items.filter(item=>item?.date===date):[]
}
function calendarReferenceForDate(date){
 const options=project.settings.calendarData||{};
 const holidays=options.includeHolidays===false?[]:calendarReferenceItems(date,"public_holiday");
 const anniversaries=options.includeAnniversaries===false?[]:calendarReferenceItems(date,"anniversary");
 const solarTerms=options.includeSolarTerms===false?[]:calendarReferenceItems(date,"solar_term");
 const lunars=options.includeLunar===false?[]:calendarReferenceItems(date,"lunar");
 return {holidays,anniversaries,solarTerms,lunars}
}
function normalizeReferenceTitle(value){
 return String(value||"").replace(/\s+/g,"").replace(/노동절/g,"근로자의날").replace(/[()·ㆍ.,-]/g,"").toLowerCase()
}
function isPublicReferenceEvent(event){
 const start=event?.startDate,end=event?.endDate||start;
 if(!start||start!==end)return false;
 const refs=calendarReferenceForDate(start),title=normalizeReferenceTitle(event.title);
 return [...refs.holidays,...refs.anniversaries,...refs.solarTerms].some(item=>normalizeReferenceTitle(item.name)===title)
}
function weekDayHeaders(compact=false){
 const monday=project.settings.weekStart==="monday";
 if(project.template?.metadata?.sampleFamily==="desk-6")return compact?(monday?["M","T","W","T","F","S","S"]:["S","M","T","W","T","F","S"]):(monday?["MON","TUE","WED","THU","FRI","SAT","SUN"]:["SUN","MON","TUE","WED","THU","FRI","SAT"]);
 return monday?["월","화","수","목","금","토","일"]:["일","월","화","수","목","금","토"]
}
function dateCell(d){
 return {date:`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`,day:d.getDate(),month:d.getMonth()+1,dow:d.getDay()}
}
function calendarGridFor(y,m,rows=Number(project.settings.calendarRows||6)){
 return window.ACDLCalendarDomain.buildCalendarGrid(y,m,project.settings.weekStart,rows)
}
function calendarRowCountFor(y,m){
 if(project.template?.metadata?.sampleFamily!=="desk-6"||project.settings.calendarRowsMode!=="adaptive")return Number(project.settings.calendarRows||6);
 const start=new Date(y,m-1,1).getDay(),offset=project.settings.weekStart==="monday"?(start+6)%7:start,days=new Date(y,m,0).getDate();
 return Math.max(5,Math.min(6,Math.ceil((offset+days)/7)))
}
function calendarGrid(y,m){return calendarGridFor(y,m,calendarRowCountFor(y,m))}
function calendarVerticalLayout(design=project.template.masters.calendar.design||{}){
 const master=project.template.masters.calendar,preset=window.ACDLCalendarPresetCatalog?.resolve({calendarPreset:master.calendarPreset,calendarLayout:master.calendarLayout,calendarOverrides:master.calendarOverrides,design});
 if(preset){const layout=preset.layout,titleSpec=window.ACDLCalendarPresetCatalog?.titlePresentations?.[preset.presentation.monthTitleStyle],title=Math.max(layout.titlePercent,titleSpec?.titlePercent||0),remaining=100-title,weekday=Math.min(layout.weekdayPercent,remaining),grid=remaining-weekday,stage=weekday+grid;return{title,weekday,grid,weekdayStage:weekday/stage*100,preset}}
 const presets={"sample-6":{title:10,weekday:4,grid:86},"sample-3":{title:21,weekday:4,grid:75}};
 const stored=design.verticalLayout,total=Number(stored?.title||0)+Number(stored?.weekday||0)+Number(stored?.grid||0);
 const detected=design.presetId&&presets[design.presetId]?design.presetId:design.monthTitleStyle==="number-inline"?"sample-3":"sample-6";
 const layout=total===100?stored:presets[detected];
 const stage=layout.weekday+layout.grid;
 return {...layout,weekdayStage:layout.weekday/stage*100};
}
function calendarChromeLayout(presentation,vertical,region=calendarRegion()){
 const style=presentation?.weekdayStyle||"filled-tabs",spec=window.ACDLCalendarPresetCatalog?.weekdayPresentations?.[style]||{boxHeightMm:7.06,gridGapMm:0};
 const pageHeightMm=Number(project.productType?.pageSize?.height||180),regionHeightMm=pageHeightMm*Number(region.height||79)/100,stageHeightMm=Math.max(1,regionHeightMm*(100-Number(vertical.title||10))/100),boxHeightMm=Number(spec.boxHeightMm||7.06),gridGapMm=Number(spec.gridGapMm||0),trackMm=boxHeightMm+gridGapMm;
 return {boxHeightMm,gridGapMm,trackMm,weekdayStage:Math.max(2,Math.min(20,trackMm/stageHeightMm*100)),contract:window.ACDLCalendarPresetCatalog?.compositionContract};
}
function yearCalendarRowCountFor(view,y,m){
 const mode=view?.rowsMode||"inherit";
 if(mode==="5"||mode==="6")return Number(mode);
 if(mode==="adaptive"){
  const start=new Date(y,m-1,1).getDay(),offset=project.settings.weekStart==="monday"?(start+6)%7:start,days=new Date(y,m,0).getDate();
  return Math.max(5,Math.min(6,Math.ceil((offset+days)/7)))
 }
 return calendarRowCountFor(y,m)
}

function selectAdjacentMiniCells(grid,currentMonth){
 const isEmpty=c=>c.month!==currentMonth&&!c.extra;
 const leading=[];for(let i=0;i<grid.length&&isEmpty(grid[i]);i++)leading.push(i);
 const trailing=[];for(let i=grid.length-1;i>=0&&isEmpty(grid[i]);i--)trailing.unshift(i);
 if(trailing.length>=3)return trailing.slice(-2);
 if(leading.length>=3)return leading.slice(0,2);
 return []
}
function renderCellMiniCalendar(y,m){
 const rows=calendarRowCountFor(y,m),cells=calendarGridFor(y,m,rows),weeks=[];for(let i=0;i<cells.length;i+=7)weeks.push(cells.slice(i,i+7));
 let h=`<div class="cell-mini-calendar"><strong>${m}</strong><div class="cell-mini-grid" style="--mini-calendar-rows:${rows}">`;
 weeks.forEach(week=>{h+='<div class="cell-mini-week">';week.forEach(c=>{const current=c.month===m,label=current?(c.extra?`${c.day}/${c.extra.day}`:c.day):"",tone=!current?"adj":c.dow===0?"sun-mini":c.dow===6?"sat-mini":"",merged=c.extra?" merged":"";h+=`<span class="${tone}${merged}">${label}</span>`});h+="</div>"});
 return h+"</div></div>"
}

function isoDate(d){
 return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`
}
function dateFromISO(value){return new Date(value+"T00:00:00")}
function isRangeEvent(ev){return (ev.endDate||ev.startDate)!==ev.startDate}
function rangeEventsForGrid(grid){
 const first=grid[0]?.date,last=grid[grid.length-1]?.date;
 return project.book.events
  .filter(isRangeEvent)
  .filter(ev=>(ev.endDate||ev.startDate)>=first&&ev.startDate<=last)
  .sort((a,b)=>eventPriority(b)-eventPriority(a)||a.startDate.localeCompare(b.startDate)||a.title.localeCompare(b.title))
}
function buildRangeSegments(grid){
 return window.ACDLCalendarDomain.buildRangeSegments(project.book.events,grid,eventPriority)
}
function assignRangeLanes(grid){
 const style=project.template.masters.calendar.rangeEventStyle,segments=buildRangeSegments(grid);
 return window.ACDLCalendarDomain.assignRangeLanes(segments,Math.ceil(grid.length/7),style.maxLanes,eventPriority)
}
function rangeLabel(segment,style){
 if(style.labelMode==="none")return "";
 if(style.labelMode==="every")return segment.event.title;
 if(style.labelMode==="continued")return segment.isFirstVisible?segment.event.title:`${segment.event.title} · 계속`;
 return segment.isFirstVisible?segment.event.title:""
}
function renderRangeEventLayer(grid,rows){
 const style=project.template.masters.calendar.rangeEventStyle;
 if(!style?.enabled)return "";
 const layout=assignRangeLanes(grid),rowHeight=100/rows,barHeight=Number(style.barHeight||11),laneGap=Number(style.laneGap||2);
 let html=`<div class="range-event-layer" style="--range-rows:${rows}">`;
 layout.segments.forEach(segment=>{
  const left=segment.startColumn/7*100,width=(segment.endColumn-segment.startColumn+1)/7*100;
  const top=segment.week*rowHeight+6+segment.lane*(barHeight+laneGap);
  const label=rangeLabel(segment,style);
  const classes=["range-event-bar",segment.continuesBefore?"continues-before":"",segment.continuesAfter?"continues-after":"",style.labelPosition==="above"?"label-above":""].filter(Boolean).join(" ");
  const categoryColor=eventColor(segment.event);html+=`<div class="${classes}" title="${escapeAttr(segment.event.title)} · ${segment.event.startDate} ~ ${segment.event.endDate}" style="left:calc(${left}% + 2px);width:calc(${width}% - 4px);top:${top}%;height:${barHeight}px;background:${categoryColor}">${label}</div>`
 });
 if(style.overflowStyle==="count"){
  const counts={};layout.overflow.forEach(x=>counts[x.week]=(counts[x.week]||0)+1);
  Object.entries(counts).forEach(([week,count])=>{
   const top=Number(week)*rowHeight+6+style.maxLanes*(barHeight+laneGap);
   html+=`<div class="range-event-overflow" style="top:${top}%">+${count}개 구간</div>`
  })
 }
 return html+"</div>"
}
