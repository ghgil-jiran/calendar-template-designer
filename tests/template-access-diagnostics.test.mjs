import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const persistenceSource = await readFile(new URL('../server/template-persistence.js', import.meta.url), 'utf8');
const authSource = await readFile(new URL('../server/admin-auth.js', import.meta.url), 'utf8');

assert.match(persistenceSource, /requireMasterAdmin/);
assert.match(authSource, /Bearer\\s\+\(\.\+\)/);
assert.match(authSource, /role=eq\.master_admin&active=is\.true/);
assert.doesNotMatch(authSource, /console\.|password\s*:/);
assert.doesNotMatch(`${persistenceSource}\n${authSource}`, /expectedToken|receivedToken|tokenValue|TEMPLATE_EDITOR_ACCESS_TOKEN/);
