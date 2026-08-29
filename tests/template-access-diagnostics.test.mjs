import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../server/template-persistence.js', import.meta.url), 'utf8');

assert.match(source, /tokenConfigured: Boolean\(expected\)/);
assert.match(source, /tokenReceived: Boolean\(received\)/);
assert.match(source, /expectedLength: expectedBytes\.length/);
assert.match(source, /receivedLength: receivedBytes\.length/);
assert.match(source, /error\?\.details \? \{ details: error\.details \}/);
assert.doesNotMatch(source, /expectedToken|receivedToken|tokenValue/);
