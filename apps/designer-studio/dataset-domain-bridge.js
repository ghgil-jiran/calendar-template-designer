(function (root) {
  function createDefaultSchoolProfile(schoolName) {
    return {
      logo: { name: '교표', image: '', description: '' },
      building: { name: schoolName, image: '', description: '학교 전경과 교육 환경을 소개합니다.' },
      flower: { name: '장미', image: '', description: '사랑과 열정을 상징합니다.' },
      tree: { name: '소나무', image: '', description: '굳센 의지와 푸른 꿈을 상징합니다.' },
      motto: { name: '교훈', image: '', description: '바르게 배우고 함께 성장하자' },
      song: { name: '우리 학교 교가', image: '', description: '작사 미상 · 작곡 미상' }
    };
  }

  // 과거 프로젝트의 일부 profile을 추측해 보충하지 않는다. 기존 화면의
  // `profile ||= defaults` 동작처럼 profile 전체가 없을 때만 기본값을 만든다.
  function ensureSchoolProfile(school) {
    if (!school || typeof school !== 'object') {
      throw new TypeError('school must be an object');
    }
    school.profile ||= createDefaultSchoolProfile(school.name);
    return school.profile;
  }

  function dateKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  // 저장된 일정 객체를 복제하거나 고치지 않고, 화면 표시용 날짜 인덱스만 만든다.
  function groupEventsByDate(events) {
    const grouped = {};
    (events || []).forEach(event => {
      const date = new Date(`${event.startDate}T00:00:00`);
      const last = new Date(`${event.endDate || event.startDate}T00:00:00`);
      while (date <= last) {
        (grouped[dateKey(date)] ||= []).push(event);
        date.setDate(date.getDate() + 1);
      }
    });
    return grouped;
  }

  function monthKey(year, month) {
    return `${Number(year)}-${String(Number(month)).padStart(2, '0')}`;
  }

  function resolvePageBinding(binding, page = {}) {
    if (typeof binding !== 'string') return binding;
    const key = monthKey(page.calendarYear, page.calendarMonth);
    if (binding === 'calendar.monthlyImages.current') return `monthlyImages.${key}`;
    return binding.replace('{YYYY-MM}', key);
  }

  // 템플릿 에디터의 가변 contacts[]를 사용자 서비스 v1.1의 고정 연락처
  // 계약으로 투영한다. 저장 원본은 바꾸지 않으며, 없는 값은 빈 문자열이다.
  function buildSchoolContact(school = {}) {
    const contacts = Array.isArray(school.contacts) ? school.contacts : [];
    const find = label => contacts.find(item => String(item?.label || '').includes(label)) || {};
    const academic = find('교무');
    const admin = find('행정');
    const faxSource = contacts.find(item => item?.fax) || {};
    return {
      address: school.address || '',
      telAcademic: academic.phone || school.phone || '',
      telAdmin: admin.phone || '',
      fax: faxSource.fax || school.fax || '',
      site: school.website || school.site || ''
    };
  }

  // Runtime으로 넘길 읽기 전용 스냅샷을 한 곳에서 만든다. 기존 프로젝트
  // 스키마를 마이그레이션하거나 사용자 UI의 저장 형태를 바꾸지 않는다.
  function buildRuntimeDataset(project) {
    if (!project || typeof project !== 'object') {
      throw new TypeError('project must be an object');
    }
    const book = project.book || {};
    const settings = project.settings || {};
    const school = book.school || {};
    return {
      schemaVersion: '1.0',
      locale: 'ko-KR',
      timezone: 'Asia/Seoul',
      school: { ...school, contact: buildSchoolContact(school) },
      calendar: {
        year: settings.year,
        startMonth: settings.startMonth,
        weekStart: settings.weekStart || 'sunday',
        gridRows: Number(settings.calendarRows || 6),
        events: book.events || [],
        dataOptions: settings.dataOptions || {}
      },
      monthlyImages: { ...(book.monthlyImages || {}) },
      monthlyQuotes: { ...(book.monthlyQuotes || {}) },
      variables: { settings }
    };
  }

  root.ACDLDatasetDomain = Object.freeze({
    createDefaultSchoolProfile,
    ensureSchoolProfile,
    groupEventsByDate,
    monthKey,
    resolvePageBinding,
    buildSchoolContact,
    buildRuntimeDataset
  });
})(typeof window !== 'undefined' ? window : globalThis);
