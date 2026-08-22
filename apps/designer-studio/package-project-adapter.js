(function (root) {
  function clone(value) {
    if (value === undefined) return undefined;
    return typeof structuredClone === 'function' ? structuredClone(value) : JSON.parse(JSON.stringify(value));
  }

  function monthKey(page) {
    if (!page?.calendarYear || !page?.calendarMonth) return null;
    return `${page.calendarYear}-${String(page.calendarMonth).padStart(2, '0')}`;
  }

  function resolvePattern(value, page) {
    const key = monthKey(page);
    return typeof value === 'string' && key ? value.replace('{YYYY-MM}', key) : value;
  }

  function elementFromDefinition(definition, page, suffix = '') {
    const frame = definition.framePct || { x: 0, y: 0, width: 100, height: 100 };
    const binding = resolvePattern(definition.bindingPattern || definition.targetBindingPattern || definition.binding, page);
    return {
      id: `${definition.id || `${page.id}.package-object`}${suffix}`,
      type: definition.type || 'semantic-object',
      role: definition.role,
      x: Number(frame.x || 0),
      y: Number(frame.y || 0),
      width: Number(frame.width == null ? 100 : frame.width),
      height: Number(frame.height == null ? 100 : frame.height),
      zIndex: Number(definition.zIndex || 1),
      binding,
      bindingEnabled: Boolean(binding),
      image: definition.type === 'image' || definition.type === 'image-frame'
        ? { binding, fit: definition.fit || 'cover' }
        : undefined,
      fit: definition.fit,
      columns: definition.columns,
      startMonth: definition.startMonth,
      lineCount: definition.lineCount,
      drawnLineCount: definition.drawnLineCount,
      footer: clone(definition.footer),
      layoutContract: clone(definition.layoutContract),
      style: clone(definition.style || {})
    };
  }

  function elementsForPage(definitions, page) {
    return definitions.flatMap((definition) => {
      if (definition.type === 'calendar') return [];
      if (definition.type !== 'composite-master') return [elementFromDefinition(definition, page)];
      return (definition.layout?.children || []).map((child, index) => elementFromDefinition({
        ...child,
        id: `${definition.id}.${child.id || index}`,
        role: child.id || definition.role,
        zIndex: definition.zIndex
      }, page));
    });
  }

  function assignPage(page, role, calendar) {
    const editorRole = {
      'school-symbols': 'front-insert-front',
      'monthly-calendar': 'monthly-front',
      'monthly-photo-memo': 'monthly-back',
      'back-contact': 'back-cover-back'
    }[role];
    page.sourceRole ||= page.role;
    if (editorRole) page.role = editorRole;
    page.packageRole = role;
    page.semanticPageRole = role;
    page.calendarYear = calendar?.year || null;
    page.calendarMonth = calendar?.month || null;
    page.monthKey = calendar ? `${calendar.year}-${String(calendar.month).padStart(2, '0')}` : null;
    page.overrides ||= {};
  }

  function applyPackage(project, packageTemplate) {
    if (!project?.book?.pageInstances || !packageTemplate?.masterDefinitions) {
      throw new TypeError('project and package template are required');
    }
    if (project.book.pageInstances.length !== 28) {
      throw new RangeError(`Package project requires 28 surfaces: ${project.book.pageInstances.length}`);
    }
    const pages = project.book.pageInstances;
    const months = root.ACDLCalendarDomain.buildTwelveMonths(project.settings.year, project.settings.startMonth);
    assignPage(pages[0], 'cover-front');
    assignPage(pages[1], 'annual-calendar');
    assignPage(pages[2], 'school-symbols');
    assignPage(pages[3], 'monthly-photo-memo', months[0]);
    for (let index = 0; index < 11; index += 1) {
      assignPage(pages[4 + index * 2], 'monthly-calendar', months[index]);
      assignPage(pages[5 + index * 2], 'monthly-photo-memo', months[index + 1]);
    }
    assignPage(pages[26], 'monthly-calendar', months[11]);
    assignPage(pages[27], 'back-contact');

    project.template.id = packageTemplate.templateId;
    project.template.revision = packageTemplate.version;
    project.template.preset = packageTemplate.templateId;
    project.template.package = {
      templateId: packageTemplate.templateId,
      version: packageTemplate.version,
      status: packageTemplate.extractionStatus || 'review'
    };
    project.template.pageComposition = { type: 'desk-academic-package', pageCount: 28, monthPairCount: 12 };
    project.template.metadata = {
      ...(project.template.metadata || {}),
      name: '학사달력 표준 탁상형 · Runtime 정밀형',
      sampleFamily: 'desk-academic-standard',
      productRuntime: 'desk-runtime-parity.v1'
    };
    project.settings.template = packageTemplate.templateId;
    project.settings.calendarRows = Number(packageTemplate.calendar?.defaultRows || 5);
    project.settings.weekStart = packageTemplate.calendar?.defaultWeekStart || 'sunday';
    project.book.elementsByPage = {};
    pages.forEach((page, index) => {
      page.sequenceIndex = index;
      const definitions = packageTemplate.masterDefinitions[page.packageRole] || [];
      project.book.elementsByPage[page.id] = elementsForPage(definitions, page);
      if (page.packageRole === 'monthly-calendar') {
        const calendar = definitions.find(item => item.type === 'calendar');
        const region = calendar?.layoutContract?.calendarFramePct || calendar?.framePct;
        if (region) project.template.masters.calendar.calendarRegion = clone(region);
        page.layoutContract = clone(calendar?.layoutContract);
      }
    });
    project.book.sheets.forEach(sheet => {
      sheet.role = sheet.surfaces.map(page => page.packageRole).join('+');
    });
    project.book.monthlyImages ||= Object.fromEntries(months.map(month => [`${month.year}-${String(month.month).padStart(2, '0')}`, '']));
    return project;
  }

  async function loadAndApply(project, packageBase, fetcher = root.fetch?.bind(root)) {
    if (!fetcher) throw new TypeError('fetcher is required');
    const files = await root.ACDLTemplatePackageLoader.load(fetcher, packageBase);
    const result = applyPackage(project, files.template);
    result.template.package.base = packageBase;
    return result;
  }

  root.ACDLPackageProjectAdapter = Object.freeze({ applyPackage, loadAndApply });
})(typeof window !== 'undefined' ? window : globalThis);
