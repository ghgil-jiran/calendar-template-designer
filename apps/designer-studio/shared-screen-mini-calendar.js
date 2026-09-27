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
  root.ACDLSharedMiniCalendar = Object.freeze({version, resolveMiniCalendar, renderMiniCalendarMarkup});
})(globalThis);
