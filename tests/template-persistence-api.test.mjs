import assert from 'node:assert/strict';
import test from 'node:test';
import {
  assertInternalAccess,
  listTemplates,
  saveDraft,
  saveVersion,
  storeTemplateAsset,
  validateVersionSave
} from '../server/template-persistence.js';

const originalEnv = {
  url: process.env.SUPABASE_URL,
  key: process.env.SUPABASE_SERVICE_ROLE_KEY
};
const originalFetch = globalThis.fetch;

function response(body, status = 200) {
  return { ok: status >= 200 && status < 300, status, text: async () => JSON.stringify(body) };
}

test.beforeEach(() => {
  process.env.SUPABASE_URL = 'https://project.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'server-secret';
});

test.after(() => {
  if (originalEnv.url === undefined) delete process.env.SUPABASE_URL; else process.env.SUPABASE_URL = originalEnv.url;
  if (originalEnv.key === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY; else process.env.SUPABASE_SERVICE_ROLE_KEY = originalEnv.key;
  globalThis.fetch = originalFetch;
});

test('internal API accepts only an active Master Admin session', async () => {
  await assert.rejects(() => assertInternalAccess({ headers: {} }), error => error.code === 'AUTH_REQUIRED');
  globalThis.fetch = async url => {
    if (url.endsWith('/auth/v1/user')) return response({ id: 'user-1', email: 'admin@example.com' });
    if (url.includes('/template_admins?')) return response([{ user_id: 'user-1', email: 'admin@example.com', role: 'master_admin', active: true }]);
    throw new Error(`unexpected ${url}`);
  };
  const user = await assertInternalAccess({ headers: { authorization: 'Bearer signed-jwt' } });
  assert.equal(user.role, 'master_admin');
});

test('library endpoint maps one current row per template', async () => {
  globalThis.fetch = async (url, options) => {
    assert.match(url, /template_projects\?select=\*&archived_at=is\.null/);
    assert.equal(options.headers.Authorization, 'Bearer server-secret');
    return response([{ id: 't1', stable_key: 'wall-01', name: '벽걸이형 표준 01', description: '', edition: 2028, state: 'draft', product_type: 'wall', template_key: 'wall-standard', latest_version_id: 'v3', latest_version_number: 3, updated_at: '2026-08-24T00:00:00Z' }]);
  };
  const templates = await listTemplates();
  assert.equal(templates.length, 1);
  assert.equal(templates[0].latestVersionNumber, 3);
  assert.equal(templates[0].name, '벽걸이형 표준 01');
});

test('manual save calls the atomic version function then returns the latest library row', async () => {
  const calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push({ url, options });
    if (url.endsWith('/rpc/save_template_version')) return response({ id: 'v4', template_id: 't1', version_number: 4, save_kind: 'manual', state: 'ready', save_note: '표지 정리', source_version_id: null, schema_version: '2.0', project_data: { id: 'project' }, created_at: '2026-08-24T01:00:00Z' });
    return response([{ id: 't1', stable_key: 'wall-01', name: '벽걸이형 표준 01', description: '', edition: 2028, state: 'ready', product_type: 'wall', template_key: 'wall-standard', latest_version_id: 'v4', latest_version_number: 4, updated_at: '2026-08-24T01:00:00Z' }]);
  };
  const saved = await saveVersion({ stableKey: 'wall-01', name: '벽걸이형 표준 01', edition: 2028, state: 'ready', productType: 'wall', templateKey: 'wall-standard', saveKind: 'manual', saveNote: '표지 정리', schemaVersion: '2.0', projectData: { id: 'project' } });
  assert.equal(saved.version.versionNumber, 4);
  assert.equal(saved.template.latestVersionId, 'v4');
  assert.equal(calls.length, 2);
  assert.equal(JSON.parse(calls[0].options.body).p_save_kind, 'manual');
});

test('autosave upserts one draft without creating a version', async () => {
  globalThis.fetch = async (url, options) => {
    assert.match(url, /template_drafts\?on_conflict=template_id/);
    assert.equal(options.headers.Prefer, 'resolution=merge-duplicates,return=representation');
    return response([{ template_id: 't1', schema_version: '2.0', project_data: { id: 'draft' }, updated_at: '2026-08-24T02:00:00Z' }]);
  };
  const draft = await saveDraft({ templateId: 't1', schemaVersion: '2.0', projectData: { id: 'draft' } });
  assert.equal(draft.template_id, 't1');
});

test('invalid save metadata is rejected before a database request', () => {
  assert.throws(() => validateVersionSave({ edition: 2028, state: 'unknown' }), error => error.code === 'INVALID_REQUEST');
});

test('image assets upload once by content hash and return a private signed URL', async () => {
  const calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push({ url, options });
    if (url.includes('/rest/v1/template_assets?select=')) return response([]);
    if (url.includes('/storage/v1/object/template-assets/')) return response({ Key: 'stored' });
    if (url.includes('/rest/v1/template_assets?on_conflict=')) return response([{ id: '11111111-1111-4111-8111-111111111111', content_hash: 'hash', storage_bucket: 'template-assets', storage_path: 'sha256/image.png', mime_type: 'image/png', byte_size: 3 }]);
    if (url.includes('/storage/v1/object/sign/')) return response({ signedURL: '/storage/v1/object/sign/template-assets/sha256/image.png?token=signed' });
    throw new Error(`unexpected ${url}`);
  };
  const asset = await storeTemplateAsset('data:image/png;base64,YWJj');
  assert.equal(asset.id, '11111111-1111-4111-8111-111111111111');
  assert.match(asset.url, /^https:\/\/project\.supabase\.co\/storage\/v1\/object\/sign\//);
  assert.equal(calls.filter(call => call.url.includes('/object/template-assets/')).length, 1);
});

test('unsupported asset types are rejected before storage access', async () => {
  await assert.rejects(() => storeTemplateAsset('data:text/plain;base64,YWJj'), error => error.code === 'INVALID_IMAGE');
});
