const { nodeResolve } = require('@rollup/plugin-node-resolve');
const commonjs = require('@rollup/plugin-commonjs');
const esbuild = require('rollup-plugin-esbuild');
const { terser } = require('rollup-plugin-terser');

const layer = (input, fileBase, layerName) => ({
  input,
  plugins: [
    esbuild({
      target: 'es2020',
      define: { __LAYER__: `"${layerName}"` }
    }),
    nodeResolve(),
    commonjs()
  ],
  output: [
    { file: `dist/${fileBase}.esm.js`, format: 'esm' },
    { file: `dist/${fileBase}.cjs.js`, format: 'cjs' }
  ]
});

module.exports = [
  layer('src/controller/index.ts', 'controller', 'controller'),
  layer('src/control/index.ts', 'control', 'control'),
  layer('src/controllee/index.ts', 'controllee', 'controllee'),
  {
    input: 'src/index.ts',
    plugins: [esbuild({ target: 'es2020', minify: true }), nodeResolve(), commonjs(), terser()],
    output: {
      file: 'dist/umd/bioware.min.js',
      format: 'umd',
      name: 'Bioware',
      sourcemap: true
    }
  }
];
