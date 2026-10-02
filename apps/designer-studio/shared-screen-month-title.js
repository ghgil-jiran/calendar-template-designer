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
    if (["number", "number-year", "number-english", "english"].includes(input.composition)) result.composition=input.composition;
    if (["row","column"].includes(input.arrangement)) result.arrangement=input.arrangement;
    if (input.reverse === true) result.reverse=true;
    if (["plain","padded"].includes(input.numberFormat)) result.numberFormat=input.numberFormat;
    if (["upper","title","short"].includes(input.englishFormat)) result.englishFormat=input.englishFormat;
    if (["full","short"].includes(input.yearFormat)) result.yearFormat=input.yearFormat;
    if (["left","center","right"].includes(input.align)) result.align=input.align;
    for (const component of ["number","year","english"]) {
      if(fonts.includes(input[component+"FontFamily"]))result[component+"FontFamily"]=input[component+"FontFamily"];
      if([100,200,300,400,500,600,700,800,900].includes(Number(input[component+"FontWeight"])))result[component+"FontWeight"]=Number(input[component+"FontWeight"]);
    }
    return result;
  }
  function screenLength(value, context) {
    const reference=Number(context?.referenceWidthPx);
    return Number.isFinite(reference)&&reference>0 ? `${Number(value)/reference*100}cqw` : `${value}px`;
  }
  function componentCss(input, component, context) {
    const style = normalizeTypography(input), rules = [];
    const family=style[component+"FontFamily"]||style.fontFamily;
    if (family) rules.push(`font-family:'${family}'!important`);
    const weight=style[component+"FontWeight"]||style.fontWeight;
    if (weight) rules.push(`font-weight:${weight}!important`);
    if (style[`${component}Size`]) rules.push(`font-size:${screenLength(style[`${component}Size`],context)}!important`);
    if (style[`${component}Color`]) rules.push(`color:${style[`${component}Color`]}!important`);
    return rules.length ? ` style="${rules.join(';')}"` : "";
  }
  function rootStyle(input, context) {
    const style = normalizeTypography(input);
    const result=style.gap == null ? {} : {gap: screenLength(style.gap,context)};
    if(style.composition){const column=style.arrangement==="column",align=style.align||"left";Object.assign(result,{display:"flex",flexDirection:column?"column":"row",alignItems:column?(align==="left"?"flex-start":align==="right"?"flex-end":"center"):"center",justifyContent:column?"center":align==="left"?"flex-start":align==="right"?"flex-end":"center",lineHeight:"1",textAlign:align,padding:"0",margin:"0",fontWeight:style.fontWeight||800});}
    if(Object.keys(style).length&&(style.fontFamily||context?.fontFamily))result.fontFamily=style.fontFamily||context.fontFamily;
    if(Object.keys(style).length&&Number(context?.baseSize)>0)result.fontSize=screenLength(context.baseSize,context);
    return result;
  }
  function title(year, month, style, override, typography, context) {
    if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) throw new Error("Invalid monthly title date");
    const kind = styles.includes(style) ? style : "number-stack";
    const y = escape(year), m = escape(month), en = names[month - 1];
    if (override != null && String(override) !== "") return { style: kind, markup: typography ? `<span${componentCss(typography,"text",context)}>${escape(override)}</span>` : escape(override) };
    const composition=normalizeTypography(typography);
    if(composition.composition){
      const english=composition.englishFormat==="short"?en.slice(0,3):composition.englishFormat==="title"?en[0]+en.slice(1).toLowerCase():en;
      const parts={number:["month-number",composition.numberFormat==="plain"?m:String(month).padStart(2,"0")],year:["month-year",composition.yearFormat==="short"?y.slice(-2):y],english:["month-en",english]};
      const keys={number:["number"],"number-year":["number","year"],"number-english":["number","english"],english:["english"]}[composition.composition];
      if(composition.reverse)keys.reverse();
      return {style:"composed",markup:keys.map(key=>`<span class="${parts[key][0]}"${componentCss(composition,key,context)}>${parts[key][1]}</span>`).join("")};
    }
    let markup = {
      "number-stack": `<span class="month-number">${m}</span><span class="month-meta"><span>${y}</span><span class="month-en">${en}</span></span>`,
      "number-inline": `<span class="month-year">${y}</span><span class="month-number">${m}</span><span class="month-en">${en}</span>`,
      "number-only": `<span class="month-number">${m}</span>`,
      "year-month-korean": `${y}년 ${m}월`,
      "month-korean": `${m}월`,
      "english-month": `<span class="month-en">${en}</span><span class="month-year">${y}</span>`,
    }[kind];
    if (typography) {
      markup = markup.replace(/<span class="month-number">/g, `<span class="month-number"${componentCss(typography,"number",context)}>`)
        .replace(/<span class="month-en">/g, `<span class="month-en"${componentCss(typography,"english",context)}>`)
        .replace(/<span class="month-year">/g, `<span class="month-year"${componentCss(typography,"year",context)}>`)
        .replace(`<span>${y}</span>`, `<span${componentCss(typography,"year",context)}>${y}</span>`);
      const metaGap = normalizeTypography(typography).metaGap;
      if (metaGap != null) markup = markup.replace('<span class="month-meta">', `<span class="month-meta" style="gap:${screenLength(metaGap,context)}">`);
      if (kind === "year-month-korean" || kind === "month-korean") markup = `<span${componentCss(typography,"text",context)}>${markup}</span>`;
    }
    return { style: kind, markup };
  }
  const api = Object.freeze({ version, title, normalizeTypography, rootStyle });
  root.ACDLSharedMonthTitle = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(globalThis);
