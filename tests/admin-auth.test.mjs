import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';
import { signInTestMasterAdmin, testAutoLoginEnabled, verifyMasterAdminToken } from '../server/admin-auth.js';

const originalFetch = globalThis.fetch;
const originalEnv = { url: process.env.SUPABASE_URL, key: process.env.SUPABASE_SERVICE_ROLE_KEY, vercel:process.env.VERCEL_ENV, node:process.env.NODE_ENV, enabled:process.env.TEST_AUTO_LOGIN_ENABLED, email:process.env.TEST_AUTO_LOGIN_EMAIL, password:process.env.TEST_AUTO_LOGIN_PASSWORD };

function response(body, status = 200) { return { ok: status >= 200 && status < 300, status, text: async () => JSON.stringify(body) }; }

test.beforeEach(() => {
  process.env.SUPABASE_URL = 'https://project.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-secret';
  delete process.env.VERCEL_ENV;
  process.env.NODE_ENV = 'test';
  delete process.env.TEST_AUTO_LOGIN_ENABLED;
  delete process.env.TEST_AUTO_LOGIN_EMAIL;
  delete process.env.TEST_AUTO_LOGIN_PASSWORD;
});

test.after(() => {
  if (originalEnv.url === undefined) delete process.env.SUPABASE_URL; else process.env.SUPABASE_URL = originalEnv.url;
  if (originalEnv.key === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY; else process.env.SUPABASE_SERVICE_ROLE_KEY = originalEnv.key;
  for (const [name,value] of [['VERCEL_ENV',originalEnv.vercel],['NODE_ENV',originalEnv.node],['TEST_AUTO_LOGIN_ENABLED',originalEnv.enabled],['TEST_AUTO_LOGIN_EMAIL',originalEnv.email],['TEST_AUTO_LOGIN_PASSWORD',originalEnv.password]]) value===undefined?delete process.env[name]:process.env[name]=value;
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

test('test auto login is impossible in Production even when credentials are configured',()=>{process.env.VERCEL_ENV='production';process.env.TEST_AUTO_LOGIN_ENABLED='true';process.env.TEST_AUTO_LOGIN_EMAIL='test@example.com';process.env.TEST_AUTO_LOGIN_PASSWORD='secret';assert.equal(testAutoLoginEnabled(),false)});

test('Preview test auto login uses the normal Supabase Master Admin session',async()=>{process.env.VERCEL_ENV='preview';process.env.TEST_AUTO_LOGIN_ENABLED='true';process.env.TEST_AUTO_LOGIN_EMAIL='test@example.com';process.env.TEST_AUTO_LOGIN_PASSWORD='secret';globalThis.fetch=async(url,options={})=>{if(url.includes('/auth/v1/token')){assert.deepEqual(JSON.parse(options.body),{email:'test@example.com',password:'secret'});return response({access_token:'test-jwt',refresh_token:'refresh',expires_in:3600})}if(url.endsWith('/auth/v1/user'))return response({id:'test-1',email:'test@example.com'});if(url.includes('/template_admins?'))return response([{user_id:'test-1',role:'master_admin',active:true}]);throw new Error(`unexpected ${url}`)};const session=await signInTestMasterAdmin();assert.equal(session.accessToken,'test-jwt');assert.equal(session.user.role,'master_admin')});

test('browser exposes capability lookup and dedicated test sign in without sending credentials',async()=>{const source=await readFile(new URL('../apps/designer-studio/admin-auth.js',import.meta.url),'utf8'),requests=[],window={sessionStorage:{getItem:()=>null,setItem(){},removeItem(){}},fetch:async(url,options={})=>{requests.push([url,options.body]);if(url.includes('capabilities=1'))return {ok:true,json:async()=>({testAutoLoginEnabled:true})};return {ok:true,status:200,json:async()=>({user:{email:'test@example.com',role:'master_admin'},accessToken:'test-jwt',refreshToken:'refresh',expiresIn:3600})}}};vm.runInNewContext(source,{window,console,Date,JSON,Set});assert.equal((await window.ACDLAdminAuth.capabilities()).testAutoLoginEnabled,true);await window.ACDLAdminAuth.signInForTesting();assert.equal(JSON.parse(requests[1][1]).action,'test-sign-in');assert.equal(requests[1][1].includes('password'),false)});
