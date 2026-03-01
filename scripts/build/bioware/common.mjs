import { mkdir } from 'node:fs/promises';
import { build } from 'esbuild';

export const ensureDist = async () => {
  await mkdir('dist', { recursive: true });
};

export const external = ['@bioware/*'];

export const base = {
  entryPoints: ['src/index.ts'],
  bundle: true,
  sourcemap: true,
  target: ['es2020'],
  platform: 'neutral',
  logLevel: 'info',
  tsconfig: 'tsconfig.json',
};

export const runBuild = async (config) => {
  await ensureDist();
  await build({
    ...base,
    ...config,
  });
};
