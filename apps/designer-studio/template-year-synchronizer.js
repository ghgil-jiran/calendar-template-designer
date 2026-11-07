(function (root) {
  function numeric(value, fallback) { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : fallback; }
  function monthSequence(year, startMonth) {
    return Array.from({ length: 12 }, (_, index) => { const date = new Date(year, startMonth - 1 + index, 1); const itemYear = date.getFullYear(), month = date.getMonth() + 1; return { year: itemYear, month, key: `${itemYear}-${String(month).padStart(2, '0')}` }; });
  }
  function remapDate(value, yearDelta) {
    const match = /^(\d{4})-(\d{2})-(\d{2})(.*)$/.exec(String(value || '')); if (!match || !yearDelta) return value;
    const targetYear = Number(match[1]) + yearDelta, month = Number(match[2]), lastDay = new Date(targetYear, month, 0).getDate(), day = Math.min(Number(match[3]), lastDay);
    return `${targetYear}-${match[2]}-${String(day).padStart(2, '0')}${match[4]}`;
  }
  function remapMonthRecord(source, keyMap) {
    if (!source || Array.isArray(source) || typeof source !== 'object') return source;
    return Object.fromEntries(Object.entries(source).map(([key, value]) => [keyMap.get(key) || key, value]));
  }
  function synchronize(project, options = {}) {
    if (!project || typeof project !== 'object') throw new TypeError('project must be an object');
    project.settings ||= {}; project.template ||= {}; project.template.metadata ||= {}; project.book ||= {};
    const previousYear = numeric(project.settings.year, numeric(project.template.metadata.edition, NaN)), year = numeric(options.year, previousYear), previousStartMonth = numeric(project.settings.startMonth, 3), startMonth = numeric(options.startMonth, previousStartMonth);
    if (!Number.isInteger(year) || year < 2000 || year > 2200) throw new RangeError('year must be 2000..2200');
    if (!Number.isInteger(startMonth) || startMonth < 1 || startMonth > 12) throw new RangeError('startMonth must be 1..12');
    const oldMonths = monthSequence(previousYear, previousStartMonth), newMonths = monthSequence(year, startMonth), keyMap = new Map(oldMonths.map((item, index) => [item.key, newMonths[index].key])), yearDelta = year - previousYear;
    project.settings.year = year; project.settings.startMonth = startMonth; project.template.metadata.edition = year;
    const pages = project.book.pageInstances || [], monthlyFronts = pages.filter(page => page.role === 'monthly-front'), monthlyBacks = pages.filter(page => page.role === 'monthly-back');
    monthlyFronts.forEach((page, index) => { const month = newMonths[index]; if (!month) return; page.calendarYear = month.year; page.calendarMonth = month.month; page.monthKey = month.key; page.pairId = `month-pair.${month.key}`; });
    monthlyBacks.forEach((page, index) => { const front = monthlyFronts[index], month = front || newMonths[index]; if (!month) return; page.calendarYear = month.calendarYear || month.year; page.calendarMonth = month.calendarMonth || month.month; page.monthKey = month.monthKey || month.key; page.pairId = month.pairId || `month-pair.${page.monthKey}`; });
    pages.filter(page => page.role === 'poster-annual').forEach(page => { page.calendarYear = year; page.calendarMonth = 1; });
    project.book.monthlyImages = remapMonthRecord(project.book.monthlyImages, keyMap); project.book.monthlyImageAssets = remapMonthRecord(project.book.monthlyImageAssets, keyMap); project.book.monthlyQuotes = remapMonthRecord(project.book.monthlyQuotes, keyMap);
    (project.book.monthlyStyleOverrides || []).forEach(item => { if (item && keyMap.has(item.monthKey)) item.monthKey = keyMap.get(item.monthKey); });
    (project.book.events || []).forEach(event => { if (!event || typeof event !== 'object') return; event.startDate = remapDate(event.startDate, yearDelta); event.endDate = remapDate(event.endDate, yearDelta); if (event.date) event.date = remapDate(event.date, yearDelta); });
    return { previousYear, year, previousStartMonth, startMonth, yearDelta, keyMap };
  }
  root.ACDLTemplateYearSynchronizer = Object.freeze({ synchronize, monthSequence, remapDate });
})(typeof window !== 'undefined' ? window : globalThis);
