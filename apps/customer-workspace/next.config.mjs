/** @type {import('next').NextConfig} */
import {fileURLToPath} from 'node:url';
const config = { outputFileTracingRoot:fileURLToPath(new URL('../../',import.meta.url)), poweredByHeader: false, experimental: { cpus: 2 } };
export default config;
