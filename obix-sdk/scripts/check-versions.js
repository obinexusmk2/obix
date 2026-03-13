#!/usr/bin/env node

const fs = require('node:fs/promises');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');
const rootPackagePath = path.join(repoRoot, 'package.json');
const workspaceGroups = ['bindings', 'drivers', 'sdk'];

async function readJson(filePath) {
  const content = await fs.readFile(filePath, 'utf8');
  return JSON.parse(content);
}

async function collectWorkspacePackagePaths() {
  const paths = [];

  for (const group of workspaceGroups) {
    const groupPath = path.join(repoRoot, 'packages', group);
    let entries;

    try {
      entries = await fs.readdir(groupPath, { withFileTypes: true });
    } catch (error) {
      if (error.code === 'ENOENT') {
        continue;
      }
      throw error;
    }

    for (const entry of entries) {
      if (!entry.isDirectory()) {
        continue;
      }

      paths.push(path.join(groupPath, entry.name, 'package.json'));
    }
  }

  return paths;
}

function toRelative(filePath) {
  return path.relative(repoRoot, filePath) || '.';
}

async function main() {
  const rootPackage = await readJson(rootPackagePath);
  const expectedVersion = rootPackage.version;

  if (!expectedVersion) {
    console.error(`Root package version is missing in ${toRelative(rootPackagePath)}.`);
    process.exitCode = 1;
    return;
  }

  const workspacePackagePaths = await collectWorkspacePackagePaths();
  const mismatches = [];

  for (const packagePath of workspacePackagePaths) {
    let workspacePackage;

    try {
      workspacePackage = await readJson(packagePath);
    } catch (error) {
      mismatches.push({
        filePath: toRelative(packagePath),
        expected: expectedVersion,
        actual: `unreadable package.json (${error.message})`
      });
      continue;
    }

    const actualVersion = workspacePackage.version;

    if (actualVersion !== expectedVersion) {
      mismatches.push({
        filePath: toRelative(packagePath),
        expected: expectedVersion,
        actual: actualVersion ?? '(missing)'
      });
    }
  }

  if (mismatches.length > 0) {
    console.error('Version mismatches found between root and workspace packages:');
    for (const mismatch of mismatches) {
      console.error(
        `- ${mismatch.filePath}: expected ${mismatch.expected}, actual ${mismatch.actual}`
      );
    }
    process.exitCode = 1;
    return;
  }

  console.log(
    `All workspace package versions match root version ${expectedVersion}.`
  );
}

main().catch((error) => {
  console.error(`check-versions failed: ${error.stack || error.message}`);
  process.exitCode = 1;
});
