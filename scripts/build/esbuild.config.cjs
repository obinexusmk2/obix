const path = require('path');

let esbuild;
try {
  esbuild = require('esbuild');
} catch {
  console.error('[Bioware Build] Missing dev dependency: esbuild');
  process.exit(1);
}

const root = path.resolve(__dirname, '../..');

const baseConfig = {
  entryPoints: [path.join(root, 'src/index.ts')],
  bundle: true,
  sourcemap: true,
  platform: 'neutral',
  target: ['es2020'],
  define: {
    __BIOWARE_VERSION__: '"0.2.0"',
    __BIOWARE_MODE__: '"production"'
  }
};

async function buildESM() {
  await esbuild.build({
    ...baseConfig,
    format: 'esm',
    outfile: path.join(root, 'dist/esm/bioware.js')
  });
}

async function buildCJS() {
  await esbuild.build({
    ...baseConfig,
    format: 'cjs',
    outfile: path.join(root, 'dist/cjs/bioware.js')
  });
}

async function buildController() {
  await esbuild.build({
    entryPoints: [path.join(root, 'src/controller/index.ts')],
    bundle: true,
    platform: 'neutral',
    target: ['es2020'],
    format: 'esm',
    outfile: path.join(root, 'dist/bioware/controller.js')
  });
}

async function buildControl() {
  await esbuild.build({
    entryPoints: [path.join(root, 'src/control/index.ts')],
    bundle: true,
    platform: 'neutral',
    target: ['es2020'],
    format: 'esm',
    outfile: path.join(root, 'dist/bioware/control.js')
  });
}

async function buildControllee() {
  await esbuild.build({
    entryPoints: [path.join(root, 'src/controllee/index.ts')],
    bundle: true,
    platform: 'neutral',
    target: ['es2020'],
    format: 'esm',
    outfile: path.join(root, 'dist/bioware/controllee.js')
  });
}

async function build() {
  console.log('[Bioware Build] Controller -> Control -> Controllee');
  await Promise.all([buildESM(), buildCJS(), buildController(), buildControl(), buildControllee()]);
  console.log('[Bioware Build] Build complete');
}

build().catch((error) => {
  console.error('[Bioware Build] Build failed', error);
  process.exit(1);
});
