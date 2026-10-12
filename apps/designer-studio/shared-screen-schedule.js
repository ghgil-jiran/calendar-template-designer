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
      const entries=group.items.map(event=>{const start=String(event.startDate||'').slice(5).replace('-','.'),end=element?.showEndDate&&event.endDate&&event.endDate!==event.startDate?'–'+String(event.endDate).slice(5).replace('-','.') : '';return '<div class="academic-month-event" style="font-size:'+fontSize+'px;line-height:'+Math.max(.8,num(s.lineHeight,1.3))+';font-weight:'+Math.max(100,Math.min(900,num(s.fontWeight,400)))+';color:'+color(s.color,'#17202e')+'"><time style="color:inherit">'+escape(start+end)+'</time><span>'+escape(event.title??event.name)+'</span></div>';}).join('');
      const body='<div class="academic-month-events" style="min-height:0;flex:1;background:'+color(s.contentBackground,'transparent')+'">'+entries+'</div>';
      return '<section class="academic-month-card" style="'+monthCss+'">'+(s.titlePosition==='bottom'?body+title:title+body)+'</section>';
    });
    const groupSize=layout==='schedule-vertical-groups'?3:layout==='schedule-horizontal-groups'?4:0;
    const content=groupSize?Array.from({length:Math.ceil(months.length/groupSize)},(_,index)=>'<div class="academic-schedule-group">'+months.slice(index*groupSize,(index+1)*groupSize).join('')+'</div>').join(''):months.join('');
    const outer='height:100%;box-sizing:border-box;font-family:'+font+';border:'+Math.max(0,Math.min(8,num(s.containerBorderWidth,0)))+'px solid '+color(s.containerBorderColor,'#d8dbe2')+';background:'+color(s.containerBackground,'transparent')+';padding:4px';
    return '<div class="widget-event-list academic-year-schedule '+layout+'" data-event-fit="manual" style="'+outer+'"><div class="academic-year-grid">'+content+'</div></div>';
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
  root.ACDLSharedSchedule = Object.freeze({ version, resolveScheduleEvents, resolveYearScheduleEvents, renderYearScheduleMarkup });
})(globalThis);
