(function (root) {
  const REFERENCE = Object.freeze({
    pdfStandard: 'PDF/X-4',
    productionSize: { width: 266, height: 186, unit: 'mm' },
    trimSize: { width: 260, height: 180, unit: 'mm' },
    bleed: { top: 3, right: 3, bottom: 3, left: 3, unit: 'mm' },
    colorProfile: 'Japan Color 2011 Coated',
    cropMarkWidth: { value: 0.540, unit: 'pt' },
    blackRule: 'K100',
    fontHandling: 'outline',
    boxes: ['TrimBox', 'BleedBox']
  });

  function equal(left, right) {
    return JSON.stringify(left) === JSON.stringify(right);
  }

  function compare(profile, approval) {
    const issues = [];
    for (const key of Object.keys(REFERENCE)) {
      if (!equal(profile?.[key], REFERENCE[key])) issues.push({ code: `PRINT_${key.replace(/[A-Z]/g, letter => `_${letter}`).toUpperCase()}_MISMATCH`, expected: REFERENCE[key], actual: profile?.[key] });
    }
    const outputApproved = issues.length === 0 && approval?.print?.status === 'approved';
    return {
      schemaVersion: 'desk-academic-print-parity.v1',
      reference: REFERENCE,
      issues,
      contractReady: issues.length === 0,
      outputApproved,
      approval: approval?.print || null,
      blockers: outputApproved ? [] : approval?.print?.blockers || ['PRINT_APPROVAL_MISSING']
    };
  }

  root.ACDLDeskAcademicPrintParity = Object.freeze({ REFERENCE, compare });
})(typeof window !== 'undefined' ? window : globalThis);
