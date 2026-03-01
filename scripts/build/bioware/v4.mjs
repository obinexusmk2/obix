import { execSync } from 'node:child_process';
import { build } from 'esbuild';
import { ensureDist } from './common.mjs';

console.log('[v4] Production release outputs + declarations');
await ensureDist();

await Promise.all([
  build({
    entryPoints: ['src/index.ts'],
    bundle: true,
    minify: true,
    format: 'esm',
    outfile: 'dist/esm/bioware.min.js',
    target: ['es2020'],
  }),
  build({
    entryPoints: ['src/index.ts'],
    bundle: true,
    minify: true,
    format: 'cjs',
    outfile: 'dist/cjs/bioware.min.cjs',
    target: ['node18'],
    platform: 'node',
  }),
  build({
    entryPoints: ['src/index.ts'],
    bundle: true,
    minify: true,
    format: 'iife',
    globalName: 'Bioware',
    outfile: 'dist/umd/bioware.min.js',
    target: ['es2018'],
    platform: 'browser',
  }),
]);

execSync('tsc --project tsconfig.types.json', { stdio: 'inherit' });
console.log('[v4] complete');
