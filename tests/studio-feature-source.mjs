import fs from 'node:fs';

const featuresDirectory = new URL('../apps/designer-studio/features/', import.meta.url);
const studioDirectory = new URL('../apps/designer-studio/', import.meta.url);

export function readStudioFeatureSource() {
  const features = fs.readdirSync(featuresDirectory)
    .filter((name) => name.endsWith('.js'))
    .sort()
    .map((name) => fs.readFileSync(new URL(name, featuresDirectory), 'utf8'))
    .join('\n');
  const shared = fs.readdirSync(studioDirectory)
    .filter((name) => name.startsWith('shared-screen-') && (name.endsWith('.js') || name.endsWith('.css')))
    .sort()
    .map((name) => fs.readFileSync(new URL(name, studioDirectory), 'utf8'))
    .join('\n');
  return `${features}\n${shared}`;
}
