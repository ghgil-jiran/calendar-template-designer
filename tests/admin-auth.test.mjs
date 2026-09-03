import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';
import { verifyMasterAdminToken } from '../server/admin-auth.js';

const originalFetch = globalThis.fetch;
const originalEnv = { url: process.env.SUPABASE_URL, key: process.env.SUPABASE_SERVICE_ROLE_KEY };

function response(body, status = 200) { return { ok: status >= 200 && status < 300, status, text: async () => JSON.stringify(body) }; }

test.beforeEach(() => {
  process.env.SUPABASE_URL = 'https://project.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-secret';
});

test.after(() => {
  if (originalEnv.url === undefined) delete process.env.SUPABASE_URL; else process.env.SUPABASE_URL = originalEnv.url;
  if (originalEnv.key === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY; else process.env.SUPABASE_SERVICE_ROLE_KEY = originalEnv.key;
  globalThis.fetch = originalFetch;
});

test('server accepts an authenticated user only when the Master Admin row is active', async () => {
  globalThis.fetch = async url => {
    if (url.endsWith('/auth/v1/user')) return response({ id: 'user-1', email: 'admin@example.com' });
    if (url.includes('/template_admins?')) return response([{ user_id: 'user-1', email: 'admin@example.com', role: 'master_admin', active: true }]);
    throw new Error(`unexpected ${url}`);
  };
  assert.deepEqual(await verifyMasterAdminToken('signed-jwt'), { id: 'user-1', email: 'admin@example.com', role: 'master_admin' });
});

test('server rejects a signed-in account that is not registered as Master Admin', async () => {
  globalThis.fetch = async url => url.endsWith('/auth/v1/user') ? response({ id: 'user-2', email: 'other@example.com' }) : response([]);
  await assert.rejects(() => verifyMasterAdminToken('signed-jwt'), error => error.code === 'MASTER_ADMIN_REQUIRED');
});

test('browser authentication stores the Supabase session without an access-code prompt', async () => {
  const source = await readFile(new URL('../apps/designer-studio/admin-auth.js', import.meta.url), 'utf8');
  const values = new Map();
  const window = {
    sessionStorage: { getItem: key => values.get(key) || null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) },
    fetch: async () => ({ ok: true, status: 200, json: async () => ({ user: { email: 'admin@example.com', role: 'master_admin' }, accessToken: 'signed-jwt', refreshToken: 'refresh', expiresIn: 3600 }) })
  };
  vm.runInNewContext(source, { window, console, Date, JSON, Set });
  await window.ACDLAdminAuth.signIn('admin@example.com', 'password');
  assert.equal(window.ACDLAdminAuth.isSignedIn(), true);
  assert.equal(window.ACDLAdminAuth.accessToken(), 'signed-jwt');
  assert.match(values.get('acdl.masterAdminSession'), /admin@example\.com/);
});
