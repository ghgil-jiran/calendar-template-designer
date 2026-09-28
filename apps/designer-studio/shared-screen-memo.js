/* Shared screen markup for the designer and user service checklist widget. */
(function (root) {
  "use strict";
  const version = "0.1.0-preview.1";
  function escapeText(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
  }
  function renderChecklist(model) {
    const itemCount = Math.max(1, Math.min(20, Number.isFinite(Number(model?.itemCount)) ? Math.trunc(Number(model.itemCount)) : 6));
    const rows = Array.from({ length: itemCount }, () => '<div class="planner-check-row"><span></span><span></span><span></span></div>').join("");
    return '<div class="widget-memo shared-screen-memo" data-memo-layout="checklist"><strong class="planner-ribbon">' + escapeText(model?.title ?? "MEMO") + '</strong><div class="planner-check-list" style="grid-template-rows:auto repeat(' + itemCount + ',1fr)"><div class="planner-check-row header"><span>DATE</span><span>TO DO</span><span></span></div>' + rows + '</div></div>';
  }
  function resolveYearlyPlan(source, fallbackYear) {
    const number = (value, fallback, min, max) => Math.max(min, Math.min(max, Number.isFinite(Number(value)) ? Number(value) : fallback));
    const startMonth = number(source?.startMonth, 1, 1, 12);
    const baseYear = Number(source?.baseYear) || Number(fallbackYear) || new Date().getFullYear();
    const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    const yearlyMonths = Array.from({ length: 12 }, (_, index) => {
      const zero = startMonth - 1 + index, month = zero % 12 + 1, year = baseYear + Math.floor(zero / 12);
      const transition = year !== baseYear;
      return { year, month, transition, label: source?.monthLabelStyle === "number-ko"
        ? (transition ? year + " " : "") + month + "월"
        : month + " " + monthNames[month - 1] + (transition ? " · " + year : "") };
    });
    return {
      title: source?.title || "메모",
      yearlyColumns: number(source?.yearlyColumns, 4, 2, 6),
      linesPerMonth: number(source?.linesPerMonth, 4, 0, 12),
      yearlyGroupSize: [3, 4].includes(Number(source?.yearlyGroupSize)) ? Number(source.yearlyGroupSize) : 0,
      yearlyLayoutType: source?.yearlyLayoutType || "yearly-open-grid",
      yearlyContainerStyle: source?.yearlyContainerStyle || "none",
      yearlyMonths,
    };
  }
  function renderYearlyPlan(model) {
    const layouts = ["yearly-open-grid", "yearly-month-cards", "yearly-vertical-groups", "yearly-horizontal-groups"];
    const layout = layouts.includes(model?.yearlyLayoutType) ? model.yearlyLayoutType : "yearly-open-grid";
    const columns = Math.max(2, Math.min(6, Number(model?.yearlyColumns) || 4));
    const lines = Math.max(0, Math.min(12, Number(model?.linesPerMonth) || 0));
    const groupSize = [3, 4].includes(Number(model?.yearlyGroupSize)) ? Number(model.yearlyGroupSize) : 0;
    const months = Array.isArray(model?.yearlyMonths) ? model.yearlyMonths.slice(0, 12) : [];
    const renderMonth = (entry) => '<section><b>' + escapeText(entry.label) + '</b><div>' + Array.from({ length: lines }, () => '<i></i>').join('') + '</div></section>';
    const content = groupSize
      ? Array.from({ length: Math.ceil(months.length / groupSize) }, (_, index) => '<div class="yearly-plan-group">' + months.slice(index * groupSize, (index + 1) * groupSize).map(renderMonth).join('') + '</div>').join('')
      : months.map(renderMonth).join('');
    return '<div class="widget-memo yearly-plan-grid yearly-layout-' + layout + '" data-container-style="' + escapeText(model?.yearlyContainerStyle || "none") + '" style="--yearly-cols:' + columns + '"><strong class="yearly-plan-title">' + escapeText(model?.title || "메모") + '</strong><div class="yearly-plan-months">' + content + '</div></div>';
  }
  root.ACDLSharedMemo = Object.freeze({ version, renderChecklist, resolveYearlyPlan, renderYearlyPlan });
})(globalThis);
