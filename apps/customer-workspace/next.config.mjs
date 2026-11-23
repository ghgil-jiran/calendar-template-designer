/** @type {import('next').NextConfig} */
import {fileURLToPath} from 'node:url';
const config = {
  outputFileTracingRoot: fileURLToPath(new URL('../../',import.meta.url)),
  outputFileTracingIncludes: {
    '/api/workspace/schedule': [
      './node_modules/pdfjs-dist/cmaps/**/*',
      './node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs',
      './node_modules/@napi-rs/canvas*/**/*',
    ],
  },
  poweredByHeader: false,
  serverExternalPackages: ['pdfjs-dist'],
  experimental: { cpus: 2 },
};
export default config;
