(function (root) {
  const palette = ['#2fb79d', '#4777bd', '#2e8b72', '#4c8f3a', '#b57b23', '#c05a4f', '#a64f78', '#7459a8', '#3f769e', '#50806b', '#9a6a45', '#526487'];
  const pastel = ['#dff4ee', '#e7f3df', '#fff0d8', '#fde5df', '#f8e4ed', '#eee7f8', '#e1edf8', '#e2f1ed', '#f6eadf', '#e8edf6', '#f1e8dc', '#e7ebf2'];
  const protectedPlannerPermissions = { move: false, resize: false, rotate: false, color: false, delete: false, duplicate: false, layer: false, content: false };
  const deskPlannerStandard = { catalogId: 'tpl-2028-desk-planner-standard-01', templateKey: 'desk-sample-6', documentVersion: 6 };
  const deskSixBackgroundPresets = {
    cover: { id: 'background.desk-6.cover', name: '6번 표지 청록 블록', roles: ['cover-front'], parts: [[4,11,88,31,'#3bbcd124'],[-3,32,15,22,'#3bbcd117'],[86,23,14,24,'#3bbcd114'],[83,57,18,31,'#3bbcd11a'],[-2,87,18,18,'#316cbe12']] },
    yearly: { id: 'background.desk-6.yearly', name: '6번 연력 흰 패널', roles: ['cover-back'], parts: [[81,5,20,23,'#3bbcd11a'],[-2,22,14,25,'#3bbcd114'],[83,48,18,22,'#3bbcd117'],[-2,70,16,28,'#3bbcd114'],[6,11,88,82,'#fffffff5']] },
    symbols: { id: 'background.desk-6.symbols', name: '6번 학교 상징 패널', roles: ['front-insert-front'], parts: [[3,8,94,88,'#effbfa'],[-3,8,20,28,'#3bbcd114'],[84,70,20,27,'#3bbcd112']] },
    backCover: { id: 'background.desk-6.back-cover', name: '6번 뒷표지 청록 블록', roles: ['back-cover-back'], parts: [[15,29,74,31,'#3bbcd124'],[83,48,19,24,'#3bbcd117'],[-2,34,19,28,'#3bbcd117'],[82,88,20,18,'#316cbe17']] }
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

  function createPlannerMasterElements() {
    return [
      { id: 'master.planner.goal', type: 'memo', role: 'monthly-goal', memoLayout: 'goal', x: 4, y: 9.8, width: 35, height: 40.2, zIndex: 2, title: 'MONTHLY GOAL', required: true, permissions: { ...protectedPlannerPermissions }, style: {} },
      { id: 'master.planner.todo', type: 'memo', role: 'monthly-todo', memoLayout: 'checklist', x: 4, y: 51.8, width: 35, height: 42.8, zIndex: 2, title: 'TO DO LIST', itemCount: 9, required: true, permissions: { ...protectedPlannerPermissions }, style: {} },
      { id: 'master.planner.weekly', type: 'memo', role: 'weekly-planner', memoLayout: 'weekly', x: 40.8, y: 9.8, width: 55.3, height: 84.8, zIndex: 2, title: 'WEEKLY PLANNER', weekCount: 5, showMemo: true, required: true, permissions: { ...protectedPlannerPermissions }, style: {} }
    ];
  }

  function createCoverFrontElements(year) {
    return [
      ...createBackgroundPresetElements('cover'),
      { id: 'page.cover.building', type: 'semantic-object', role: 'school-building', x: 18.5, y: 14, width: 62, height: 52, zIndex: 1, binding: 'school.profile.building', bindingEnabled: true, fallbackToSample: true, showCaption: false, sampleContent: { name: '학교 전경', description: '', image: '' }, style: { borderRadius: 5 } },
      { id: 'page.cover.year', type: 'text', role: 'year', binding: 'calendar.year', x: 34, y: 68, width: 20, height: 11, zIndex: 3, content: String(year), style: { fontSize: 44, textAlign: 'right', background: false, color: '#20abc3' } },
      { id: 'page.cover.calendar', type: 'text', role: 'calendar-label', x: 55, y: 73, width: 18, height: 5, zIndex: 3, content: 'CALENDAR', style: { fontSize: 13, textAlign: 'left', background: false, color: '#8a8a8a' } },
      { id: 'page.cover.logo', type: 'semantic-object', role: 'school-logo', x: 20, y: 83, width: 27, height: 10, zIndex: 3, binding: 'school.profile.logo', bindingEnabled: true, fallbackToSample: true, sampleContent: { image: '' }, style: {} },
      { id: 'page.cover.address', type: 'text', role: 'school-contact', binding: 'school.address', x: 49, y: 84, width: 35, height: 4, zIndex: 3, content: '학교 주소', style: { fontSize: 7, textAlign: 'left', background: false, color: '#475467' } },
      { id: 'page.cover.contacts', type: 'text', role: 'school-contact', binding: 'school.contacts', x: 49, y: 88, width: 35, height: 6, zIndex: 3, content: '학교 연락처', style: { fontSize: 7, textAlign: 'left', background: false, color: '#475467' } }
    ];
  }

  function createYearlyElements(year, startMonth) {
    return [
      ...createBackgroundPresetElements('yearly'),
      { id: 'page.yearly.title', type: 'text', role: 'year', binding: 'calendar.year', x: 39, y: 7, width: 22, height: 11, zIndex: 2, content: String(year), style: { fontSize: 42, textAlign: 'center', background: false, color: '#20abc3' } },
      { id: 'page.yearly', type: 'year-calendar', role: 'year-calendar', x: 8, y: 21, width: 84, height: 70, zIndex: 1, startMonth, monthCount: 12, columns: 4, showWeekdayHeader: true, style: {} }
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
      { id: 'page.back.year', type: 'text', role: 'year', binding: 'calendar.year', x: 37, y: 9, width: 20, height: 10, zIndex: 3, content: String(year), style: { fontSize: 40, textAlign: 'right', background: false, color: '#20abc3' } },
      { id: 'page.back.calendar', type: 'text', role: 'calendar-label', x: 58, y: 13, width: 16, height: 5, zIndex: 3, content: 'CALENDAR', style: { fontSize: 12, textAlign: 'left', background: false, color: '#8a8a8a' } },
      { id: 'page.back.building', type: 'semantic-object', role: 'school-building', x: 29, y: 24, width: 43, height: 39, zIndex: 1, binding: 'school.profile.building', bindingEnabled: true, fallbackToSample: true, showCaption: false, sampleContent: { name: '학교 전경', description: '', image: '' }, style: { borderRadius: 5 } },
      { id: 'page.back.logo', type: 'semantic-object', role: 'school-logo', x: 35, y: 69, width: 30, height: 10, zIndex: 3, binding: 'school.profile.logo', bindingEnabled: true, fallbackToSample: true, sampleContent: { image: '' }, style: {} },
      { id: 'page.back.address', type: 'text', role: 'school-contact', binding: 'school.address', x: 27, y: 84, width: 46, height: 4, zIndex: 3, content: '학교 주소', style: { fontSize: 7, textAlign: 'center', background: false, color: '#475467' } },
      { id: 'page.back.contacts', type: 'text', role: 'school-contact', binding: 'school.contacts', x: 24, y: 88, width: 52, height: 6, zIndex: 3, content: '학교 연락처', style: { fontSize: 7, textAlign: 'center', background: false, color: '#475467' } }
    ];
  }

  function createSchoolSymbolElements() {
    return [
      ...createBackgroundPresetElements('symbols'),
      { id: 'page.symbols.title', type: 'text', role: 'symbols-title', x: 10, y: 8, width: 80, height: 8, zIndex: 3, content: '우리학교 상징', style: { fontSize: 27, textAlign: 'center', background: false, color: '#20abc3' } },
      { id: 'page.symbols.motto', type: 'semantic-object', role: 'school-motto', x: 8, y: 22, width: 40, height: 23, zIndex: 1, binding: 'school.profile.motto', bindingEnabled: true, fallbackToSample: true, sampleContent: { name: '교훈', description: '바르게 배우고 함께 성장합니다.' }, style: { titleSize: 17, descriptionSize: 12 } },
      { id: 'page.symbols.song', type: 'semantic-object', role: 'school-song', x: 52, y: 22, width: 40, height: 62, zIndex: 1, binding: 'school.profile.song', bindingEnabled: true, fallbackToSample: true, sampleContent: { name: '교가', description: '우리 학교 교가' }, style: { titleSize: 17, descriptionSize: 9 } },
      { id: 'page.symbols.tree', type: 'semantic-object', role: 'school-tree', x: 8, y: 52, width: 18, height: 32, zIndex: 1, binding: 'school.profile.tree', bindingEnabled: true, fallbackToSample: true, showCaption: true, sampleContent: { name: '교목', description: '곧은 마음과 푸른 꿈' }, style: { titleSize: 14, descriptionSize: 9 } },
      { id: 'page.symbols.flower', type: 'semantic-object', role: 'school-flower', x: 29, y: 52, width: 18, height: 32, zIndex: 1, binding: 'school.profile.flower', bindingEnabled: true, fallbackToSample: true, showCaption: true, sampleContent: { name: '교화', description: '아름다운 배움과 우정' }, style: { titleSize: 14, descriptionSize: 9 } }
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
      applyDeskPlannerFixedSurfaces(project, options);
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
