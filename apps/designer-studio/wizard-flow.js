(function (root) {
  const STORAGE_KEY = 'acdl-user-wizard-state';

  function safeStorage() {
    try { return root.localStorage || null; } catch (_) { return null; }
  }

  function isNonEmptyString(value) {
    return typeof value === 'string' && value.trim() !== '';
  }

  function normalizeState(state, fallbackType = null) {
    const step = Math.max(1, Math.min(5, Number(state?.step) || 1));
    const calendarType = isNonEmptyString(state?.calendarType)
      ? state.calendarType
      : isNonEmptyString(state?.selectedType)
        ? state.selectedType
        : null;
    const templateId = isNonEmptyString(state?.templateId)
      ? state.templateId
      : isNonEmptyString(state?.template)
        ? state.template
        : null;
    return {
      step,
      calendarType,
      templateId,
      validationMessage: ''
    };
  }

  function createFreshWizardState() {
    return {
      step: 1,
      calendarType: null,
      templateId: null,
      validationMessage: '달력 유형을 선택해 주세요.'
    };
  }

  function buildValidationMessage(state) {
    const payload = normalizeState(state);
    if (!payload.calendarType) return '달력 유형을 선택해 주세요.';
    if (payload.step === 2 && !payload.templateId) return '사용할 템플릿을 선택해 주세요.';
    return '';
  }

  function selectCalendarType(state, type) {
    const payload = normalizeState(state);
    const nextType = isNonEmptyString(type) ? type : payload.calendarType;
    return {
      ...payload,
      calendarType: nextType,
      templateId: null,
      validationMessage: buildValidationMessage({ ...payload, calendarType: nextType, templateId: null })
    };
  }

  function selectTemplate(state, templateId) {
    const payload = normalizeState(state);
    const nextTemplate = isNonEmptyString(templateId) ? templateId : payload.templateId;
    return {
      ...payload,
      templateId: nextTemplate,
      validationMessage: buildValidationMessage({ ...payload, templateId: nextTemplate })
    };
  }

  function validateWizardStep(state) {
    const payload = normalizeState(state);
    payload.validationMessage = buildValidationMessage(payload);
    return payload;
  }

  function moveWizardStep(state, direction) {
    const payload = normalizeState(state);
    const delta = direction === 'prev' ? -1 : direction === 'next' ? 1 : Number(direction) || 0;
    const nextStep = Math.max(1, Math.min(5, payload.step + delta));
    return {
      ...payload,
      step: nextStep,
      validationMessage: buildValidationMessage({ ...payload, step: nextStep })
    };
  }

  function restoreWizardState(storageKey = STORAGE_KEY, options = {}) {
    const storage = safeStorage();
    if (!storage || options.allowStored === false) return createFreshWizardState();
    try {
      const raw = storage.getItem(storageKey);
      if (!raw) return createFreshWizardState();
      return validateWizardStep(JSON.parse(raw));
    } catch (_) {
      return createFreshWizardState();
    }
  }

  function resetWizardState(storageKey = STORAGE_KEY) {
    const storage = safeStorage();
    if (!storage) return createFreshWizardState();
    const payload = createFreshWizardState();
    storage.setItem(storageKey, JSON.stringify(payload));
    return payload;
  }

  function persistWizardState(state, storageKey = STORAGE_KEY) {
    const storage = safeStorage();
    if (!storage) return null;
    const payload = validateWizardStep(state);
    storage.setItem(storageKey, JSON.stringify(payload));
    return payload;
  }

  function applyTypeSelection(state, type, template) {
    const payload = selectCalendarType(state, type);
    const nextTemplate = isNonEmptyString(template) ? template : payload.templateId;
    return selectTemplate(payload, nextTemplate);
  }

  function syncWizardUi(state, doc = root.document) {
    const payload = validateWizardStep(state);
    const userWizardStep = Number(payload.step) || 1;
    const buttons = {
      prev: doc?.getElementById?.('userPrevBtn'),
      next: doc?.getElementById?.('userNextBtn'),
      create: doc?.getElementById?.('userCreateBtn')
    };

    doc?.querySelectorAll?.('[data-user-step]').forEach((node) => {
      const active = Number(node.dataset.userStep) === userWizardStep;
      node.classList.toggle('active', active);
    });
    doc?.querySelectorAll?.('.wizard-step-dot').forEach((node, index) => {
      node.classList.toggle('active', index < userWizardStep);
    });
    buttons.prev?.classList?.toggle('hidden', userWizardStep === 1);
    buttons.next?.classList?.toggle('hidden', userWizardStep === 5);
    buttons.create?.classList?.toggle('hidden', userWizardStep !== 5);

    doc?.querySelectorAll?.('[data-calendar-type]').forEach((node) => {
      node.classList.toggle('selected', node.dataset.calendarType === payload.calendarType);
      node.setAttribute('aria-pressed', node.dataset.calendarType === payload.calendarType ? 'true' : 'false');
    });

    doc?.querySelectorAll?.('[data-user-template]').forEach((node) => {
      const matches = node.dataset.userType === payload.calendarType;
      node.classList.toggle('hidden-by-type', !matches);
      if (!matches) {
        node.classList.remove('selected');
        node.setAttribute('aria-pressed', 'false');
        return;
      }
      const active = Boolean(node.dataset.userTemplate) && node.dataset.userTemplate === payload.templateId && node.dataset.userType === payload.calendarType;
      node.classList.toggle('selected', active);
      node.setAttribute('aria-pressed', active ? 'true' : 'false');
    });

    const typeLabel = doc?.getElementById?.('selectedTypeLabel');
    if (typeLabel) {
      typeLabel.textContent = { desk: '탁상형', wall: '벽걸이형', poster: '연간 포스터형', postcard: '엽서형' }[payload.calendarType] || (payload.calendarType || '달력 유형을 선택해 주세요.');
    }

    return payload;
  }

  root.ACDLDesignerStudioWizard = {
    STORAGE_KEY,
    createFreshWizardState,
    normalizeState,
    selectCalendarType,
    selectTemplate,
    validateWizardStep,
    moveWizardStep,
    restoreWizardState,
    resetWizardState,
    persistWizardState,
    applyTypeSelection,
    syncWizardUi
  };
})(typeof window !== 'undefined' ? window : globalThis);
