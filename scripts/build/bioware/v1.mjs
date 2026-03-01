import { runBuild } from './common.mjs';

console.log('[v1] Baseline esbuild bundle');
await runBuild({
  format: 'esm',
  outfile: 'dist/bioware.v1.js',
});
