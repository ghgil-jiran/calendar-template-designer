import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import handler from '../api/schedule-extract.js';

const originalEnv = {
  origin: process.env.USER_SERVICE_ORIGIN,
  token: process.env.TEMPLATE_EDITOR_ACCESS_TOKEN
};
const originalFetch = globalThis.fetch;

function request({ token = 'shared-editor-token', body = 'multipart-payload' } = {}) {
  const stream = Readable.from([Buffer.from(body)]);
  stream.method = 'POST';
  stream.headers = {
    'content-type': 'multipart/form-data; boundary=calendar-test',
    ...(token ? { 'x-template-editor-token': token } : {})
  };
  return stream;
}

function response() {
  return {
    statusCode: 200,
    headers: {},
    body: '',
    setHeader(name, value) { this.headers[name.toLowerCase()] = value; },
    status(code) { this.statusCode = code; return this; },
    json(value) { this.setHeader('Content-Type', 'application/json; charset=utf-8'); this.end(JSON.stringify(value)); },
    end(value = '') { this.body += String(value); }
  };
}

test.beforeEach(() => {
  process.env.USER_SERVICE_ORIGIN = 'https://school-calendar-editor-service.example/';
  process.env.TEMPLATE_EDITOR_ACCESS_TOKEN = 'shared-editor-token';
});

test.after(() => {
  if (originalEnv.origin === undefined) delete process.env.USER_SERVICE_ORIGIN;
  else process.env.USER_SERVICE_ORIGIN = originalEnv.origin;
  if (originalEnv.token === undefined) delete process.env.TEMPLATE_EDITOR_ACCESS_TOKEN;
  else process.env.TEMPLATE_EDITOR_ACCESS_TOKEN = originalEnv.token;
  globalThis.fetch = originalFetch;
});

test('deployed proxy authenticates and forwards the untouched multipart body to the shared User Service module', async () => {
  let upstreamRequest;
  globalThis.fetch = async (url, options) => {
    upstreamRequest = { url, options };
    return {
      status: 200,
      headers: { get: name => name.toLowerCase() === 'content-type' ? 'application/json; charset=utf-8' : null },
      text: async () => JSON.stringify({
        schedules: [{ date: '2028-03-02', label: '개학식', category: 'event' }],
        total: 1
      })
    };
  };

  const res = response();
  await handler(request(), res);

  assert.equal(res.statusCode, 200);
  assert.equal(upstreamRequest.url, 'https://school-calendar-editor-service.example/api/ai/schedule-extract');
  assert.equal(upstreamRequest.options.method, 'POST');
  assert.equal(upstreamRequest.options.headers['content-type'], 'multipart/form-data; boundary=calendar-test');
  assert.equal(upstreamRequest.options.body.toString(), 'multipart-payload');
  assert.equal(JSON.parse(res.body).schedules[0].label, '개학식');
  assert.equal(res.headers['cache-control'], 'no-store');
});

test('proxy authentication diagnostics never disclose either access-token value', async () => {
  const res = response();
  await handler(request({ token: 'wrong-token' }), res);

  assert.equal(res.statusCode, 401);
  const body = JSON.parse(res.body);
  assert.equal(body.error, 'UNAUTHORIZED');
  assert.equal(body.details.tokenConfigured, true);
  assert.equal(body.details.tokenReceived, true);
  assert.equal(body.details.expectedLength, 'shared-editor-token'.length);
  assert.equal(body.details.receivedLength, 'wrong-token'.length);
  assert.doesNotMatch(res.body, /shared-editor-token|wrong-token/);
});

test('proxy refuses deployment without a fixed HTTPS User Service origin', async () => {
  process.env.USER_SERVICE_ORIGIN = 'http://localhost:3000';
  const res = response();
  await handler(request(), res);
  assert.equal(res.statusCode, 503);
  assert.equal(JSON.parse(res.body).error, 'SCHEDULE_API_NOT_CONFIGURED');
});

test('remote browser client uses same-origin proxy and the remote-persistence access token', async () => {
  const source = await readFile(new URL('../apps/designer-studio/schedule-api-client.js', import.meta.url), 'utf8');
  let captured;
  const context = {
    console,
    Date,
    Blob,
    FormData,
    location: { hostname: 'calendar-template-designer.vercel.app', origin: 'https://calendar-template-designer.vercel.app' },
    ACDLTemplateRemotePersistence: {
      accessToken: () => 'shared-editor-token',
      clearAccessToken: () => { throw new Error('must not clear a valid token'); }
    },
    fetch: async (url, options) => {
      captured = { url, options };
      return { ok: true, status: 200, json: async () => ({ schedules: [], total: 0 }) };
    },
    localStorage: { getItem: () => null, setItem: () => {} },
    document: { addEventListener: () => {}, getElementById: () => null },
    globalThis: null
  };
  context.globalThis = context;
  vm.runInNewContext(source, context);

  const file = new Blob(['schedule'], { type: 'text/plain' });
  const result = await context.ACDLScheduleApiClient.extract(file, { academicYear: 2028, startMonth: 3 });

  assert.equal(captured.url, 'https://calendar-template-designer.vercel.app/api/schedule-extract');
  assert.equal(captured.options.method, 'POST');
  assert.equal(captured.options.headers['x-template-editor-token'], 'shared-editor-token');
  assert.equal(result.total, 0);
});
