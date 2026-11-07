import assert from 'node:assert/strict';

await import('../apps/designer-studio/dataset-domain-bridge.js');

const {
  createDefaultSchoolProfile,
  ensureSchoolProfile,
  groupEventsByDate,
  displayEvent,
  monthKey,
  resolvePageBinding,
  buildSchoolContact,
  buildRuntimeDataset
} = globalThis.ACDLDatasetDomain;

const defaults = createDefaultSchoolProfile('샘플 학교');
assert.deepEqual(Object.keys(defaults), ['logo', 'building', 'flower', 'tree', 'motto', 'song']);
assert.equal(defaults.building.name, '샘플 학교');
assert.equal(defaults.motto.description, '바르게 배우고 함께 성장하자');

const schoolWithoutProfile = { name: '테스트 학교' };
const created = ensureSchoolProfile(schoolWithoutProfile);
assert.equal(created, schoolWithoutProfile.profile);
assert.equal(created.building.name, '테스트 학교');

const existingProfile = { logo: { name: '기존 교표' } };
const schoolWithPartialProfile = { name: '기존 학교', profile: existingProfile };
assert.equal(ensureSchoolProfile(schoolWithPartialProfile), existingProfile);
assert.deepEqual(schoolWithPartialProfile.profile, { logo: { name: '기존 교표' } });
assert.throws(() => ensureSchoolProfile(null), /school/);

const opening = {
  id: 'opening',
  title: '개학식',
  startDate: '2027-03-03',
  endDate: '2027-03-03'
};
const counseling = {
  id: 'counseling',
  title: '학부모상담기간',
  startDate: '2027-03-05',
  endDate: '2027-03-08'
};
const grouped = groupEventsByDate([opening, counseling]);
assert.deepEqual(Object.keys(grouped), [
  '2027-03-03',
  '2027-03-05',
  '2027-03-06',
  '2027-03-07',
  '2027-03-08'
]);
assert.equal(grouped['2027-03-03'][0], opening);
assert.equal(grouped['2027-03-07'][0], counseling);
const duplicateHolidays = groupEventsByDate([
  { id: 'holiday-a', title: '어린이날', startDate: '2027-05-05' },
  { id: 'holiday-b', title: '어린이 날', startDate: '2027-05-05' },
  { id: 'holiday-c', title: '어린이날', startDate: '2027-05-05', endDate: '2027-05-05' }
]);
assert.equal(duplicateHolidays['2027-05-05'].length, 1);
assert.equal(displayEvent({ title: '노동절 · 노동절' }).title, '노동절');
assert.equal(displayEvent({ title: '어린이날 · 어린이 날' }).title, '어린이날');
assert.equal(displayEvent({ title: '노동절 · 근로자의 날' }).title, '노동절');
assert.equal(displayEvent({ title: '스승의 날 · 세종대왕 나신 날' }).title, '스승의 날 · 세종대왕 나신 날');
assert.deepEqual(groupEventsByDate(), {});

assert.equal(monthKey(2027, 3), '2027-03');
assert.equal(resolvePageBinding('calendar.monthlyImages.current', { calendarYear: 2027, calendarMonth: 3 }), 'monthlyImages.2027-03');
assert.equal(resolvePageBinding('monthlyImages.{YYYY-MM}', { calendarYear: 2028, calendarMonth: 2 }), 'monthlyImages.2028-02');
assert.equal(resolvePageBinding('school.name', { calendarYear: 2027, calendarMonth: 3 }), 'school.name');
assert.deepEqual(buildSchoolContact({
  address: '서울시 테스트로 1',
  website: 'https://school.example',
  contacts: [
    { label: '교무실', phone: '02-111-1111' },
    { label: '행정실', phone: '02-222-2222', fax: '02-333-3333' }
  ]
}), {
  address: '서울시 테스트로 1',
  telAcademic: '02-111-1111',
  telAdmin: '02-222-2222',
  fax: '02-333-3333',
  site: 'https://school.example'
});

const project = {
  settings: { year: 2027, startMonth: 3, calendarRows: 5, weekStart: 'sunday' },
  book: {
    school: { name: '테스트 학교', address: '서울', phone: '02-100-1000' },
    events: [opening],
    monthlyImages: { '2027-03': 'asset:March' },
    monthlyQuotes: { '2027-03': { quoteKo: '테스트' } }
  }
};
const dataset = buildRuntimeDataset(project);
assert.equal(dataset.timezone, 'Asia/Seoul');
assert.equal(dataset.school.contact.telAcademic, '02-100-1000');
assert.equal(dataset.calendar.gridRows, 5);
assert.equal(dataset.calendar.events[0], opening);
assert.equal(dataset.monthlyImages['2027-03'], 'asset:March');
assert.notEqual(dataset.monthlyImages, project.book.monthlyImages);
assert.throws(() => buildRuntimeDataset(null), /project/);
