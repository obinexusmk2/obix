import esbuild from 'rollup-plugin-esbuild';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import dts from 'rollup-plugin-dts';
import { terser } from 'rollup-plugin-terser';

const layers = [
  {
    input: 'src/controller/index.ts',
    base: 'controller'
  },
  {
    input: 'src/control/index.ts',
    base: 'control'
  },
  {
    input: 'src/controllee/index.ts',
    base: 'controllee'
  }
];

const layerConfigs = layers.map(({ input, base }) => ({
  input,
  plugins: [esbuild({ target: 'es2020' }), nodeResolve(), commonjs()],
  output: [
    { file: `dist/${base}.esm.js`, format: 'esm' },
    { file: `dist/${base}.cjs.js`, format: 'cjs', exports: 'named' }
  ]
}));

const productionBundle = {
  input: 'src/index.ts',
  plugins: [
    esbuild({ target: 'es2020', minify: true }),
    nodeResolve(),
    commonjs(),
    terser()
  ],
  output: {
    file: 'dist/bioware.min.js',
    format: 'umd',
    name: 'Bioware'
  }
};

const typesBundle = {
  input: 'dist/types-bioware/index.d.ts',
  output: [{ file: 'dist/bioware.d.ts', format: 'esm' }],
  plugins: [dts()]
};

export default [...layerConfigs, productionBundle, typesBundle];
