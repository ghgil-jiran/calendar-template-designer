/* Shared mini-calendar model and screen markup for authoring and user preview. */
(function (root) {
  "use strict";
  const version = "0.1.0-preview.1";
  const escapeText = value => String(value ?? "").replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;", "'":"&#39;"})[char]);
  const hex = (value, fallback) => typeof value === "string" && /^#[0-9a-fA-F]{3,8}$/.test(value) ? value : fallback;
  const align = value => ["left", "center", "right"].includes(value) ? value : "left";
  function resolveMiniCalendar(element, page, defaults = {}) {
    const sourceYear = Number(page?.calendarYear || defaults.year);
    const sourceMonth = Number(page?.calendarMonth || defaults.startMonth || 1);
    if (!Number.isInteger(sourceYear) || sourceYear < 2000 || sourceYear > 2200 || !Number.isInteger(sourceMonth) || sourceMonth < 1 || sourceMonth > 12) return null;
    const shift = element?.type === "mini-calendar-prev" ? -1 : element?.type === "mini-calendar-next" ? 1 : 0;
    const target = new Date(Date.UTC(sourceYear, sourceMonth - 1 + shift, 1));
    const year = target.getUTCFullYear(), month = target.getUTCMonth() + 1;
    const monday = (element?.weekStart || defaults.weekStart) === "monday";
    const offset = monday ? (target.getUTCDay() + 6) % 7 : target.getUTCDay();
    const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const configured = Number(element?.calendarRows ?? defaults.calendarRows ?? 6);
    const adaptive = (element?.calendarRowsMode ?? defaults.calendarRowsMode) === "adaptive";
    const rows = adaptive ? Math.max(5, Math.min(6, Math.ceil((offset + days) / 7))) : configured === 5 ? 5 : 6;
    const start = new Date(Date.UTC(year, month - 1, 1 - offset));
    const dateCell = date => ({ year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate(), weekday: date.getUTCDay(), date: date.toISOString().slice(0, 10) });
    const all = Array.from({ length: 42 }, (_, index) => { const date = new Date(start); date.setUTCDate(start.getUTCDate() + index); return dateCell(date); });
    const cells = rows === 6 ? all : all.slice(0, 35).map(cell => ({ ...cell }));
    if (rows === 5) all.slice(35).forEach((cell, index) => { if (cell.month === month) cells[28 + index].extra = cell; });
    const desk6 = (element?.sampleFamily ?? defaults.sampleFamily) === "desk-6";
    const headers = desk6 ? (monday ? ["MON","TUE","WED","THU","FRI","SAT","SUN"] : ["SUN","MON","TUE","WED","THU","FRI","SAT"])
      : (monday ? ["월","화","수","목","금","토","일"] : ["일","월","화","수","목","금","토"]);
    const monthNames = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
    const label = element?.monthLabelStyle === "number-en" ? month + " " + monthNames[month - 1] : year + "년 " + month + "월";
    return { year, month, rows, headers, label, showWeekdayHeader: element?.showWeekdayHeader !== false, showAdjacentMonths:element?.showAdjacentMonths !== false, cells };
  }
  function renderMiniCalendarMarkup(model, options = {}) {
    if (!model || !Array.isArray(model.cells) || !Array.isArray(model.headers)) return "";
    const s = options.style || {};
    const reference = s.preset === "reference-photo";
    const size=(v,d)=>Math.max(0,Math.min(100,Number(v) || d));
    const font=v=>escapeText(String(v||"inherit").replace(/[;{}]/g,""));
    const css = `font-family:${font(s.dateFontFamily||s.fontFamily)};--mini-number-size:${size(s.monthNumberSize,s.titleSize||11)}px;--mini-english-size:${size(s.monthEnglishSize,11)}px;--mini-title-gap:${size(s.titleGap,8)}px;--mini-row-gap:${size(s.rowGap,0)}px;--mini-date-weight:${size(s.dateWeight,30)*10};--mini-rule-width:${size(s.ruleWidth,1)}px;--mini-rule-gap:${size(s.ruleGap,8)}px;--mini-date-size:${Math.max(3,Math.min(36,Number(s.dateSize)||7))}px;--mini-title-align:${align(s.titleAlign || (options.sampleFamily === "desk-3" ? "left" : "center"))};--mini-title-size:${Math.max(5,Math.min(40,Number(s.titleSize)||11))}px;--mini-primary:${hex(s.primary,"#293878")};--mini-weekday:${hex(s.weekdayColor,"#7a8291")};--mini-date:${hex(s.dateColor,"#293878")};--mini-sunday:${hex(s.sunday,"#ef3340")};--mini-saturday:${hex(s.saturday,"#4777bd")};--mini-line:${hex(s.lineColor,"#d8dbe2")};`;
    const label = reference ? `<span style="font-family:${font(s.monthNumberFontFamily||s.fontFamily)};font-size:var(--mini-number-size)">${model.month}</span><small style="font-family:${font(s.monthEnglishFontFamily||s.fontFamily)};font-size:var(--mini-english-size);margin-left:8px">${["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"][model.month-1]}</small>` : s.titleStyle === "editorial-photo" ? `<span style="font-size:32px;line-height:1">${model.month}</span><small style="font-size:11px;margin-left:8px">${["January","February","March","April","May","June","July","August","September","October","November","December"][model.month-1]} · ${model.year}</small>` : options.monthLabelStyle === "number-en"
      ? `${model.month} <small>${["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"][model.month-1]}</small>`
      : escapeText(model.label);
    const holidays = new Set(Array.isArray(options.holidayDates) ? options.holidayDates : []);
    let inner = `<div class="widget-mini-calendar shared-screen-mini-calendar${reference ? " mini-reference-photo" : ""}${s.bottomRule ? " mini-bottom-rule" : ""}${s.gridLine ? " mini-grid-lines" : ""}" style="${css}"><strong${s.titleStyle === "editorial-photo"?' style="display:flex;align-items:baseline;justify-content:flex-start;border-bottom:1px dotted #9da7a5;padding-bottom:6px"':''}>${label}</strong><div class="mini-grid" style="--mini-calendar-rows:${model.rows};grid-template-rows:${model.showWeekdayHeader && !reference ? "auto " : ""}repeat(${model.rows},1fr)">`;
    if (model.showWeekdayHeader && !reference) model.headers.forEach(name => { inner += `<span class="mh">${escapeText(name)}</span>`; });
    model.cells.forEach(cell => { const classes = [cell.month !== model.month ? "adj" : "", cell.weekday === 0 ? "sun" : "", cell.weekday === 6 ? "sat" : "", holidays.has(cell.date) ? "holiday" : ""].filter(Boolean).join(" "); inner += `<span class="${classes}">${cell.month!==model.month&&model.showAdjacentMonths===false?"":cell.day}${cell.extra ? ` · ${cell.extra.day}` : ""}</span>`; });
    return inner + "</div></div>";
  }
  function renderCellMiniCalendarMarkup(model) {
    if (!model || !Array.isArray(model.cells) || model.cells.length !== model.rows * 7) return "";
    let html = `<div class="cell-mini-calendar"><strong>${model.month}</strong><div class="cell-mini-grid" style="--mini-calendar-rows:${model.rows}">`;
    for (let index = 0; index < model.cells.length; index += 7) {
      html += '<div class="cell-mini-week">';
      model.cells.slice(index, index + 7).forEach(cell => {
        const current = cell.month === model.month;
        const tone = !current ? "adj" : cell.weekday === 0 ? "sun-mini" : cell.weekday === 6 ? "sat-mini" : "";
        html += `<span class="${tone}${cell.extra ? " merged" : ""}">${current ? cell.day + (cell.extra ? "/" + cell.extra.day : "") : ""}</span>`;
      });
      html += "</div>";
    }
    return html + "</div></div>";
  }
  function resolveAnnualCalendar(element, page, defaults = {}) {
    let baseYear = Number(page?.calendarYear || defaults.year);
    let startMonth = Number(element?.startMonth || defaults.startMonth || 1);
    if(element?.academicPoster){const absolute=Number(defaults.startMonth||element.startMonth||1)-1+Number(element.posterMonthOffset||0);baseYear=Number(defaults.year||page?.calendarYear)+Math.floor(absolute/12);startMonth=((absolute%12)+12)%12+1;}
    if (!Number.isInteger(baseYear) || !Number.isInteger(startMonth) || startMonth < 1 || startMonth > 12) return null;
    const count = Math.max(1, Math.min(12, Number(element?.monthCount || 12)));
    const layout = ["open-grid","individual-month-boxes","vertical-three-month-groups","horizontal-four-month-groups"].includes(element?.layoutType) ? element.layoutType : "individual-month-boxes";
    const columns = Math.max(1, Math.min(6, Number(element?.columns || 4)));
    const groupSize = layout === "vertical-three-month-groups" ? 3 : layout === "horizontal-four-month-groups" ? 4 : 0;
    const months = Array.from({ length: count }, (_, index) => {
      const absolute = startMonth - 1 + index;
      const year = baseYear + Math.floor(absolute / 12), month = absolute % 12 + 1;
      const rowMode = element?.academicPoster&&root.ACDLWallCalendar?"6":String(element?.rowsMode || "inherit");
      const mini = resolveMiniCalendar({
        type: "mini-calendar", weekStart: element?.weekStart ?? defaults.weekStart,
        calendarRows: rowMode === "5" || rowMode === "6" ? Number(rowMode) : defaults.calendarRows,
        calendarRowsMode: rowMode === "6" ? "fixed" : rowMode === "adaptive" ? "adaptive" : defaults.calendarRowsMode,
        sampleFamily: rowMode === "adaptive" ? "desk-6" : defaults.sampleFamily,
      }, { calendarYear: year, calendarMonth: month }, { year, startMonth: month, ...defaults });
      const transition = element?.showTransitionYear !== false && year !== baseYear;
      const names = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
      const label = element?.monthLabelStyle === "number-en" ? month + " " + names[month - 1] + (transition ? " · " + year : "") : (transition ? year + " " : "") + month + "월";
      return { year, month, transition, label, rows: mini?.rows ?? 6, cells: mini?.cells ?? [], headers: (element?.sampleFamily ?? defaults.sampleFamily) === "desk-6" ? (mini?.headers ?? []).map(label => label[0]) : (mini?.headers ?? []) };
    });
    return { baseYear, startMonth, columns, layout, groupSize, showWeekdayHeader: element?.showWeekdayHeader !== false, months };
  }
  function posterDefaults(element){
    const two=Number(element.monthCount)===6;
    return {dateSize:two?13:10,titleSize:two?28:22,eventSize:two?6:5,listSize:two?7:6,referenceSize:two?5.5:4.5};
  }
  function normalizePosterElement(element){
    if(element?.academicPoster){element.label||='전체 월력';}
    if(!element?.academicPoster||element.posterPolicyVersion===2)return element;
    const d=posterDefaults(element);element.style||={};
    // Migrate the old shipped sizes once. Explicitly authored sizes remain intact.
    for(const [key,legacy,value] of [['dateSize',[15,18,21],d.dateSize],['titleSize',[22,24,27,30],d.titleSize]])if(element.style[key]==null||legacy.includes(Number(element.style[key])))element.style[key]=value;
    for(const [key,legacy,value] of [['posterEventSize',[6,7.5,8],d.eventSize],['posterListSize',[7.5,10.5],d.listSize]])if(element[key]==null||legacy.includes(Number(element[key])))element[key]=value;
    element.posterReferenceSize??=d.referenceSize;
    element.posterColorMode??='monthly';
    element.posterReferenceLayout??='inherit';
    element.posterPolicyVersion=2;return element;
  }
  function normalizePosterProject(project){
    if(project?.productType?.category!=='poster'||project.productionCorrection)return project;
    for(const items of [...Object.values(project.template?.masterElements||{}),...Object.values(project.book?.elementsByPage||{})])for(const item of Array.isArray(items)?items:[])normalizePosterElement(item);
    return project;
  }
  function posterPlacementKey(item){
    if(!item||item.academicPoster||item.role==='graphic-package-background'||item.type==='year-calendar'||/^(page-number|page-counter)$/.test(item.role||''))return '';
    const legacy=String(item.id||'').match(/^wall-b\.\d+\.(.+)$/);
    if(legacy?.[1]==='page'||legacy?.[1]==='background')return '';
    if(item.metadata?.correspondenceKey)return String(item.metadata.correspondenceKey);
    if(legacy&&item.type==='text')return 'wall-b.'+legacy[1];
    const binding=item.bindingEnabled===false?'':item.image?.binding||item.binding||'';
    if(item.role==='school-logo'||binding==='school.profile.logo')return 'logo';
    if(item.type==='text'&&(binding==='calendar.year'||Number(item.y)<=16&&binding.startsWith('school.')))return binding;
    if(item.type==='text'&&!binding&&/학사|달력|일정/.test(item.content||''))return 'heading:'+item.content;
    return '';
  }
  function posterCounterparts(project,pageId,item){
    const key=posterPlacementKey(item);if(project?.productType?.category!=='poster'||!key)return [];
    const result=[];
    for(const page of project.book.pageInstances||[]){if(page.id===pageId)continue;
      const local=project.book.elementsByPage?.[page.id]||[],shadowed=new Set(local.map(e=>e.shadowOfMasterElementId).filter(Boolean)),elements=[...(project.template?.masterElements?.[page.masterId]||[]).filter(e=>!shadowed.has(e.id)),...local];
      const matches=elements.filter(e=>e!==item&&posterPlacementKey(e)===key);
      if(matches.length===1)result.push({pageId:page.id,item:matches[0]});
    }return result;
  }
  function posterSharedValue(item,kind){return kind==='style'?{style:item.style||{},imageStyle:item.imageStyle,fit:item.fit,opacity:item.opacity}:Object.fromEntries(['x','y','width','height','rotation'].map(key=>[key,item[key]??(key==='rotation'?0:undefined)]));}
  function posterSharingState(project,pageId,item,kind){const value=JSON.stringify(posterSharedValue(item,kind)),matches=posterCounterparts(project,pageId,item);return {pages:matches.length,changed:matches.filter(other=>JSON.stringify(posterSharedValue(other.item,kind))!==value).length};}
  function applyPosterAppearance(project,pageId,item,{style=false,layout=false}={}){
    const matches=posterCounterparts(project,pageId,item),seen=new Set();let count=0;
    for(const target of matches){const other=target.item;if(seen.has(other))continue;seen.add(other);let changed=false;
      if(style&&JSON.stringify(posterSharedValue(other,'style'))!==JSON.stringify(posterSharedValue(item,'style'))){for(const [key,value] of Object.entries(posterSharedValue(item,'style'))){if(value===undefined)delete other[key];else other[key]=structuredClone(value);}changed=true;}
      if(layout&&JSON.stringify(posterSharedValue(other,'layout'))!==JSON.stringify(posterSharedValue(item,'layout'))){for(const key of ['x','y','width','height'])other[key]=item[key];if(item.rotation!==undefined)other.rotation=item.rotation;else delete other.rotation;changed=true;}
      if(changed)count++;
    }return count;
  }
  function applyPosterPlacement(project,pageId,item){return applyPosterAppearance(project,pageId,item,{layout:true});}
  function resolvePosterMonths(annual, element, project) {
    const options=root.ACDLWallCalendar?root.ACDLWallCalendar.resolve(element,project):project?.settings?.calendarData||{},book=project?.book||{},events=(book.events||[]).filter(e=>e.startDate&&e.title),categories=new Map((project?.template?.resources?.eventCategories||[]).map(c=>[c.id,c.color]));
    const references=[];
    for(const year of Object.values(book.calendarReference?.years||{}))for(const key of ['public_holiday','anniversary','solar_term','lunar'])for(const item of year[key]?.items||[])if(item.date&&item.name)references.push({id:'ref.'+key+'.'+item.date+'.'+item.name,startDate:item.date,endDate:item.date,title:item.name,category:key==='public_holiday'&&item.isHoliday!==false?'holiday':'reference',reference:true,referenceKind:key==='public_holiday'?(item.isHoliday===false?'anniversaries':'holidays'):{anniversary:'anniversaries',solar_term:'solarTerms',lunar:'lunars'}[key]});
    // Use exactly the existing calendar-reference records, including the basic calendar's lunar selection.
    const referenceKey=e=>e.startDate+'|'+String(e.title).replace(/\s/g,''),known=new Map(references.map(e=>[referenceKey(e),e])),kindOf=e=>e.referenceKind||(e.category==='holiday'?'holidays':e.reference?'anniversaries':'school'),flag={school:'includeSchoolEvents',holidays:'includeHolidays',anniversaries:'includeAnniversaries',solarTerms:'includeSolarTerms',lunars:'includeLunar'};
    const all=[],seen=new Set();for(const original of [...events,...references]){const e=original.endDate&&original.endDate!==original.startDate?original:{...original,...known.get(referenceKey(original))};if(options[flag[kindOf(e)]]===false)continue;const key=e.startDate+'|'+(e.endDate||e.startDate)+'|'+String(e.title).replace(/\s/g,'');if(seen.has(key))continue;seen.add(key);all.push({...e,endDate:e.endDate||e.startDate,color:hex(e.color||categories.get(e.category),'#dce9f0')})}
    return annual.months.map(month=>{
      const first=`${month.year}-${String(month.month).padStart(2,'0')}-01`,last=`${month.year}-${String(month.month).padStart(2,'0')}-${new Date(Date.UTC(month.year,month.month,0)).getUTCDate()}`,items=all.filter(e=>e.startDate<=last&&e.endDate>=first).sort((a,b)=>a.startDate.localeCompare(b.startDate)||a.title.localeCompare(b.title)),ranges=[];
      for(let row=0;row<month.rows;row++){const week=month.cells.slice(row*7,row*7+7),lanes=[];for(const event of items.filter(e=>e.endDate>e.startDate)){const columns=week.map((cell,index)=>cell.month===month.month&&cell.date>=event.startDate&&cell.date<=event.endDate?index:-1).filter(index=>index>=0);if(!columns.length)continue;const start=columns[0],end=columns.at(-1);let lane=lanes.findIndex(last=>last<start);if(lane<0)lane=lanes.length;lanes[lane]=end;ranges.push({...event,row,start,end,lane})}}
      const holidayDates=[...new Set([...(book.events||[]).filter(e=>e.category==='holiday').map(e=>e.startDate),...Object.values(book.calendarReference?.years||{}).flatMap(y=>(y.public_holiday?.items||[]).filter(e=>e.isHoliday!==false).map(e=>e.date))])];return {...month,items,ranges,holidayDates,days:month.cells.map(cell=>({...cell,events:cell.month===month.month?items.filter(e=>e.startDate===cell.date&&e.endDate===cell.date):[]}))};
    });
  }
  function renderPosterCalendarMarkup(annual,element,project){
    if(root.ACDLWallCalendar)return root.ACDLWallCalendar.render(annual,element,project);
    element=normalizePosterElement(structuredClone(element));
    const months=resolvePosterMonths(annual,element,project),s=element.style||{},unit=n=>(Number(n)/10)+'cqw',dateSize=Number(s.dateSize)||18,titleSize=Number(s.titleSize)||27,eventSize=Number(element.posterEventSize)||7.5,listSize=Number(element.posterListSize)||10.5,columns=annual.columns,colors=element.posterColors||['#e9bccb','#b3d3e5','#b9d6c2','#cfc2df'];
    const text=e=>escapeText(e.title),dateLabel=e=>{const a=e.startDate.slice(5).replace('-','/'),b=e.endDate.slice(5).replace('-','/');return a+(e.endDate>e.startDate?'–'+b:'')};
    return '<div class="academic-poster-grid" data-poster-months="'+months.length+'" style="width:100%;height:100%;display:grid;grid-template-columns:repeat('+columns+',minmax(0,1fr));grid-template-rows:repeat('+Math.ceil(months.length/columns)+',minmax(0,1fr));column-gap:'+unit(s.columnGap??20)+';row-gap:'+unit(s.rowGap??20)+';font-family:inherit">'+months.map((month,index)=>{
      const accent=hex((element.posterColorMode==='rows'?colors[Math.floor(index/columns)%colors.length]:element.posterMonthColors?.[String(month.month)]||colors[index%colors.length]),'#b3d3e5'),holidayDates=new Set(month.items.filter(e=>e.category==='holiday').map(e=>e.startDate)),tone=cell=>cell.weekday===0||holidayDates.has(cell.date)?hex(s.sunday,'#d92d20'):cell.weekday===6?hex(s.saturday,'#175cd3'):hex(s.dateColor,'#17202e');
      const referenceTone=e=>{
        if(!e.reference&&e.category!=='holiday')return '#344054';
        const weekday=new Date(e.startDate+'T00:00:00Z').getUTCDay(),kind=e.referenceKind||(e.category==='holiday'?'holidays':'anniversaries');
        return root.ACDLSharedCalendarAnnotations?.context({weekday,isHoliday:holidayDates.has(e.startDate),referenceColors:project?.template?.masters?.calendar?.calendarLayout?.referenceColors,colors:{color:hex(s.dateColor,'#17202e'),saturdayColor:hex(s.saturday,'#175cd3'),holidayColor:hex(s.sunday,'#d92d20')}}).colorFor(kind)||(kind==='holidays'?hex(s.sunday,'#d92d20'):tone({weekday,date:e.startDate}));
      };
      const header='<header style="background:'+accent+';border-radius:'+unit(5)+';padding:'+unit(3)+';text-align:center;font-weight:800;font-size:'+unit(titleSize)+';line-height:1.1;color:#17202e">'+(month.transition?'<small style="font-size:.6em">'+month.year+' </small>':'')+month.month+' <small style="font-size:.48em">'+['JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE','JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER'][month.month-1]+'</small></header>';
      const weekdays='<div style="display:grid;grid-template-columns:repeat(7,1fr);font-size:'+unit(10)+';text-align:center;font-weight:700;line-height:1.4;margin-top:'+unit(3)+'">'+month.headers.map((name,col)=>{const weekday=project?.settings?.weekStart==='monday'?(col+1)%7:col;return '<span style="color:'+(weekday===0?hex(s.sunday,'#d92d20'):weekday===6?hex(s.saturday,'#175cd3'):hex(s.dateColor,'#17202e'))+'">'+escapeText(name)+'</span>'}).join('')+'</div>';
      const annotations=root.ACDLSharedCalendarAnnotations,annotationBase=project?.template?.masters?.calendar?.calendarLayout?.annotations,layout=element.posterReferenceLayout==='inherit'?(annotations?.normalize(annotationBase)?.layout||'basic-1'):element.posterReferenceLayout,referenceSize=Number(element.posterReferenceSize)||posterDefaults(element).referenceSize;
      const dayMarkup=cell=>{
        const refs=cell.events.filter(e=>e.reference||e.category==='holiday'),normal=cell.events.filter(e=>!e.reference&&e.category!=='holiday'),primary=refs.filter(e=>['holidays','anniversaries'].includes(e.referenceKind||'holidays')),secondary=refs.filter(e=>!primary.includes(e));
        const side=layout==='basic-1'?secondary:layout==='basic-2'?primary:layout==='beside'?refs:[],bottom=layout==='basic-1'?primary:layout==='basic-2'?secondary:layout==='below'?refs:[];
        const block=list=>list.length?'<span style="min-width:0;font-weight:400;font-size:'+unit(referenceSize)+';line-height:1.2;overflow-wrap:anywhere">'+list.map(e=>'<span data-reference-kind="'+(e.referenceKind||'holidays')+'" style="color:'+referenceTone(e)+'">'+text(e)+'</span>').join(' · ')+'</span>':'';
        return '<div style="display:flex;align-items:flex-start;gap:'+unit(2)+';color:'+tone(cell)+'"><b style="flex:none;font-size:'+unit(dateSize)+';font-weight:700;line-height:1.15">'+cell.day+'</b>'+block(side)+'</div>'+block(bottom)+normal.map(e=>'<div style="font-size:'+unit(eventSize)+';line-height:1.2;overflow-wrap:anywhere;color:'+referenceTone(e)+'">'+text(e)+'</div>').join('');
      };
      const days=month.days.map((cell,i)=>{const lanes=month.ranges.filter(e=>e.row===Math.floor(i/7)).reduce((n,e)=>Math.max(n,e.lane+1),0);return '<div data-poster-date="'+cell.date+'" style="grid-column:'+(i%7+1)+';grid-row:'+(Math.floor(i/7)+1)+';min-width:0;min-height:0;border-top:1px solid '+accent+';'+(element.posterGridStyle==='boxed'?'border-right:1px solid '+accent+';':'')+'padding:'+unit(2)+' '+unit(1)+' '+unit(2+lanes*(eventSize*1.4+2))+';box-sizing:border-box;overflow:visible">'+(cell.month===month.month?dayMarkup(cell):'')+'</div>'}).join('');
      const ranges=month.ranges.map(e=>'<div data-poster-range="'+escapeText(e.id||e.title)+'" style="grid-column:'+(e.start+1)+' / span '+(e.end-e.start+1)+';grid-row:'+(e.row+1)+';align-self:end;z-index:2;margin-bottom:'+unit(e.lane*(eventSize*1.4+2))+';background:'+e.color+'33;border-bottom:2px solid '+e.color+';color:#17202e;text-align:center;font-size:'+unit(eventSize)+';line-height:1.1;overflow-wrap:anywhere">'+text(e)+'</div>').join('');
      const list=month.items.filter(e=>e.category!=='reference').map(e=>'<div data-poster-list-event="'+escapeText(e.id||e.title)+'" style="break-inside:avoid;margin-bottom:'+unit(1)+';overflow-wrap:anywhere"><b>'+dateLabel(e)+'</b> '+text(e)+'</div>').join('');
      return '<section class="academic-poster-month" data-poster-month="'+month.year+'-'+String(month.month).padStart(2,'0')+'" style="min-width:0;min-height:0;display:flex;flex-direction:column;border:1px solid '+accent+';border-radius:'+unit(7)+';padding:'+unit(4)+';box-sizing:border-box;background:#ffffff">'+header+weekdays+'<div style="position:relative;display:grid;grid-template-columns:repeat(7,minmax(0,1fr));grid-template-rows:repeat('+month.rows+',minmax(0,1fr));height:'+(element.posterShowList===false?'auto':'56%')+';flex:'+(element.posterShowList===false?'1':'none')+';min-height:0">'+days+ranges+'</div>'+(element.posterShowList===false?'':'<div class="academic-poster-month-list" style="flex:1;min-height:0;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));grid-auto-rows:max-content;align-content:start;column-gap:'+unit(8)+';border-top:1px solid '+accent+';padding-top:'+unit(4)+';margin-top:'+unit(3)+';font-size:'+unit(listSize)+';line-height:1.22;overflow:visible">'+list+'</div>')+'</section>';
    }).join('')+'</div>';
  }
  function renderAnnualCalendarMarkup(annual, element = {}, context = {}) {
    if(annual&&element.academicPoster===true)return renderPosterCalendarMarkup(annual,element,context.project);
    if (!annual) return "";
    const style=element.style||{},dateSize=Math.max(3,Math.min(36,Number(style.dateSize)||7)),titleSize=Math.max(5,Math.min(40,Number(style.titleSize)||10)),gridStyle=style.dayGridStyle||"none",line=hex(style.lineColor,"#d8dbe2"),holidayDates=new Set(element.holidayDates||[]),font=escapeText(String(style.fontFamily||"inherit").replace(/[;{}]/g,""));
    const unit=value=>Number(style.fontReferenceWidthPx)>0?(value/Number(style.fontReferenceWidthPx)*100)+"cqw":value+"px";
    const dateColor=hex(style.dateColor,"#293878"),sunday=hex(style.sunday,"#ef3340"),saturday=hex(style.saturday,"#4777bd");
    const day=(cell,mm)=>{
      if(element.showAdjacentMonths===false&&cell.month!==mm.month)return '<span></span>';
      const adjacent=cell.month!==mm.month,holiday=holidayDates.has(cell.date),color=adjacent?"#aeb5c2":holiday||cell.weekday===0?sunday:cell.weekday===6?saturday:dateColor;
      return '<span data-date="'+cell.date+'" style="color:'+color+'">'+cell.day+'</span>';
    };
    const open=annual.layout==='open-grid',renderMonth=mm=>{
      const label=element.monthLabelStyle==='number-en'&&Number(style.monthNumberSize)>0?'<span style="font-family:'+escapeText(String(style.monthNumberFontFamily||style.fontFamily||'inherit'))+';font-size:'+unit(Number(style.monthNumberSize))+'">'+mm.month+'</span><span style="font-size:'+unit(Number(style.monthEnglishSize)||titleSize)+'"> '+escapeText(mm.label.split(' ').slice(1).join(' '))+'</span>':escapeText(mm.label);
      const border=gridStyle==='boxes'?'1px solid '+line:'none',underline=gridStyle==='underline'?'1px solid '+line:'none';
      let html='<section class="year-month" data-month-key="'+mm.year+'-'+String(mm.month).padStart(2,'0')+'" style="min-height:0;display:flex;flex-direction:column;'+(open?'border:0;border-radius:0;background:transparent;overflow:visible;':'')+'"><strong style="'+(open?'background:transparent;padding:0 0 6px;':'')+'font-size:'+unit(titleSize)+';color:'+hex(style.primary,dateColor)+';text-align:'+align(style.titleAlign||'center')+'">'+label+'</strong><div class="year-month-grid" style="min-height:0;flex:1;display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:'+(gridStyle==='none'?'0':'2px')+';font-size:'+unit(dateSize)+';grid-template-rows:'+(annual.showWeekdayHeader?'auto ':'')+'repeat('+mm.rows+',1fr)">';
      if(annual.showWeekdayHeader)mm.headers.forEach((name,index)=>{const weekday=element.weekStart==='monday'?(index+1)%7:index;html+='<span class="mh" style="font-size:'+unit(dateSize)+';color:'+(weekday===0?sunday:weekday===6?saturday:hex(style.weekdayColor,dateColor))+'">'+escapeText(name)+'</span>';});
      mm.cells.forEach(cell=>html+='<span class="annual-day" style="display:flex;align-items:center;justify-content:center;min-width:0;border:'+border+';border-bottom:'+underline+'">'+day(cell,mm)+(cell.extra?' · '+day(cell.extra,mm):'')+'</span>');
      return html+'</div></section>';
    };
    const grouped=annual.groupSize,columns=grouped?annual.layout==='vertical-three-month-groups'?Math.ceil(annual.months.length/grouped):1:annual.columns;
    let inner='<div class="year-calendar-object annual-layout-'+annual.layout+'" style="height:100%;display:grid;min-height:0;'+(open?'padding:0;border:0;border-radius:0;background:transparent;':'')+'column-gap:'+unit(Math.max(0,Math.min(100,Number(style.columnGap??8))))+';row-gap:'+unit(Math.max(0,Math.min(100,Number(style.rowGap??8))))+';font-family:'+font+';grid-template-columns:repeat('+columns+',minmax(0,1fr));grid-template-rows:repeat('+(grouped?annual.layout==='vertical-three-month-groups'?1:Math.ceil(annual.months.length/grouped):Math.ceil(annual.months.length/columns))+',minmax(0,1fr))">';
    if(grouped)for(let index=0;index<annual.months.length;index+=grouped)inner+='<div class="year-calendar-group" style="display:grid;min-height:0;gap:6px;'+(annual.layout==='vertical-three-month-groups'?'grid-template-rows':'grid-template-columns')+':repeat('+grouped+',minmax(0,1fr))">'+annual.months.slice(index,index+grouped).map(renderMonth).join('')+'</div>';
    else inner+=annual.months.map(renderMonth).join('');
    return inner+'</div>';
  }
  root.ACDLSharedMiniCalendar = Object.freeze({version, resolveMiniCalendar, renderMiniCalendarMarkup, renderCellMiniCalendarMarkup, resolveAnnualCalendar, renderAnnualCalendarMarkup, resolvePosterMonths, renderPosterCalendarMarkup, normalizePosterElement, normalizePosterProject, posterDefaults, posterPlacementKey, posterCounterparts, posterSharingState, applyPosterAppearance, applyPosterPlacement});
})(globalThis);


