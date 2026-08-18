(function (root) {
  const REQUIRED_SOURCE = 'jirantech-calendar-editor-v1.1';

  function diagnostic(severity, code, message, path) {
    return { severity, code, message, ...(path ? { path } : {}) };
  }

  function isAssetRef(value) {
    return Boolean(value && typeof value === 'object' && (
      (value.ref === 'idb' && typeof value.id === 'string' && value.id.length > 0) ||
      (value.ref === 'url' && typeof value.src === 'string' && value.src.length > 0)
    ));
  }

  function inspectDataset(dataset) {
    const diagnostics = [];
    if (!dataset || typeof dataset !== 'object') {
      return [diagnostic('error', 'INVALID_DATASET', 'Runtime Dataset이 객체가 아닙니다.', 'dataset')];
    }
    if (dataset.schemaVersion !== '1.0') diagnostics.push(diagnostic('error', 'UNSUPPORTED_SCHEMA', 'Dataset Contract 1.0만 지원합니다.', 'schemaVersion'));
    if (dataset.locale !== 'ko-KR') diagnostics.push(diagnostic('error', 'UNSUPPORTED_LOCALE', '사용자 서비스 Dataset locale은 ko-KR이어야 합니다.', 'locale'));
    if (dataset.timezone !== 'Asia/Seoul') diagnostics.push(diagnostic('error', 'UNSUPPORTED_TIMEZONE', '사용자 서비스 Dataset timezone은 Asia/Seoul이어야 합니다.', 'timezone'));
    if (!String(dataset.school?.name || '').trim()) diagnostics.push(diagnostic('error', 'MISSING_SCHOOL_NAME', '학교명이 비어 있습니다.', 'school.name'));
    if (!Array.isArray(dataset.school?.contacts)) diagnostics.push(diagnostic('error', 'INVALID_CONTACTS', '학교 연락처는 배열이어야 합니다.', 'school.contacts'));

    const calendar = dataset.calendar || {};
    if (!Number.isInteger(calendar.year)) diagnostics.push(diagnostic('error', 'INVALID_YEAR', '학사연도는 정수여야 합니다.', 'calendar.year'));
    if (calendar.startMonth !== 3) diagnostics.push(diagnostic('error', 'INVALID_START_MONTH', '사용자 서비스 v1.1은 3월 시작 달력이어야 합니다.', 'calendar.startMonth'));
    if (calendar.weekStart !== 'sunday') diagnostics.push(diagnostic('error', 'INVALID_WEEK_START', '사용자 서비스 v1.1은 일요일 시작 달력이어야 합니다.', 'calendar.weekStart'));
    if (calendar.gridRows !== 5) diagnostics.push(diagnostic('error', 'INVALID_GRID_ROWS', '사용자 서비스 v1.1 월력은 5행이어야 합니다.', 'calendar.gridRows'));
    if (!Array.isArray(calendar.events)) diagnostics.push(diagnostic('error', 'INVALID_EVENTS', '학사일정은 배열이어야 합니다.', 'calendar.events'));

    for (const [key, item] of Object.entries(dataset.monthlyImages || {})) {
      if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(key)) diagnostics.push(diagnostic('error', 'INVALID_MONTH_KEY', `월별 이미지 키가 유효하지 않습니다: ${key}`, `monthlyImages.${key}`));
      if (!isAssetRef(item?.assetRef)) diagnostics.push(diagnostic('error', 'INVALID_ASSET_REF', `월별 이미지 참조가 유효하지 않습니다: ${key}`, `monthlyImages.${key}.assetRef`));
      if (!Number.isInteger(item?.sourcePageN)) diagnostics.push(diagnostic('error', 'INVALID_SOURCE_PAGE', `월별 이미지 원본 쪽수가 유효하지 않습니다: ${key}`, `monthlyImages.${key}.sourcePageN`));
    }

    if (dataset.variables?.source !== REQUIRED_SOURCE) diagnostics.push(diagnostic('error', 'INVALID_SOURCE', '사용자 서비스 v1.1에서 생성한 Dataset이 아닙니다.', 'variables.source'));
    if (!String(dataset.variables?.sourceDocumentId || '').trim()) diagnostics.push(diagnostic('error', 'MISSING_SOURCE_DOCUMENT', '원본 문서 ID가 없습니다.', 'variables.sourceDocumentId'));
    if (!String(dataset.variables?.sourceTemplateId || '').trim()) diagnostics.push(diagnostic('error', 'MISSING_SOURCE_TEMPLATE', '원본 템플릿 ID가 없습니다.', 'variables.sourceTemplateId'));
    return diagnostics;
  }

  function accept(adapterResult) {
    if (!adapterResult || typeof adapterResult !== 'object') throw new TypeError('adapterResult must be an object');
    const upstream = Array.isArray(adapterResult.diagnostics) ? adapterResult.diagnostics : [];
    const diagnostics = [...upstream, ...inspectDataset(adapterResult.dataset)];
    return Object.freeze({
      dataset: adapterResult.dataset,
      diagnostics,
      hasErrors: Boolean(adapterResult.hasErrors) || diagnostics.some(item => item?.severity === 'error')
    });
  }

  root.ACDLUserServiceDatasetBridge = Object.freeze({ REQUIRED_SOURCE, isAssetRef, inspectDataset, accept });
})(typeof window !== 'undefined' ? window : globalThis);
