(function (root) {
  const palette = ['#2fb79d', '#f47c20', '#ec407a', '#3275c8', '#2cb7d5', '#6758ba', '#f47c20', '#8b4a24', '#2cb7d5', '#7554b8', '#ec407a', '#7b8798'];
  const pastel = ['#dff4ee', '#fff0df', '#fde6ee', '#e7edf9', '#e4f7fc', '#eee9f8', '#fff0df', '#f4e9e1', '#e4f7fc', '#eee9f8', '#fde6ee', '#edf0f5'];
  const protectedPlannerPermissions = { move: false, resize: false, rotate: false, color: false, delete: false, duplicate: false, layer: false, content: false };
  const deskPlannerStandard = { catalogId: 'tpl-2028-desk-planner-standard-01', templateKey: 'desk-sample-6', documentVersion: 11 };
  const deskSixReviewAssets = [
    { id: 'asset.sample.desk-6.building', name: '지란중학교 전경', role: 'school-building', binding: 'school.profile.building', kind: '학교 전경', image: 'assets/sample-school/jiran-building.webp' },
    { id: 'asset.sample.desk-6.logo', name: '지란중학교 교표 연결', role: 'school-logo', binding: 'school.profile.logo', kind: '교표', image: 'assets/sample-school/jiran-logo-composite.svg' },
    { id: 'asset.sample.desk-6.song', name: '지란중학교 교가', role: 'school-song', binding: 'school.profile.song', kind: '교가', image: 'assets/sample-school/jiran-song.webp' },
    { id: 'asset.sample.desk-6.tree', name: '은행나무', role: 'school-tree', binding: 'school.profile.tree', kind: '교목', image: 'assets/sample-school/jiran-tree.webp' },
    { id: 'asset.sample.desk-6.flower', name: '장미', role: 'school-flower', binding: 'school.profile.flower', kind: '교화', image: 'assets/sample-school/jiran-flower.webp' }
  ];
  const deskSixReviewProfile = {
    building: { name: '지란중학교', description: '학교 전경', image: 'assets/sample-school/jiran-building.webp', assetId: 'asset.sample.desk-6.building' },
    logo: { name: '지란중학교 교표 연결', description: '', image: 'assets/sample-school/jiran-logo-composite.svg', assetId: 'asset.sample.desk-6.logo' },
    motto: { name: '교훈', description: '슬기롭게, 화목하게, 튼튼하게', image: '' },
    song: { name: '교가', description: '지란중학교 교가', image: 'assets/sample-school/jiran-song.webp', assetId: 'asset.sample.desk-6.song' },
    tree: { name: '은행나무', description: '풍경을 아름답게 함\n중요한 가구재로 쓰임', image: 'assets/sample-school/jiran-tree.webp', assetId: 'asset.sample.desk-6.tree' },
    flower: { name: '장미', description: '고상한 품위와 아름다움\n순결, 정열, 위엄', image: 'assets/sample-school/jiran-flower.webp', assetId: 'asset.sample.desk-6.flower' }
  };
  const deskSixBackgroundPresets = {
    cover: { id: 'background.desk-6.cover', name: '6번 표지 청록 블록', roles: ['cover-front'], parts: [[4,9,89,27,'#3bbcd124'],[-3,31,15,22,'#3bbcd117'],[86,22,14,23,'#3bbcd114'],[8,48,82,18,'#3bbcd118'],[84,55,18,18,'#3bbcd114'],[-2,86,15,18,'#316cbe12'],[92,76,11,21,'#3bbcd117']] },
    yearly: { id: 'background.desk-6.yearly', name: '6번 연력 흰 패널', roles: ['cover-back'], parts: [[82,5,20,22,'#3bbcd11a'],[-2,22,14,25,'#3bbcd114'],[84,49,18,22,'#3bbcd117'],[-2,70,16,28,'#3bbcd114'],[6,10,88,83,'#fffffff8']] },
    symbols: { id: 'background.desk-6.symbols', name: '6번 학교 상징 패널', roles: ['front-insert-front'], parts: [[0,5,100,95,'#e7f8f7'],[5,12,90,80,'#fffffff8'],[-4,7,28,29,'#3bbcd114'],[78,69,25,28,'#3bbcd112'],[-9,9,76,18,'#ffffff38'],[41,-2,72,18,'#ffffff38']] },
    backCover: { id: 'background.desk-6.back-cover', name: '6번 뒷표지 청록 블록', roles: ['back-cover-back'], parts: [[15,28,74,31,'#3bbcd124'],[84,47,19,24,'#3bbcd117'],[-2,34,19,28,'#3bbcd117'],[17,40,72,18,'#3bbcd114'],[82,87,20,18,'#316cbe17'],[-2,86,15,18,'#3bbcd112']] }
  };

  function createBackgroundPresetElements(key) {
    const preset = deskSixBackgroundPresets[key];
    return preset.parts.map(([x, y, width, height, fill], index) => ({ id: `${preset.id}.part.${index + 1}`, type: 'shape', role: 'background-decoration', backgroundPresetId: preset.id, backgroundPartId: index + 1, shapeType: 'rect', x, y, width, height, zIndex: 0, opacity: 1, style: { fill, stroke: 'transparent', strokeWidth: 0 }, permissions: { move: true, resize: true, rotate: false, color: true, delete: true, duplicate: true, layer: true, content: false } }));
  }

  function ensureDeskSixBackgroundPresetRegistry(project) {
    project.template.resources ||= {};
    project.template.resources.backgroundPresetLibraryVersion = 1;
    project.template.resources.backgroundPresets = Object.values(deskSixBackgroundPresets).map(({ parts, ...preset }) => ({ ...preset, kind: 'shape-composition', editable: true, supportsBleed: true }));
  }

  function ensureDeskSixReviewSampleData(project) {
    project.template.resources ||= {};
    project.template.resources.sampleAssets ||= [];
    const existingRoles = new Set(project.template.resources.sampleAssets.map(asset => asset.role));
    deskSixReviewAssets.forEach(asset => {
      if (!existingRoles.has(asset.role)) project.template.resources.sampleAssets.push({ ...asset });
    });
    project.template.review ||= {};
    Object.assign(project.template.review, {
      status: 'review',
      reviewId: 'tpl-2028-desk-planner-standard-01-review-01',
      sourceCatalogId: deskPlannerStandard.catalogId,
      referenceSample: 'desk-6',
      publicPackage: false
    });
    project.book.school ||= {};
    const school = project.book.school;
    if (!school.name || school.name === '샘플 학교' || school.name === '학교명 미입력') school.name = '지란중학교';
    if (!school.englishName || school.englishName === 'SAMPLE SCHOOL') school.englishName = 'JIRAN MIDDLE SCHOOL';
    if (!school.slogan || school.slogan === '배움으로 성장하고 함께 미래를 여는 학교') school.slogan = '슬기롭게, 화목하게, 튼튼하게';
    if (!school.address) school.address = '경기도 성남시 수정구 금토로80번길 37 인피니티타워 WEST 10층';
    if (!school.phone) school.phone = '031-608-9735';
    if (!school.fax) school.fax = '031-608-9735';
    if (!school.website) school.website = 'schoolp.co.kr';
    if (!Array.isArray(school.contacts) || !school.contacts.length) school.contacts = [
      { label: '교무실', phone: '031-608-9735', fax: '' },
      { label: '행정실', phone: '031-608-9735', fax: '' },
      { label: '팩스', phone: '', fax: '031-608-9735' }
    ];
    school.contacts.forEach(contact => {
      if (!contact?.value || contact.phone || contact.fax) return;
      if (String(contact.label || '').includes('팩스')) contact.fax = contact.value;
      else contact.phone = contact.value;
      delete contact.value;
    });
    school.profile ||= {};
    Object.entries(deskSixReviewProfile).forEach(([key, sample]) => {
      const current = school.profile[key] ||= {};
      if (!current.name) current.name = sample.name;
      if (!current.description) current.description = sample.description;
      if (!current.image) current.image = sample.image;
      if (!current.assetId && current.image === sample.image) current.assetId = sample.assetId;
    });
    const samplesByRole = Object.fromEntries(Object.entries(deskSixReviewProfile).map(([key, value]) => [`school-${key}`, { ...value, ...school.profile[key] }]));
    Object.values(project.book.elementsByPage || {}).forEach(elements => (elements || []).forEach(item => {
      const sample = samplesByRole[item.role];
      if (!sample || item.type !== 'semantic-object') return;
      item.sampleContent ||= {};
      if (!item.sampleContent.name || ['학교 전경', '교훈', '교가', '교목', '교화'].includes(item.sampleContent.name)) item.sampleContent.name = sample.name;
      if (!item.sampleContent.description || ['바르게 배우고 함께 성장합니다.', '우리 학교 교가', '곧은 마음과 푸른 꿈', '아름다운 배움과 우정'].includes(item.sampleContent.description)) item.sampleContent.description = sample.description;
      if (!item.sampleContent.image) item.sampleContent.image = sample.image;
      if (!item.sampleAssetId && sample.assetId) item.sampleAssetId = sample.assetId;
    }));
  }

  function createPlannerMasterElements() {
    return [
      { id: 'master.planner.goal', type: 'memo', role: 'monthly-goal', memoLayout: 'goal', x: 4, y: 9.6, width: 35, height: 40.8, zIndex: 2, title: 'MONTHLY GOAL', required: true, permissions: { ...protectedPlannerPermissions }, style: {} },
      { id: 'master.planner.todo', type: 'memo', role: 'monthly-todo', memoLayout: 'checklist', x: 4, y: 52.1, width: 35, height: 42.5, zIndex: 2, title: 'TO DO LIST', itemCount: 9, required: true, permissions: { ...protectedPlannerPermissions }, style: {} },
      { id: 'master.planner.weekly', type: 'memo', role: 'weekly-planner', memoLayout: 'weekly', x: 41, y: 9.6, width: 55, height: 85, zIndex: 2, title: 'WEEKLY PLANNER', weekCount: 5, showMemo: true, required: true, permissions: { ...protectedPlannerPermissions }, style: {} }
    ];
  }

  function createCoverFrontElements(year) {
    return [
      ...createBackgroundPresetElements('cover'),
      { id: 'page.cover.building', type: 'semantic-object', role: 'school-building', x: 18.5, y: 14, width: 63, height: 52, zIndex: 1, binding: 'school.profile.building', bindingEnabled: true, fallbackToSample: true, showCaption: false, sampleContent: { name: '학교 전경', description: '', image: '' }, style: { borderRadius: 4 } },
      { id: 'page.cover.year', type: 'text', role: 'year', binding: 'calendar.year', x: 32, y: 68, width: 23, height: 12, zIndex: 3, content: String(year), style: { fontSize: 50, fontWeight: 900, textAlign: 'right', background: false, color: '#20abc3' } },
      { id: 'page.cover.calendar', type: 'text', role: 'calendar-label', x: 56, y: 74, width: 16, height: 5, zIndex: 3, content: 'CALENDAR', style: { fontSize: 13, textAlign: 'left', background: false, color: '#777f88' } },
      { id: 'page.cover.logo', type: 'semantic-object', role: 'school-logo', x: 19, y: 89, width: 17, height: 7, zIndex: 3, binding: 'school.profile.logo', bindingEnabled: true, fallbackToSample: true, sampleContent: { image: '' }, style: {} },
      { id: 'page.cover.address', type: 'text', role: 'school-contact', binding: 'school.address', x: 39, y: 89, width: 43, height: 3.5, zIndex: 3, content: '학교 주소', style: { fontSize: 7.5, textAlign: 'left', background: false, color: '#475467' } },
      { id: 'page.cover.contacts', type: 'text', role: 'school-contact', binding: 'school.contacts', x: 39, y: 92.5, width: 43, height: 3.5, zIndex: 3, content: '학교 연락처', style: { fontSize: 7.5, textAlign: 'left', background: false, color: '#475467', inlineContacts: true } }
    ];
  }

  function createYearlyElements(year, startMonth) {
    return [
      ...createBackgroundPresetElements('yearly'),
      { id: 'page.yearly.title', type: 'text', role: 'year', binding: 'calendar.year', x: 36, y: 7, width: 28, height: 11, zIndex: 2, content: String(year), style: { fontSize: 50, fontWeight: 900, textAlign: 'center', background: false, color: '#20abc3' } },
      { id: 'page.yearly', type: 'year-calendar', role: 'year-calendar', x: 9, y: 22, width: 82, height: 66, zIndex: 1, startMonth, monthCount: 12, columns: 4, showWeekdayHeader: true, style: {} }
    ];
  }

  function createFrontInsertFrontElements() {
    return [
      { id: 'page.insert.history.title', type: 'text', role: 'insert-title', x: 10, y: 10, width: 80, height: 9, zIndex: 3, content: '우리 학교 이야기', style: { fontSize: 28, textAlign: 'center', background: false, color: '#20abc3' } },
      { id: 'page.insert.history.building', type: 'semantic-object', role: 'school-building', x: 8, y: 23, width: 42, height: 60, zIndex: 2, binding: 'school.profile.building', bindingEnabled: true, fallbackToSample: true, showCaption: false, sampleContent: { name: '학교 전경', description: '', image: '' }, style: { borderRadius: 5 } },
      { id: 'page.insert.history.school', type: 'text', role: 'school-name', binding: 'school.name', x: 55, y: 25, width: 35, height: 7, zIndex: 3, content: '샘플 학교', style: { fontSize: 22, textAlign: 'left', background: false, color: '#17202e' } },
      { id: 'page.insert.history.slogan', type: 'text', role: 'school-slogan', binding: 'school.slogan', x: 55, y: 34, width: 35, height: 10, zIndex: 3, content: '배움으로 성장하고 함께 미래를 여는 학교', style: { fontSize: 12, textAlign: 'left', background: false, color: '#475467' } },
      { id: 'page.insert.history.heading', type: 'text', role: 'history-heading', x: 55, y: 50, width: 35, height: 6, zIndex: 3, content: '학교 연혁', style: { fontSize: 15, textAlign: 'left', background: false, color: '#20abc3' } },
      { id: 'page.insert.history.body', type: 'text', role: 'school-history', x: 55, y: 58, width: 35, height: 27, zIndex: 3, content: '학교의 주요 연혁을 입력하세요.\n\n설립과 성장의 기록을 간결하게 정리할 수 있습니다.', style: { fontSize: 10, textAlign: 'left', background: false, color: '#475467' } }
    ];
  }

  function createFrontInsertBackElements() {
    return [
      { id: 'page.insert.vision.title', type: 'text', role: 'insert-title', x: 10, y: 10, width: 80, height: 9, zIndex: 3, content: '교육 비전', style: { fontSize: 28, textAlign: 'center', background: false, color: '#20abc3' } },
      { id: 'page.insert.vision.motto', type: 'semantic-object', role: 'school-motto', x: 18, y: 25, width: 64, height: 22, zIndex: 2, binding: 'school.profile.motto', bindingEnabled: true, fallbackToSample: true, sampleContent: { name: '교훈', description: '바르게 배우고 함께 성장합니다.' }, style: { titleSize: 18, descriptionSize: 13 } },
      { id: 'page.insert.vision.left', type: 'text', role: 'education-direction', x: 10, y: 57, width: 37, height: 25, zIndex: 3, content: '함께 배우는 학교\n\n서로 존중하고 협력하며 배움의 즐거움을 키웁니다.', style: { fontSize: 12, textAlign: 'center', background: true, color: '#475467' } },
      { id: 'page.insert.vision.right', type: 'text', role: 'education-direction', x: 53, y: 57, width: 37, height: 25, zIndex: 3, content: '미래를 여는 학교\n\n학생의 가능성을 발견하고 창의적인 성장을 지원합니다.', style: { fontSize: 12, textAlign: 'center', background: true, color: '#475467' } }
    ];
  }

  function createBackCoverElements(year) {
    return [
      ...createBackgroundPresetElements('backCover'),
      { id: 'page.back.year', type: 'text', role: 'year', binding: 'calendar.year', x: 36, y: 14, width: 17, height: 12, zIndex: 3, content: String(year), style: { fontSize: 47, fontWeight: 900, textAlign: 'right', background: false, color: '#20abc3' } },
      { id: 'page.back.calendar', type: 'text', role: 'calendar-label', x: 53, y: 19, width: 14, height: 4, zIndex: 3, content: 'CALENDAR', style: { fontSize: 11, textAlign: 'left', background: false, color: '#8a8a8a' } },
      { id: 'page.back.building', type: 'semantic-object', role: 'school-building', x: 29.5, y: 28.5, width: 40.5, height: 35.5, zIndex: 1, binding: 'school.profile.building', bindingEnabled: true, fallbackToSample: true, showCaption: false, sampleContent: { name: '학교 전경', description: '', image: '' }, style: { borderRadius: 4 } },
      { id: 'page.back.logo', type: 'semantic-object', role: 'school-logo', x: 40, y: 77, width: 20, height: 7, zIndex: 3, binding: 'school.profile.logo', bindingEnabled: true, fallbackToSample: true, sampleContent: { image: '' }, style: {} },
      { id: 'page.back.address', type: 'text', role: 'school-contact', binding: 'school.address', x: 27, y: 86.5, width: 46, height: 3.5, zIndex: 3, content: '학교 주소', style: { fontSize: 7, textAlign: 'center', background: false, color: '#475467' } },
      { id: 'page.back.contacts', type: 'text', role: 'school-contact', binding: 'school.contacts', x: 23, y: 90, width: 54, height: 4, zIndex: 3, content: '학교 연락처', style: { fontSize: 7, textAlign: 'center', background: false, color: '#475467', inlineContacts: true } }
    ];
  }

  function createSchoolSymbolElements() {
    return [
      ...createBackgroundPresetElements('symbols'),
      { id: 'page.symbols.title', type: 'text', role: 'symbols-title', x: 10, y: 8, width: 80, height: 8, zIndex: 3, content: '우리학교 상징', style: { fontSize: 27, textAlign: 'center', background: false, color: '#20abc3' } },
      { id: 'page.symbols.motto', type: 'semantic-object', role: 'school-motto', layoutPreset: 'desk-six-symbol-card', x: 15, y: 25, width: 32, height: 17, zIndex: 1, binding: 'school.profile.motto', bindingEnabled: true, fallbackToSample: true, sampleContent: { name: '교훈', description: '바르게 배우고 함께 성장합니다.' }, style: { titleSize: 15, descriptionSize: 11 } },
      { id: 'page.symbols.song', type: 'semantic-object', role: 'school-song', layoutPreset: 'desk-six-symbol-card', x: 52, y: 24, width: 38, height: 62, zIndex: 1, binding: 'school.profile.song', bindingEnabled: true, fallbackToSample: true, sampleContent: { name: '교가', description: '우리 학교 교가' }, style: { titleSize: 15, descriptionSize: 8 } },
      { id: 'page.symbols.tree', type: 'semantic-object', role: 'school-tree', layoutPreset: 'desk-six-symbol-card', x: 10, y: 48, width: 18, height: 37, zIndex: 1, binding: 'school.profile.tree', bindingEnabled: true, fallbackToSample: true, showCaption: true, sampleContent: { name: '교목', description: '곧은 마음과 푸른 꿈' }, style: { titleSize: 13, descriptionSize: 8 } },
      { id: 'page.symbols.flower', type: 'semantic-object', role: 'school-flower', layoutPreset: 'desk-six-symbol-card', x: 31, y: 48, width: 18, height: 37, zIndex: 1, binding: 'school.profile.flower', bindingEnabled: true, fallbackToSample: true, showCaption: true, sampleContent: { name: '교화', description: '아름다운 배움과 우정' }, style: { titleSize: 13, descriptionSize: 8 } }
    ];
  }

  function applyDeskPlannerFixedSurfaces(project, options) {
    ensureDeskSixBackgroundPresetRegistry(project);
    const byRole = role => project.book.pageInstances.find(page => page.role === role);
    const assign = (role, semanticPageRole, elements) => {
      const page = byRole(role);
      if (!page) return;
      page.semanticPageRole = semanticPageRole;
      project.book.elementsByPage[page.id] = elements;
    };
    assign('cover-front', 'cover-front', createCoverFrontElements(options.year));
    assign('cover-back', 'yearly-calendar', createYearlyElements(options.year, options.startMonth));
    assign('front-insert-front', 'school-symbols', createSchoolSymbolElements());
    assign('back-cover-back', 'back-cover-information', createBackCoverElements(options.year));
  }

  function applyDeskSixBackCoverParity(project, year) {
    ensureDeskSixBackgroundPresetRegistry(project);
    const page = project.book.pageInstances.find(item => item.role === 'back-cover-back');
    if (!page) return;
    page.semanticPageRole = 'back-cover-information';
    project.book.elementsByPage[page.id] = createBackCoverElements(year);
  }

  function applyDeskSixSpecialPageParity(project, role, semanticPageRole, elements) {
    const page = project.book.pageInstances.find(item => item.role === role);
    if (!page) return;
    const previous = project.book.elementsByPage[page.id] || [];
    const previousByRole = Object.fromEntries(previous.filter(item => item.type === 'semantic-object').map(item => [item.role, item]));
    elements.forEach(item => {
      if (item.type !== 'semantic-object') return;
      const prior = previousByRole[item.role];
      if (!prior) return;
      item.sampleContent = { ...(item.sampleContent || {}), ...(prior.sampleContent || {}) };
      if (prior.sampleAssetId) item.sampleAssetId = prior.sampleAssetId;
    });
    page.semanticPageRole = semanticPageRole;
    project.book.elementsByPage[page.id] = elements;
  }

  function ensureDeskSixVisualParity(project) {
    const year = Number(project.settings?.year || 2028);
    const startMonth = Number(project.settings?.startMonth || 3);
    project.settings.calendarRowsMode = 'adaptive';
    project.settings.weekStart = 'sunday';
    project.settings.showAdjacentMiniCalendars = true;
    project.template.resources ||= {};
    project.template.resources.fontTheme = { title: 'Pretendard', body: 'Pretendard', calendar: 'Pretendard', event: 'Pretendard', fallback: '"Noto Sans KR", Arial, sans-serif' };
    project.template.masters ||= {};
    project.template.masters.calendar ||= {};
    Object.assign(project.template.masters.calendar, {
      calendarRegion: { x: 0, y: 8, width: 100, height: 91 },
      monthTitleSize: 25,
      eventMaxVisiblePerDay: 3,
      showAdjacentMonths: true,
      design: { monthTitleAlign: 'left', monthTitleStyle: 'number-stack', weekdayStyle: 'filled-tabs', gridStyle: 'boxed', eventStyle: 'strong-bars', presetId: 'sample-6' }
    });
    project.template.masters.calendar.rangeEventStyle = { ...(project.template.masters.calendar.rangeEventStyle || {}), enabled: true, labelMode: 'first', labelPosition: 'inside', barHeight: 11, laneGap: 2, maxLanes: 4, continuationStyle: 'none', overflowStyle: 'count' };
    project.template.masterElements ||= {};
    project.template.masterElements['master.monthly.back'] = createPlannerMasterElements();
    applyDeskPlannerFixedSurfaces(project, { year, startMonth });
    const months = (project.book.pageInstances || []).filter(page => page.role === 'monthly-front');
    project.book.monthlyStyleOverrides = months.map((page, index) => ({ monthKey: page.monthKey || `${page.calendarYear}-${String(page.calendarMonth).padStart(2, '0')}`, tokens: { primary: palette[index], accent: palette[index], calendarHeader: palette[index], plannerBackground: pastel[index] } }));
    project.book.events ||= [];
    if (!project.book.events.length) {
      const iso = (monthOffset, day) => { const date = new Date(year, startMonth - 1 + monthOffset, day); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; };
      project.book.events.push(
        { id: 'sample.review.opening', title: '개학식', startDate: iso(0, 4), endDate: iso(0, 4), category: 'school', color: '#4777bd', sample: true },
        { id: 'sample.review.counsel', title: '학부모 상담 기간', startDate: iso(0, 11), endDate: iso(0, 13), category: 'safety', color: '#f47c20', sample: true },
        { id: 'sample.review.science', title: '과학 탐구 주간', startDate: iso(0, 20), endDate: iso(0, 21), category: 'student', color: '#2fb79d', sample: true },
        { id: 'sample.review.sports', title: '한마음 체육대회', startDate: iso(2, 17), endDate: iso(2, 17), category: 'school', color: '#ec407a', sample: true },
        { id: 'sample.review.vacation', title: '여름방학', startDate: iso(4, 24), endDate: iso(5, 16), category: 'vacation', color: '#2cb7d5', sample: true },
        { id: 'sample.review.festival', title: '학교 축제', startDate: iso(7, 20), endDate: iso(7, 21), category: 'education', color: '#7554b8', sample: true }
      );
    }
  }

  function normalizeDeskPlannerSampleSixSequence(project) {
    const oldPages = project.book.pageInstances || [];
    const oldElements = project.book.elementsByPage || {};
    const byRole = role => oldPages.find(page => page.role === role);
    const monthPages = role => oldPages.filter(page => page.role === role).sort((a, b) => (a.sequenceIndex ?? a.number ?? 0) - (b.sequenceIndex ?? b.number ?? 0));
    const fronts = monthPages('monthly-front');
    const backs = monthPages('monthly-back');
    const symbolSource = oldPages.find(page => page.semanticPageRole === 'school-symbols') || byRole('front-insert-front') || byRole('back-cover-back');
    const backCoverSource = oldPages.find(page => page.semanticPageRole === 'back-cover-information') || byRole('back-cover-front') || byRole('back-cover-back');
    const sources = [byRole('cover-front'), byRole('cover-back'), symbolSource];
    for (let index = 0; index < 12; index += 1) sources.push(backs[index], fronts[index]);
    sources.push(backCoverSource);
    const roles = ['cover-front', 'cover-back', 'front-insert-front'];
    for (let index = 0; index < 12; index += 1) roles.push('monthly-back', 'monthly-front');
    roles.push('back-cover-back');
    const pages = [];
    const elementsByPage = {};
    for (let index = 0; index < 28; index += 1) {
      const number = index + 1;
      const sheetNumber = Math.ceil(number / 2);
      const side = number % 2 ? 'front' : 'back';
      const role = roles[index];
      const source = sources[index] || {};
      const id = `surface.${sheetNumber}.${side}`;
      const page = { ...source, id, number, sequenceIndex: index, sheetNumber, side, role, masterId: role === 'monthly-front' ? 'master.monthly.front' : role === 'monthly-back' ? 'master.monthly.back' : `master.${role.replace(/-(front|back)$/, '.$1')}` };
      pages.push(page);
      elementsByPage[id] = oldElements[source.id] || [];
    }
    project.book.pageInstances = pages;
    project.book.elementsByPage = elementsByPage;
    project.book.sheets = Array.from({ length: 14 }, (_, index) => ({ id: `sheet.${index + 1}`, sheetNumber: index + 1, role: 'sample-6-sequence', surfaces: pages.slice(index * 2, index * 2 + 2) }));
    project.settings.frontInsertCount = 0;
    project.settings.rearInsertCount = 0;
  }

  function isDeskPlannerStandardDocument(project) {
    const pages = project?.book?.pageInstances || [];
    return project?.settings?.template === deskPlannerStandard.templateKey
      && (pages.length === 28 || pages.length === 30)
      && pages.filter(page => page.role === 'monthly-front').length === 12
      && pages.filter(page => page.role === 'monthly-back').length === 12;
  }

  function migrateProject(project) {
    if (!project || typeof project !== 'object') return { project, report: { applied: [], source: 'invalid' } };
    if (!isDeskPlannerStandardDocument(project)) return { project, report: { applied: [], source: 'not-desk-planner-standard-01' } };
    const applied = [];
    project.template ||= {};
    project.template.metadata ||= {};
    if (project.template.metadata.sampleFamily !== 'desk-6') {
      project.template.metadata.sampleFamily = 'desk-6';
      applied.push('desk-planner-sample-family');
    }
    if (project.template.standardIdentity?.catalogId !== deskPlannerStandard.catalogId) {
      project.template.standardIdentity = { catalogId: deskPlannerStandard.catalogId, templateKey: deskPlannerStandard.templateKey };
      applied.push('desk-planner-standard-identity');
    }
    const fromVersion = Number(project.template.documentVersion || 0);
    if (fromVersion < 2) {
      project.template.masterElements ||= {};
      project.template.masterElements['master.monthly.back'] = createPlannerMasterElements();
      applied.push('desk-planner-master-source-match-v2');
    }
    if (fromVersion < 3) {
      applyDeskPlannerFixedSurfaces(project, { year: Number(project.settings?.year || 2028), startMonth: Number(project.settings?.startMonth || 3) });
      applied.push('desk-planner-fixed-surfaces-v3');
    }
    if (fromVersion < 4 || project.book.pageInstances.length !== 28) {
      normalizeDeskPlannerSampleSixSequence(project);
      applyDeskPlannerFixedSurfaces(project, { year: Number(project.settings?.year || 2028), startMonth: Number(project.settings?.startMonth || 3) });
      project.template.pageComposition = { type: 'desk-sample-6-sequence', pageCount: 28, monthPairCount: 12, leadingSurfaceCount: 3, trailingSurfaceCount: 1 };
      applied.push('desk-planner-sample-6-sequence-v4');
    }
    if (fromVersion < 5) {
      applyDeskPlannerFixedSurfaces(project, { year: Number(project.settings?.year || 2028), startMonth: Number(project.settings?.startMonth || 3) });
      applied.push('desk-planner-fixed-surfaces-v5');
    }
    if (fromVersion < 6) {
      applyDeskPlannerFixedSurfaces(project, { year: Number(project.settings?.year || 2028), startMonth: Number(project.settings?.startMonth || 3) });
      applied.push('desk-planner-editable-background-presets-v6');
    }
    if (fromVersion < 7) {
      ensureDeskSixReviewSampleData(project);
      applied.push('desk-planner-review-sample-data-v7');
    }
    if (fromVersion < 8) {
      ensureDeskSixReviewSampleData(project);
      applied.push('desk-planner-review-color-contact-fix-v8');
    }
    if (fromVersion < 9) {
      ensureDeskSixVisualParity(project);
      ensureDeskSixReviewSampleData(project);
      applied.push('desk-planner-sample-six-visual-parity-v9');
    }
    if (fromVersion < 10) {
      applyDeskSixBackCoverParity(project, Number(project.settings?.year || 2028));
      applied.push('desk-planner-back-cover-parity-v10');
    }
    if (fromVersion < 11) {
      const year = Number(project.settings?.year || 2028);
      applyDeskSixSpecialPageParity(project, 'cover-front', 'cover-front', createCoverFrontElements(year));
      applyDeskSixSpecialPageParity(project, 'back-cover-back', 'back-cover-information', createBackCoverElements(year));
      ensureDeskSixReviewSampleData(project);
      applied.push('desk-planner-special-page-text-image-parity-v11');
    }
    if (fromVersion < deskPlannerStandard.documentVersion) {
      project.template.documentVersion = deskPlannerStandard.documentVersion;
      applied.push(`desk-planner-document-version-${deskPlannerStandard.documentVersion}`);
    }
    const report = { applied, source: 'desk-planner-standard-01', fromVersion, toVersion: deskPlannerStandard.documentVersion };
    project.template.migrationReport = report;
    return { project, report };
  }

  function applyDeskRepresentativePreset(project, options) {
    if (options.type !== 'desk' || !['desk-sample-6', 'desk-sample-2'].includes(options.template)) return project;
    const isPlanner = options.template === 'desk-sample-6';
    const months = project.book.pageInstances.filter(page => page.role === 'monthly-front');
    project.template.metadata = { name: isPlanner ? '탁상형 6번 · 월별 플래너형' : '탁상형 2번 · 이미지 콜라주형', sampleFamily: isPlanner ? 'desk-6' : 'desk-2', productRuntime: 'desk-sequence' };
    if (isPlanner) {
      project.template.standardIdentity = { catalogId: deskPlannerStandard.catalogId, templateKey: deskPlannerStandard.templateKey };
      project.template.documentVersion = deskPlannerStandard.documentVersion;
    }
    project.template.pageComposition = { type: 'desk-sample-6-sequence', pageCount: 28, monthPairCount: 12, leadingSurfaceCount: 3, trailingSurfaceCount: 1 };
    project.template.masters.calendar.calendarRegion = { x: 3, y: 10, width: 94, height: 87 };
    project.template.masters.calendar.eventMaxVisiblePerDay = 3;
    project.template.masters.calendar.design = { monthTitleAlign: 'left', monthTitleStyle: 'number-stack', weekdayStyle: 'filled-tabs', gridStyle: 'boxed', eventStyle: 'strong-bars' };
    project.template.masterElements['master.monthly.back'] = isPlanner ? createPlannerMasterElements() : [
      { id: 'master.collage.large', type: 'image-frame', role: 'monthly-image', x: 5, y: 6, width: 57, height: 58, zIndex: 1, image: { binding: 'calendar.monthlyImages.current', fit: 'cover', focalPoint: { x: .5, y: .5 } }, fit: 'cover', style: { borderRadius: 3 } },
      { id: 'master.collage.small-a', type: 'image-frame', role: 'monthly-image-secondary', x: 65, y: 6, width: 30, height: 27, zIndex: 1, image: { binding: 'calendar.monthlyImages.current', fit: 'cover', focalPoint: { x: .25, y: .5 } }, fit: 'cover', style: { borderRadius: 3 } },
      { id: 'master.collage.small-b', type: 'image-frame', role: 'monthly-image-tertiary', x: 65, y: 37, width: 30, height: 27, zIndex: 1, image: { binding: 'calendar.monthlyImages.current', fit: 'cover', focalPoint: { x: .75, y: .5 } }, fit: 'cover', style: { borderRadius: 3 } },
      { id: 'master.collage.strip', type: 'month-date-strip', role: 'month-date-strip', x: 5, y: 72, width: 90, height: 20, zIndex: 2, monthSource: 'page', showWeekday: true, showDate: true, style: { background: true } }
    ];
    const coverFront = project.book.pageInstances.find(page => page.role === 'cover-front');
    if (isPlanner && coverFront) {
      project.book.elementsByPage[coverFront.id] = [
        { id: 'page.cover.building', type: 'semantic-object', role: 'school-building', x: 16, y: 11, width: 68, height: 55, zIndex: 1, binding: 'school.profile.building', bindingEnabled: true, fallbackToSample: true, showCaption: false, sampleContent: { name: '학교 전경', description: '', image: '' }, style: { borderRadius: 5 } },
        { id: 'page.cover.year', type: 'text', role: 'year', binding: 'calendar.year', x: 29, y: 68, width: 25, height: 11, zIndex: 3, content: String(options.year), style: { fontSize: 44, textAlign: 'right', background: false, color: '#20a9c2' } },
        { id: 'page.cover.calendar', type: 'text', role: 'calendar-label', x: 55, y: 72, width: 18, height: 6, zIndex: 3, content: 'CALENDAR', style: { fontSize: 14, textAlign: 'left', background: false, color: '#8a8a8a' } },
        { id: 'page.cover.logo', type: 'semantic-object', role: 'school-logo', x: 17, y: 84, width: 6, height: 9, zIndex: 3, binding: 'school.profile.logo', bindingEnabled: true, fallbackToSample: true, sampleContent: { image: '' }, style: {} },
        { id: 'page.cover.school', type: 'text', role: 'school-name', binding: 'school.name', x: 24, y: 84, width: 23, height: 5, zIndex: 3, content: '샘플 학교', style: { fontSize: 16, textAlign: 'left', background: false, color: '#17202e' } },
        { id: 'page.cover.english', type: 'text', role: 'school-english-name', binding: 'school.englishName', x: 24, y: 89, width: 23, height: 4, zIndex: 3, content: 'SAMPLE SCHOOL', style: { fontSize: 8, textAlign: 'left', background: false, color: '#667085' } },
        { id: 'page.cover.address', type: 'text', role: 'school-contact', binding: 'school.address', x: 48, y: 84, width: 35, height: 4, zIndex: 3, content: '학교 주소', style: { fontSize: 8, textAlign: 'left', background: false, color: '#475467' } },
        { id: 'page.cover.contacts', type: 'text', role: 'school-contact', binding: 'school.contacts', x: 48, y: 88, width: 35, height: 6, zIndex: 3, content: '학교 연락처', style: { fontSize: 8, textAlign: 'left', background: false, color: '#475467' } }
      ];
      project.book.coverElementsInitialized = { [coverFront.id]: true };
    }
    const coverBack = project.book.pageInstances.find(page => page.role === 'cover-back');
    if (coverBack) {
      coverBack.semanticPageRole = 'yearly-calendar';
      project.book.elementsByPage[coverBack.id] = [
        { id: 'page.yearly.title', type: 'text', role: 'year', binding: 'calendar.year', x: 35, y: 7, width: 30, height: 10, zIndex: 2, content: String(options.year), style: { fontSize: 42, textAlign: 'center', background: false, color: '#20a9c2' } },
        { id: 'page.yearly', type: 'year-calendar', role: 'year-calendar', x: 7, y: 21, width: 86, height: 70, zIndex: 1, startMonth: options.startMonth, monthCount: 12, columns: 4, showWeekdayHeader: true, style: {} }
      ];
    }
    const symbolPage = project.book.pageInstances.find(page => page.role === 'front-insert-front');
    if (symbolPage) {
      symbolPage.semanticPageRole = 'school-symbols';
      project.book.elementsByPage[symbolPage.id] = [
        { id: 'page.symbols.motto', type: 'semantic-object', role: 'school-motto', x: 5, y: 10, width: 43, height: 35, zIndex: 1, binding: 'school.profile.motto', bindingEnabled: true, fallbackToSample: true, sampleContent: { name: '교훈', description: '바르게 배우고 함께 성장합니다.' }, style: {} },
        { id: 'page.symbols.song', type: 'semantic-object', role: 'school-song', x: 52, y: 10, width: 43, height: 35, zIndex: 1, binding: 'school.profile.song', bindingEnabled: true, fallbackToSample: true, sampleContent: { name: '교가', description: '우리 학교 교가' }, style: {} },
        { id: 'page.symbols.tree', type: 'semantic-object', role: 'school-tree', x: 5, y: 52, width: 43, height: 35, zIndex: 1, binding: 'school.profile.tree', bindingEnabled: true, fallbackToSample: true, showCaption: true, sampleContent: { name: '교목', description: '곧은 마음과 푸른 꿈' }, style: {} },
        { id: 'page.symbols.flower', type: 'semantic-object', role: 'school-flower', x: 52, y: 52, width: 43, height: 35, zIndex: 1, binding: 'school.profile.flower', bindingEnabled: true, fallbackToSample: true, showCaption: true, sampleContent: { name: '교화', description: '아름다운 배움과 우정' }, style: {} }
      ];
    }
    const backCover = project.book.pageInstances.find(page => page.role === 'back-cover-back');
    if (isPlanner && backCover) {
      backCover.semanticPageRole = 'back-cover-information';
      project.book.elementsByPage[backCover.id] = [
        { id: 'page.back.year', type: 'text', role: 'year', binding: 'calendar.year', x: 31, y: 7, width: 25, height: 10, zIndex: 3, content: String(options.year), style: { fontSize: 40, textAlign: 'right', background: false, color: '#20a9c2' } },
        { id: 'page.back.calendar', type: 'text', role: 'calendar-label', x: 57, y: 11, width: 18, height: 5, zIndex: 3, content: 'CALENDAR', style: { fontSize: 13, textAlign: 'left', background: false, color: '#8a8a8a' } },
        { id: 'page.back.building', type: 'semantic-object', role: 'school-building', x: 30, y: 22, width: 45, height: 39, zIndex: 1, binding: 'school.profile.building', bindingEnabled: true, fallbackToSample: true, showCaption: false, sampleContent: { name: '학교 전경', description: '', image: '' }, style: { borderRadius: 5 } },
        { id: 'page.back.logo', type: 'semantic-object', role: 'school-logo', x: 33, y: 68, width: 6, height: 9, zIndex: 3, binding: 'school.profile.logo', bindingEnabled: true, fallbackToSample: true, sampleContent: { image: '' }, style: {} },
        { id: 'page.back.school', type: 'text', role: 'school-name', binding: 'school.name', x: 40, y: 68, width: 27, height: 5, zIndex: 3, content: '샘플 학교', style: { fontSize: 16, textAlign: 'left', background: false, color: '#17202e' } },
        { id: 'page.back.english', type: 'text', role: 'school-english-name', binding: 'school.englishName', x: 40, y: 73, width: 27, height: 4, zIndex: 3, content: 'SAMPLE SCHOOL', style: { fontSize: 8, textAlign: 'left', background: false, color: '#667085' } },
        { id: 'page.back.address', type: 'text', role: 'school-contact', binding: 'school.address', x: 28, y: 82, width: 48, height: 4, zIndex: 3, content: '학교 주소', style: { fontSize: 8, textAlign: 'center', background: false, color: '#475467' } },
        { id: 'page.back.contacts', type: 'text', role: 'school-contact', binding: 'school.contacts', x: 25, y: 87, width: 54, height: 6, zIndex: 3, content: '학교 연락처', style: { fontSize: 8, textAlign: 'center', background: false, color: '#475467' } }
      ];
    }
    if (isPlanner) {
      normalizeDeskPlannerSampleSixSequence(project);
      ensureDeskSixVisualParity(project);
      ensureDeskSixReviewSampleData(project);
    }
    project.book.pageInstances.forEach((page, index) => {
      page.sequenceIndex = index;
      if (page.role === 'cover-front') page.semanticPageRole = 'cover-front';
      if (page.role === 'monthly-front' || page.role === 'monthly-back') {
        const monthKey = `${page.calendarYear}-${String(page.calendarMonth).padStart(2, '0')}`;
        page.semanticPageRole = page.role === 'monthly-front' ? 'month-calendar' : 'month-back';
        page.monthKey = monthKey;
        page.pairId = `month-pair.${monthKey}`;
      }
      if (page.role === 'back-cover-back' && !page.semanticPageRole) page.semanticPageRole = 'back-cover';
    });
    project.book.monthlyStyleOverrides = months.map((page, index) => ({ monthKey: page.monthKey, tokens: { primary: palette[index], accent: palette[index], calendarHeader: palette[index], plannerBackground: pastel[index] } }));
    project.book.monthlyImages = Object.fromEntries(months.map(page => [page.monthKey, '']));
    return project;
  }

  function createProject(options, dependencies) {
    const months = dependencies.buildMonths(options.year, options.startMonth);
    const isDesk = options.type === 'desk';
    const isPoster = options.type === 'poster';
    const preset = dependencies.sizePresets[options.type]?.find(item => item.id === options.sizePresetId);
    if (!preset) throw new RangeError(`Unknown size preset: ${options.type}/${options.sizePresetId}`);
    const project = { format: 'acdl-project', version: '2.18.0', settings: { ...options, calendarRows: Number(options.calendarRows || 6), weekStart: options.weekStart || 'sunday', showAdjacentMiniCalendars: options.showAdjacentMiniCalendars !== false, sizePreset: { id: preset.id, label: preset.label, width: preset.width, height: preset.height } }, productType: { id: isDesk ? 'desk-landscape-duplex' : isPoster ? 'poster-annual-single' : 'wall-portrait-single', category: options.type, duplex: isDesk, pageSize: { width: preset.width, height: preset.height, unit: 'mm' } }, template: { id: `template.${options.template}`, revision: 1, resources: { sampleAssetLibraryVersion: 2, sampleAssets: [], colorTheme: { primary: '#315e9e', secondary: '#667085', accent: '#4777bd', holiday: '#d92d20', weekend: '#175cd3', background: '#ffffff', line: '#d7dce5' }, fontTheme: { title: 'Arial', body: 'Arial', calendar: 'Arial', event: 'Arial', fallback: '"Noto Sans KR", sans-serif' }, eventCategories: [{ id: 'holiday', name: '공휴일', color: '#d92d20', priority: 100 }, { id: 'school', name: '학교 행사', color: '#4777bd', priority: 70 }, { id: 'education', name: '교육', color: '#7f56d9', priority: 60 }, { id: 'student', name: '학생', color: '#039855', priority: 50 }, { id: 'safety', name: '안전', color: '#dc6803', priority: 80 }, { id: 'vacation', name: '방학', color: '#0891b2', priority: 90 }], exportSettings: { format: 'pdf', dpi: 300, bleed: 3, cropMarks: true, colorMode: 'cmyk', pageRange: 'all', imageQuality: 'high', guides: false } }, masters: { calendar: { eventMaxVisiblePerDay: 2, monthTitleSize: 22, showAdjacentMonths: true, calendarRegion: { x: 5, y: 16, width: 90, height: 79 }, rangeEventStyle: { enabled: true, labelMode: 'first', labelPosition: 'inside', barHeight: 11, laneGap: 2, maxLanes: 4, continuationStyle: 'arrow', overflowStyle: 'count' } }, cover: { titleSize: 34 } }, masterElements: {} }, book: { id: `book.${options.type}.${options.year}.${String(options.startMonth).padStart(2, '0')}`, school: { name: '샘플 학교', englishName: 'SAMPLE SCHOOL', slogan: '배움으로 성장하고 함께 미래를 여는 학교', address: '', phone: '', website: '' }, sheets: [], pageInstances: [], events: [], elementsByPage: {} } };
    if (isPoster) {
      project.book.pageInstances.push({ id: 'page.poster.annual', number: 1, side: 'front', role: 'poster-annual', masterId: 'master.poster.annual', calendarYear: options.year, calendarMonth: null, overrides: {} });
    } else if (isDesk) {
      if (options.template === 'desk-sample-6') {
        const specs = [
          ['cover-front', null], ['cover-back', null], ['front-insert-front', null],
          ...months.flatMap(month => [['monthly-back', month], ['monthly-front', month]]),
          ['back-cover-back', null]
        ];
        specs.forEach(([role, calendar], index) => {
          const number = index + 1;
          const sheetNumber = Math.ceil(number / 2);
          const side = number % 2 ? 'front' : 'back';
          const page = { id: `surface.${sheetNumber}.${side}`, number, sheetNumber, side, role, masterId: role === 'monthly-front' ? 'master.monthly.front' : role === 'monthly-back' ? 'master.monthly.back' : `master.${role.replace(/-(front|back)$/, '.$1')}`, calendarYear: calendar?.year || null, calendarMonth: calendar?.month || null, overrides: {} };
          project.book.pageInstances.push(page);
        });
        project.book.sheets = Array.from({ length: 14 }, (_, index) => ({ id: `sheet.${index + 1}`, sheetNumber: index + 1, role: 'sample-6-sequence', surfaces: project.book.pageInstances.slice(index * 2, index * 2 + 2) }));
        project.settings.frontInsertCount = 0;
        project.settings.rearInsertCount = 0;
        return applyDeskRepresentativePreset(project, options);
      }
      const specs = [['cover', null, null]];
      const frontInsertCount = options.template === 'desk-sample-6' ? 1 : Number(options.frontInsertCount || 0);
      const rearInsertCount = options.template === 'desk-sample-6' ? 0 : Number(options.rearInsertCount || 0);
      project.settings.frontInsertCount = frontInsertCount;
      project.settings.rearInsertCount = rearInsertCount;
      for (let index = 1; index <= frontInsertCount; index += 1) specs.push(['front-insert', null, index]);
      months.forEach(month => specs.push(['monthly', month, null]));
      for (let index = 1; index <= rearInsertCount; index += 1) specs.push(['rear-insert', null, index]);
      specs.push(['back-cover', null, null]);
      let sheetNumber = 1;
      let pageNumber = 1;
      specs.forEach(([role, calendar, insertIndex]) => {
        const sheet = { id: `sheet.${sheetNumber}`, sheetNumber, role, calendar, insertIndex, surfaces: [] };
        ['front', 'back'].forEach(side => {
          const page = { id: `surface.${sheetNumber}.${side}`, number: pageNumber++, sheetNumber, side, role: role === 'monthly' ? `monthly-${side}` : `${role}-${side}`, insertIndex, masterId: role === 'monthly' ? `master.monthly.${side}` : `master.${role}.${side}`, calendarYear: calendar?.year || null, calendarMonth: calendar?.month || null, overrides: {} };
          sheet.surfaces.push(page);
          project.book.pageInstances.push(page);
        });
        project.book.sheets.push(sheet);
        sheetNumber += 1;
      });
    } else {
      const specs = [['cover-front', null, null]];
      for (let index = 1; index <= options.frontInsertCount; index += 1) specs.push(['front-insert-front', null, index]);
      months.forEach(month => specs.push(['monthly-front', month, null]));
      for (let index = 1; index <= options.rearInsertCount; index += 1) specs.push(['rear-insert-front', null, index]);
      specs.push(['back-cover-front', null, null]);
      let pageNumber = 1;
      specs.forEach(([role, calendar, insertIndex]) => project.book.pageInstances.push({ id: `page.${pageNumber}`, number: pageNumber++, side: 'front', role, insertIndex, masterId: role === 'monthly-front' ? 'master.monthly.front' : `master.${role}`, calendarYear: calendar?.year || null, calendarMonth: calendar?.month || null, overrides: {} }));
    }
    return applyDeskRepresentativePreset(project, options);
  }

  root.ACDLProjectDocument = Object.freeze({ createProject, migrateProject, isDeskPlannerStandardDocument });
})(typeof window !== 'undefined' ? window : globalThis);
