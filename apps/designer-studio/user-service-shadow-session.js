(function (root) {
  function eventSignature(events) {
    return JSON.stringify((events || []).map(item => ({
      id: item?.id,
      title: item?.title,
      startDate: item?.startDate,
      endDate: item?.endDate,
      range: item?.range
    })));
  }

  function compareData(source, resolved, document) {
    const issues = [];
    const output = document?.dataset || {};
    if (source?.school?.name !== output?.school?.name) {
      issues.push({ severity: 'error', code: 'SHADOW_SCHOOL_NAME_MISMATCH', expected: source?.school?.name, actual: output?.school?.name });
    }
    if (eventSignature(source?.calendar?.events) !== eventSignature(output?.calendar?.events)) {
      issues.push({ severity: 'error', code: 'SHADOW_EVENTS_MISMATCH' });
    }
    const contact = output?.school?.contact || {};
    const contacts = Array.isArray(source?.school?.contacts) ? source.school.contacts : [];
    const expectedContact = {
      address: source?.school?.address || '',
      telAcademic: contacts.find(item => item?.type === 'academic')?.value || '',
      telAdmin: contacts.find(item => item?.type === 'admin')?.value || '',
      fax: contacts.find(item => item?.type === 'fax')?.value || '',
      site: source?.school?.website || ''
    };
    if (JSON.stringify(expectedContact) !== JSON.stringify(contact)) {
      issues.push({ severity: 'error', code: 'SHADOW_CONTACT_MISMATCH', expected: expectedContact, actual: contact });
    }
    const expectedMonths = Object.keys(source?.monthlyImages || {}).sort();
    const actualMonths = Object.keys(output?.monthlyImages || {}).sort();
    if (JSON.stringify(expectedMonths) !== JSON.stringify(actualMonths)) {
      issues.push({ severity: 'error', code: 'SHADOW_MONTHLY_IMAGE_KEYS_MISMATCH', expected: expectedMonths, actual: actualMonths });
    }
    for (const key of expectedMonths) {
      if (!resolved?.monthlyImages?.[key]?.src) {
        issues.push({ severity: 'warning', code: 'SHADOW_MONTHLY_IMAGE_UNRESOLVED', monthKey: key });
      }
      if (resolved?.monthlyImages?.[key]?.src !== output?.monthlyImages?.[key]?.src) {
        issues.push({ severity: 'error', code: 'SHADOW_MONTHLY_IMAGE_SOURCE_MISMATCH', monthKey: key });
      }
    }
    const pages = document?.template?.pages || [];
    const roles = Object.fromEntries(['cover-front', 'annual-calendar', 'school-symbols', 'monthly-calendar', 'monthly-photo-memo', 'back-contact'].map(role => [role, pages.filter(page => page.role === role).length]));
    const expectedRoles = { 'cover-front': 1, 'annual-calendar': 1, 'school-symbols': 1, 'monthly-calendar': 12, 'monthly-photo-memo': 12, 'back-contact': 1 };
    for (const [role, expected] of Object.entries(expectedRoles)) {
      if (roles[role] !== expected) issues.push({ severity: 'error', code: 'SHADOW_PAGE_ROLE_COUNT', role, expected, actual: roles[role] });
    }
    return {
      schemaVersion: 'user-service-shadow-parity.v1',
      metrics: {
        pageCount: pages.length,
        roles,
        eventCount: source?.calendar?.events?.length || 0,
        contactCount: contacts.length,
        monthlyImageCount: expectedMonths.length,
        resolvedMonthlyImageCount: expectedMonths.filter(key => Boolean(resolved?.monthlyImages?.[key]?.src)).length
      },
      issues,
      matches: !issues.some(item => item.severity === 'error')
    };
  }

  function create(options = {}) {
    const runtimeAdapter = options.runtimeAdapter;
    const packageLoader = options.packageLoader || root.ACDLTemplatePackageLoader;
    const packageRuntime = options.packageRuntime || root.ACDLDeskAcademicPackageRuntime;
    const renderer = options.renderer || root.ACDLDeskAcademicShadowRenderer;
    const visualParity = options.visualParity || root.ACDLDeskAcademicVisualParity;

    async function run(project, adapterResult, packageOptions = {}) {
      if (!runtimeAdapter?.adaptUserServiceWithAssets) throw new Error('Runtime Project Adapter with Asset Resolver is required');
      const adapted = await runtimeAdapter.adaptUserServiceWithAssets(project, adapterResult);
      if (adapted.hasErrors) {
        return Object.freeze({ schemaVersion: 'user-service-shadow-session.v1', status: 'blocked', adapted, diagnostics: adapted.diagnostics, readyForReview: false });
      }
      const pkg = packageOptions.package || await packageLoader.load(packageOptions.fetcher, packageOptions.base);
      const document = packageRuntime.build(adapted, pkg.template);
      const packageDiagnostics = packageRuntime.validate(document);
      const rendered = renderer.renderDocument(document);
      const visual = visualParity.compare(rendered, pkg.parity);
      const data = compareData(adapterResult.dataset, adapted.dataset, document);
      const diagnostics = [...adapted.diagnostics, ...packageDiagnostics, ...data.issues];
      const hasErrors = diagnostics.some(item => item?.severity === 'error') || !visual.structurallyReady;
      return Object.freeze({
        schemaVersion: 'user-service-shadow-session.v1',
        status: hasErrors ? 'blocked' : 'ready',
        package: pkg,
        adapted,
        document,
        rendered,
        parity: { data, visual },
        diagnostics,
        readyForReview: !hasErrors,
        approvedForReplacement: false
      });
    }

    return Object.freeze({ run });
  }

  root.ACDLUserServiceShadowSession = Object.freeze({ eventSignature, compareData, create });
})(typeof window !== 'undefined' ? window : globalThis);
