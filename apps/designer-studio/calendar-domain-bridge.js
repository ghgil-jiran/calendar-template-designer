(function (root) {
  function buildTwelveMonths(year, startMonth) {
    const normalizedYear = Number(year);
    const normalizedStartMonth = Number(startMonth);
    if (!Number.isInteger(normalizedYear) || normalizedYear < 2000 || normalizedYear > 2200) {
      throw new RangeError('year must be 2000..2200');
    }
    if (!Number.isInteger(normalizedStartMonth) || normalizedStartMonth < 1 || normalizedStartMonth > 12) {
      throw new RangeError('startMonth must be 1..12');
    }
    return Array.from({ length: 12 }, (_, index) => {
      const monthIndex = normalizedStartMonth - 1 + index;
      return {
        year: normalizedYear + Math.floor(monthIndex / 12),
        month: monthIndex % 12 + 1
      };
    });
  }

  root.ACDLCalendarDomain = Object.freeze({ buildTwelveMonths });
})(typeof window !== 'undefined' ? window : globalThis);
