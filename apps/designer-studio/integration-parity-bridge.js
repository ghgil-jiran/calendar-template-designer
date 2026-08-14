(function (root) {
  function monthKey(year, month) {
    return `${Number(year)}-${String(Number(month)).padStart(2, '0')}`;
  }

  function academicMonths(year, startMonth) {
    return Array.from({ length: 12 }, (_, offset) => {
      const date = new Date(Number(year), Number(startMonth) - 1 + offset, 1);
      return { year: date.getFullYear(), month: date.getMonth() + 1, key: monthKey(date.getFullYear(), date.getMonth() + 1) };
    });
  }

  // 사용자 서비스 v1.1의 물리적 14장 28면 정본.
  function buildDeskAcademicSurfacePlan(year, startMonth = 3) {
    const months = academicMonths(year, startMonth);
    const surfaces = [
      { index: 0, sheet: 1, side: 'front', role: 'cover-front' },
      { index: 1, sheet: 1, side: 'back', role: 'annual-calendar' },
      { index: 2, sheet: 2, side: 'front', role: 'school-symbols' },
      { index: 3, sheet: 2, side: 'back', role: 'monthly-photo-memo', monthKey: months[0].key }
    ];
    for (let index = 0; index < 11; index += 1) {
      const sheet = index + 3;
      surfaces.push(
        { index: surfaces.length, sheet, side: 'front', role: 'monthly-calendar', monthKey: months[index].key },
        { index: surfaces.length + 1, sheet, side: 'back', role: 'monthly-photo-memo', monthKey: months[index + 1].key }
      );
    }
    surfaces.push(
      { index: surfaces.length, sheet: 14, side: 'front', role: 'monthly-calendar', monthKey: months[11].key },
      { index: surfaces.length + 1, sheet: 14, side: 'back', role: 'back-contact' }
    );
    return surfaces;
  }

  function actualSurface(page, index) {
    const roleMap = {
      'cover-front': 'cover-front',
      'cover-back': 'annual-calendar',
      'monthly-front': 'monthly-calendar',
      'monthly-back': 'monthly-photo-memo',
      'back-cover-front': 'school-symbols',
      'back-cover-back': 'back-contact'
    };
    return {
      index,
      role: roleMap[page?.role] || page?.semanticPageRole || page?.role || 'unknown',
      monthKey: page?.calendarYear && page?.calendarMonth ? monthKey(page.calendarYear, page.calendarMonth) : undefined
    };
  }

  function compareSurfacePlan(pages, expected) {
    const actual = (pages || []).map(actualSurface);
    const issues = [];
    if (actual.length !== expected.length) {
      issues.push({ code: 'SURFACE_COUNT_MISMATCH', expected: expected.length, actual: actual.length });
    }
    const length = Math.max(actual.length, expected.length);
    for (let index = 0; index < length; index += 1) {
      const wanted = expected[index];
      const found = actual[index];
      if (!wanted || !found) continue;
      if (wanted.role !== found.role) {
        issues.push({ code: 'SURFACE_ROLE_MISMATCH', index, expected: wanted.role, actual: found.role });
      }
      if (wanted.monthKey && wanted.monthKey !== found.monthKey) {
        issues.push({ code: 'SURFACE_MONTH_MISMATCH', index, expected: wanted.monthKey, actual: found.monthKey });
      }
    }
    return { expected, actual, issues, matches: issues.length === 0 };
  }

  function missingDataIssues(project, expected) {
    const images = project?.book?.monthlyImages || {};
    const requiredMonths = [...new Set(expected.filter(item => item.role === 'monthly-photo-memo').map(item => item.monthKey))];
    const issues = requiredMonths
      .filter(key => !images[key])
      .map(key => ({ code: 'MONTHLY_IMAGE_MISSING', severity: 'info', monthKey: key }));
    const contact = root.ACDLDatasetDomain?.buildSchoolContact(project?.book?.school || {}) || {};
    if (!Object.values(contact).some(Boolean)) {
      issues.push({ code: 'BACK_CONTACT_EMPTY', severity: 'info' });
    }
    return issues;
  }

  function compareProject(project) {
    const year = project?.settings?.year;
    const startMonth = project?.settings?.startMonth || 3;
    const expected = buildDeskAcademicSurfacePlan(year, startMonth);
    const surface = compareSurfacePlan(project?.book?.pageInstances || [], expected);
    const composition = root.ACDLDeskAcademicPageAdapter?.compose(project, expected) || { pages: [], missing: [], complete: false };
    const composedSurface = compareSurfacePlan(composition.pages, expected);
    return {
      schemaVersion: 'desk-academic-parity.v1',
      templateId: 'desk-academic-standard',
      surface,
      composition: { ...composition, surface: composedSurface },
      dataIssues: missingDataIssues(project, expected),
      readyForComposition: composition.complete && composedSurface.matches,
      readyForReplacement: false,
      replacementBlockers: ['MONTHLY_PHOTO_MEMO_MASTER_NOT_RENDERED', 'BACK_CONTACT_MASTER_NOT_RENDERED']
    };
  }

  root.ACDLIntegrationParity = Object.freeze({
    buildDeskAcademicSurfacePlan,
    compareSurfacePlan,
    compareProject
  });
})(typeof window !== 'undefined' ? window : globalThis);
