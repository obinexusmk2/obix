// config/rollup/rollup.config.js
const path = require('path');
const { nodeResolve } = require('@rollup/plugin-node-resolve');
const commonjs = require('@rollup/plugin-commonjs');
const typescript = require('@rollup/plugin-typescript');
const terser = require('@rollup/plugin-terser');
const replace = require('@rollup/plugin-replace');
const dts = require('rollup-plugin-dts');
const { visualizer } = require('rollup-plugin-visualizer');
const pkg = require('../../package.json');

// Environment variables
const env = process.env.NODE_ENV || 'development';
const format = process.env.FORMAT || 'esm';
const isProd = env === 'production';
const isESM = format === 'esm';
const isUMD = format === 'umd';
const isDTS = format === 'dts';

// Set output directory based on format
const outputDir = path.join('dist', format);

// Library name for UMD bundle
const libraryName = 'OBIX';

// Common plugins
const basePlugins = [
  nodeResolve({
    browser: isUMD,
    preferBuiltins: !isUMD,
  }),
  commonjs(),
  replace({
    preventAssignment: true,
    values: {
      'process.env.NODE_ENV': JSON.stringify(env),
      '__VERSION__': JSON.stringify(pkg.version),
    },
  }),
];

// Config for different formats
const configs = [];

// ESM Configuration
if (isESM || !format) {
  configs.push({
    input: 'src/index.ts',
    output: {
      dir: outputDir,
      format: 'esm',
      sourcemap: true,
      preserveModules: true,
      preserveModulesRoot: 'src',
    },
    plugins: [
      ...basePlugins,
      typescript({
        tsconfig: './config/typescript/tsconfig.json',
        outDir: outputDir,
        sourceMap: true,
        declaration: false,
      }),
      isProd && terser(),
      isProd && visualizer({
        filename: path.join(outputDir, 'stats.html'),
        title: `OBIX ESM Bundle Stats`,
        gzipSize: true,
      }),
    ].filter(Boolean),
    external: [
      ...Object.keys(pkg.dependencies || {}),
      ...Object.keys(pkg.peerDependencies || {}),
    ],
    onwarn(warning, warn) {
      // Suppress circular dependency warnings
      if (warning.code === 'CIRCULAR_DEPENDENCY') return;
      warn(warning);
    },
  });
}

// UMD Configuration
if (isUMD) {
  configs.push({
    input: 'src/index.ts',
    output: {
      file: path.join(outputDir, 'index.js'),
      format: 'umd',
      name: libraryName,
      sourcemap: true,
      globals: {
        // Add global variable mappings for external dependencies if needed
        // 'dependency-name': 'globalVariableName',
      },
    },
    plugins: [
      ...basePlugins,
      typescript({
        tsconfig: './config/typescript/tsconfig.json',
        outDir: outputDir,
        sourceMap: true,
        declaration: false,
      }),
      isProd && terser(),
      isProd && visualizer({
        filename: path.join(outputDir, 'stats.html'),
        title: `OBIX UMD Bundle Stats`,
        gzipSize: true,
      }),
    ].filter(Boolean),
    external: Object.keys(pkg.peerDependencies || {}),
  });
  
  // Also create a minified version for CDNs
  if (isProd) {
    configs.push({
      input: 'src/index.ts',
      output: {
        file: path.join(outputDir, 'index.min.js'),
        format: 'umd',
        name: libraryName,
        sourcemap: true,
        globals: {
          // Add global variable mappings for external dependencies if needed
          // 'dependency-name': 'globalVariableName',
        },
      },
      plugins: [
        ...basePlugins,
        typescript({
          tsconfig: './config/typescript/tsconfig.json',
          outDir: outputDir,
          sourceMap: true,
          declaration: false,
        }),
        terser(),
        visualizer({
          filename: path.join(outputDir, 'stats.min.html'),
          title: `OBIX UMD Minified Bundle Stats`,
          gzipSize: true,
        }),
      ],
      external: Object.keys(pkg.peerDependencies || {}),
    });
  }
}

// TypeScript Declaration Bundle
if (isDTS) {
  configs.push({
    input: 'dist/types/index.d.ts',
    output: {
      file: 'dist/index.d.ts',
      format: 'es',
    },
    plugins: [dts()],
  });
}

module.exports = configs;