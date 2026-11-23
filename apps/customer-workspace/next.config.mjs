/** @type {import('next').NextConfig} */
import {fileURLToPath} from 'node:url';
const config = {
  outputFileTracingRoot: fileURLToPath(new URL('../../',import.meta.url)),
  outputFileTracingIncludes: {'/api/workspace/schedule': ['./node_modules/pdfjs-dist/cmaps/**/*']},
  poweredByHeader: false,
  serverExternalPackages: ['pdfjs-dist'],
  experimental: { cpus: 2 },
};
export default config;
