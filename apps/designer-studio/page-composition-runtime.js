(function (root) {
  "use strict";
  const alias = type => ({ frame: "image-frame", "monthly-calendar": "calendar", "school-object": "semantic-object" })[type] || type;
  function isMonthBackCompositionElement(element) {
    return element?.role === "ai-month-back-component"
      || Boolean(element?.aiDesignComponent)
      || ["image-frame", "mini-calendar", "mini-calendar-prev", "mini-calendar-next", "month-date-strip", "memo"].includes(alias(element?.type))
      || ["monthly-goal", "monthly-todo", "weekly-planner"].includes(element?.role);
  }
  function isInheritedDesignDecoration(element) {
    return element?.role === "background-decoration"
      || element?.role === "ai-design-background"
      || Boolean(element?.backgroundPresetId);
  }
  function visibleElements(page, masterElements = [], localElements = []) {
    const shadowed = new Set(localElements.map(element => element.shadowOfMasterElementId).filter(Boolean));
    return [
      ...masterElements.filter(element =>
        !shadowed.has(element.id)
        && (page.aiDesignBase?.mode !== "neutral" || !isInheritedDesignDecoration(element))
        && (page.aiMonthBackComposition?.mode !== "generated-layout" || !isMonthBackCompositionElement(element))
      ).map(element => ({ ...element, _scope: "master" })),
      ...localElements.map(element => ({ ...element, _scope: "page" }))
    ].sort((left, right) => (Number(left.zIndex) || 0) - (Number(right.zIndex) || 0));
  }
  function resolveMonthDateStrip(element, page, defaults = {}) {
    const value = element?.value && typeof element.value === "object" && !Array.isArray(element.value) ? element.value : {};
    const widget = element?.runtimeWidget || {};
    const fixed = (element.monthSource ?? widget.monthSource) === "fixed";
    const year = Number(fixed ? (element.year ?? widget.year ?? value.year ?? defaults.year) : (page?.calendarYear ?? value.year ?? defaults.year));
    const month = Number(fixed ? (element.month ?? widget.month ?? value.month ?? defaults.startMonth) : (page?.calendarMonth ?? value.month ?? defaults.startMonth));
    if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) return null;
    const count = new Date(Date.UTC(year, month, 0)).getUTCDate();
    return {
      year, month,
      showWeekday: (element.showWeekday ?? widget.showWeekday ?? value.showWeekday) !== false,
      showDate: (element.showDate ?? widget.showDate ?? value.showDate) !== false,
      cells: Array.from({ length: count }, (_, index) => {
        const day = index + 1;
        const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
        return { day, weekday, weekdayLabel: "SMTWTFS"[weekday] };
      })
    };
  }
  function shiftedMonth(year, month, offset) {
    const date = new Date(Date.UTC(Number(year), Number(month) - 1 + offset, 1));
    return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1 };
  }
  function widgetValue(element, page) {
    const storedValue = element?.value && typeof element.value === "object" && !Array.isArray(element.value) ? element.value : {};
    const runtimeConfig = Object.fromEntries(Object.entries({ rows: element.rows, weekStart: element.weekStart, showWeekday: element.showWeekday, showDate: element.showDate, baseYear: element.baseYear, startMonth: element.startMonth, monthCount: element.monthCount, columns: element.columns, memoLayout: element.memoLayout, title: element.title, lineCount: element.lineCount, itemCount: element.itemCount, weekCount: element.weekCount, showMemo: element.showMemo, showAdjacentMonths: element.showAdjacentMonths, ...element.runtimeWidget }).filter(([, value]) => value !== undefined));
    const config = { ...storedValue, ...runtimeConfig };
    const type = alias(element.type), year = Number(page?.calendarYear), month = Number(page?.calendarMonth);
    if (type === "year-calendar") return { year: Number(config.baseYear), startMonth: Number(config.startMonth || 3), monthCount: Number(config.monthCount || 12), columns: Number(config.columns || 4), weekStart: config.weekStart || "sunday" };
    if (type === "month-date-strip") {
      const strip = resolveMonthDateStrip(element, page, { year, startMonth: month });
      return strip ? { year: strip.year, month: strip.month, showWeekday: strip.showWeekday, showDate: strip.showDate } : element.value;
    }
    if (!Number.isInteger(year) || month < 1 || month > 12) return element.value;
    if (type === "calendar" || type === "calendar-grid") return { ...storedValue, year, month, rows: config.rows, weekStart: config.weekStart, showAdjacentMonths: config.showAdjacentMonths };
    if (type === "mini-calendar-prev") return { ...storedValue, ...shiftedMonth(year, month, -1), rows: config.rows, weekStart: config.weekStart };
    if (type === "mini-calendar-next") return { ...storedValue, ...shiftedMonth(year, month, 1), rows: config.rows, weekStart: config.weekStart };
    if (type === "mini-calendar") return { year, month, rows: config.rows, weekStart: config.weekStart, showWeekday: config.showWeekday !== false, showDate: config.showDate !== false };
    if (type === "memo") return { layout: config.memoLayout || "lines", title: config.title || "MEMO", lineCount: Number(config.lineCount || 8), itemCount: Number(config.itemCount || 9), weekCount: Number(config.weekCount || 5), showMemo: config.showMemo !== false };
    return element.value;
  }
  // The same page object must produce the same widget DOM in authoring and user editing.
  // Values inserted into HTML are generated calendar numbers or escaped labels.
  const monthDateStripCss = ".month-date-strip{width:100%;height:100%;display:grid;grid-template-columns:repeat(var(--date-count,31),minmax(0,1fr));align-items:stretch;background:rgba(255,255,255,.96);border:1px solid var(--line,#d8dbe2);border-radius:6px;overflow:hidden}.month-date-cell{min-width:0;display:grid;grid-template-rows:1fr 1.15fr;align-items:center;text-align:center;border-right:1px solid rgba(23,32,46,.09);font-variant-numeric:tabular-nums}.month-date-cell:last-child{border-right:0}.month-date-cell .dow{font-size:clamp(5px,1.05vw,10px);font-weight:800;color:#6b7280;line-height:1}.month-date-cell .date{font-size:clamp(6px,1.35vw,13px);font-weight:750;line-height:1}.month-date-cell.sun .dow,.month-date-cell.sun .date{color:#d04444}.month-date-cell.sat .dow,.month-date-cell.sat .date{color:#3569b8}";
  function escapeMonthStripText(value) {
    return String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
  }
  function renderMonthDateStripMarkup(strip, transparent = false) {
    if (!strip || !Array.isArray(strip.cells)) return "";
    const cells = strip.cells.map(cell => {
      const kind = cell.weekday === 0 ? " sun" : cell.weekday === 6 ? " sat" : "";
      return '<div class="month-date-cell' + kind + '">' +
        (strip.showWeekday ? '<span class="dow">' + escapeMonthStripText(cell.weekdayLabel) + '</span>' : "") +
        (strip.showDate ? '<span class="date">' + escapeMonthStripText(cell.day) + '</span>' : "") + '</div>';
    }).join("");
    return '<div class="month-date-strip" style="--date-count:' + strip.cells.length +
      (transparent ? ';background:transparent;border-color:transparent' : "") + '">' + cells + '</div>';
  }
  function installMonthDateStripStyle() {
    if (typeof document === "undefined" || document.getElementById("acdl-month-date-strip-style")) return;
    const style = document.createElement("style");
    style.id = "acdl-month-date-strip-style";
    style.textContent = monthDateStripCss;
    document.head.appendChild(style);
  }
  const VECTOR_LIBRARY=[
 {id:"school-building",name:"학교 건물",category:"school",icon:"🏫"},{id:"book-open",name:"펼친 책",category:"school",icon:"📖"},{id:"pencil",name:"연필",category:"school",icon:"✎"},{id:"ruler",name:"자",category:"school",icon:"📏"},{id:"globe",name:"지구본",category:"school",icon:"🌐"},{id:"board",name:"칠판",category:"school",icon:"▰"},{id:"graduation-cap",name:"졸업모",category:"school",icon:"🎓"},{id:"school-bell",name:"학교 종",category:"school",icon:"🔔"},{id:"backpack",name:"책가방",category:"school",icon:"🎒"},{id:"school-bus",name:"스쿨버스",category:"school",icon:"🚌"},{id:"microscope",name:"현미경",category:"school",icon:"🔬"},{id:"flask",name:"플라스크",category:"school",icon:"⚗"},
 {id:"cherry-blossom",name:"벚꽃",category:"season",icon:"✿"},{id:"sprout",name:"새싹",category:"season",icon:"🌱"},{id:"leaf",name:"나뭇잎",category:"season",icon:"🍃"},{id:"sun",name:"여름 해",category:"season",icon:"☀"},{id:"cloud",name:"구름",category:"season",icon:"☁"},{id:"rain",name:"빗방울",category:"season",icon:"💧"},{id:"maple",name:"단풍",category:"season",icon:"🍁"},{id:"snow",name:"눈송이",category:"season",icon:"❄"},
 {id:"entrance",name:"입학식",category:"event",icon:"🎒"},{id:"graduation",name:"졸업식",category:"event",icon:"🎓"},{id:"sports",name:"운동회",category:"event",icon:"🏃"},{id:"festival",name:"학교 축제",category:"event",icon:"🎉"},{id:"field-trip",name:"체험학습",category:"event",icon:"🚌"},{id:"exam",name:"시험",category:"event",icon:"📝"},{id:"vacation",name:"방학",category:"event",icon:"🏖"},{id:"counsel",name:"상담",category:"event",icon:"💬"},
 {id:"laurel",name:"월계수",category:"decoration",icon:"❧"},{id:"badge",name:"배지",category:"decoration",icon:"⬟"},{id:"corner",name:"코너 장식",category:"decoration",icon:"⌜"},{id:"wave",name:"물결 장식",category:"decoration",icon:"〰"}
];
  function vectorColor(value, fallback) {
    return typeof value === "string" && /^#[0-9a-fA-F]{3,8}$/.test(value) ? value : fallback;
  }
  function renderVectorSvg(assetId, colors = {}) {
    const asset = VECTOR_LIBRARY.find(item => item.id === assetId);
    if (!asset) return "";
    const primary = vectorColor(colors?.primary, "#4777bd");
    const secondary = vectorColor(colors?.secondary, "#f4b740");
    return '<svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-label="' + escapeMonthStripText(asset.name) + '">' +
      '<circle cx="50" cy="50" r="44" fill="' + secondary + '" opacity=".22"/>' +
      '<path d="M50 5 L58 35 L90 35 L64 54 L74 86 L50 67 L26 86 L36 54 L10 35 L42 35 Z" fill="' + primary + '" opacity=".12"/>' +
      '<text x="50" y="61" text-anchor="middle" font-size="44" font-family="Arial, sans-serif" fill="' + primary + '">' + escapeMonthStripText(asset.icon) + '</text></svg>';
  }
  function supportsVectorAsset(assetId) { return VECTOR_LIBRARY.some(item => item.id === assetId); }
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
  function resolveMemoLayout(element) {
    const layout = typeof element?.memoLayout === "string" && element.memoLayout ? element.memoLayout : "lines";
    const title = typeof element?.title === "string" && element.title ? element.title : "메모";
    const bounded = (value, fallback, min, max) => Math.max(min, Math.min(max, Number(value || fallback)));
    return {
      layout, title,
      lineCount: bounded(element?.lineCount, 8, 3, 20),
      weekCount: bounded(element?.weekCount, 5, 1, 5),
      itemCount: bounded(element?.itemCount, 6, 1, 20),
      showMemo: element?.showMemo !== false,
    };
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
      const prefix = groups[0].key;
      const items = events.filter(item => item.startDate.startsWith(prefix) || (item.endDate || "").startsWith(prefix))
        .sort((left, right) => left.startDate.localeCompare(right.startDate)).slice(0, Number(element?.maxItems || 10));
      return { mode, groups: [{ ...groups[0], items }], items };
    }
    const first = groups[0].key + "-01", lastGroup = groups[groups.length - 1];
    const last = new Date(Date.UTC(lastGroup.year, lastGroup.month, 0)).toISOString().slice(0, 10);
    const all = events.filter(item => item.startDate <= last && (item.endDate || item.startDate) >= first)
      .sort((left, right) => left.startDate.localeCompare(right.startDate));
    const items = mode === "all" || mode === "year-by-month" ? all : all.slice(0, Number(element?.maxItems || 24));
    return { mode, groups, items };
  }
  root.ACDLPageCompositionRuntime = Object.freeze({ visibleElements, isMonthBackCompositionElement, widgetValue, resolveMonthDateStrip, renderMonthDateStripMarkup, monthDateStripCss, installMonthDateStripStyle, renderVectorSvg, supportsVectorAsset, resolveMiniCalendar, resolveAnnualCalendar, resolveMemoLayout, resolveScheduleEvents });
})(typeof window !== "undefined" ? window : globalThis);
