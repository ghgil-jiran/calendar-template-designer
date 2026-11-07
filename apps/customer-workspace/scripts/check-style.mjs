import {readFile, readdir} from 'node:fs/promises';
const violations = [];
async function walk(path) {
  for (const item of await readdir(path, {withFileTypes: true})) {
    const file = `${path}/${item.name}`;
    if (item.isDirectory()) await walk(file);
    else if (/\.tsx$/.test(file)) {
      const text = await readFile(file, 'utf8');
      if (/style=\{\{|(?:bg|text|border)-\[(?:#|rgb)/.test(text)) violations.push(file);
    }
  }
}
await walk('src');
const layout = await readFile('src/app/layout.tsx', 'utf8');
const globals = await readFile('src/app/globals.css', 'utf8');
if (!layout.includes("import './globals.css'")) violations.push('missing global stylesheet');
for (const name of ['base', 'components', 'utilities']) if (!globals.includes(`@tailwind ${name}`)) violations.push(`missing tailwind ${name}`);
if (violations.length) {console.error(violations); process.exit(1);}
console.log('Style guard passed');
