import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../apps/designer-studio/schedule-api-client.js', import.meta.url), 'utf8');
const listeners = [];
const context = {
  console,
  Date,
  FormData,
  fetch: async () => { throw new Error('not called'); },
  localStorage: { getItem: () => null, setItem: () => {} },
  document: { addEventListener: (...args) => listeners.push(args), getElementById: () => null },
  globalThis: null
};
context.globalThis = context;
vm.runInNewContext(source, context);

const api = context.ACDLScheduleApiClient;
assert.ok(api, 'schedule API client must be exported');
assert.equal(api.endpoint(), 'http://localhost:3000/api/ai/schedule-extract');
const events = api.toEditorEvents([
  { date: '2028-03-02', label: '개학식', category: 'event' },
  { date: '2028-07-20', endDate: '2028-08-16', label: '여름방학', category: 'vacation' }
]);
assert.equal(events.length, 2);
assert.equal(events[0].startDate, '2028-03-02');
assert.equal(events[0].endDate, '2028-03-02');
assert.equal(events[1].endDate, '2028-08-16');
assert.equal(events[1].source, 'user-import');
assert.ok(listeners.some(([name]) => name === 'change'), 'resource upload interception must be registered');

const studio = await readFile(new URL('../apps/designer-studio/index.html', import.meta.url), 'utf8');
assert.match(studio, /schedule-api-client\.css/);
assert.match(studio, /schedule-api-client\.js/);
assert.match(source, /resourceScheduleAiPanel/);
assert.match(source, /academicYear/);
assert.match(source, /startMonth/);
assert.match(source, /공통 AI로 추출했습니다/);
