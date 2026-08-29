import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const proxy = await readFile(new URL('../api/schedule-extract.js', import.meta.url), 'utf8');
const client = await readFile(new URL('../apps/designer-studio/schedule-api-client.js', import.meta.url), 'utf8');
const remote = await readFile(new URL('../apps/designer-studio/template-remote-persistence.js', import.meta.url), 'utf8');
const vercel = JSON.parse(await readFile(new URL('../vercel.json', import.meta.url), 'utf8'));
const env = await readFile(new URL('../.env.example', import.meta.url), 'utf8');

assert.doesNotThrow(() => new Function(client));
assert.doesNotThrow(() => new Function(remote));

assert.match(proxy, /assertInternalAccess\(request\)/);
assert.match(proxy, /process\.env\.USER_SERVICE_ORIGIN/);
assert.match(proxy, /\/api\/ai\/schedule-extract/);
assert.match(proxy, /body: await readBody\(request\)/);
assert.match(proxy, /AbortSignal\.timeout\(58_000\)/);
assert.match(client, /root\.location\.origin \+ '\/api\/schedule-extract'/);
assert.match(client, /x-template-editor-token/);
assert.match(client, /ACDLTemplateRemotePersistence\?\.accessToken/);
assert.match(client, /response\.status === 401/);
assert.match(client, /clearAccessToken/);
assert.match(client, /운영 자동 연결/);
assert.match(remote, /accessToken:requestToken/);
assert.match(remote, /clearAccessToken:clearToken/);
assert.equal(vercel.functions['api/schedule-extract.js'].maxDuration, 60);
assert.match(env, /^USER_SERVICE_ORIGIN=$/m);
