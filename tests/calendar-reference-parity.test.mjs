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
  assert.match(studio, /calendar-reference holiday/);
  assert.match(studio, /calendar-reference.*solar-term/);
  assert.match(studio, /filter\(event=>!isPublicReferenceEvent\(event\)\)/);
  assert.match(studio, /reservedTop=32/);
});

test('공공 데이터가 템플릿 문서에 저장되어 재열기와 출력에도 유지된다', () => {
  assert.match(client, /book\.calendarReference/);
  assert.match(client, /calendar-reference\.v1/);
  assert.match(studio, /project\.book\.calendarReference/);
});
