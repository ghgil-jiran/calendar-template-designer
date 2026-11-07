import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const composition = await readFile(resolve(root, 'apps/designer-studio/page-composition-runtime.js'), 'utf8');
const start = composition.indexOf('  const VECTOR_LIBRARY=');
const end = composition.indexOf('  function resolveMiniCalendar(', start);
if (start < 0 || end < 0) throw new Error('vector screen source missing');
const vector = composition.slice(start, end).replaceAll('escapeMonthStripText', 'escapeText');
const source = `(function(root){\n  "use strict";\n  const version = "0.1.0-preview.1";\n  const escapeText = value => String(value).replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[char]);\n${vector}  const api = Object.freeze({ version, renderVectorSvg, supportsVectorAsset });\n  root.ACDLSharedVector = api;\n  if (typeof module === "object" && module.exports) module.exports = api;\n})(typeof window !== "undefined" ? window : globalThis);\n`;
await writeFile(resolve(root, 'apps/designer-studio/shared-screen-vector.js'), source);
