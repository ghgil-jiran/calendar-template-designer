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
  root.ACDLPageCompositionRuntime = Object.freeze({ visibleElements, isMonthBackCompositionElement, widgetValue, resolveMonthDateStrip });
})(typeof window !== "undefined" ? window : globalThis);
