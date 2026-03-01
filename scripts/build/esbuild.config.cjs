const esbuild = require('esbuild');
const path = require('path');

const shared = {
  entryPoints: [path.resolve(__dirname, '../../src/index.ts')],
  bundle: true,
  sourcemap: true,
  legalComments: 'none',
  target: ['es2020'],
  platform: 'neutral'
};

async function buildEsm() {
  await esbuild.build({
    ...shared,
    format: 'esm',
    outfile: path.resolve(__dirname, '../../dist/esm/index.js')
  });
}

async function buildCjs() {
  await esbuild.build({
    ...shared,
    format: 'cjs',
    outfile: path.resolve(__dirname, '../../dist/cjs/index.js')
  });
}

async function run() {
  await Promise.all([buildEsm(), buildCjs()]);
}

run().catch((error) => {
  console.error('[bioware-build] failed', error);
  process.exit(1);
});
