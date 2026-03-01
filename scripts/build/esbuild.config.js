/* eslint-disable no-console */
const esbuild = require('esbuild');

const common = {
  entryPoints: ['src/index.ts'],
  bundle: true,
  sourcemap: true,
  target: ['es2020'],
  platform: 'neutral',
};

const buildESM = () =>
  esbuild.build({
    ...common,
    format: 'esm',
    outfile: 'dist/esm/index.js',
  });

const buildCJS = () =>
  esbuild.build({
    ...common,
    format: 'cjs',
    outfile: 'dist/cjs/index.js',
  });

const buildBiowareBundle = () =>
  esbuild.build({
    ...common,
    format: 'iife',
    globalName: 'Bioware',
    outfile: 'dist/bioware/bioware.js',
    minify: true,
    define: {
      __BIOWARE_MODE__: '"production"',
    },
  });

const build = async () => {
  await Promise.all([buildESM(), buildCJS(), buildBiowareBundle()]);
  console.log('[bioware] build complete');
};

build().catch((error) => {
  console.error('[bioware] build failed', error);
  process.exit(1);
});
