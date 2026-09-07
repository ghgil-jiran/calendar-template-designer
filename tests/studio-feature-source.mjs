import fs from 'node:fs';

const featuresDirectory = new URL('../apps/designer-studio/features/', import.meta.url);

export function readStudioFeatureSource() {
  return fs.readdirSync(featuresDirectory)
    .filter((name) => name.endsWith('.js'))
    .sort()
    .map((name) => fs.readFileSync(new URL(name, featuresDirectory), 'utf8'))
    .join('\n');
}
