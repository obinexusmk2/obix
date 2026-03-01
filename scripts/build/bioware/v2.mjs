import { build } from 'esbuild';
import { ensureDist } from './common.mjs';

console.log('[v2] Layered controller/control/controllee builds');
await ensureDist();

await Promise.all([
  build({
    entryPoints: ['src/controller/index.ts'],
    bundle: true,
    format: 'esm',
    outfile: 'dist/controller.v2.js',
    sourcemap: true,
    target: ['es2020'],
  }),
  build({
    entryPoints: ['src/control/index.ts'],
    bundle: true,
    format: 'esm',
    outfile: 'dist/control.v2.js',
    sourcemap: true,
    target: ['es2020'],
  }),
  build({
    entryPoints: ['src/controllee/index.ts'],
    bundle: true,
    format: 'esm',
    outfile: 'dist/controllee.v2.js',
    sourcemap: true,
    target: ['es2020'],
  }),
]);
