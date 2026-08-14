(function (root) {
  function monthKey(year, month) {
    return `${Number(year)}-${String(Number(month)).padStart(2, '0')}`;
  }

  function sourceKey(role, key) {
    return key ? `${role}:${key}` : role;
  }

  // 기존 페이지와 개체를 수정하지 않고 v1.1의 물리적 28면 순서로 참조한다.
  function compose(project, expectedPlan) {
    const pages = project?.book?.pageInstances || [];
    const sources = new Map();
    for (const page of pages) {
      const key = page.calendarYear && page.calendarMonth ? monthKey(page.calendarYear, page.calendarMonth) : undefined;
      sources.set(sourceKey(page.role, key), page);
    }

    const sourceRole = {
      'cover-front': 'cover-front',
      'annual-calendar': 'cover-back',
      'school-symbols': 'back-cover-front',
      'monthly-calendar': 'monthly-front',
      'monthly-photo-memo': 'monthly-back',
      'back-contact': 'back-cover-back'
    };
    const missing = [];
    const composed = expectedPlan.map((surface, index) => {
      const role = sourceRole[surface.role];
      const key = surface.monthKey;
      const source = sources.get(sourceKey(role, key));
      if (!source) {
        missing.push({ index, role: surface.role, monthKey: key, sourceRole: role });
      }
      const year = key ? Number(key.slice(0, 4)) : null;
      const month = key ? Number(key.slice(5)) : null;
      return {
        ...(source || {}),
        id: `integration.surface.${String(index + 1).padStart(2, '0')}`,
        sourcePageId: source?.sourcePageId || source?.id || null,
        number: index + 1,
        sheetNumber: surface.sheet,
        side: surface.side,
        role: surface.role,
        semanticPageRole: surface.role,
        calendarYear: year,
        calendarMonth: month,
        monthKey: key,
        integrationSourceRole: role,
        integrationMissingSource: !source
      };
    });
    return { pages: composed, missing, complete: missing.length === 0 };
  }

  root.ACDLDeskAcademicPageAdapter = Object.freeze({ compose });
})(typeof window !== 'undefined' ? window : globalThis);
