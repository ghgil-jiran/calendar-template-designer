(function (root) {
  const REFERENCE = Object.freeze({
    source: 'ghgil-jiran/-v1.1@integration/runtime-v2',
    productionSize: { width: 266, height: 186, unit: 'mm' },
    trimSize: { width: 260, height: 180, unit: 'mm' },
    calendar: { rows: 5, columns: 7, cells: 35 },
    photoMemo: { photoFlex: 1.7, memoFlex: 1, lineCount: 7, drawnLineCount: 6 },
    contact: { fields: ['academicPhone', 'adminPhone', 'fax', 'site'], hideEmptyFields: true, hideWhenAllEmpty: true }
  });

  function count(source, pattern) {
    return (String(source || '').match(pattern) || []).length;
  }

  function inspectPage(page) {
    const html = page?.html || '';
    const role = page?.role || '';
    const metrics = { role };
    if (role === 'monthly-calendar') {
      metrics.rows = Number(html.match(/data-calendar-rows="(\d+)"/)?.[1]);
      metrics.cells = count(html, /class="shadow-calendar-cell/g);
    }
    if (role === 'monthly-photo-memo') {
      metrics.layout = html.includes('data-layout="photo-1.7-memo-1"');
      metrics.lines = count(html, /class="shadow-memo-line(?: has-rule)?"/g);
      metrics.drawnLines = count(html, /class="shadow-memo-line has-rule"/g);
    }
    if (role === 'back-contact') {
      metrics.contactCard = html.includes('shadow-contact-card');
    }
    return metrics;
  }

  function compare(document, approval) {
    const pages = document?.pages || [];
    const metrics = pages.map(inspectPage);
    const issues = [];
    if (pages.length !== 28) issues.push({ code: 'VISUAL_SURFACE_COUNT', expected: 28, actual: pages.length });
    const calendars = metrics.filter(item => item.role === 'monthly-calendar');
    const photoMemos = metrics.filter(item => item.role === 'monthly-photo-memo');
    if (calendars.length !== 12) issues.push({ code: 'VISUAL_CALENDAR_COUNT', expected: 12, actual: calendars.length });
    if (photoMemos.length !== 12) issues.push({ code: 'VISUAL_PHOTO_MEMO_COUNT', expected: 12, actual: photoMemos.length });
    calendars.forEach((item, index) => {
      if (item.rows !== REFERENCE.calendar.rows) issues.push({ code: 'VISUAL_CALENDAR_ROWS', index, expected: 5, actual: item.rows });
      if (item.cells !== REFERENCE.calendar.cells) issues.push({ code: 'VISUAL_CALENDAR_CELLS', index, expected: 35, actual: item.cells });
    });
    photoMemos.forEach((item, index) => {
      if (!item.layout) issues.push({ code: 'VISUAL_PHOTO_MEMO_LAYOUT', index });
      if (item.lines !== 7) issues.push({ code: 'VISUAL_MEMO_LINES', index, expected: 7, actual: item.lines });
      if (item.drawnLines !== 6) issues.push({ code: 'VISUAL_MEMO_DRAWN_LINES', index, expected: 6, actual: item.drawnLines });
    });
    const visuallyApproved = issues.length === 0 && approval?.visual?.status === 'approved';
    return { schemaVersion: 'desk-academic-visual-parity.v1', reference: REFERENCE, metrics, issues, structurallyReady: issues.length === 0, visuallyApproved, approval: approval?.visual || null };
  }

  root.ACDLDeskAcademicVisualParity = Object.freeze({ REFERENCE, inspectPage, compare });
})(typeof window !== 'undefined' ? window : globalThis);
