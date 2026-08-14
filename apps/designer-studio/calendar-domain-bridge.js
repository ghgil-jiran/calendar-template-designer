(function (root) {
  function assertWeekStart(weekStart) {
    if (weekStart !== 'sunday' && weekStart !== 'monday') {
      throw new RangeError('weekStart must be sunday or monday');
    }
  }

  function dateCell(date) {
    return {
      date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
      day: date.getDate(),
      month: date.getMonth() + 1,
      dow: date.getDay()
    };
  }

  function dateFromISO(value) {
    return new Date(`${value}T00:00:00`);
  }

  function isoDate(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

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

  // Designer Studio의 5행 달력은 여섯째 주의 해당 월 날짜를 마지막 행에
  // `extra`로 합친다. 일반 달력 도메인의 5행 오류 처리와 의도적으로 다르다.
  function buildCalendarGrid(year, month, weekStart = 'sunday', rows = 6) {
    const normalizedYear = Number(year);
    const normalizedMonth = Number(month);
    const normalizedRows = Number(rows);
    if (!Number.isInteger(normalizedYear) || normalizedYear < 2000 || normalizedYear > 2200) {
      throw new RangeError('year must be 2000..2200');
    }
    if (!Number.isInteger(normalizedMonth) || normalizedMonth < 1 || normalizedMonth > 12) {
      throw new RangeError('month must be 1..12');
    }
    if (normalizedRows !== 5 && normalizedRows !== 6) {
      throw new RangeError('rows must be 5 or 6');
    }
    assertWeekStart(weekStart);

    const first = new Date(normalizedYear, normalizedMonth - 1, 1);
    const weekOffset = weekStart === 'monday' ? (first.getDay() + 6) % 7 : first.getDay();
    const start = new Date(normalizedYear, normalizedMonth - 1, 1 - weekOffset);
    const all = Array.from({ length: 42 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      return dateCell(date);
    });

    if (normalizedRows === 6) return all;
    const compact = all.slice(0, 35).map(cell => ({ ...cell }));
    all.slice(35).forEach((cell, index) => {
      if (cell.month === normalizedMonth) compact[28 + index].extra = cell;
    });
    return compact;
  }

  function buildRangeSegments(events, grid, priorityOf = event => Number(event.priority || 0)) {
    if (!Array.isArray(events) || !Array.isArray(grid) || grid.length === 0) return [];
    const first = grid[0].date;
    const last = grid[grid.length - 1].date;
    const byDate = new Map(grid.map((cell, index) => [cell.date, index]));
    const rows = Math.ceil(grid.length / 7);
    const rangeEvents = events
      .filter(event => (event.endDate || event.startDate) !== event.startDate)
      .filter(event => (event.endDate || event.startDate) >= first && event.startDate <= last)
      .sort((a, b) => priorityOf(b) - priorityOf(a)
        || a.startDate.localeCompare(b.startDate)
        || a.title.localeCompare(b.title));
    const segments = [];

    rangeEvents.forEach(event => {
      const eventStart = dateFromISO(event.startDate);
      const eventEnd = dateFromISO(event.endDate || event.startDate);
      for (let week = 0; week < rows; week += 1) {
        const weekStart = dateFromISO(grid[week * 7].date);
        const weekEnd = dateFromISO(grid[Math.min(week * 7 + 6, grid.length - 1)].date);
        const segmentStart = new Date(Math.max(eventStart, weekStart));
        const segmentEnd = new Date(Math.min(eventEnd, weekEnd));
        if (segmentStart > segmentEnd) continue;
        const startIndex = byDate.get(isoDate(segmentStart));
        const endIndex = byDate.get(isoDate(segmentEnd));
        if (startIndex === undefined || endIndex === undefined) continue;
        segments.push({
          event,
          week,
          startColumn: startIndex % 7,
          endColumn: endIndex % 7,
          continuesBefore: eventStart < segmentStart,
          continuesAfter: eventEnd > segmentEnd,
          isFirstVisible: isoDate(segmentStart) === event.startDate,
          segmentStart: isoDate(segmentStart)
        });
      }
    });
    return segments;
  }

  function assignRangeLanes(segments, rowCount, maxLanes, priorityOf = event => Number(event.priority || 0)) {
    const result = [];
    const overflow = [];
    for (let week = 0; week < Number(rowCount); week += 1) {
      const weekSegments = segments
        .filter(segment => segment.week === week)
        .sort((a, b) => priorityOf(b.event) - priorityOf(a.event)
          || a.startColumn - b.startColumn
          || (b.endColumn - b.startColumn) - (a.endColumn - a.startColumn));
      const lanes = [];
      weekSegments.forEach(source => {
        const segment = { ...source };
        let lane = lanes.findIndex(items => items.every(item => (
          segment.endColumn < item.startColumn || segment.startColumn > item.endColumn
        )));
        if (lane < 0) {
          lane = lanes.length;
          lanes.push([]);
        }
        if (lane < Number(maxLanes)) {
          segment.lane = lane;
          lanes[lane].push(segment);
          result.push(segment);
        } else {
          overflow.push(segment);
        }
      });
    }
    return { segments: result, overflow };
  }

  root.ACDLCalendarDomain = Object.freeze({
    buildTwelveMonths,
    buildCalendarGrid,
    buildRangeSegments,
    assignRangeLanes
  });
})(typeof window !== 'undefined' ? window : globalThis);
