/* Versioned monthly title markup used by both authoring and Runtime screens. */
(function (root) {
  "use strict";
  const version = "1.0.0-preview.1";
  const names = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
  const styles = ["number-stack", "number-inline", "number-only", "year-month-korean", "month-korean", "english-month"];
  const escape = (value) => String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
  function title(year, month, style, override) {
    if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) throw new Error("Invalid monthly title date");
    const kind = styles.includes(style) ? style : "number-stack";
    const y = escape(year), m = escape(month), en = names[month - 1];
    if (override != null && String(override) !== "") return { style: kind, markup: escape(override) };
    const markup = {
      "number-stack": `<span class="month-number">${m}</span><span class="month-meta"><span>${y}</span><span class="month-en">${en}</span></span>`,
      "number-inline": `<span class="month-year">${y}</span><span class="month-number">${m}</span><span class="month-en">${en}</span>`,
      "number-only": `<span class="month-number">${m}</span>`,
      "year-month-korean": `${y}년 ${m}월`,
      "month-korean": `${m}월`,
      "english-month": `<span class="month-en">${en}</span><span class="month-year">${y}</span>`,
    }[kind];
    return { style: kind, markup };
  }
  const api = Object.freeze({ version, title });
  root.ACDLSharedMonthTitle = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(globalThis);
