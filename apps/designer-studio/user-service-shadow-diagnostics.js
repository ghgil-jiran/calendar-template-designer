(function (root) {
  function countBySeverity(items) {
    return (items || []).reduce((result, item) => {
      const severity = item?.severity || 'info';
      result[severity] = (result[severity] || 0) + 1;
      return result;
    }, { error: 0, warning: 0, info: 0 });
  }

  function safeIssue(item) {
    if (!item || typeof item !== 'object') return { severity: 'info', code: 'UNKNOWN_DIAGNOSTIC' };
    const allowed = ['severity', 'code', 'message', 'path', 'pageId', 'role', 'monthKey', 'index'];
    const safe = Object.fromEntries(allowed.filter(key => item[key] !== undefined).map(key => [key, item[key]]));
    for (const key of ['expected', 'actual']) {
      const value = item[key];
      if (typeof value === 'number' || typeof value === 'boolean' || value === null) safe[key] = value;
    }
    return safe;
  }

  function createReport(session, options = {}) {
    if (!session || typeof session !== 'object') throw new TypeError('session result must be an object');
    const diagnostics = (session.diagnostics || []).map(safeIssue);
    const data = session.parity?.data;
    const visual = session.parity?.visual;
    return Object.freeze({
      schemaVersion: 'user-service-shadow-diagnostic.v1',
      generatedAt: options.generatedAt || null,
      source: {
        documentId: options.documentId || null,
        templateId: options.templateId || null,
        datasetSchemaVersion: options.datasetSchemaVersion || session.adapted?.dataset?.schemaVersion || null
      },
      status: session.status || 'blocked',
      readyForReview: session.readyForReview === true,
      approvedForReplacement: false,
      summary: {
        diagnostics: diagnostics.length,
        severities: countBySeverity(diagnostics),
        pageCount: data?.metrics?.pageCount ?? session.rendered?.pageCount ?? 0,
        eventCount: data?.metrics?.eventCount ?? 0,
        contactCount: data?.metrics?.contactCount ?? 0,
        monthlyImageCount: data?.metrics?.monthlyImageCount ?? 0,
        resolvedMonthlyImageCount: data?.metrics?.resolvedMonthlyImageCount ?? 0,
        dataMatches: data?.matches === true,
        visualStructurallyReady: visual?.structurallyReady === true,
        visuallyApproved: visual?.visuallyApproved === true
      },
      issues: diagnostics
    });
  }

  function toJson(session, options) {
    return JSON.stringify(createReport(session, options), null, 2);
  }

  root.ACDLUserServiceShadowDiagnostics = Object.freeze({ countBySeverity, safeIssue, createReport, toJson });
})(typeof window !== 'undefined' ? window : globalThis);
