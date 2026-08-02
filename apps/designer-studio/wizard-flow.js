(function (root) {
  const STORAGE_KEY = 'acdl-user-wizard-state';

  function safeStorage() {
    try { return root.localStorage || null; } catch (_) { return null; }
  }

  function normalizeState(state, fallbackType = '') {
    const selectedType = typeof state?.selectedType === 'string' && state.selectedType ? state.selectedType : fallbackType;
    const template = typeof state?.template === 'string' && state.template ? state.template : '';
    const step = Math.max(1, Math.min(5, Number(state?.step) || 1));
    return { selectedType, template, step };
  }

  function restoreWizardState(storageKey = STORAGE_KEY) {
    const storage = safeStorage();
    if (!storage) return normalizeState(null);
    try {
      const raw = storage.getItem(storageKey);
      if (!raw) return normalizeState(null);
      return normalizeState(JSON.parse(raw));
    } catch (_) {
      return normalizeState(null);
    }
  }

  function persistWizardState(state, storageKey = STORAGE_KEY) {
    const storage = safeStorage();
    if (!storage) return null;
    const payload = normalizeState(state);
    storage.setItem(storageKey, JSON.stringify(payload));
    return payload;
  }

  function applyTypeSelection(state, type, template) {
    const payload = normalizeState(state, type || '');
    const nextType = typeof type === 'string' && type ? type : payload.selectedType;
    const typeChanged = nextType !== payload.selectedType;
    const nextTemplate = typeof template === 'string' ? template : (typeChanged ? '' : payload.template);
    return { ...payload, selectedType: nextType, template: nextTemplate, step: payload.step };
  }

  function syncWizardUi(state, doc = root.document) {
    const payload = normalizeState(state);
    const userWizardStep = Number(payload.step) || 1;
    const buttons = {
      prev: doc?.getElementById?.('userPrevBtn'),
      next: doc?.getElementById?.('userNextBtn'),
      create: doc?.getElementById?.('userCreateBtn'),
      summary: doc?.getElementById?.('userWizardSummary')
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
      node.classList.toggle('selected', node.dataset.calendarType === payload.selectedType);
      node.setAttribute?.('aria-pressed', String(node.dataset.calendarType === payload.selectedType));
    });

    doc?.querySelectorAll?.('[data-user-template]').forEach((node) => {
      const matches = node.dataset.userType === payload.selectedType;
      node.classList.toggle('hidden-by-type', !matches);
      if (!matches) node.classList.remove('selected');
    });

    const selectedCard = payload.template
      ? doc?.querySelector?.(`[data-user-template="${payload.template}"][data-user-type="${payload.selectedType}"]`)
      : null;
    if (selectedCard) {
      doc?.querySelectorAll?.('[data-user-template]').forEach((node) => node.classList.remove('selected'));
      selectedCard.classList.add('selected');
    }

    const typeLabel = doc?.getElementById?.('selectedTypeLabel');
    if (typeLabel) {
      typeLabel.textContent = { desk: '탁상형', wall: '벽걸이형', poster: '연간 포스터형', postcard: '엽서형' }[payload.selectedType] || payload.selectedType;
    }

    return payload;
  }

  root.ACDLDesignerStudioWizard = {
    STORAGE_KEY,
    restoreWizardState,
    persistWizardState,
    applyTypeSelection,
    syncWizardUi
  };
})(typeof window !== 'undefined' ? window : globalThis);
