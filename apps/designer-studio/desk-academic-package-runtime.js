(function (root) {
  function readPath(source, path) {
    return String(path || '').split('.').filter(Boolean).reduce((value, key) => value == null ? undefined : value[key], source);
  }

  function frameFromPct(frame, size) {
    const source = frame || { x: 0, y: 0, width: 100, height: 100 };
    return {
      x: Number(source.x || 0) / 100 * size.width,
      y: Number(source.y || 0) / 100 * size.height,
      width: Number(source.width == null ? 100 : source.width) / 100 * size.width,
      height: Number(source.height == null ? 100 : source.height) / 100 * size.height
    };
  }

  function runtimeObject(definition, page, dataset, index) {
    const bindingPattern = definition.bindingPattern || definition.targetBindingPattern || definition.binding;
    const binding = root.ACDLDatasetDomain?.resolvePageBinding(bindingPattern, page) || bindingPattern;
    let payload = definition.bindings
      ? Object.fromEntries(Object.entries(definition.bindings).map(([key, path]) => [key, readPath(dataset, path)]))
      : binding ? readPath(dataset, binding) : undefined;
    if ((payload === undefined || payload === null || payload === '') && definition.fallbackBinding) {
      payload = readPath(dataset, definition.fallbackBinding);
    }
    let contract;
    if (definition.type === 'composite-master') {
      contract = {
        ...definition.layout,
        children: (definition.layout?.children || []).map(child => {
          const childBinding = root.ACDLDatasetDomain?.resolvePageBinding(child.bindingPattern, page) || child.bindingPattern;
          const footer = child.footer
            ? Object.fromEntries(Object.entries(child.footer).map(([key, path]) => [key, readPath(dataset, path)]))
            : undefined;
          return { ...child, binding: childBinding, payload: childBinding ? readPath(dataset, childBinding) : undefined, footer };
        })
      };
    }
    if (definition.type === 'calendar') {
      payload = { year: page.calendarYear, month: page.calendarMonth, gridRows: dataset.calendar?.gridRows };
    }
    return {
      id: definition.id || `${page.id}.package-object.${index}`,
      sourceObjectId: definition.id,
      type: definition.type || 'semantic-object',
      role: definition.role,
      frame: frameFromPct(definition.framePct, page.size),
      binding,
      payload,
      style: definition.style || {},
      contract,
      metadata: {
        fallbackBinding: definition.fallbackBinding,
        hideEmptyFields: definition.hideEmptyFields,
        hideWhenAllEmpty: definition.hideWhenAllEmpty
      },
      visible: true,
      zIndex: Number(definition.zIndex == null ? index : definition.zIndex)
    };
  }

  function build(adapted, packageTemplate) {
    if (!adapted?.template?.pages || !packageTemplate?.masterDefinitions) {
      throw new TypeError('adapted document and package template are required');
    }
    const dataset = {
      ...adapted.dataset,
      calendar: {
        ...(adapted.dataset.calendar || {}),
        gridRows: Number(packageTemplate.calendar?.defaultRows || adapted.dataset.calendar?.gridRows || 5),
        weekStart: packageTemplate.calendar?.defaultWeekStart || adapted.dataset.calendar?.weekStart || 'sunday'
      }
    };
    const pages = adapted.template.pages.map(page => {
      const definitions = packageTemplate.masterDefinitions[page.role] || [];
      const bindingPage = {
        ...page,
        calendarYear: page.calendarYear ?? page.metadata?.calendarYear,
        calendarMonth: page.calendarMonth ?? page.metadata?.calendarMonth
      };
      return {
        ...page,
        objects: definitions.map((definition, index) => runtimeObject(definition, bindingPage, dataset, index)),
        metadata: { ...page.metadata, packageMasterRole: page.role }
      };
    });
    return {
      template: {
        schemaVersion: packageTemplate.schemaVersion,
        id: packageTemplate.templateId,
        revision: packageTemplate.version,
        pages
      },
      dataset,
      composition: adapted.composition,
      packageStatus: packageTemplate.extractionStatus
    };
  }

  function validate(document) {
    const diagnostics = [];
    const pages = document?.template?.pages || [];
    if (pages.length !== 28) diagnostics.push({ severity: 'error', code: 'PACKAGE_SURFACE_COUNT', expected: 28, actual: pages.length });
    for (const page of pages) {
      if (!page.objects.length) diagnostics.push({ severity: 'error', code: 'PACKAGE_MASTER_EMPTY', pageId: page.id, role: page.role });
      if (page.role === 'monthly-photo-memo') {
        const photo = page.objects[0]?.contract?.children?.find(child => child.id === 'monthly-photo');
        if (!photo?.payload) diagnostics.push({ severity: 'info', code: 'PACKAGE_MONTHLY_IMAGE_EMPTY', pageId: page.id, binding: photo?.binding });
      }
      if (page.role === 'back-contact') {
        const contact = page.objects.find(object => object.id === 'back.contact-card');
        if (!contact || !Object.values(contact.payload || {}).some(Boolean)) diagnostics.push({ severity: 'info', code: 'PACKAGE_CONTACT_EMPTY', pageId: page.id });
      }
      if (page.role === 'monthly-calendar') {
        const calendar = page.objects.find(object => object.type === 'calendar');
        if (calendar?.payload?.gridRows !== 5) diagnostics.push({ severity: 'error', code: 'PACKAGE_CALENDAR_ROWS', pageId: page.id, actual: calendar?.payload?.gridRows });
      }
    }
    return diagnostics;
  }

  root.ACDLDeskAcademicPackageRuntime = Object.freeze({ build, validate });
})(typeof window !== 'undefined' ? window : globalThis);
