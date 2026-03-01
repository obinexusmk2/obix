const { terser } = require('rollup-plugin-terser');

module.exports = {
  input: 'dist/esm/index.js',
  output: {
    file: 'dist/umd/bioware.min.js',
    format: 'umd',
    name: 'Bioware',
  },
  plugins: [terser()],
};
