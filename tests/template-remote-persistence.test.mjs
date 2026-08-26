import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const source = await readFile(new URL('../apps/designer-studio/template-remote-persistence.js', import.meta.url), 'utf8');

function runtime({ hostname = 'templates.example.com', fetch, prompt = () => 'access-code' } = {}) {
  const values = new Map();
  const window = { location: { hostname }, sessionStorage: { getItem: key => values.get(key) || null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) }, prompt, fetch };
  vm.runInNewContext(source, { window, URL, console, structuredClone });
  return window.ACDLTemplateRemotePersistence;
}

test('remote persistence stays disabled on the local editor', () => {
  assert.equal(runtime({ hostname: 'localhost' }).isRemote(), false);
});

test('remote library uses one latest record per template', async () => {
  const calls = [];
  const api = runtime({ fetch: async (path, options) => {
    calls.push({ path, options });
    return { ok: true, status: 200, json: async () => ({ templates: [{ id: 't1', stableKey: 'wall-01', name: '벽걸이형 표준 01', description: '', edition: 2028, state: 'ready', productType: 'wall', templateKey: 'wall-standard', latestVersionNumber: 7, updatedAt: '2026-08-24T00:00:00Z' }] }) };
  }});
  const records = await api.list();
  assert.equal(records.length, 1);
  assert.equal(records[0].id, 't1');
  assert.equal(records[0].version, 7);
  assert.equal(records[0].storage, 'supabase');
  assert.equal(calls[0].options.headers['x-template-editor-token'], 'access-code');
});

test('remote save sends project data through the protected Vercel API', async () => {
  let request;
  const api = runtime({ fetch: async (path, options) => {
    request = { path, options };
    return { ok: true, status: 201, json: async () => ({ template: { id: 't1' }, version: { versionNumber: 2 } }) };
  }});
  const result = await api.save({ stableKey: 'wall-01', projectData: { id: 'project' } });
  assert.equal(request.path, '/api/templates');
  assert.equal(request.options.method, 'POST');
  assert.equal(JSON.parse(request.options.body).projectData.id, 'project');
  assert.equal(result.version.versionNumber, 2);
});

test('autosave never prompts for a missing access token', async () => {
  let promptCount = 0;
  const api = runtime({ prompt: () => { promptCount += 1; return ''; }, fetch: async () => { throw new Error('must not fetch'); } });
  await assert.rejects(() => api.saveDraft({ templateId: 't1', projectData: {} }), error => error.code === 'ACCESS_TOKEN_REQUIRED');
  assert.equal(promptCount, 0);
});

test('project images become stable asset references and hydrate with signed URLs', async () => {
  const api = runtime({ fetch: async (path) => {
    if (path === '/api/template-assets') return { ok: true, status: 201, json: async () => ({ asset: { id: '11111111-1111-4111-8111-111111111111' } }) };
    if (path.startsWith('/api/template-assets?ids=')) return { ok: true, status: 200, json: async () => ({ assets: [{ id: '11111111-1111-4111-8111-111111111111', url: 'https://signed.example/image.png' }] }) };
    throw new Error(`unexpected ${path}`);
  }});
  const prepared = await api.prepareProjectData({ cover: { image: 'data:image/png;base64,YWJj' } });
  assert.equal(prepared.cover.image, 'acdl-asset://11111111-1111-4111-8111-111111111111');
  const hydrated = await api.hydrateProjectData(prepared);
  assert.equal(hydrated.cover.image, 'https://signed.example/image.png');
  const resaved = await api.prepareProjectData(hydrated);
  assert.equal(resaved.cover.image, 'acdl-asset://11111111-1111-4111-8111-111111111111');
});

test('a historical version hydrates private asset references for preview', async () => {
  const api = runtime({ fetch: async path => {
    assert.match(path, /^\/api\/template-assets\?ids=/);
    return { ok: true, status: 200, json: async () => ({ assets: [{ id: '11111111-1111-4111-8111-111111111111', url: 'https://signed.example/history.png' }] }) };
  }});
  const version = await api.hydrateVersion({ id: 'v1', projectData: { image: 'acdl-asset://11111111-1111-4111-8111-111111111111' } });
  assert.equal(version.projectData.image, 'https://signed.example/history.png');
});
