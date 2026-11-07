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
  // A date-based presentation of the existing daily planner, shared by all surfaces.
  function projectHolidayDates(project) {
    if (project?.settings?.calendarData?.includeHolidays === false) return [];
    return [...new Set([
      ...(project?.book?.events || []).filter(e=>e.category === 'holiday').map(e=>e.startDate),
      ...Object.values(project?.book?.calendarReference?.years || {}).flatMap(year=>(year.public_holiday?.items || []).filter(item=>item.isHoliday !== false).map(item=>item.date))
    ])].filter(date=>/^\d{4}-\d{2}-\d{2}$/.test(String(date)));
  }
  function resolveDailyPlan(element, page = {}, defaults = {}) {
    const value = {...(element?.value || {}), ...(element?.runtimeWidget || {}), ...element};
    const year = Number(page.calendarYear ?? value.calendarYear ?? value.year ?? defaults.year);
    const month = Number(page.calendarMonth ?? value.calendarMonth ?? value.month ?? defaults.startMonth);
    if (!Number.isInteger(year) || year < 1900 || year > 9999 || !Number.isInteger(month) || month < 1 || month > 12) return null;
    const count = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const holidays = new Set(value.holidayDates ?? defaults.holidayDates ?? []);
    const date = day => {
      if (day > count || day < 1) return null;
      const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
      const key = year + '-' + String(month).padStart(2,'0') + '-' + String(day).padStart(2,'0');
      return {day, weekday, label:['일','월','화','수','목','금','토'][weekday], holiday:holidays.has(key), date:key};
    };
    return {year, month, title:value.title || '일일 자기주도 계획', rows:Array.from({length:16}, (_,i) => [i < 15 ? date(i+1) : null, date(i+16)])};
  }
  function renderDailyPlan(model, style = {}) {
    if (!model) return '';
    const color = (key, fallback) => /^#[0-9a-f]{3,8}$/i.test(style[key] || '') ? style[key] : fallback;
    const ink=color('color','#20282b'), sunday=color('sundayColor','#b53443'), saturday=color('saturdayColor','#35659b');
    const scale=key=>Math.max(.6,Math.min(2,Number(style[key]||100)/100));
    const dateScale=scale('dateScale'),titleScale=scale('titleScale');
    const accent=color('titleColor','#719da4'), line=color('lineColor','#d5dbd7'), stripe=color('stripeColor','#edf0e9');
    const rows=model.rows.map((pair,i) => {
      const y=136+i*47;
      return '<rect x="0" y="'+y+'" width="1000" height="47" fill="'+(i%2?stripe:'#ffffff')+'"/><path d="M0 '+(y+47)+'H1000" stroke="'+line+'" stroke-width=".7"/>'+pair.map((entry,col)=>entry?'<text data-plan-date="'+entry.date+'" data-weekday="'+entry.weekday+'" x="'+(col*500+22)+'" y="'+(y+30)+'" fill="'+(entry.holiday||entry.weekday===0?sunday:entry.weekday===6?saturday:ink)+'" font-size="'+(23*dateScale)+'" font-weight="700">'+entry.day+'<tspan font-size="'+(16*dateScale)+'"> '+entry.label+'</tspan></text>':'').join('');
    }).join('');
    return '<svg class="shared-daily-plan" style="font-family:'+escapeText(String(style.fontFamily||'inherit').replace(/[;{}]/g,''))+'" data-memo-layout="daily-plan" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 1000 900" preserveAspectRatio="none" role="img" aria-label="'+model.year+'년 '+model.month+'월 '+escapeText(model.title)+'"><text x="500" y="48" text-anchor="middle" fill="'+accent+'" font-size="'+(35*titleScale)+'" font-weight="700">'+model.month+'월의</text><text x="500" y="100" text-anchor="middle" fill="'+accent+'" font-size="'+(40*titleScale)+'" font-weight="700">'+escapeText(model.title)+'</text>'+rows+'<path d="M88 136V888 M500 136V888 M588 136V888" stroke="'+line+'" stroke-width=".7"/></svg>';
  }
  root.ACDLSharedMemo = Object.freeze({ version, projectHolidayDates, resolveDailyPlan, renderDailyPlan, renderChecklist, resolveYearlyPlan, renderYearlyPlan });
})(globalThis);

