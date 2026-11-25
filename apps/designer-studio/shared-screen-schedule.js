/* Shared yearly schedule presentation for the designer and user service. */
(function (root) {
  "use strict";
  const version = "1.0.0-preview.1";
  const escape = value => String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
  function resolveYearScheduleEvents(inputEvents, element, baseYear) {
    const year = Number(baseYear);
    const startMonth = Number(element?.startMonth || 1);
    if (!Number.isInteger(year) || !Number.isInteger(startMonth) || startMonth < 1 || startMonth > 12) {
      throw new Error("Invalid yearly schedule year or start month");
    }
    const events = Array.isArray(inputEvents) ? inputEvents.filter(item => item && /^\d{4}-\d{2}-\d{2}$/.test(item.startDate || "")) : [];
    return { groups: Array.from({ length: 12 }, (_, offset) => {
      const from = new Date(Date.UTC(year, startMonth - 1 + offset, 1));
      const end = new Date(Date.UTC(year, startMonth + offset, 0));
      const first = from.toISOString().slice(0, 10), last = end.toISOString().slice(0, 10);
      return {
        year: from.getUTCFullYear(), month: from.getUTCMonth() + 1,
        items: events.filter(item => item.startDate <= last && (item.endDate || item.startDate) >= first)
          .sort((left, right) => left.startDate.localeCompare(right.startDate)),
      };
    }) };
  }
  function renderYearScheduleMarkup(schedule, element, baseYear) {
    const s=element?.style||{},color=(value,fallback)=>typeof value==='string'&&/^(#[0-9a-f]{3,8}|transparent)$/i.test(value)?value:fallback,num=(value,fallback)=>Number.isFinite(Number(value))?Number(value):fallback;
    const layout=["schedule-open-grid","schedule-month-cards","schedule-vertical-groups","schedule-horizontal-groups"].includes(element?.scheduleLayoutType)?element.scheduleLayoutType:"schedule-open-grid";
    const fontSize=Math.max(3,Math.min(72,num(s.fontSize??element?.fontSize,8))),titleSize=Math.max(3,Math.min(72,num(s.titleSize,10))),font=escape(String(s.fontFamily||'inherit').replace(/[;{}]/g,'')),align=['left','center','right'].includes(s.titleAlign)?s.titleAlign:'left';
    const titleCss='font-size:'+titleSize+'px;color:'+color(s.titleColor,color(s.color,'#17202e'))+';justify-content:'+(align==='center'?'center':align==='right'?'flex-end':'flex-start')+';text-align:'+align+';background:'+color(s.titleBackground,'transparent')+';padding:4px';
    const monthCss='min-height:0;overflow:hidden;border:'+Math.max(0,Math.min(8,num(s.monthBorderWidth,layout==='schedule-open-grid'?0:1)))+'px solid '+color(s.lineColor,'#d8dbe2')+';background:'+color(s.monthBackground,'transparent')+';display:flex;flex-direction:column;';
    const months=(schedule?.groups||[]).map(group=>{
      const transition=group.year!==Number(baseYear)?' <small>'+escape(group.year)+'</small>':'';
      const title='<h5 style="'+titleCss+'">'+escape(group.month)+'월'+transition+'</h5>';
      const entries=group.items.map(event=>{const start=String(event.startDate||'').slice(5).replace('-','.'),end=element?.showEndDate&&event.endDate&&event.endDate!==event.startDate?'–'+String(event.endDate).slice(5).replace('-','.') : '';return '<div class="academic-month-event" style="font-size:'+fontSize+'px;line-height:'+Math.max(.8,Math.min(4,num(s.lineHeight,1.3)))+';font-weight:'+Math.max(100,Math.min(900,num(s.fontWeight,400)))+';color:'+color(s.color,'#17202e')+'"><time style="color:inherit;font-weight:inherit">'+escape(start+end)+'</time><span>'+escape(event.title??event.name)+'</span></div>';}).join('');
      const body='<div class="academic-month-events" style="min-height:0;flex:1;background:'+color(s.contentBackground,'transparent')+'">'+entries+'</div>';
      return '<section class="academic-month-card" style="'+monthCss+'">'+(s.titlePosition==='bottom'?body+title:title+body)+'</section>';
    });
    const groupSize=layout==='schedule-vertical-groups'?3:layout==='schedule-horizontal-groups'?4:0;
    const content=groupSize?Array.from({length:Math.ceil(months.length/groupSize)},(_,index)=>'<div class="academic-schedule-group">'+months.slice(index*groupSize,(index+1)*groupSize).join('')+'</div>').join(''):months.join('');
    const outer='height:100%;box-sizing:border-box;font-family:'+font+';border:'+Math.max(0,Math.min(8,num(s.containerBorderWidth,0)))+'px solid '+color(s.containerBorderColor,'#d8dbe2')+';border-radius:'+Math.max(0,Math.min(40,num(s.containerBorderRadius,0)))+'px;overflow:hidden'+';background:'+color(s.containerBackground,'transparent')+';padding:4px';
    return '<div class="widget-event-list academic-year-schedule '+layout+'" data-event-fit="manual" style="'+outer+'"><div class="academic-year-grid">'+content+'</div></div>';
  }
  function renderScheduleMarkup(schedule, element, page = {}) {
    const s = element?.style || {}, monthly = element?.type === 'monthly-schedule';
    const num = (value, fallback) => Number.isFinite(Number(value)) ? Number(value) : fallback;
    const color = (value, fallback) => typeof value === 'string' && /^(#[0-9a-f]{3,8}|transparent)$/i.test(value) ? value : fallback;
    const scale = Math.max(.62, Math.min(1.35, Math.min(Number(element?.width || 35)/35, Number(element?.height || 28)/28)));
    const fontSize = Math.max(3, Math.min(72, num(s.fontSize ?? element?.fontSize, monthly ? 9*scale : 8)));
    const minSize = Math.max(3, Math.min(fontSize, num(element?.minFontSize, 6)));
    const columns = element?.columns === 'auto' ? 'auto' : Math.max(1, Math.min(4, num(element?.columns, 1)));
    const font = escape(String(s.fontFamily || 'inherit').replace(/[;{}]/g, ''));
    const align = ['left','center','right'].includes(s.titleAlign) ? s.titleAlign : 'left';
    const automaticTitle = schedule?.mode === 'month' && !monthly && (element?.titleMode === 'auto' || element?.titleMode !== 'custom' && (element?.titleTemplate || /^\d+월 학사일정$/.test(element?.title || '')));
    const title = automaticTitle ? (page.calendarMonth || schedule.groups?.[0]?.month || '')+'월 학사일정' : element?.title || (monthly ? '이달의 일정' : schedule?.mode === 'month' ? (page.calendarMonth || schedule.groups?.[0]?.month || '')+'월 학사일정' : '전체 학사일정');
    const titleCss = 'font-size:'+Math.max(3,Math.min(72,num(s.titleSize,monthly ? 12*scale : 10)))+'px;color:'+color(s.titleColor,color(s.color,'#17202e'))+';text-align:'+align+';background:'+color(s.titleBackground,'transparent');
    const textCss = 'font-size:'+(monthly?fontSize+'px':'var(--event-list-font-size,'+fontSize+'px)')+';color:'+color(s.color,'#17202e')+';font-weight:'+Math.max(100,Math.min(900,num(s.fontWeight,400)))+';line-height:'+Math.max(.8,Math.min(4,num(s.lineHeight,1.3)));
    const entries = (schedule?.items || []).map(event => {
      const start = monthly ? String(event.startDate || '').slice(8)+'일' : String(event.startDate || '').slice(5).replace('-','.');
      const end = element?.showEndDate && event.endDate && event.endDate !== event.startDate ? '–'+String(event.endDate).slice(5).replace('-','.') : '';
      return '<div class="'+(monthly?'schedule-item':'annual-event-item')+'" style="'+textCss+'"><time style="color:inherit;font-weight:inherit">'+escape(start+end)+'</time><span>'+escape(event.title ?? event.name)+'</span></div>';
    }).join('') || (element?.emptyStatePresentation === 'blank' ? '' : '<div class="annual-event-empty" style="'+textCss+'">등록된 일정이 없습니다.</div>');
    const body = '<div class="'+(monthly?'schedule-items':'annual-event-items')+'" style="--event-list-columns:'+(columns==='auto'?1:columns)+';--event-list-row-count:'+Math.max(1,Math.ceil((schedule?.items?.length||0)/(columns==='auto'?1:columns)))+';--event-list-font-size:'+fontSize+'px;min-height:0;flex:1;background:'+color(s.contentBackground,'transparent')+'">'+entries+'</div>';
    const heading = '<strong style="'+titleCss+'">'+escape(title)+'</strong>';
    const outer = 'height:100%;box-sizing:border-box;display:flex;flex-direction:column;font-family:'+font+';background:'+color(s.containerBackground,'transparent')+';border:'+Math.max(0,Math.min(8,num(s.containerBorderWidth,0)))+'px solid '+color(s.containerBorderColor,'#d8dbe2')+';border-radius:'+Math.max(0,Math.min(40,num(s.containerBorderRadius,0)))+'px;overflow:hidden'+';--schedule-font-size:'+fontSize+'px;--schedule-line-height:'+Math.max(.8,Math.min(4,num(s.lineHeight,1.3)))+';--schedule-pad:'+(7*scale).toFixed(1)+'px;--schedule-date-width:'+(26*scale).toFixed(1)+'px;--schedule-gap:'+(4*scale).toFixed(1)+'px;--schedule-item-gap:'+(4*scale).toFixed(1)+'px';
    return '<div class="'+(monthly?'widget-schedule':'widget-event-list'+(schedule?.mode==='month'?' is-current-month-schedule':'')+(!schedule?.items?.length&&element?.emptyStatePresentation==='quiet-guide'?' is-empty-quiet-guide':''))+'" data-event-fit="'+(element?.autoShrink===false?'manual':'auto')+'" data-event-columns="'+columns+'" data-event-width="'+num(element?.width,20)+'" data-event-height="'+num(element?.height,40)+'" data-event-font-size="'+fontSize+'" data-event-min-font-size="'+minSize+'" style="'+outer+'">'+(s.titlePosition==='bottom'?body+heading:heading+body)+(monthly?'':'<div class="event-list-overflow-warning" aria-hidden="true"></div>')+'</div>';
  }
  function fitEventList(widget) {
    const list=widget?.querySelector('.annual-event-items');if(!list)return null;
    const count=list.querySelectorAll('.annual-event-item').length,requested=widget.dataset.eventColumns||'1';
    let cols=requested==='auto'?Math.max(1,Math.min(4,Math.ceil(count/Math.max(8,Math.floor(Number(widget.dataset.eventHeight||40)/3.2))))):Math.max(1,Math.min(4,Number(requested)||1));
    if(requested==='auto'&&Number(widget.dataset.eventWidth||20)<32)cols=Math.min(cols,2);
    let font=Math.max(3,Number(widget.dataset.eventFontSize||8)),minFont=Math.max(3,Math.min(font,Number(widget.dataset.eventMinFontSize||6)));
    const layout=()=>{list.style.setProperty('--event-list-columns',String(cols));list.style.setProperty('--event-list-row-count',String(Math.max(1,Math.ceil(count/cols))));list.style.setProperty('--event-list-font-size',font+'px')};
    layout();
    if(requested==='auto')while(list.scrollHeight>list.clientHeight+1&&cols<4){cols++;layout()}
    if(widget.dataset.eventFit==='auto')while(list.scrollHeight>list.clientHeight+1&&font>minFont){font=Math.max(minFont,font-.5);layout()}
    const overflow=list.scrollHeight>list.clientHeight+1||list.scrollWidth>list.clientWidth+1;
    widget.classList.toggle('has-event-overflow',overflow);
    const warning=widget.querySelector('.event-list-overflow-warning');if(warning)warning.textContent=overflow?'전체 '+count+'건 · 영역 초과':'';
    widget.dataset.resolvedColumns=String(cols);widget.dataset.resolvedFontSize=String(font);
    return {columns:cols,fontSize:font,overflow};
  }
  function resolveScheduleEvents(inputEvents, element, page, defaults = {}) {
    const events = Array.isArray(inputEvents) ? inputEvents.filter(item => item && /^\d{4}-\d{2}-\d{2}$/.test(item.startDate || "")) : [];
    const type = element?.type === "monthly-schedule" ? "monthly-schedule" : "event-list";
    const mode = type === "monthly-schedule" ? "month" : element?.displayMode || "limit";
    const year = Number(mode === "month" ? page?.calendarYear || defaults.year : defaults.year || page?.calendarYear);
    const startMonth = Number(mode === "month" ? page?.calendarMonth || defaults.startMonth || 1 : element?.startMonth || defaults.startMonth || 1);
    if (!Number.isInteger(year) || !Number.isInteger(startMonth) || startMonth < 1 || startMonth > 12) return { mode, groups: [], items: [] };
    const count = mode === "month" ? 1 : mode === "year-by-month" ? 12 : Math.max(1, Math.min(12, Number(element?.monthCount || 12)));
    const group = offset => {
      const from = new Date(Date.UTC(year, startMonth - 1 + offset, 1));
      const end = new Date(Date.UTC(year, startMonth + offset, 0));
      const first = from.toISOString().slice(0, 10), last = end.toISOString().slice(0, 10);
      const monthYear = from.getUTCFullYear(), month = from.getUTCMonth() + 1;
      const matches = events.filter(item => item.startDate <= last && (item.endDate || item.startDate) >= first)
        .sort((left, right) => left.startDate.localeCompare(right.startDate));
      return { year: monthYear, month, key: monthYear + "-" + String(month).padStart(2, "0"), items: matches };
    };
    const groups = Array.from({ length: count }, (_, index) => group(index));
    if (type === "monthly-schedule") {
      const items = groups[0].items.slice(0, Number(element?.maxItems || 10));
      return { mode, groups: [{ ...groups[0], items }], items };
    }
    const first = groups[0].key + "-01", lastGroup = groups[groups.length - 1];
    const last = new Date(Date.UTC(lastGroup.year, lastGroup.month, 0)).toISOString().slice(0, 10);
    const all = events.filter(item => item.startDate <= last && (item.endDate || item.startDate) >= first)
      .sort((left, right) => left.startDate.localeCompare(right.startDate));
    const items = mode === "all" || mode === "year-by-month" ? all : all.slice(0, Number(element?.maxItems || 24));
    return { mode, groups, items };
  }
  const displayModes=Object.freeze(['bar','text','line']);
  function displayStyle(mode,current={}) {
    if(!displayModes.includes(mode))throw Error('일정 표시 스타일을 확인해 주세요.');
    return {...current,displayMode:mode,enabled:true,labelPosition:mode==='line'?'above':'inside',barHeight:14,laneGap:2,lineThickness:2};
  }
  function fitDisplayLanes(layout,style,grid,cellHeight){
    if(!['text','line'].includes(style.displayMode))return layout;
    const gap=Math.max(0,Number(style.laneGap)||0),cap=Math.max(1,Math.min(4,Math.floor((cellHeight-32+gap)/(14+gap)))),hiddenByDate={...layout.hiddenByDate};
    const segments=(layout.segments||[]).filter(seg=>{if(seg.lane<cap)return true;for(let col=seg.startCol;col<seg.startCol+seg.span;col++){const date=grid[seg.row*7+col]?.date;if(date)hiddenByDate[date]=(hiddenByDate[date]||0)+1;}return false;});
    return {...layout,segments,hiddenByDate:style.overflowStyle==='hide'?{}:hiddenByDate,maxLanes:Math.min(cap,Math.max(1,...segments.map(s=>s.lane+1)))};
  }
  function physicalFontPx(style,pageWidth,widthMm){const pt=Number(style?.fontSizePt);return pt>0&&pageWidth>0&&widthMm>0?pt*25.4/72*pageWidth/widthMm:0;}
  function fitPhysicalLanes(layout,style,grid,cellHeight,pageWidth,widthMm){
    const fontPx=physicalFontPx(style,pageWidth,widthMm);if(!fontPx)return layout;
    const gap=Math.max(0,Number(style.laneGap)||0),height=Math.max(Number(style.barHeight)||14,Math.ceil(fontPx*1.5)+4),cap=Math.max(0,Math.min(4,Math.floor((cellHeight-32+gap)/(height+gap)))),hiddenByDate={...layout.hiddenByDate};
    const segments=(layout.segments||[]).filter(seg=>{if(seg.lane<cap)return true;for(let col=seg.startCol;col<seg.startCol+seg.span;col++){const date=grid[seg.row*7+col]?.date;if(date)hiddenByDate[date]=(hiddenByDate[date]||0)+1;}return false;});
    return {...layout,segments,hiddenByDate,maxLanes:Math.max(1,...segments.map(s=>s.lane+1))};
  }
  function displaySegment(style,{label,color,height,fontPx,maxLines=2}) {
    if(!['text','line'].includes(style.displayMode))return null;
    const line=style.displayMode==='line'?1:0,gap=line?1:0;
    const safeFont=Math.min(fontPx,Math.max(1,(height-line-gap)/1.5));
    const lineHeight=Math.min(height-line-gap,Math.ceil(safeFont*1.5));
    const css='position:absolute;left:2px;right:2px;top:0;height:'+lineHeight+'px;overflow:hidden;white-space:nowrap;display:block;line-height:'+lineHeight+'px;text-overflow:ellipsis;text-align:left;color:'+color+';font-size:'+safeFont+'px';
    return '<span style="'+css+'">'+escape(label)+'</span>'+(line?'<i aria-hidden="true" style="position:absolute;left:2px;right:2px;top:'+(lineHeight+gap)+'px;height:1px;background:'+color+'"></i>':'');
  }

  function monthSchedule(layout, style = {}, singleLimit = 4) {
    if (style.enabled === false) return {segments: [], hiddenByDate: {}};
    const firstRows = new Map(), singles = new Map();
    const hiddenByDate = {...layout.hiddenByDate};
    const limit = Math.max(1, Math.min(4, Number(singleLimit) || 4));
    for (const seg of layout.segments || []) firstRows.set(seg.eventId, Math.min(firstRows.get(seg.eventId) ?? Infinity, seg.row));
    const segments = (layout.segments || []).filter(seg => {
      if (seg.startDate !== seg.endDate) return true;
      const count = (singles.get(seg.startDate) || 0) + 1;
      singles.set(seg.startDate, count);
      if (count <= limit) return true;
      hiddenByDate[seg.startDate] = (hiddenByDate[seg.startDate] || 0) + 1;
      return false;
    }).map(seg => {
      const first = seg.row === firstRows.get(seg.eventId);
      const label = style.labelMode === 'none' || style.labelMode === 'first' && !first ? ''
        : style.labelMode === 'continued' && !first ? seg.title + ' · 계속' : seg.title;
      return {...seg, label};
    });
    return {segments, hiddenByDate: style.overflowStyle === 'hide' ? {} : hiddenByDate};
  }
  function deskScheduleDefaults(events=[],pages=[]){
    const counts=new Map(), months=new Set(pages.filter(p=>p.role==='monthly-front'&&p.calendarYear&&p.calendarMonth)
      .map(p=>p.calendarYear+'-'+String(p.calendarMonth).padStart(2,'0')));
    if(!months.size)return {};
    for(const month of months){
      const first=new Date(month+'-01T00:00:00Z');
      for(const date=new Date(first);date.getUTCMonth()===first.getUTCMonth();date.setUTCDate(date.getUTCDate()+1)){
        const key=date.toISOString().slice(0,10);
        const count=events.filter(event=>event.startDate<=key&&(event.endDate||event.startDate)>=key).length;
        counts.set(key,count);
      }
    }
    const peak=Math.min(5,Math.max(0,...counts.values()));
    if(!peak)return {};
    const [fontSizePt,barHeight]=[[9,13],[9,13],[9,13],[8,11],[7,10]][peak-1];
    return {fontSizePt,barHeight};
  }

  function deskScheduleMetrics(style,fontPx){
    const minimum=Math.ceil(fontPx*1.1)+(style.displayMode==='text'?0:2);
    return {minimum,height:Math.max(minimum,Number(style.barHeight)||minimum)};
  }

  function deskTextEventsForDate(events,date,rangeEachDay){
    if(rangeEachDay)return events.filter(event=>event.startDate<=date&&(event.endDate||event.startDate)>=date);
    return events.filter(event=>event.startDate===date).map(event=>{
      const end=event.endDate;
      if(!end||end<=date)return event;
      const [year,month,day]=date.split('-').map(Number);
      const [endYear,endMonth,endDay]=end.split('-').map(Number);
      const startLabel=year===endYear?month+'/'+day:year+'/'+month+'/'+day;
      const endLabel=year!==endYear?endYear+'/'+endMonth+'/'+endDay:month!==endMonth?endMonth+'/'+endDay:endDay;
      return {...event,title:event.title+' ('+startLabel+' - '+endLabel+')'};
    });
  }

  const vacationBackground = '#e6f0fb';
  const vacationColor = value => typeof value === 'string' && /^#[a-f0-9]{6}$/i.test(value) ? value : vacationBackground;
  function isVacationRange(event) {
    return !event.reference && event.category !== 'holiday' &&
      /^(?:(?:여름|겨울|봄|가을|학년말)\s*)?방학(?:\s*[(（].*[)）])?$/.test(String(event.title || '').trim()) &&
      /^\d{4}-\d{2}-\d{2}$/.test(event.startDate) && /^\d{4}-\d{2}-\d{2}$/.test(event.endDate) &&
      event.endDate > event.startDate;
  }

  function vacationOnDate(events, date) {
    const active = events.filter(event => event.startDate <= date && event.endDate >= date);
    const shortDate = value => Number(value.slice(5,7)) + '/' + Number(value.slice(8,10));
    const labels = active.filter(event => event.startDate === date || date.endsWith('-01'))
      .map(event => '방학(' + shortDate(event.startDate) + ' - ' + shortDate(event.endDate) + ')');
    return {active: active.length > 0, labels: [...new Set(labels)]};
  }

  function fitDeskCalendar(page,style,events,fontPx,fontFamily){
    const layer=page.querySelector('.range-event-layer');
    if(!layer||!layer.offsetHeight)return;
    const bounds=layer.getBoundingClientRect();
    const sx=bounds.width/layer.offsetWidth||1,sy=bounds.height/layer.offsetHeight||1;
    const bottomInset=2;
    const laneGap=1.5;
    const cells=[...page.querySelectorAll('.calendar > .cell:not(.head)')];
    const byDate=new Map();
    const rows=new Map();
    cells.forEach((cell,index)=>{
      const box=cell.getBoundingClientRect();
      const blocks=[...cell.querySelectorAll('.day-block[data-date]')];
      blocks.forEach((block,part)=>{
        if(!block.children.length)return;
        const start=block.getBoundingClientRect().top;
        const dateLine=block.querySelector('.ann-heading, .day-head-row');
        const belowDate=[...block.querySelectorAll('.ann-bottom, .calendar-reference.special, .calendar-vacation-label')];
        const dateBottom=dateLine?.getBoundingClientRect().bottom??start;
        const headerBottom=Math.max(dateBottom,...belowDate.map(node=>node.getBoundingClientRect().bottom));
        const headerGap=belowDate.length?1.5:2;
        const limit=part+1<blocks.length?block.nextElementSibling.getBoundingClientRect().top:box.bottom;
        const row=Math.floor(index/7);
        const area={date:block.dataset.date,x:(box.left-bounds.left)/sx+2,width:box.width/sx-4,
          top:(headerBottom-bounds.top)/sy+headerGap,bottom:(limit-bounds.top)/sy-bottomInset,row,column:index%7};
        byDate.set(area.date,area);
        if(!rows.has(row))rows.set(row,[]);
        rows.get(row).push(area);
      });
    });
    const {minimum,height}=deskScheduleMetrics(style,fontPx);
    const markerHeight=8;
    const addBox=(area,top,className)=>{
      const node=layer.ownerDocument.createElement('div');
      node.className=className;
      Object.assign(node.style,{position:'absolute',left:area.x+'px',top:top+'px',width:Math.max(0,area.width)+'px',boxSizing:'border-box'});
      layer.append(node);
      return node;
    };
    const mark=(area,count)=>{
      if(!count||style.overflowStyle==='hide'||area.bottom-area.top<markerHeight)return;
      const marker=addBox(area,Math.max(area.top,area.bottom-markerHeight),'desk-schedule-overflow');
      marker.textContent='+'+count;
      marker.title='표시하지 못한 일정 '+count+'건';
      Object.assign(marker.style,{height:markerHeight+'px',lineHeight:markerHeight+'px',fontSize:'7px',fontWeight:'700',color:'#526071',textAlign:'right'});
    };
    if(style.displayMode==='text'){
      const sorted=[...events].sort((a,b)=>a.startDate.localeCompare(b.startDate));
      for(const area of byDate.values()){
        const active=deskTextEventsForDate(sorted,area.date,style.rangeEachDay);
        if(!active.length)continue;
        const node=addBox(area,area.top,'desk-schedule-text');
        const available=Math.max(0,Math.floor(area.bottom-area.top));
        const lineHeight=style.joinText?height:Math.max(minimum,Math.min(height,Math.floor(available/Math.min(5,active.length))));
        Object.assign(node.style,{overflow:'hidden',fontFamily,fontSize:fontPx+'px',lineHeight:lineHeight+'px',maxHeight:available+'px',overflowWrap:'anywhere'});
        const fill=budget=>{
          node.replaceChildren();
          let shown=0;
          for(const event of active){
            if(!style.joinText&&shown===5)break;
            const label=layer.ownerDocument.createElement('span');
            label.textContent=(style.joinText&&shown?' / ':'')+(style.bullet?'• ':'')+event.title;
            if(!style.joinText)Object.assign(label.style,{display:'block',overflow:'hidden',whiteSpace:'nowrap',textOverflow:'ellipsis'});
            if(event.color)label.style.color=event.color;
            node.append(label);
            if(node.scrollHeight>budget){label.remove();break;}
            shown++;
          }
          return shown;
        };
        let shown=fill(available);
        if(shown<active.length&&style.overflowStyle!=='hide')shown=fill(Math.max(0,available-markerHeight));
        if(shown){
          const markerSpace=shown<active.length&&style.overflowStyle!=='hide'?markerHeight:0;
          node.style.top=Math.max(area.top,area.bottom-markerSpace-node.scrollHeight)+'px';
        }else node.remove();
        mark(area,active.length-shown);
      }
      return;
    }
    const hidden=JSON.parse(layer.dataset.hiddenSchedule||'{}');
    const bars=[...layer.querySelectorAll('[data-desk-lane]')];
    for(const [row,areas] of rows){
      const top=Math.max(...areas.map(area=>area.top));
      const bottom=Math.min(...areas.map(area=>area.bottom));
      const gap=laneGap;
      const rowBars=bars.filter(bar=>Number(bar.dataset.deskRow)===row);
      const lanes=Math.max(0,...rowBars.map(bar=>Number(bar.dataset.deskLane)+1));
      const available=Math.max(0,bottom-top);
      const withMarker=style.overflowStyle!=='hide'&&(areas.some(area=>hidden[area.date])||lanes*minimum+Math.max(0,lanes-1)*gap>available);
      const space=Math.max(0,available-(withMarker?markerHeight:0));
      const limit=Math.min(lanes,Math.floor((space+gap)/(minimum+gap)));
      const laneHeight=Math.min(height,Math.floor((space+gap)/Math.max(1,limit))-gap);
      for(const bar of rowBars){
        const lane=Number(bar.dataset.deskLane);
        if(lane>=limit){
          for(const area of areas)if(area.column>=Number(bar.dataset.deskStart)&&area.column<=Number(bar.dataset.deskEnd))
            hidden[area.date]=(hidden[area.date]||0)+1;
          bar.remove();
          continue;
        }
        // Lane zero remains nearest the bottom, as in the original desk layout.
        bar.style.top=bottom-(withMarker?markerHeight:0)-(lane+1)*laneHeight-lane*gap+'px';
        bar.style.height=laneHeight+'px';
        const label=bar.querySelector('span');
        if(style.displayMode==='line'&&label){
          label.style.fontSize=fontPx+'px';
          label.style.lineHeight=Math.max(0,laneHeight-1)+'px';
          label.style.height=Math.max(0,laneHeight-1)+'px';
          bar.querySelector('i')?.style.setProperty('top',laneHeight-1+'px');
        }
      }
    }
    for(const area of byDate.values())mark(area,hidden[area.date]||0);
  }
  root.ACDLSharedSchedule = Object.freeze({ version, isVacationRange, vacationOnDate, vacationBackground, vacationColor, deskScheduleDefaults, deskScheduleMetrics, deskTextEventsForDate, fitDeskCalendar, physicalFontPx, fitPhysicalLanes, displayModes, displayStyle, fitDisplayLanes, displaySegment, monthSchedule, resolveScheduleEvents, resolveYearScheduleEvents, renderYearScheduleMarkup, renderScheduleMarkup, fitEventList });
})(globalThis);

