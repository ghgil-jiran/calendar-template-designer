import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const studio = fs.readFileSync(new URL('../apps/designer-studio/index.html', import.meta.url), 'utf8');
const client = fs.readFileSync(new URL('../apps/designer-studio/schedule-api-client.js', import.meta.url), 'utf8');
const proxy = fs.readFileSync(new URL('../api/calendar-reference.js', import.meta.url), 'utf8');

test('템플릿 에디터가 사용자 서비스 공공 달력 API를 같은 origin 프록시로 사용한다', () => {
  assert.match(client, /\/api\/calendar-reference/);
  assert.match(client, /x-template-editor-token/);
  assert.match(proxy, /\/api\/calendar\/reference\?year=/);
  assert.match(proxy, /assertInternalAccess/);
});

test('공휴일·기념일·절기는 날짜 셀, 학사일정은 별도 막대 레이어에 표시한다', () => {
  assert.match(studio, /calendarReferenceForDate/);
  assert.match(studio, /calendar-reference special/);
  assert.match(studio, /calendar-reference auxiliary/);
  assert.match(studio, /const auxiliary=\[\.\.\.refs\.lunars,\.\.\.refs\.solarTerms\]/);
  assert.match(studio, /const special=\[\.\.\.refs\.holidays,\.\.\.refs\.anniversaries\]/);
  assert.match(studio, /filter\(event=>!isPublicReferenceEvent\(event\)\)/);
  assert.match(studio, /reservedTop=32/);
});

test('공공 데이터가 템플릿 문서에 저장되어 재열기와 출력에도 유지된다', () => {
  assert.match(client, /book\.calendarReference/);
  assert.match(client, /calendar-reference\.v1/);
  assert.match(studio, /project\.book\.calendarReference/);
});

test('기본 설정에서 공휴일·기념일·24절기 표시 여부를 저장한다', () => {
  assert.match(studio, /resourceIncludeHolidays/);
  assert.match(studio, /resourceIncludeAnniversaries/);
  assert.match(studio, /resourceIncludeSolarTerms/);
  assert.match(studio, /resourceIncludeLunar/);
  assert.match(studio, /includeAnniversaries/);
  assert.match(studio, /ensureCalendarReferences\?\.\(project,\{force:true\}\)/);
});

test('공공 데이터 수신 뒤 실제 편집 월력을 다시 렌더링한다', () => {
  assert.match(client, /hasReferenceYear/);
  assert.match(client, /markDirty\?\.\(\)/);
  assert.match(client, /render\?\.\(\)/);
  assert.doesNotMatch(client, /root\.render\?\.\(\)/);
});

test('비어 있는 과거 공공 데이터 캐시는 유효한 캐시로 간주하지 않는다', () => {
  assert.match(client, /Array\.isArray\(items\) && items\.length > 0/);
  assert.match(client, /calendarYears\(targetProject\)\.filter/);
});

test('음력 표시 옵션과 캐시 계약을 사용자 서비스와 공유한다', () => {
  assert.match(studio, /calendarReferenceItems\(date,"lunar"\)/);
  assert.match(studio, /day-head-row/);
  assert.match(studio, /calendar-reference auxiliary/);
  assert.match(client, /'solar_term', 'lunar'/);
});
