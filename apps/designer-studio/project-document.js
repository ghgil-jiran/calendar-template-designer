(function (root) {
  const palette = ['#315e9e', '#4777bd', '#2e8b72', '#4c8f3a', '#b57b23', '#c05a4f', '#a64f78', '#7459a8', '#3f769e', '#50806b', '#9a6a45', '#526487'];
  const pastel = ['#dff4ee', '#e7f3df', '#fff0d8', '#fde5df', '#f8e4ed', '#eee7f8', '#e1edf8', '#e2f1ed', '#f6eadf', '#e8edf6', '#f1e8dc', '#e7ebf2'];
  const protectedPlannerPermissions = { move: false, resize: false, rotate: false, color: false, delete: false, duplicate: false, layer: false, content: false };

  function applyDeskRepresentativePreset(project, options) {
    if (options.type !== 'desk' || !['desk-sample-6', 'desk-sample-2'].includes(options.template)) return project;
    const isPlanner = options.template === 'desk-sample-6';
    const months = project.book.pageInstances.filter(page => page.role === 'monthly-front');
    project.template.metadata = { name: isPlanner ? '탁상형 6번 · 월별 플래너형' : '탁상형 2번 · 이미지 콜라주형', sampleFamily: isPlanner ? 'desk-6' : 'desk-2', productRuntime: 'desk-sequence' };
    project.template.pageComposition = { type: 'desk-sequence', pageCount: 30, monthPairCount: 12, frontInsertSurfaceCount: 2 };
    project.template.masters.calendar.calendarRegion = { x: 3, y: 10, width: 94, height: 87 };
    project.template.masters.calendar.eventMaxVisiblePerDay = 3;
    project.template.masters.calendar.design = { monthTitleAlign: 'left', monthTitleStyle: 'number-stack', weekdayStyle: 'filled-tabs', gridStyle: 'boxed', eventStyle: 'strong-bars' };
    project.template.masterElements['master.monthly.back'] = isPlanner ? [
      { id: 'master.planner.goal', type: 'memo', role: 'monthly-goal', memoLayout: 'goal', x: 4, y: 11, width: 36, height: 42, zIndex: 2, title: 'MONTHLY GOAL', required: true, permissions: { ...protectedPlannerPermissions }, style: {} },
      { id: 'master.planner.todo', type: 'memo', role: 'monthly-todo', memoLayout: 'checklist', x: 4, y: 55, width: 36, height: 40, zIndex: 2, title: 'TO DO LIST', itemCount: 9, required: true, permissions: { ...protectedPlannerPermissions }, style: {} },
      { id: 'master.planner.weekly', type: 'memo', role: 'weekly-planner', memoLayout: 'weekly', x: 42, y: 11, width: 54, height: 84, zIndex: 2, title: 'WEEKLY PLANNER', weekCount: 5, showMemo: true, required: true, permissions: { ...protectedPlannerPermissions }, style: {} }
    ] : [
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
    const symbolPage = project.book.pageInstances.find(page => page.role === 'back-cover-back');
    if (symbolPage) {
      symbolPage.semanticPageRole = 'school-symbols';
      project.book.elementsByPage[symbolPage.id] = [
        { id: 'page.symbols.motto', type: 'semantic-object', role: 'school-motto', x: 5, y: 10, width: 43, height: 35, zIndex: 1, binding: 'school.profile.motto', bindingEnabled: true, fallbackToSample: true, sampleContent: { name: '교훈', description: '바르게 배우고 함께 성장합니다.' }, style: {} },
        { id: 'page.symbols.song', type: 'semantic-object', role: 'school-song', x: 52, y: 10, width: 43, height: 35, zIndex: 1, binding: 'school.profile.song', bindingEnabled: true, fallbackToSample: true, sampleContent: { name: '교가', description: '우리 학교 교가' }, style: {} },
        { id: 'page.symbols.tree', type: 'semantic-object', role: 'school-tree', x: 5, y: 52, width: 43, height: 35, zIndex: 1, binding: 'school.profile.tree', bindingEnabled: true, fallbackToSample: true, showCaption: true, sampleContent: { name: '교목', description: '곧은 마음과 푸른 꿈' }, style: {} },
        { id: 'page.symbols.flower', type: 'semantic-object', role: 'school-flower', x: 52, y: 52, width: 43, height: 35, zIndex: 1, binding: 'school.profile.flower', bindingEnabled: true, fallbackToSample: true, showCaption: true, sampleContent: { name: '교화', description: '아름다운 배움과 우정' }, style: {} }
      ];
    }
    const backCover = project.book.pageInstances.find(page => page.role === 'back-cover-front');
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

  root.ACDLProjectDocument = Object.freeze({ createProject });
})(typeof window !== 'undefined' ? window : globalThis);
