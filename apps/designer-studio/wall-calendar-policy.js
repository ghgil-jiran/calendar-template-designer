/* Physical wall calendar contract shared by type settings, authoring, customer and print. */
(function(root){'use strict';
 const schemaVersion='wall-calendar.v1',num=(v,d,min,max)=>Number.isFinite(Number(v))?Math.min(max,Math.max(min,Number(v))):d;
 const nationalDays=new Set(['03-01','07-17','08-15','10-03','10-09']);
 const fontBounds=Object.freeze({titlePt:[6,72],datePt:[5,48],weekdayPt:[5,24],referencePt:[5,24],eventPt:[3,24],listPt:[5,24]});
 const defaults={schemaVersion,rangeMode:'repeat',rangeLabelMode:'every',datePt:12,titlePt:24,weekdayPt:10,weekdayWeight:'inherit',referencePt:7.5,eventPt:8.5,listPt:10,listLineHeight:16,listPaddingTop:2,listPaddingRight:2,listPaddingBottom:2,listPaddingLeft:2,weekRows:'six',gapMm:4,columnDividerMm:0,columnDividerColor:'#d6edf7',paddingMm:1.5,lineMm:.18,listPercent:45,fixedListHeight:false,listPosition:'bottom',listWidthPercent:42,listDateFormat:'day',boxStyle:'outline',weekdayStyle:'plain',titleColorMode:'month',titleNumberLarge:false,listColumns:2,listLayout:'auto',listGrouping:'separate',listHeading:'show',listBackground:'plain',listColorMode:'row',monthFormat:'korean',titleStyle:'band',dateAlign:'auto',dateVerticalAlign:'top',gridStyle:'horizontal',showWeekdays:true,weekdayFormat:'short',schedulePlacement:'list',referenceLayout:'below',referencePlacement:'list',includeSchoolEvents:true,includeHolidays:true,includeAnniversaries:true,includeSolarTerms:false,includeLunar:false};
 const customerKeys=['gridStyle','showWeekdays','schedulePlacement','referenceLayout','referencePlacement','listLayout','listGrouping','monthFormat','titleStyle','dateAlign','weekdayFormat','listPosition','cellListLayout','scheduleFontFamily','schedulePt','scheduleColor','scheduleWeekday','scheduleHolidays','cellAutoFit','listAutoFit','scheduleTracking','scheduleBullet','scheduleDisplayMode','scheduleRangeEachDay','showVacationBackground','vacationBackgroundColor','scheduleJoinText','scheduleStylePreset','scheduleBarHeight','listColumnColors','listLineHeight','listPaddingTop','listPaddingRight','listPaddingBottom','listPaddingLeft'];
 function normalize(value={}){const v={...defaults};for(const k of ['datePt','titlePt','weekdayPt','referencePt','eventPt','listPt'])v[k]=num(value[k],defaults[k],...fontBounds[k]);for(const [k,min,max] of [['gapMm',0,15],['paddingMm',0,5],['lineMm',.1,1],['listPercent',15,50],['listWidthPercent',20,55],['listColumns',1,3],['listLineHeight',8,48],...['Top','Right','Bottom','Left'].map(side=>['listPadding'+side,0,15])])v[k]=num(value[k],defaults[k],min,max);for(const key of ['columnGapMm','rowGapMm'])v[key]=num(value[key],v.gapMm,0,15);v.columnDividerMm=num(value.columnDividerMm,0,0,2);v.columnDividerColor=/^#[a-f0-9]{6}$/i.test(value.columnDividerColor||'')?value.columnDividerColor:defaults.columnDividerColor;v.listColumns=Math.round(v.listColumns);for(const [k,choices] of Object.entries({weekdayWeight:['inherit','400','700'],rangeMode:['repeat','bars'],rangeLabelMode:['every','first','continued'],listLayout:['auto','one','two','three'],listGrouping:['separate','merged'],monthFormat:['korean','bilingual','center-english','split-english','number'],titleStyle:['band','plain','underline','rounded','rounded-top'],listHeading:['show','hide'],listBackground:['plain','tinted','palette'],listColorMode:['month','row'],listPosition:['bottom','right'],listDateFormat:['day','weekday'],boxStyle:['outline','filled','plain'],weekRows:['six','split-five'],weekdayStyle:['band','plain','grid','tinted'],titleColorMode:['month','row'],dateAlign:['auto','left','center','right'],dateVerticalAlign:['top','center'],gridStyle:['none','horizontal','boxed'],weekdayFormat:['short','full','english'],schedulePlacement:['list','cells','both'],referenceLayout:['basic-1','basic-2','below','beside'],referencePlacement:['list','cells','hidden']}))v[k]=choices.includes(value[k])?value[k]:defaults[k];if(!value.listLayout&&[1,3].includes(value.listColumns))v.listLayout=value.listColumns===1?'one':'three';for(const key of ['titlePalette','listPalette'])if(Array.isArray(value[key]))v[key]=value[key].slice(0,12).filter(color=>/^#[a-f0-9]{6}$/i.test(color));v.showWeekdays=value.showWeekdays!==false;v.titleNumberLarge=value.titleNumberLarge===true;v.titleNumberMonthColor=value.titleNumberMonthColor===true;v.fixedListHeight=value.fixedListHeight===true;for(const key of ['includeSchoolEvents','includeHolidays','includeAnniversaries','includeSolarTerms','includeLunar'])v[key]=typeof value[key]==='boolean'?value[key]:defaults[key];for(const k of ['dateColor','sunday','saturday','titleColor','titleNumberColor','titleEnglishColor','weekdayColor','weekdayBackgroundColor','listColor','gridColor'])if(/^#[a-f0-9]{6}$/i.test(value[k]||''))v[k]=value[k];for(const k of ['fontFamily','titleFontFamily','titleNumberFontFamily','titleEnglishFontFamily','weekdayFontFamily','dateFontFamily','listFontFamily'])if(typeof value[k]==='string'&&value[k].length<=100&&!/[;{}<>\n]/.test(value[k]))v[k]=value[k];if(['auto','one','two','three'].includes(value.cellListLayout))v.cellListLayout=value.cellListLayout;
 for(const key of ['titleNumberPt','titleEnglishPt'])if(value[key]!=null&&value[key]!=='')v[key]=num(value[key],v.titlePt,...fontBounds.titlePt);
 if(typeof value.schedulePt==='number')v.schedulePt=num(value.schedulePt,defaults.eventPt,...fontBounds.eventPt);
 if(/^#[a-f0-9]{6}$/i.test(value.scheduleColor||''))v.scheduleColor=value.scheduleColor;
 if(typeof value.scheduleFontFamily==='string'&&value.scheduleFontFamily.length<=100&&/^[\p{L}\p{N} .,_-]+$/u.test(value.scheduleFontFamily))v.scheduleFontFamily=value.scheduleFontFamily;
 if(typeof value.scheduleBarHeight==='number'&&value.scheduleBarHeight>0)v.scheduleBarHeight=num(value.scheduleBarHeight,10,1,24);
 if(typeof value.scheduleTracking==='number')v.scheduleTracking=num(value.scheduleTracking,0,-.1,.2);
 if(['bar','text','line','legacy'].includes(value.scheduleDisplayMode))v.scheduleDisplayMode=value.scheduleDisplayMode;
 if(Object.hasOwn(onePageStyles,value.scheduleStylePreset))v.scheduleStylePreset=value.scheduleStylePreset;
 for(const key of ['listColumnColors','scheduleBullet','scheduleRangeEachDay','showVacationBackground','scheduleJoinText','scheduleWeekday','scheduleHolidays','cellAutoFit','listAutoFit'])if(typeof value[key]==='boolean')v[key]=value[key];
 if(typeof value.vacationBackgroundColor==='string'&&/^#[a-f0-9]{6}$/i.test(value.vacationBackgroundColor))v.vacationBackgroundColor=value.vacationBackgroundColor;
 return v;}
 function monthStyle(element,month){if(!month)return {};const {gapMm,columnGapMm,rowGapMm,columnDividerMm,columnDividerColor,listPercent,listWidthPercent,fixedListHeight,...value}=element?.wallMonthOverrides?.[String(month)]||{};return value;}
 function cellScheduleDefaults(element,project,settings){
  if(Number(element?.monthCount)!==6||project?.book?.pageInstances?.length!==2||settings.schedulePlacement!=='cells')return {};
  const first=new Date(Date.UTC(Number(project.settings.year),Number(project.settings.startMonth||1)-1,1));
  const end=new Date(Date.UTC(first.getUTCFullYear(),first.getUTCMonth()+12,1));
  const events=(project.book.events||[]).filter(event=>event.startDate&&!event.reference&&!event.referenceKind&&event.category!=='holiday'&&!(settings.showVacationBackground&&root.ACDLSharedSchedule?.isVacationRange(event)));
  let peak=0;
  for(const day=new Date(first);day<end&&peak<5;day.setUTCDate(day.getUTCDate()+1)){
   const date=day.toISOString().slice(0,10);
   peak=Math.max(peak,events.filter(event=>event.startDate<=date&&(event.endDate||event.startDate)>=date).length);
  }
  const [fontPt,height]=peak<=3?[9,13]:peak===4?[8,11]:[7,10];
  return {autoSchedulePt:fontPt,autoScheduleHeight:height};
 }
 function posterSample(project){
  return project?.template?.metadata?.name?.match(/샘플\s*([EFG])\b/i)?.[1].toUpperCase();
 }
 function resolve(element,project,month){
  const flags=Object.fromEntries(['includeSchoolEvents','includeHolidays','includeAnniversaries','includeSolarTerms','includeLunar'].filter(k=>typeof project?.settings?.calendarData?.[k]==='boolean').map(k=>[k,project.settings.calendarData[k]]));
  const stored={...project?.template?.calendarTypeSnapshot?.definition?.wallCalendarDefaults,...element?.wallCalendarSettings,...monthStyle(element,month)};
  const sample=posterSample(project);
  const v=normalize({...(element?.posterShowList===false?{schedulePlacement:'cells',referencePlacement:'cells'}:{}),...stored,...flags});
  if(flags.includeHolidays===undefined&&v.scheduleHolidays!==undefined)v.includeHolidays=v.scheduleHolidays;
  if(sample==='G'){
   v.schedulePlacement='cells';
   v.referencePlacement='cells';
   const layout=monthStyle(element,month)?.referenceLayout??element?.wallCalendarSettings?.referenceLayout;
   v.referenceLayout=layout==='below'?'below':'beside';
  }else if(sample==='E'||sample==='F'){
   v.schedulePlacement='list';
   v.referencePlacement='list';
  }else if(project?.mode==='calendar-workspace'&&Number(element?.monthCount)===6&&project.book?.pageInstances?.length===2&&v.schedulePlacement==='cells'){
   v.referencePlacement='cells';
   const layout=project.template.masters?.calendar?.calendarLayout?.annotations?.layout;
   if(['basic-1','basic-2','below','beside'].includes(layout))v.referenceLayout=layout;
  }
  return {...v,...cellScheduleDefaults(element,project,v)};
 }
 function geometry(project,element,value=resolve(element,project)){const width=Number(project.productType.pageSize.width)*Number(element.width)/100,height=Number(project.productType.pageSize.height)*Number(element.height)/100,columns=Math.max(1,Number(element.columns)||3),rows=Math.ceil((Number(element.monthCount)||12)/columns),monthWidth=(width-(columns-1)*(value.columnGapMm??value.gapMm))/columns,monthHeight=(height-(rows-1)*(value.rowGapMm??value.gapMm))/rows;return {width,height,columns,rows,monthWidth,monthHeight,dayWidth:(monthWidth-2*value.paddingMm)*(value.listPosition==='right'&&(value.schedulePlacement!=='cells'||value.referencePlacement==='list')?1-value.listWidthPercent/100:1)/7,gridHeight:(monthHeight-2*value.paddingMm)*(value.listPosition==='right'||value.schedulePlacement==='cells'&&value.referencePlacement!=='list'?1:1-value.listPercent/100)-value.titlePt*25.4/72*1.25-(value.showWeekdays?value.weekdayPt*25.4/72*1.5:0)};}
 function apply(project,item,settings,{month=null,allPages=false,columns=null,startMonth=null,resetMonths=false,changedSettings=[]}={}){const value=normalize(settings),targets=allPages?[...Object.values(project.template.masterElements||{}),...Object.values(project.book.elementsByPage||{})].flat().filter(e=>e.academicPoster):[item];for(const target of targets){if(month){const {gapMm,columnGapMm,rowGapMm,columnDividerMm,columnDividerColor,...local}=value;target.wallMonthOverrides||={};target.wallMonthOverrides[String(month)]=structuredClone(local);}else{target.wallCalendarSettings=structuredClone(value);if(resetMonths)delete target.wallMonthOverrides;else for(const override of Object.values(target.wallMonthOverrides||{}))for(const key of changedSettings)delete override[key];if(columns!==null&&Number(target.monthCount)===Number(item.monthCount)&&(Number(item.monthCount)===6?[2,3]:[2,3,4]).includes(Number(columns)))target.columns=Number(columns);if(startMonth===0)delete target.posterStartMonth;else if(Number.isInteger(startMonth)&&startMonth>=1&&startMonth<=12)target.posterStartMonth=startMonth;}target.label=target.label||'전체 월력';}return targets.length;}
 function validateCustomer(value){if(!value||Object.keys(value).some(k=>!customerKeys.includes(k)))throw Error('허용하지 않은 전체 월력 설정입니다.');const normalized=normalize(value);for(const [k,v] of Object.entries(value))if(normalized[k]!==v)throw Error('전체 월력 설정을 확인해 주세요.');return value;}
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),hex=(v,f)=>/^#[a-f0-9]{6}$/i.test(v||'')?v:f;
 const onePageStyles=Object.freeze({
  'poster-bottom':{columns:3,label:'3×4 · 하단 일정형'},
  'poster-right':{columns:2,label:'2×6 · 오른쪽 일정형'},
  'poster-cells':{columns:3,label:'3×4 · 날짜 칸 일정형'}
 });
 const presets=Object.freeze({
 'poster-bottom':{schedulePlacement:'list',referencePlacement:'list',listPosition:'bottom',scheduleDisplayMode:'legacy'},
 'poster-right':{schedulePlacement:'list',referencePlacement:'list',listPosition:'right',scheduleDisplayMode:'legacy'},
 'poster-cells':{schedulePlacement:'cells',referencePlacement:'cells',gridStyle:'boxed',scheduleDisplayMode:'text',cellAutoFit:true},
 'basic-1-1':{gridStyle:'horizontal',schedulePlacement:'list',referencePlacement:'list',listPosition:'bottom',titleStyle:'band',dateAlign:'center'},
 'basic-1-2':{gridStyle:'horizontal',schedulePlacement:'list',referencePlacement:'list',listPosition:'right',titleStyle:'band',dateAlign:'center'},
 'basic-2-1':{gridStyle:'boxed',schedulePlacement:'list',referencePlacement:'list',listPosition:'bottom',titleStyle:'rounded',dateAlign:'center'},
 'basic-2-2':{gridStyle:'boxed',schedulePlacement:'list',referencePlacement:'list',listPosition:'right',titleStyle:'rounded',dateAlign:'center'},
minimal:{listPosition:'bottom',gridStyle:'none',schedulePlacement:'list',referencePlacement:'list',titleStyle:'plain',dateAlign:'center'},grid:{listPosition:'bottom',gridStyle:'boxed',schedulePlacement:'list',referencePlacement:'list',titleStyle:'band',dateAlign:'center'},schedule:{listPosition:'bottom',gridStyle:'boxed',schedulePlacement:'cells',referencePlacement:'cells',titleStyle:'band',dateAlign:'left'}});
 function preset(value,name){if(!presets[name])throw Error('벽보형 적용 스타일을 확인해 주세요.');return normalize({...value,...presets[name]});}
 function presetName(value,columns){const keys=Object.keys(presets);return keys.find(key=>(!onePageStyles[key]||onePageStyles[key].columns===Number(columns))&&Object.entries(presets[key]).every(([k,v])=>value[k]===v))||'custom';}
 let fitPending=false;
 function scheduleFit(){if(fitPending||!root.requestAnimationFrame||!root.document)return;fitPending=true;root.requestAnimationFrame(()=>{fitPending=false;fit(root.document);root.document.fonts?.ready?.then(()=>fit(root.document));});}
 // listPercent is a preferred allocation, not a cap.
 function allocateMonthSpace({height,chrome,gridMinimum,listRequired,preferredPercent}){
  const available=Math.max(0,height-chrome-gridMinimum),preferred=height*Math.max(0,Math.min(100,preferredPercent))/100;
  return {available,listHeight:Math.min(available,Math.max(preferred,listRequired)),overflow:Math.max(0,listRequired-available)};
 }
 function fitScheduleText(node,base,minimum,leading,measure){
  const floor=Math.min(base,minimum);
  for(let size=base;;size=Math.max(floor,Math.round((size-.5)*100)/100)){
   node.style.setProperty('--wall-'+(node.dataset.wallListFit?'list':'cell')+'-fit-size',size*Number(node.dataset.wallPtUnit)+'cqw');
   for(const spacing of [leading,leading===1.3?1.2:1.15,1.1]){
    node.style.setProperty('--wall-'+(node.dataset.wallListFit?'list':'cell')+'-fit-leading',String(spacing));
    const result=measure();
    if(result.fits||size===floor&&spacing===1.1)return result;
   }
  }
 }
 function fit(scope, enlarge=true){
  const lists=[...(scope?.querySelectorAll?.('[data-wall-list-layout]')||[])];
  if(enlarge)for(const list of lists){
   list.style.removeProperty('--wall-list-auto-size');
   list.style.removeProperty('--wall-list-auto-leading');
  }
  for(const month of scope?.querySelectorAll?.('[data-wall-cell-fit]')||[]){
   const grid=month.querySelector('[data-wall-grid]'),list=month.querySelector('[data-wall-list-layout]');
   if(!grid?.clientHeight)continue;
   const bottom=list?.dataset.wallListPosition==='bottom';
   if(bottom){
    grid.style.minHeight='0px';grid.style.flex='1 1 0px';
    list.style.height=list.dataset.wallListPercent+'%';list.style.flex='0 0 auto';
   }
   const cells=[...grid.querySelectorAll('[data-wall-cell-event]')].map(n=>n.closest('[data-poster-date]'));
   const scheduledCells=[...new Set(cells)];
   if(!scheduledCells.length)continue;
   fitScheduleText(month,Number(month.dataset.wallCellFit),3,1.25,()=>({fits:scheduledCells.every(cell=>cell.scrollHeight<=cell.clientHeight+1&&cell.scrollWidth<=cell.clientWidth+1)}));
  }
  for(const list of lists){
   if(!list.clientWidth)continue;
   const month=list.closest('[data-poster-month]'),grid=month?.querySelector('[data-wall-grid]');
   if(!month||!grid||!month.clientHeight)continue;
   const css=node=>root.getComputedStyle(node),px=value=>Number.parseFloat(value)||0;
   const groups=[...list.querySelectorAll('[data-wall-list-columns]')];
   if(list.dataset.wallListPosition==='right'){
    const fixedColumns={one:1,two:2,three:3}[list.dataset.wallListLayout];
    const set=count=>{for(const group of groups)group.style.columnCount=String(count);list.dataset.wallResolvedColumns=String(count);};
    const measure=()=>{
     let best={count:1,overflow:Infinity,fits:false};
     for(const count of fixedColumns?[fixedColumns]:[1,2,3]){
      set(count);
      const overflow=Math.max(0,list.scrollHeight-list.clientHeight)+Math.max(0,list.scrollWidth-list.clientWidth);
      if(overflow<=1)return {fits:true};
      if(list.dataset.wallListLayout==='auto'||overflow<best.overflow)best={count,overflow,fits:false};
     }
     set(best.count);
     return best;
    };
    if(list.dataset.wallListFit&&fixedColumns)fitScheduleText(list,Number(list.dataset.wallListFit),5,1.3,measure);
    else measure();
    continue;
   }
   // Cloned print pages inherit screen pixel sizes. Re-measure from scratch at the destination size.
   grid.style.minHeight='0px';grid.style.flex='1 1 0px';list.style.height='auto';list.style.flex='0 0 auto';
   const cells=[...grid.children].filter(n=>n.dataset.wallRegion==='day'),scale=month.offsetHeight?month.getBoundingClientRect().height/month.offsetHeight:1;
   let rowMinimum=0;
   for(const cell of cells){const rect=cell.getBoundingClientRect(),style=css(cell);let bottom=px(style.borderTopWidth)+px(style.paddingTop);
    if(cell.dataset.wallCenteredDate!==undefined)bottom+=cell.firstElementChild?.offsetHeight||0;
    else for(const child of cell.children)bottom=Math.max(bottom,(child.getBoundingClientRect().bottom-rect.top)/(scale||1));
    rowMinimum=Math.max(rowMinimum,bottom+px(style.paddingBottom)+px(style.borderBottomWidth));
   }
   const rows=Number(grid.dataset.wallRows)||Math.ceil(cells.length/7),gridMinimum=Math.ceil(rowMinimum*rows*100)/100;
   grid.style.minHeight=gridMinimum+'px';
   const monthCss=css(month),height=Math.max(0,month.clientHeight-px(monthCss.paddingTop)-px(monthCss.paddingBottom));
   const chrome=[...month.children].filter(n=>n!==grid&&n!==list).reduce((sum,n)=>sum+n.offsetHeight+px(css(n).marginTop)+px(css(n).marginBottom),0);
   const set=count=>{for(const group of groups)group.style.columnCount=String(count);list.dataset.wallResolvedColumns=String(count);};
   const measure=count=>{set(count);return {count,required:Math.max(list.offsetHeight,list.scrollHeight+px(css(list).borderTopWidth)+px(css(list).borderBottomWidth)),horizontal:Math.max(0,list.scrollWidth-list.clientWidth)};};
   const capacity=Math.max(0,height-chrome-gridMinimum);let chosen;
   if(list.dataset.wallListFit&&list.dataset.wallListLayout!=='auto'){
    const fixedColumns={one:1,two:2,three:3}[list.dataset.wallListLayout];
    const limit=list.dataset.wallFixedHeight==='true'?Math.min(capacity,height*Number(list.dataset.wallListPercent)/100):capacity;
    chosen=fitScheduleText(list,Number(list.dataset.wallListFit),5,1.3,()=>{
     const options=(fixedColumns?[fixedColumns]:[1,2,3]).map(measure);
     const fits=options.find(option=>option.required<=limit+.5&&option.horizontal<=1);
     const penalty=option=>Math.max(0,option.required-limit)+option.horizontal;
     return fits?{...fits,fits:true}:options.sort((a,b)=>penalty(a)-penalty(b))[0];
    });
   }else if(list.dataset.wallListLayout==='auto'){
    const options=[1,2,3].map(measure);
    const limit=list.dataset.wallFixedHeight==='true'?Math.min(capacity,height*Number(list.dataset.wallListPercent)/100):capacity;
    chosen=options.find(option=>option.required<=limit+.5&&option.horizontal<=1)||options.at(-1);
   }else chosen=measure({one:1,two:2,three:3}[list.dataset.wallListLayout]||2);
   set(chosen.count);
   const allocation=allocateMonthSpace({height,chrome,gridMinimum,listRequired:chosen.required,preferredPercent:Number(list.dataset.wallListPercent)||45});
   list.style.height=(list.dataset.wallFixedHeight==='true'?Math.min(allocation.available,height*Number(list.dataset.wallListPercent)/100):allocation.listHeight)+'px';list.style.flex='0 0 auto';
   list.dataset.wallAvailableHeight=allocation.available.toFixed(2);list.dataset.wallRequiredHeight=chosen.required.toFixed(2);list.dataset.wallGridMinimum=gridMinimum.toFixed(2);
   for(const node of [list,grid,month])node.dataset.wallOverflow=String(node.scrollHeight>node.clientHeight+2||node.scrollWidth>node.clientWidth+2);
  }
  if(enlarge)for(const poster of new Set(lists.map(list=>list.closest('.academic-poster-grid')).filter(Boolean))){
   const monthly=[...poster.querySelectorAll('[data-wall-list-layout]')];
   const fits=()=>monthly.every(list=>list.dataset.wallResolvedColumns==='1'&&list.scrollHeight<=list.clientHeight+1&&list.scrollWidth<=list.clientWidth+1);
   if(!monthly.length||!monthly.every(list=>list.dataset.wallListLayout==='auto')||!fits())continue;
   const base=Math.max(...monthly.map(list=>Number(list.dataset.wallListBasePt)));
   if(!Number.isFinite(base)||base>=12||monthly.some(list=>Number(list.dataset.wallListBasePt)!==base))continue;
   const setSize=increment=>{
    for(const list of monthly){
     const unit=Number(list.dataset.wallListPtUnit);
     const size=Number(list.dataset.wallListBasePt)+increment;
     const leading=Math.max(Number(list.dataset.wallListLinePx),size*96/72);
     list.style.setProperty('--wall-list-auto-size',size*unit+'cqw');
     list.style.setProperty('--wall-list-auto-leading',leading*72/96*unit+'cqw');
    }
   };
   let accepted=0;
   for(let step=.5;step<=12-base+.001;step+=.5){
    setSize(step);fit(poster,false);
    if(!fits()){setSize(accepted);fit(poster,false);break;}
    accepted=step;
   }
  }
 }
 function render(annual,element,project){const base=resolve(element,project),g=geometry(project,element,base),cw=mm=>100*mm/g.width+'cqw',pt=n=>cw(n*25.4/72),months=root.ACDLSharedMiniCalendar.resolvePosterMonths(annual,element,project),weekdayNames=project.settings.weekStart==='monday'?['월','화','수','목','금','토','일']:['일','월','화','수','목','금','토'];
 scheduleFit();const html=months.map((sourceMonth,index)=>{
 const v=resolve(element,project,sourceMonth.month),vacationRules=root.ACDLSharedSchedule;
 const vacations=Number(element.monthCount)===6&&project.book?.pageInstances?.length===2&&v.includeSchoolEvents&&v.showVacationBackground===true&&vacationRules?sourceMonth.items.filter(vacationRules.isVacationRange):[];
 const month=vacations.length?{...sourceMonth,items:sourceMonth.items.filter(e=>!vacationRules.isVacationRange(e)),days:sourceMonth.days.map(day=>({...day,events:day.events.filter(e=>!vacationRules.isVacationRange(e))}))}:sourceMonth;
 const style={...element.style,...v},palette=v.titlePalette?.length?v.titlePalette:element.posterColors?.length?element.posterColors:months.map(m=>hex(element.posterMonthColors?.[String(m.month)],'#b3d3e5')),monthColor=element.posterMonthColors?.[String(month.month)],accent=hex((v.titleColorMode==='row'?palette?.[Math.floor(index/g.columns)%(palette?.length||1)]:v.titlePalette?.length?palette[index%palette.length]:monthColor||palette?.[index%(palette?.length||1)]),'#b3d3e5'),sun='#d92d20',sat='#175cd3',ink=hex(style.dateColor,'#17202e'),holidays=new Set([...(month.holidayDates||[]),...month.items.filter(e=>e.category==='holiday').map(e=>e.startDate)]),tone=day=>holidays.has(day.date)||nationalDays.has(day.date.slice(5))||day.weekday===0?sun:day.weekday===6?sat:ink,line=cw(v.lineMm)+' solid '+hex(v.gridColor,accent);
 const sampleG=posterSample(project)==='G',referenceSize=pt(sampleG?v.datePt:v.schedulePt??v.referencePt);
 const scheduleStyle=(v.scheduleFontFamily?'font-family:'+esc(v.scheduleFontFamily)+';':'')+(v.scheduleColor?'color:'+v.scheduleColor+';':'')+(v.scheduleTracking?'letter-spacing:'+v.scheduleTracking+'em;':'');
 const weekdayLabel=date=>' ('+['일','월','화','수','목','금','토'][new Date(date+'T00:00:00Z').getUTCDay()]+')';
 const refs=day=>day.events.filter(e=>e.reference||e.category==='holiday'),normal=day=>day.events.filter(e=>!e.reference&&e.category!=='holiday');
 const reference=(items,day,showBullet=v.scheduleBullet)=>items.map(e=>{const kind=e.referenceKind||'holidays',color=root.ACDLSharedCalendarAnnotations?.context({weekday:day.weekday,isHoliday:holidays.has(day.date),colors:{color:ink,saturdayColor:sat,holidayColor:sun},referenceColors:project.template.masters?.calendar?.calendarLayout?.referenceColors}).colorFor(kind)||tone(day);return '<span data-reference-kind="'+kind+'" style="color:'+(e.category==='holiday'||kind==='holidays'?(sampleG?tone(day):sun):v.scheduleColor||color)+'">'+esc((showBullet?'• ':'')+e.title)+'</span>';}).join(' · ');
 // Reuse the desk calendar's date segmentation and lane/label policies.
 const splitWeeks=v.weekRows==='split-five';
 const cellPlacement=(index)=>{
  if(!splitWeeks)return '';
  const col=index%7,row=Math.floor(index/7);
  const split=month.days[35+col]?.month===month.month;
  return 'grid-column:'+(col+1)+';grid-row:'+(row===5?10:row*2+1)+' / span '+(row===5||row===4&&split?1:2)+';';
 };
 const displayMode=v.scheduleDisplayMode??(Number(element.monthCount)===6&&v.schedulePlacement==='cells'&&v.rangeMode!=='bars'?'text':'legacy');
 const scheduleHeight=v.scheduleBarHeight??v.autoScheduleHeight;
 const cellLineHeight=displayMode==='text'&&scheduleHeight?cw(scheduleHeight*25.4/96):1.25;
 const bullet=v.scheduleBullet?'• ':'';
 const cellPt=v.schedulePt??v.autoSchedulePt??v.eventPt,listPt=Math.max(5,(project.mode==='calendar-workspace'?v.schedulePt:undefined)??v.listPt);
 const textCells=displayMode==='text'&&v.schedulePlacement!=='list';
 const useBars=(displayMode==='legacy'?!splitWeeks&&v.rangeMode==='bars':displayMode!=='text')&&v.includeSchoolEvents&&v.schedulePlacement!=='list',rangeEvents=month.items.filter(e=>!e.reference&&e.category!=='holiday'&&(displayMode==='bar'||displayMode==='line'||e.endDate>e.startDate)).map((e,i)=>({...e,id:e.id||'wall-range-'+i}));
 let rangeLayout={segments:[],hiddenByDate:{}};
 if(useBars&&rangeEvents.length){if(!root.ACDLCalendarDomain?.buildCalendarScheduleLanes||!root.ACDLSharedSchedule?.monthSchedule)throw Error('공통 기간 일정 모듈을 불러오지 못했습니다.');rangeLayout=root.ACDLSharedSchedule.monthSchedule(root.ACDLCalendarDomain.buildCalendarScheduleLanes(month.year,month.month,rangeEvents,project.settings.weekStart||'sunday',month.rows,v.autoSchedulePt?Infinity:undefined),{labelMode:v.rangeLabelMode},v.autoSchedulePt?Infinity:4);}
 const barMm=v.autoScheduleHeight&&v.schedulePt==null?scheduleHeight*25.4/96:Math.max(cellPt*25.4/72*1.35+.6,(scheduleHeight??0)*25.4/96),barGap=.5;
 const rowBottom=(row,col)=>splitWeeks?(row===4&&month.days[35+col]?.month===month.month?90:Math.min(100,(row+1)*20)):(row+1)/month.rows*100;
 const reserved=(row,col)=>Math.max(0,...rangeLayout.segments.filter(seg=>seg.row===row&&(!splitWeeks||col>=seg.startCol&&col<seg.startCol+seg.span)).map(seg=>seg.lane+1))*(barMm+barGap);
 const bars=rangeLayout.segments.map(seg=>{
  const event=rangeEvents.find(e=>e.id===seg.eventId),resources=project.template.resources;
  const categoryColor=resources?.eventCategories?.find(category=>category.id===event?.category)?.color;
  const color=hex(event?.color,hex(categoryColor,hex(resources?.colorTheme?.accent,'#4777bd')));
  const label=esc(seg.label?bullet+seg.label:'');
  const bottom=(seg.lane+1)*(barMm+barGap),pieces=[];
  for(let col=seg.startCol;col<seg.startCol+seg.span;col++){
   const track=rowBottom(seg.row,col),last=pieces.at(-1);
   if(last?.track===track)last.span++;
   else pieces.push({col,span:1,track});
  }
  const appearance=displayMode==='line'
   ?'color:'+color+';border-bottom:'+cw(25.4/96)+' solid '+color+';align-items:flex-start;'
   :displayMode==='bar'?'background:'+color+';color:#fff;border-radius:'+cw(4*25.4/96)+';align-items:center;justify-content:center;opacity:.92;'
   :'background:'+color+';color:#17202e;align-items:center;';
  return pieces.map(({col,span,track},index)=>'<div data-wall-range data-wall-region="range" data-wall-start=\"'+(seg.row*7+col)+'\" data-wall-span=\"'+span+'\" title="'+esc(event?.title||seg.title)+'" style="position:absolute;z-index:1;box-sizing:border-box;left:calc('+col/7*100+'% + '+cw(.4)+');width:calc('+span/7*100+'% - '+cw(.8)+');top:calc('+track+'% - '+cw(bottom)+');height:'+cw(barMm)+';display:flex;overflow:hidden;padding:0 '+cw(.4)+';'+appearance+scheduleStyle+'font-size:'+pt(cellPt)+';line-height:'+(v.autoScheduleHeight?'1':'1.35')+'"><span style="display:block;min-width:0;overflow:hidden;white-space:nowrap;text-overflow:ellipsis">'+(index===0?label:'')+'</span></div>').join('');
 }).join('');
 const days=month.days.map((day,i)=>{const vacation=day.month===month.month&&vacations.length?vacationRules.vacationOnDate(vacations,day.date):null;if(splitWeeks&&i>=35&&day.month!==month.month)return '';const list=v.referencePlacement==='cells'?refs(day):[],primary=list.filter(e=>['holidays','anniversaries'].includes(e.referenceKind||'holidays')),secondary=list.filter(e=>!primary.includes(e)),side=v.referenceLayout==='beside'?list:v.referenceLayout==='basic-1'?secondary:v.referenceLayout==='basic-2'?primary:[],bottom=list.filter(e=>!side.includes(e));const events=!v.includeSchoolEvents||v.schedulePlacement==='list'||useBars&&displayMode!=='legacy'?[]:displayMode==='text'&&root.ACDLSharedSchedule?.deskTextEventsForDate?root.ACDLSharedSchedule.deskTextEventsForDate(month.items.filter(e=>!e.reference&&e.category!=='holiday'),day.date,v.scheduleRangeEachDay):[...new Map([...normal(day),...month.items.filter(e=>!useBars&&!e.reference&&e.category!=='holiday'&&e.endDate>e.startDate&&e.startDate<=day.date&&e.endDate>=day.date)].map(e=>[e.id||[e.title,e.startDate,e.endDate].join('|'),e])).values()];const cellColumns={one:1,two:2,three:3}[v.cellListLayout]||(v.cellListLayout==='auto'&&events.length>=4?2:1);const centered=v.dateVerticalAlign==='center'&&!list.length&&!events.length&&!reserved(Math.floor(i/7),i%7);return '<div data-poster-date="'+day.date+'" data-wall-cell-index="'+i+'" data-wall-region="day"'+(centered?' data-wall-centered-date':'')+' style="'+(centered?'display:flex;flex-direction:column;justify-content:center;':textCells?'display:flex;flex-direction:column;':'')+cellPlacement(i)+(vacation?.active?'background-color:'+vacationRules.vacationColor(v.vacationBackgroundColor)+';':'')+'min-width:0;min-height:0;box-sizing:border-box;padding:'+cw(.6)+';padding-bottom:'+cw(.6+reserved(Math.floor(i/7),i%7))+';border-top:'+(v.gridStyle==='none'?'0':line)+';'+(v.gridStyle==='boxed'?'border-right:'+line+';'+(i%7===0?'border-left:'+line+';':''):'')+(v.gridStyle!=='none'&&(splitWeeks?i>=35||i>=28&&month.days[i+7]?.month!==month.month:i>=month.days.length-7)?'border-bottom:'+line+';':'')+'">'+(day.month!==month.month?'':'<div data-wall-date-heading style="display:flex;gap:'+cw(.6)+';align-items:flex-start;justify-content:'+({left:'flex-start',center:'center',right:'flex-end'}[v.dateAlign]||(v.schedulePlacement==='list'&&v.referencePlacement!=='cells'?'center':'flex-start'))+'"><b style="font-size:'+pt(v.datePt)+';line-height:1.15;color:'+tone(day)+'">'+day.day+(v.scheduleWeekday&&(list.length||events.length||day.events.some(e=>useBars&&!e.reference&&e.category!=='holiday')||useBars&&rangeEvents.some(e=>e.startDate<=day.date&&e.endDate>=day.date))?weekdayLabel(day.date):'')+'</b>'+(side.length?'<span style="min-width:0;overflow-wrap:anywhere;'+scheduleStyle+'font-size:'+referenceSize+';line-height:1.2">'+reference(side,day)+'</span>':'')+'</div><div data-wall-date-reference style="'+scheduleStyle+'break-inside:avoid;font-size:'+referenceSize+';line-height:1.2;overflow-wrap:anywhere">'+reference(bottom,day)+'</div>'+(vacation?.labels.length?'<div data-wall-vacation-label style="font-size:'+pt(cellPt)+';line-height:1.15;overflow-wrap:anywhere">'+vacation.labels.map(esc).join('<br>')+'</div>':'')+'<div'+(textCells?' data-wall-cell-text':'')+' style="'+scheduleStyle+(textCells?'margin-top:auto;':'')+'column-count:'+cellColumns+';column-gap:'+cw(.6)+'">'+events.map((e,idx)=>'<'+(v.scheduleJoinText&&displayMode==='text'?'span':'div')+' data-wall-cell-event style="break-inside:avoid;font-size:var(--wall-cell-fit-size,'+pt(cellPt)+');line-height:var(--wall-cell-fit-leading,'+cellLineHeight+');overflow-wrap:anywhere">'+esc((v.scheduleJoinText&&displayMode==='text'&&idx?' / ':'')+bullet+e.title)+'</'+(v.scheduleJoinText&&displayMode==='text'?'span':'div')+'>').join('')+'</div>')+'</div>';}).join('');
 const isPublic=e=>e.reference||e.category==='holiday';
 const listed=month.items.filter(e=>{
  if((e.referenceKind==='holidays'||e.category==='holiday')&&!v.includeHolidays)return false;
  return isPublic(e)?v.referencePlacement==='list'||(v.schedulePlacement==='list'&&v.referencePlacement!=='hidden'):v.includeSchoolEvents&&v.schedulePlacement!=='cells';
 });
 const entry=e=>{const short=date=>date.slice(0,7)===month.year+'-'+String(month.month).padStart(2,'0')?String(Number(date.slice(8)))+((v.scheduleWeekday??(v.listDateFormat==='weekday'))?weekdayLabel(date):''):date.slice(5).replace('-','/'),date=short(e.startDate)+(e.endDate>e.startDate?'–'+short(e.endDate):''),publicInfo=e.reference||e.category==='holiday',day={weekday:new Date(e.startDate+'T00:00:00Z').getUTCDay(),date:e.startDate};return '<div data-poster-list-event="'+esc(e.id||e.title)+'" data-start-date="'+esc(e.startDate)+'" style="break-inside:avoid;display:grid;grid-template-columns:max-content minmax(0,1fr);align-items:start;column-gap:'+cw(1)+';overflow-wrap:anywhere"><b style="font-variant-numeric:tabular-nums;white-space:nowrap">'+esc(bullet+date)+'</b><span>'+ (publicInfo?reference([e],day,false):esc(e.title))+'</span></div>';};
 const group=(title,items)=>!items.length?'':'<section data-wall-list-group style="padding-top:'+cw(1)+'">'+(!title||v.listHeading==='hide'?'':'<div style="font-weight:700;line-height:inherit;margin-bottom:'+cw(.6)+';border-bottom:'+line+'">'+title+'</div>')+'<div data-wall-list-columns style="column-count:'+({one:1,two:2,three:3}[v.listLayout]||2)+';column-gap:'+cw(2)+(v.listColumnColors?';column-rule:'+cw(.35)+' solid '+hex(v.gridColor,accent):'')+';column-fill:balance">'+items.map(entry).join('')+'</div></section>';
 const list=v.listGrouping==='merged'?group('',listed):group('공휴일·기념일'+(v.includeSolarTerms||v.includeLunar?' 등':''),listed.filter(isPublic))+group('학교 일정',listed.filter(e=>!isPublic(e)));
 const showList=v.schedulePlacement!=='cells'||v.referencePlacement==='list',right=showList&&v.listPosition==='right';
 const listPalette=v.listPalette?.length?v.listPalette:palette;
 const listFill=v.listBackground==='palette'?hex(listPalette?.[(v.listColorMode==='row'?Math.floor(index/g.columns):index)%(listPalette.length||1)],accent):v.listBackground==='tinted'?accent+'26':'';
 const sectionLayout=right?'display:grid;grid-template-columns:minmax(0,1fr) '+v.listWidthPercent+'%;grid-template-rows:auto '+(v.showWeekdays?'auto ':'')+'minmax(0,1fr);':'display:flex;flex-direction:column;';
 const titleBackground=['band','rounded','rounded-top'].includes(v.titleStyle)?accent:'transparent';
 const titleInk=hex(v.titleColor,'#17202e');
 const luminance=color=>[.2126,.7152,.0722].reduce((sum,weight,i)=>{
  const channel=parseInt(color.slice(1+i*2,3+i*2),16)/255;
  return sum+weight*(channel<=.04045?channel/12.92:((channel+.055)/1.055)**2.4);
 },0);
 const contrast=(a,b)=>(Math.max(a,b)+.05)/(Math.min(a,b)+.05);
 const requestedNumberColor=hex(monthColor,accent),backgroundLight=luminance(titleBackground==='transparent'?v.boxStyle==='filled'?accent:'#ffffff':titleBackground);
 const numberColor=contrast(luminance(requestedNumberColor),backgroundLight)>=3?requestedNumberColor:contrast(0,backgroundLight)>=contrast(1,backgroundLight)?'#000000':'#ffffff';
 const family=key=>v[key]?'font-family:'+esc(v[key])+';':'';
 const titlePart=(part,fallbackSize,fallbackColor='')=>family('title'+part+'FontFamily')+
  (v['title'+part+'Pt']?'font-size:'+pt(v['title'+part+'Pt'])+';':fallbackSize)+
  (v['title'+part+'Color']?'color:'+v['title'+part+'Color']+';':fallbackColor);
 const titleNumber='<span style="'+titlePart('Number',v.titleNumberLarge&&v.monthFormat!=='number'?'font-size:1.3em;':'',v.titleNumberMonthColor?'color:'+numberColor+';':'')+'">'+(v.monthFormat==='split-english'?String(month.month).padStart(2,'0'):month.month)+'</span>';
 const splitTitle=v.monthFormat==='split-english';
 const englishMonth=['JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE','JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER'][month.month-1];
 const yearLabel=month.transition?'<small>'+month.year+' </small>':'';
 const monthEnglish=(label,compact)=>'<span style="'+titlePart('English',compact?'font-size:.65em;':'')+'">'+label+'</span>';
 const titleText=splitTitle?'<span style="display:flex;align-items:baseline;justify-content:space-between;gap:.35em;min-width:0"><span>'+yearLabel+titleNumber+'</span>'+monthEnglish(englishMonth,true)+'</span>':yearLabel+titleNumber+(v.monthFormat==='number'?'':v.monthFormat==='center-english'?' '+monthEnglish(englishMonth,true):v.monthFormat==='bilingual'?' '+monthEnglish(['Jan','Feb','March','April','May','June','July','Aug','Sept','Oct','Nov','Dec'][month.month-1],false):'월');
 return '<section data-poster-month="'+month.year+'-'+String(month.month).padStart(2,'0')+'"'+((v.cellAutoFit??displayMode==='text')?' data-wall-cell-fit="'+cellPt+'" data-wall-pt-unit="'+(100*25.4/(72*g.width))+'"':'')+' class="academic-poster-month" data-wall-region="month" style="'+sectionLayout+'min-width:0;min-height:0;box-sizing:border-box;padding:'+cw(v.paddingMm)+';border:'+(v.boxStyle==='outline'?line:'0')+';background:'+(v.boxStyle==='plain'?'transparent':v.boxStyle==='filled'?accent+'33':'white')+';font-family:'+esc(style.fontFamily||'inherit')+'"><header style="grid-column:'+(splitTitle&&right?'1':'1 / -1')+';'+family('titleFontFamily')+'color:'+titleInk+';font-size:'+pt(v.titlePt)+';font-weight:800;line-height:1.2;flex:none;background:'+titleBackground+';border-radius:'+(v.titleStyle==='rounded'?cw(1.5):v.titleStyle==='rounded-top'?cw(4)+' '+cw(4)+' 0 0':'0')+';border-bottom:'+(v.titleStyle==='underline'?line:'0')+';text-align:center">'+titleText+'</header>'+(v.showWeekdays?'<div style="grid-column:1;'+family('weekdayFontFamily')+'display:grid;flex:none;background:'+(v.weekdayBackgroundColor||(v.weekdayStyle==='band'?accent:v.weekdayStyle==='tinted'?accent+'55':v.weekdayStyle==='grid'?accent+'33':'#ffffff'))+';grid-template-columns:repeat(7,1fr);text-align:center;font-size:'+pt(v.weekdayPt)+';font-weight:'+v.weekdayWeight+';line-height:1.5">'+weekdayNames.map(name=>'<span style="color:'+(v.weekdayColor||(v.weekdayStyle==='band'?'#ffffff':name==='일'?sun:name==='토'?sat:ink))+'">'+(v.weekdayFormat==='english'?{일:'SUN',월:'MON',화:'TUE',수:'WED',목:'THU',금:'FRI',토:'SAT'}[name]:name+(v.weekdayFormat==='full'?'요일':''))+'</span>').join('')+'</div>':'')+'<div data-wall-grid data-wall-rows="'+month.rows+'" style="grid-column:1;'+family('dateFontFamily')+'position:relative;display:grid;grid-template-columns:repeat(7,minmax(0,1fr));grid-template-rows:repeat('+(splitWeeks?10:month.rows)+',minmax(0,1fr));flex:1;min-height:'+cw((splitWeeks?5:month.rows)*(v.datePt*25.4/72*1.15+1.2+(v.gridStyle==='none'?0:v.lineMm*2)+.3))+'">'+days+bars+(Object.keys(rangeLayout.hiddenByDate).length?'<span data-wall-hidden-ranges="'+Object.keys(rangeLayout.hiddenByDate).length+'" style="position:absolute;bottom:0;color:#b42318;font-size:'+pt(cellPt)+'">기간 일정 겹침 공간 부족</span>':'')+'</div>'+(!showList?'':'<div class="academic-poster-month-list" data-wall-region="list"'+(v.listAutoFit?' data-wall-list-fit="'+listPt+'" data-wall-pt-unit="'+(100*25.4/(72*g.width))+'"':'')+' data-wall-list-base-pt="'+listPt+'" data-wall-list-pt-unit="'+(100*25.4/(72*g.width))+'" data-wall-list-line-px="'+v.listLineHeight+'" data-wall-list-layout="'+v.listLayout+'" data-wall-list-percent="'+v.listPercent+'" data-wall-fixed-height="'+v.fixedListHeight+'" data-wall-list-position="'+v.listPosition+'" data-wall-list-mm="'+((g.monthWidth-2*v.paddingMm)*v.listWidthPercent/100)+'" style="'+(right?'grid-column:2;grid-row:2 / -1;min-width:0;border-left:'+line+';padding-left:'+cw(1)+';':'height:'+v.listPercent+'%;flex:0 1 auto;min-height:0;border-top:'+line+';') +family('listFontFamily')+(listFill?'background:'+listFill+';padding-inline:'+cw(1.5)+';':'')+'color:'+hex(v.listColor,ink)+';'+scheduleStyle+'min-height:0;box-sizing:border-box;display:block;font-size:var(--wall-list-auto-size,var(--wall-list-fit-size,'+pt(listPt)+'));line-height:var(--wall-list-auto-leading,var(--wall-list-fit-leading,'+cw(v.listLineHeight*25.4/96)+'));padding:'+['Top','Right','Bottom','Left'].map(side=>cw(v['listPadding'+side])).join(' ')+'">'+list+'</div>')+'</section>';
 }).join('');
 const dividers=base.columnDividerMm>0?Array.from({length:g.columns-1},(_,i)=>{
  const center=(i+1)*(g.monthWidth+base.columnGapMm)-base.columnGapMm/2;
  return '<span aria-hidden="true" data-wall-column-divider style="pointer-events:none;position:absolute;top:0;bottom:0;left:'+cw(center)+';width:'+cw(base.columnDividerMm)+';transform:translateX(-50%);background:'+base.columnDividerColor+'"></span>';
 }).join(''):'';
 return '<div style="width:100%;height:100%;container-type:size"><div class="academic-poster-grid" data-wall-contract="'+schemaVersion+'" style="width:100%;height:100%;display:grid;grid-template-columns:repeat('+g.columns+',minmax(0,1fr));grid-template-rows:repeat('+g.rows+',minmax(0,1fr));position:relative;column-gap:'+cw(base.columnGapMm)+';row-gap:'+cw(base.rowGapMm)+';font-family:'+esc(element.style?.fontFamily||'inherit')+'">'+html+dividers+'</div></div>';
 }
 function inspect(scope){fit(scope);const hidden=[...(scope?.querySelectorAll?.('[data-wall-hidden-ranges]')||[])].map(n=>({month:n.closest('[data-poster-month]')?.dataset.posterMonth,region:'range',date:null,width:n.clientWidth,height:n.clientHeight,contentWidth:n.scrollWidth,contentHeight:n.scrollHeight}));return hidden.concat([...(scope?.querySelectorAll?.('[data-wall-region]')||[])].filter(n=>{const overflow=n.scrollHeight>n.clientHeight+2||n.scrollWidth>n.clientWidth+2;n.dataset.wallOverflow=String(overflow);return overflow;}).map(n=>({month:n.closest('[data-poster-month]')?.dataset.posterMonth,region:n.dataset.wallRegion,date:n.dataset.posterDate||null,width:n.clientWidth,height:n.clientHeight,contentWidth:n.scrollWidth,contentHeight:n.scrollHeight})));}
 function assertFits(scope){const issues=inspect(scope);if(issues.length){const details=issues.slice(0,8).map(i=>(i.date||i.month||'월 미상')+' '+({day:'날짜 칸',list:'일정 목록',month:'월력',range:'기간 일정'}[i.region]||i.region)+' ['+i.width+'×'+i.height+'px / 내용 '+i.contentWidth+'×'+i.contentHeight+'px]').join('; ');throw Error('벽보형 인쇄 공간 부족: '+details+(issues.length>8?' 외 '+(issues.length-8)+'건':'')+'. 전체 월력 개체에서 공간을 조정해 주세요.');}return issues;}
 root.ACDLWallCalendar=Object.freeze({schemaVersion,fontBounds,defaults,normalize,posterSample,resolve,geometry,apply,validateCustomer,customerKeys,render,inspect,assertFits,fit,allocateMonthSpace,onePageStyles,presets,preset,presetName});
})(globalThis);
