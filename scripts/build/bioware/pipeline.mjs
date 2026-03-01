import { execSync } from 'node:child_process';

const versions = ['v1', 'v2', 'v3', 'v4'];

for (const version of versions) {
  console.log(`[pipeline] running ${version}`);
  execSync(`node scripts/build/bioware/${version}.mjs`, { stdio: 'inherit' });
}

console.log('[pipeline] version1 -> version2 -> version3 -> version4 complete');
