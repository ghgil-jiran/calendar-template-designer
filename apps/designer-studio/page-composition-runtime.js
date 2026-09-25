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
  root.ACDLPageCompositionRuntime = Object.freeze({ visibleElements, isMonthBackCompositionElement, widgetValue, resolveMonthDateStrip, renderMonthDateStripMarkup, monthDateStripCss, installMonthDateStripStyle, renderVectorSvg, supportsVectorAsset });
})(typeof window !== "undefined" ? window : globalThis);
