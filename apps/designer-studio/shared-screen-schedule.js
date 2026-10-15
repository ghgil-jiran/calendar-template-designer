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
    const outer='height:100%;box-sizing:border-box;font-family:'+font+';border:'+Math.max(0,Math.min(8,num(s.containerBorderWidth,0)))+'px solid '+color(s.containerBorderColor,'#d8dbe2')+';background:'+color(s.containerBackground,'transparent')+';padding:4px';
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
    const outer = 'height:100%;box-sizing:border-box;display:flex;flex-direction:column;font-family:'+font+';background:'+color(s.containerBackground,'transparent')+';border:'+Math.max(0,Math.min(8,num(s.containerBorderWidth,0)))+'px solid '+color(s.containerBorderColor,'#d8dbe2')+';--schedule-font-size:'+fontSize+'px;--schedule-line-height:'+Math.max(.8,Math.min(4,num(s.lineHeight,1.3)))+';--schedule-pad:'+(7*scale).toFixed(1)+'px;--schedule-date-width:'+(26*scale).toFixed(1)+'px;--schedule-gap:'+(4*scale).toFixed(1)+'px;--schedule-item-gap:'+(4*scale).toFixed(1)+'px';
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
  root.ACDLSharedSchedule = Object.freeze({ version, monthSchedule, resolveScheduleEvents, resolveYearScheduleEvents, renderYearScheduleMarkup, renderScheduleMarkup, fitEventList });
})(globalThis);
