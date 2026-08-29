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

  const SCHEDULE_MAX_LANES = 4;

  function calendarScheduleTypography(title, span) {
    const charactersPerColumn = String(title || '').length / Math.max(Number(span) || 1, 1);
    return {
      fontPx: charactersPerColumn >= 29 ? 6 : charactersPerColumn >= 13 ? 7 : 8,
      maxLines: 2
    };
  }

  function buildCalendarScheduleLanes(year, month, input, weekStart = 'sunday', rows = 5) {
    const grid = buildCalendarGrid(year, month, weekStart, rows);
    const monthFirst = `${year}-${String(month).padStart(2, '0')}-01`;
    const monthLastDay = new Date(year, month, 0).getDate();
    const monthLast = `${year}-${String(month).padStart(2, '0')}-${String(monthLastDay).padStart(2, '0')}`;
    const dayOf = value => Number(String(value).slice(-2));
    const dateLength = event => dayOf(event.endDate) - dayOf(event.startDate);
    const overlaps = (left, right) => left.startDate <= right.endDate && right.startDate <= left.endDate;
    const events = (Array.isArray(input) ? input : [])
      .filter(event => event?.id && event?.startDate && (event.endDate || event.startDate) >= event.startDate)
      .filter(event => event.startDate <= monthLast && (event.endDate || event.startDate) >= monthFirst)
      .map(event => ({
        ...event,
        title: String(event.title || ''),
        startDate: event.startDate < monthFirst ? monthFirst : event.startDate,
        endDate: (event.endDate || event.startDate) > monthLast ? monthLast : (event.endDate || event.startDate)
      }))
      .sort((left, right) => dateLength(right) - dateLength(left)
        || left.startDate.localeCompare(right.startDate)
        || left.title.localeCompare(right.title));

    const lanes = [];
    const eventLane = new Map();
    events.forEach(event => {
      let lane = lanes.findIndex(placed => placed.every(item => !overlaps(item, event)));
      if (lane < 0) {
        lane = lanes.length;
        lanes.push([event]);
      } else {
        lanes[lane].push(event);
      }
      eventLane.set(event.id, lane);
    });

    const primaryByDate = new Map();
    grid.forEach((cell, index) => {
      primaryByDate.set(cell.date, { row: Math.floor(index / 7), startCol: index % 7 });
      if (cell.extra) primaryByDate.set(cell.extra.date, { row: Math.floor(index / 7), startCol: index % 7, compactExtra: true });
    });
    const segments = [];
    const hiddenByDate = {};
    events.forEach(event => {
      const lane = eventLane.get(event.id) || 0;
      let cursor = dateFromISO(event.startDate);
      const end = dateFromISO(event.endDate);
      if (lane >= SCHEDULE_MAX_LANES) {
        while (cursor <= end) {
          const date = isoDate(cursor);
          hiddenByDate[date] = (hiddenByDate[date] || 0) + 1;
          cursor.setDate(cursor.getDate() + 1);
        }
        return;
      }
      while (cursor <= end) {
        const date = isoDate(cursor);
        const start = primaryByDate.get(date);
        if (!start) {
          cursor.setDate(cursor.getDate() + 1);
          continue;
        }
        let span = 1;
        const compactExtra = start.compactExtra === true;
        if (!compactExtra) {
          let probe = new Date(cursor);
          while (span < 7 - start.startCol && probe < end) {
            probe.setDate(probe.getDate() + 1);
            const next = primaryByDate.get(isoDate(probe));
            if (!next || next.compactExtra || next.row !== start.row || next.startCol !== start.startCol + span) break;
            span += 1;
          }
        }
        segments.push({
          eventId: event.id,
          title: event.title,
          row: start.row,
          startCol: start.startCol,
          span,
          lane,
          startDate: event.startDate,
          endDate: event.endDate
        });
        cursor.setDate(cursor.getDate() + span);
      }
    });
    return { segments, hiddenByDate, maxLanes: SCHEDULE_MAX_LANES };
  }

  root.ACDLCalendarDomain = Object.freeze({
    buildTwelveMonths,
    buildCalendarGrid,
    buildRangeSegments,
    assignRangeLanes,
    calendarScheduleTypography,
    buildCalendarScheduleLanes,
    SCHEDULE_MAX_LANES
  });
})(typeof window !== 'undefined' ? window : globalThis);
