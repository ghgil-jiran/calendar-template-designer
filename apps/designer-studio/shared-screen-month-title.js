/* Versioned monthly title markup used by both authoring and Runtime screens. */
(function (root) {
  "use strict";
  const version = "1.0.0-preview.1";
  const names = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
  const styles = ["number-stack", "number-inline", "number-only", "year-month-korean", "month-korean", "english-month"];
  const escape = (value) => String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
  const fonts = ["Pretendard", "Noto Sans KR", "Noto Serif KR", "Nanum Gothic", "Nanum Myeongjo", "Arial", "Times New Roman", "Playfair Display"];
  function normalizeTypography(input = {}) {
    input = input && typeof input === "object" ? input : {};
    const result = {};
    if (fonts.includes(input.fontFamily)) result.fontFamily = input.fontFamily;
    if ([100,200,300,400,500,600,700,800,900].includes(Number(input.fontWeight))) result.fontWeight = Number(input.fontWeight);
    for (const key of ["numberSize", "yearSize", "englishSize", "textSize"]) {
      const value = Number(input[key]);
      if (Number.isFinite(value) && value >= 1 && value <= 240) result[key] = value;
    }
    for (const key of ["numberColor", "yearColor", "englishColor", "textColor"]) {
      if (/^#[a-f0-9]{6}$/i.test(input[key] || "")) result[key] = input[key];
    }
    for (const key of ["gap", "metaGap"]) {
      if (input[key] !== "" && input[key] != null && Number.isFinite(Number(input[key])) && Number(input[key]) >= 0 && Number(input[key]) <= 100) result[key] = Number(input[key]);
    }
    return result;
  }
  function componentCss(input, component) {
    const style = normalizeTypography(input), rules = [];
    if (style.fontFamily) rules.push(`font-family:'${style.fontFamily}'!important`);
    if (style.fontWeight) rules.push(`font-weight:${style.fontWeight}!important`);
    if (style[`${component}Size`]) rules.push(`font-size:${style[`${component}Size`]}px!important`);
    if (style[`${component}Color`]) rules.push(`color:${style[`${component}Color`]}!important`);
    return rules.length ? ` style="${rules.join(';')}"` : "";
  }
  function rootStyle(input) {
    const style = normalizeTypography(input);
    return style.gap == null ? {} : {gap: `${style.gap}px`};
  }
  function title(year, month, style, override, typography) {
    if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) throw new Error("Invalid monthly title date");
    const kind = styles.includes(style) ? style : "number-stack";
    const y = escape(year), m = escape(month), en = names[month - 1];
    if (override != null && String(override) !== "") return { style: kind, markup: typography ? `<span${componentCss(typography,"text")}>${escape(override)}</span>` : escape(override) };
    let markup = {
      "number-stack": `<span class="month-number">${m}</span><span class="month-meta"><span>${y}</span><span class="month-en">${en}</span></span>`,
      "number-inline": `<span class="month-year">${y}</span><span class="month-number">${m}</span><span class="month-en">${en}</span>`,
      "number-only": `<span class="month-number">${m}</span>`,
      "year-month-korean": `${y}년 ${m}월`,
      "month-korean": `${m}월`,
      "english-month": `<span class="month-en">${en}</span><span class="month-year">${y}</span>`,
    }[kind];
    if (typography) {
      markup = markup.replace(/<span class="month-number">/g, `<span class="month-number"${componentCss(typography,"number")}>`)
        .replace(/<span class="month-en">/g, `<span class="month-en"${componentCss(typography,"english")}>`)
        .replace(/<span class="month-year">/g, `<span class="month-year"${componentCss(typography,"year")}>`)
        .replace(`<span>${y}</span>`, `<span${componentCss(typography,"year")}>${y}</span>`);
      const metaGap = normalizeTypography(typography).metaGap;
      if (metaGap != null) markup = markup.replace('<span class="month-meta">', `<span class="month-meta" style="gap:${metaGap}px">`);
      if (kind === "year-month-korean" || kind === "month-korean") markup = `<span${componentCss(typography,"text")}>${markup}</span>`;
    }
    return { style: kind, markup };
  }
  const api = Object.freeze({ version, title, normalizeTypography, rootStyle });
  root.ACDLSharedMonthTitle = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(globalThis);
