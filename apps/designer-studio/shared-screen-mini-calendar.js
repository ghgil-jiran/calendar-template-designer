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
    const adaptive = (element?.sampleFamily ?? defaults.sampleFamily) === "desk-6" && (element?.calendarRowsMode ?? defaults.calendarRowsMode) === "adaptive";
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
    return { year, month, rows, headers, label, showWeekdayHeader: element?.showWeekdayHeader !== false, cells };
  }
  function renderMiniCalendarMarkup(model, options = {}) {
    if (!model || !Array.isArray(model.cells) || !Array.isArray(model.headers)) return "";
    const s = options.style || {};
    const css = `--mini-title-align:${align(s.titleAlign || (options.sampleFamily === "desk-3" ? "left" : "center"))};--mini-title-size:${Math.max(5,Math.min(40,Number(s.titleSize)||11))}px;--mini-primary:${hex(s.primary,"#293878")};--mini-weekday:${hex(s.weekdayColor,"#7a8291")};--mini-date:${hex(s.dateColor,"#293878")};--mini-sunday:${hex(s.sunday,"#ef3340")};--mini-saturday:${hex(s.saturday,"#4777bd")};--mini-line:${hex(s.lineColor,"#d8dbe2")};`;
    const label = options.monthLabelStyle === "number-en"
      ? `${model.month} <small>${["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"][model.month-1]}</small>`
      : escapeText(model.label);
    const holidays = new Set(Array.isArray(options.holidayDates) ? options.holidayDates : []);
    let inner = `<div class="widget-mini-calendar shared-screen-mini-calendar${s.gridLine ? " mini-grid-lines" : ""}" style="${css}"><strong>${label}</strong><div class="mini-grid" style="--mini-calendar-rows:${model.rows};grid-template-rows:${model.showWeekdayHeader ? "auto " : ""}repeat(${model.rows},1fr)">`;
    if (model.showWeekdayHeader) model.headers.forEach(name => { inner += `<span class="mh">${escapeText(name)}</span>`; });
    model.cells.forEach(cell => { const classes = [cell.month !== model.month ? "adj" : "", cell.weekday === 0 ? "sun" : "", cell.weekday === 6 ? "sat" : "", holidays.has(cell.date) ? "holiday" : ""].filter(Boolean).join(" "); inner += `<span class="${classes}">${cell.day}${cell.extra ? ` · ${cell.extra.day}` : ""}</span>`; });
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
    const baseYear = Number(page?.calendarYear || defaults.year);
    const startMonth = Number(element?.startMonth || defaults.startMonth || 1);
    if (!Number.isInteger(baseYear) || !Number.isInteger(startMonth) || startMonth < 1 || startMonth > 12) return null;
    const count = Math.max(1, Math.min(12, Number(element?.monthCount || 12)));
    const layout = ["open-grid","individual-month-boxes","vertical-three-month-groups","horizontal-four-month-groups"].includes(element?.layoutType) ? element.layoutType : "individual-month-boxes";
    const columns = Math.max(1, Math.min(6, Number(element?.columns || 4)));
    const groupSize = layout === "vertical-three-month-groups" ? 3 : layout === "horizontal-four-month-groups" ? 4 : 0;
    const months = Array.from({ length: count }, (_, index) => {
      const absolute = startMonth - 1 + index;
      const year = baseYear + Math.floor(absolute / 12), month = absolute % 12 + 1;
      const rowMode = String(element?.rowsMode || "inherit");
      const mini = resolveMiniCalendar({
        type: "mini-calendar", weekStart: element?.weekStart ?? defaults.weekStart,
        calendarRows: rowMode === "5" || rowMode === "6" ? Number(rowMode) : defaults.calendarRows,
        calendarRowsMode: rowMode === "adaptive" ? "adaptive" : defaults.calendarRowsMode,
        sampleFamily: rowMode === "adaptive" ? "desk-6" : defaults.sampleFamily,
      }, { calendarYear: year, calendarMonth: month }, { year, startMonth: month, ...defaults });
      const transition = element?.showTransitionYear !== false && year !== baseYear;
      const names = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
      const label = element?.monthLabelStyle === "number-en" ? month + " " + names[month - 1] + (transition ? " · " + year : "") : (transition ? year + " " : "") + month + "월";
      return { year, month, transition, label, rows: mini?.rows ?? 6, cells: mini?.cells ?? [], headers: (element?.sampleFamily ?? defaults.sampleFamily) === "desk-6" ? (mini?.headers ?? []).map(label => label[0]) : (mini?.headers ?? []) };
    });
    return { baseYear, startMonth, columns, layout, groupSize, showWeekdayHeader: element?.showWeekdayHeader !== false, months };
  }
  function renderAnnualCalendarMarkup(annual, element = {}) {
    if (!annual) return "";
    const style=element.style||{},dateSize=Math.max(3,Math.min(36,Number(style.dateSize)||7)),titleSize=Math.max(5,Math.min(40,Number(style.titleSize)||10)),gridStyle=style.dayGridStyle||"none",line=hex(style.lineColor,"#d8dbe2"),holidayDates=new Set(element.holidayDates||[]),font=escapeText(String(style.fontFamily||"inherit").replace(/[;{}]/g,""));
    const dateColor=hex(style.dateColor,"#293878"),sunday=hex(style.sunday,"#ef3340"),saturday=hex(style.saturday,"#4777bd");
    const day=(cell,mm)=>{
      const adjacent=cell.month!==mm.month,holiday=holidayDates.has(cell.date),color=adjacent?"#aeb5c2":holiday||cell.weekday===0?sunday:cell.weekday===6?saturday:dateColor;
      return '<span data-date="'+cell.date+'" style="color:'+color+'">'+cell.day+'</span>';
    };
    const renderMonth=mm=>{
      const border=gridStyle==='boxes'?'1px solid '+line:'none',underline=gridStyle==='underline'?'1px solid '+line:'none';
      let html='<section class="year-month" data-month-key="'+mm.year+'-'+String(mm.month).padStart(2,'0')+'" style="min-height:0;display:flex;flex-direction:column"><strong style="font-size:'+titleSize+'px;color:'+hex(style.primary,dateColor)+';text-align:'+align(style.titleAlign||'center')+'">'+escapeText(mm.label)+'</strong><div class="year-month-grid" style="min-height:0;flex:1;display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:'+(gridStyle==='none'?'0':'2px')+';font-size:'+dateSize+'px;grid-template-rows:'+(annual.showWeekdayHeader?'auto ':'')+'repeat('+mm.rows+',1fr)">';
      if(annual.showWeekdayHeader)mm.headers.forEach((name,index)=>{const weekday=element.weekStart==='monday'?(index+1)%7:index;html+='<span class="mh" style="font-size:'+dateSize+'px;color:'+(weekday===0?sunday:weekday===6?saturday:hex(style.weekdayColor,dateColor))+'">'+escapeText(name)+'</span>';});
      mm.cells.forEach(cell=>html+='<span class="annual-day" style="display:flex;align-items:center;justify-content:center;min-width:0;border:'+border+';border-bottom:'+underline+'">'+day(cell,mm)+(cell.extra?' · '+day(cell.extra,mm):'')+'</span>');
      return html+'</div></section>';
    };
    const grouped=annual.groupSize,columns=grouped?annual.layout==='vertical-three-month-groups'?Math.ceil(annual.months.length/grouped):1:annual.columns;
    let inner='<div class="year-calendar-object annual-layout-'+annual.layout+'" style="height:100%;display:grid;min-height:0;gap:8px;font-family:'+font+';grid-template-columns:repeat('+columns+',minmax(0,1fr));grid-template-rows:repeat('+(grouped?annual.layout==='vertical-three-month-groups'?1:Math.ceil(annual.months.length/grouped):Math.ceil(annual.months.length/columns))+',minmax(0,1fr))">';
    if(grouped)for(let index=0;index<annual.months.length;index+=grouped)inner+='<div class="year-calendar-group" style="display:grid;min-height:0;gap:6px;'+(annual.layout==='vertical-three-month-groups'?'grid-template-rows':'grid-template-columns')+':repeat('+grouped+',minmax(0,1fr))">'+annual.months.slice(index,index+grouped).map(renderMonth).join('')+'</div>';
    else inner+=annual.months.map(renderMonth).join('');
    return inner+'</div>';
  }
  root.ACDLSharedMiniCalendar = Object.freeze({version, resolveMiniCalendar, renderMiniCalendarMarkup, renderCellMiniCalendarMarkup, resolveAnnualCalendar, renderAnnualCalendarMarkup});
})(globalThis);
