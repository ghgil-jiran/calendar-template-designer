(function (root) {
  const STORAGE_KEY = 'acdl.scheduleExtractApiUrl';
  const DEFAULT_ENDPOINT = 'http://localhost:3000/api/ai/schedule-extract';
  const CATEGORY_LABELS = { exam: '시험', vacation: '방학', event: '행사', custom: '기타' };

  function isRemote() {
    return !['localhost', '127.0.0.1', ''].includes(root.location?.hostname || '');
  }

  function endpoint() {
    if (isRemote()) return root.location.origin + '/api/schedule-extract';
    return localStorage.getItem(STORAGE_KEY) || root.ACDL_SCHEDULE_EXTRACT_API_URL || DEFAULT_ENDPOINT;
  }

  function setEndpoint(value) {
    if (isRemote()) return endpoint();
    const normalized = String(value || '').trim().replace(/\/$/, '');
    if (!/^https?:\/\//i.test(normalized)) throw new Error('API 주소는 http:// 또는 https://로 시작해야 합니다.');
    const url = normalized.endsWith('/api/ai/schedule-extract') ? normalized : normalized + '/api/ai/schedule-extract';
    localStorage.setItem(STORAGE_KEY, url);
    return url;
  }

  function toEditorEvents(schedules) {
    const events = (Array.isArray(schedules) ? schedules : []).map((item, index) => ({
      id: `ai-import-${Date.now()}-${index}`,
      title: String(item.label || '').trim(),
      startDate: item.date,
      endDate: item.endDate || item.date,
      category: item.category || 'custom',
      source: 'user-import',
      priority: item.category === 'vacation' ? 85 : item.category === 'exam' ? 80 : 70
    })).filter(item => item.title && /^\d{4}-\d{2}-\d{2}$/.test(item.startDate));
    return root.ACDLCalendarDomain?.assignCalendarScheduleColors
      ? root.ACDLCalendarDomain.assignCalendarScheduleColors(events)
      : events;
  }

  async function extract(file, options) {
    const form = new FormData();
    form.append('file', file);
    form.append('academicYear', String(options?.academicYear || ''));
    form.append('startMonth', String(options?.startMonth || 3));
    const target = options?.endpoint || endpoint();
    const guarded = isRemote() && target === endpoint();
    const request = async () => {
      const headers = {};
      if (guarded) {
        const accessToken = root.ACDLTemplateRemotePersistence?.accessToken?.();
        if (!accessToken) throw new Error('템플릿 에디터 원격 저장 접근 코드가 필요합니다.');
        headers['x-template-editor-token'] = accessToken;
      }
      return fetch(target, { method: 'POST', headers, body: form });
    };
    let response = await request();
    if (response.status === 401 && guarded) {
      root.ACDLTemplateRemotePersistence?.clearAccessToken?.();
      response = await request();
    }
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = body?.error?.message || (response.status === 401 ? '템플릿 에디터 접근 코드가 일치하지 않습니다.' : `일정 추출 API 오류 (${response.status})`);
      throw new Error(message);
    }
    if (!Array.isArray(body.schedules)) throw new Error('일정 추출 API 응답에 schedules 배열이 없습니다.');
    return body;
  }

  function formatDate(item) {
    if (!item.endDate || item.endDate === item.date) return item.date;
    return `${item.date} ~ ${item.endDate}`;
  }

  const REFERENCE_DEFAULT_ENDPOINT = 'http://localhost:3000/api/calendar/reference';
  const referenceInflight = new Map();

  function referenceEndpoint(year) {
    const base = isRemote() ? root.location.origin + '/api/calendar-reference' : REFERENCE_DEFAULT_ENDPOINT;
    return base + '?year=' + encodeURIComponent(year);
  }

  function calendarYears(targetProject) {
    const pages = targetProject?.book?.pageInstances || [];
    const years = pages.filter(page => page?.role === 'monthly-front').map(page => Number(page.calendarYear)).filter(Number.isFinite);
    if (!years.length) {
      const startYear = Number(targetProject?.settings?.calendarYear) || new Date().getFullYear();
      const startMonth = Number(targetProject?.settings?.startMonth) || 3;
      years.push(startYear);
      if (startMonth > 1) years.push(startYear + 1);
    }
    return [...new Set(years)].sort();
  }

  async function fetchReferenceYear(year) {
    const target = referenceEndpoint(year);
    const guarded = isRemote();
    const headers = {};
    if (guarded) {
      const accessToken = root.ACDLTemplateRemotePersistence?.accessToken?.();
      if (!accessToken) throw new Error('템플릿 에디터 원격 저장 접근 코드가 필요합니다.');
      headers['x-template-editor-token'] = accessToken;
    }
    const response = await fetch(target, { headers });
    const body = await response.json().catch(() => ({}));
    if (!response.ok || body?.ok === false) {
      const message = body?.error?.message || (response.status === 401 ? '템플릿 에디터 접근 코드가 일치하지 않습니다.' : `공공 달력 API 오류 (${response.status})`);
      throw new Error(message);
    }
    return body;
  }

  function hasReferenceYear(value) {
    return ['public_holiday', 'anniversary', 'solar_term'].every(category => Array.isArray(value?.[category]?.items));
  }

  async function ensureCalendarReferences(targetProject = project, options = {}) {
    if (!targetProject?.book) return null;
    targetProject.book.calendarReference ||= { schemaVersion: 'calendar-reference.v1', years: {} };
    targetProject.book.calendarReference.years ||= {};
    const missing = calendarYears(targetProject).filter(year => options.force || !hasReferenceYear(targetProject.book.calendarReference.years[String(year)]));
    await Promise.all(missing.map(year => {
      if (!referenceInflight.has(year)) {
        referenceInflight.set(year, fetchReferenceYear(year).then(body => {
          if (!body?.data || !hasReferenceYear(body.data)) throw new Error('공공 달력 API 응답 형식이 올바르지 않습니다.');
          targetProject.book.calendarReference.years[String(year)] = body.data;
          return body;
        }).finally(() => referenceInflight.delete(year)));
      }
      return referenceInflight.get(year);
    }));
    if (missing.length) {
      markDirty?.();
      render?.();
    }
    return targetProject.book.calendarReference;
  }

  function mountReviewPanel() {
    const preview = document.getElementById('resourceSchedulePreview');
    if (!preview || document.getElementById('resourceScheduleAiPanel')) return;
    const panel = document.createElement('section');
    panel.id = 'resourceScheduleAiPanel';
    panel.className = 'schedule-ai-panel';
    panel.innerHTML = `
      <div class="schedule-ai-head">
        <div><strong>추출된 학사일정 확인</strong><small>사용자 서비스와 같은 AI 추출 규칙을 사용합니다.</small></div>
        <span id="resourceScheduleAiState">등록 전</span>
      </div>
      <label class="schedule-api-field">공통 일정 추출 API 주소
        <div><input id="resourceScheduleApiUrl" type="url" value="${endpoint()}" aria-label="공통 일정 추출 API 주소" ${isRemote() ? 'readonly' : ''}><button id="resourceScheduleApiSave" type="button" ${isRemote() ? 'disabled' : ''}>${isRemote() ? '운영 자동 연결' : '주소 저장'}</button></div>
        <small>${isRemote() ? '배포본은 템플릿 에디터 서버를 통해 사용자 서비스의 공통 AI 모듈에 자동 연결됩니다.' : '로컬 사용자 서비스는 http://localhost:3000, 또는 사용자 서비스 공개 주소를 입력하세요. API 키는 서버에만 보관됩니다.'}</small>
      </label>
      <div id="resourceScheduleSummary" class="schedule-summary">파일을 등록하면 추출 건수와 분류를 보여줍니다.</div>
      <div id="resourceScheduleMonths" class="schedule-months" role="group" aria-label="일정 월 필터"></div>
      <div id="resourceScheduleList" class="schedule-review-list"><p>등록된 일정이 없습니다.</p></div>
    `;
    preview.insertAdjacentElement('afterend', panel);
    document.getElementById('resourceScheduleApiSave').addEventListener('click', () => {
      try {
        const value = setEndpoint(document.getElementById('resourceScheduleApiUrl').value);
        document.getElementById('resourceScheduleApiUrl').value = value;
        showEditorToast?.('공통 일정 추출 API 주소를 저장했습니다.');
      } catch (error) {
        showEditorToast?.(error.message);
      }
    });
  }

  function renderReview(result, activeMonth) {
    mountReviewPanel();
    const schedules = Array.isArray(result?.schedules) ? result.schedules : [];
    const months = [...new Set(schedules.map(item => item.date.slice(0, 7)))].sort();
    const filter = activeMonth || 'all';
    const visible = filter === 'all' ? schedules : schedules.filter(item => item.date.startsWith(filter));
    const summary = document.getElementById('resourceScheduleSummary');
    const categoryText = (result.byType || []).map(item => `${item.label} ${item.count}건`).join(' · ');
    summary.innerHTML = `<strong>총 ${schedules.length}건</strong>${categoryText ? ` · ${categoryText}` : ''}${result.holidayExcluded ? `<br><span>공휴일 ${result.holidayExcluded}건은 자동 표시 대상으로 제외했습니다.</span>` : ''}`;
    const monthBar = document.getElementById('resourceScheduleMonths');
    monthBar.innerHTML = ['all', ...months].map(month => `<button type="button" data-schedule-month="${month}" class="${month === filter ? 'active' : ''}">${month === 'all' ? '전체' : Number(month.slice(5)) + '월'}</button>`).join('');
    monthBar.querySelectorAll('button').forEach(button => button.addEventListener('click', () => renderReview(result, button.dataset.scheduleMonth)));
    const list = document.getElementById('resourceScheduleList');
    list.innerHTML = visible.length ? visible.map(item => `
      <article class="schedule-review-item">
        <span class="schedule-category ${item.category || 'custom'}">${CATEGORY_LABELS[item.category] || '기타'}</span>
        <div><strong>${escapeHtml(item.label)}</strong><small>${formatDate(item)}</small></div>
      </article>`).join('') : '<p>선택한 월에 등록된 일정이 없습니다.</p>';
  }

  function escapeHtml(value) {
    const node = document.createElement('span');
    node.textContent = String(value || '');
    return node.innerHTML;
  }

  async function handleResourceFile(file) {
    mountReviewPanel();
    const state = document.getElementById('resourceScheduleAiState');
    state.textContent = 'AI 분석 중';
    state.className = 'loading';
    const year = Number(document.getElementById('resourceCalendarYear')?.value) || new Date().getFullYear();
    const startMonth = Number(document.getElementById('resourceStartMonth')?.value) || 3;
    try {
      const result = await extract(file, { academicYear: year, startMonth, endpoint: endpoint() });
      const events = toEditorEvents(result.schedules);
      project.book.scheduleImport = {
        fileName: file.name,
        fileType: file.type || file.name.split('.').pop(),
        size: file.size,
        registeredAt: new Date().toISOString(),
        events,
        apiResult: result,
        extraction: 'shared-anthropic-api',
        status: 'parsed'
      };
      project.book.events = [...(project.book.events || []).filter(item => item.source !== 'user-import'), ...events];
      project.template.masters.calendar.rangeEventStyle ||= { enabled: true, contractId: 'user-service-v1.1', contractRevision: '1.0.0', labelMode: 'every', labelPosition: 'inside', barHeight: 14, laneGap: 1, maxLanes: 4, continuationStyle: 'arrow', overflowStyle: 'count' };
      project.template.masters.calendar.rangeEventStyle.enabled = true;
      project.template.masters.calendar.rangeEventStyle.contractId = 'user-service-v1.1';
      project.template.masters.calendar.rangeEventStyle.contractRevision = '1.0.0';
      project.book.scheduleDisplay = { schemaVersion: 'academic-schedule-display.v1', contractId: 'user-service-v1.1', revision: '1.0.0' };
      document.getElementById('resourceScheduleFileName').textContent = file.name;
      document.getElementById('resourceScheduleFileStatus').textContent = `${events.length}개 샘플 일정을 공통 AI로 추출했습니다.`;
      previewResult(result);
      renderReview(result);
      state.textContent = '추출 완료';
      state.className = 'ready';
      markDirty();
      render();
      ensureCalendarReferences(project).catch(error => showEditorToast?.(error.message));
      showEditorToast?.(`${events.length}개 학사일정을 반영했습니다.`);
    } catch (error) {
      state.textContent = '추출 실패';
      state.className = 'error';
      document.getElementById('resourceScheduleFileStatus').textContent = error.message;
      showEditorToast?.(error.message);
    } finally {
      const input = document.getElementById('resourceScheduleInput');
      if (input) input.value = '';
    }
  }

  function previewResult(result) {
    const preview = document.getElementById('resourceSchedulePreview');
    preview.classList.remove('hidden');
    preview.innerHTML = `공통 AI 추출 완료 · 총 ${result.total ?? result.schedules.length}건`;
  }

  document.addEventListener('change', event => {
    if (event.target?.id !== 'resourceScheduleInput') return;
    const file = event.target.files?.[0];
    if (!file) return;
    event.stopImmediatePropagation();
    handleResourceFile(file);
  }, true);

  document.addEventListener('DOMContentLoaded', () => {
    mountReviewPanel();
    const input = document.getElementById('resourceScheduleInput');
    if (input) input.accept = '.pdf,.xlsx,.xls,.docx,.hwpx,.csv,.txt';
    const saved = project?.book?.scheduleImport?.apiResult;
    if (saved?.schedules) renderReview(saved);
    ensureCalendarReferences(project).catch(error => showEditorToast?.(error.message));
  });

  root.ACDLScheduleApiClient = Object.freeze({ isRemote, endpoint, setEndpoint, extract, toEditorEvents, renderReview, referenceEndpoint, fetchReferenceYear, ensureCalendarReferences });
})(typeof window !== 'undefined' ? window : globalThis);
