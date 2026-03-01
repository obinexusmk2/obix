import { build } from 'esbuild';
import { ensureDist } from './common.mjs';

console.log('[v3] Multi-format esbuild outputs');
await ensureDist();

await Promise.all([
  build({
    entryPoints: ['src/index.ts'],
    bundle: true,
    format: 'esm',
    outfile: 'dist/esm/index.js',
    sourcemap: true,
    target: ['es2020'],
  }),
  build({
    entryPoints: ['src/index.ts'],
    bundle: true,
    format: 'cjs',
    outfile: 'dist/cjs/index.js',
    sourcemap: true,
    target: ['node18'],
    platform: 'node',
  }),
]);
