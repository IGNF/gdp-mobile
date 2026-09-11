#!/usr/bin/env node
/**
 * Bump de version à la Cartes IGN :
 *   natives + package.json + commit + tag vX.Y.Z
 * Ne pousse pas (le push du tag déclenchera la CI store plus tard).
 *
 * Usage (depuis la racine ou gdp-mobile) :
 *   npm run bump:version -- 4.0.1
 *   npm run bump:version -- 4.0.1 --no-git
 */
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import {
  APP_DIR,
  ANDROID_GRADLE,
  IOS_PBXPROJ,
  PACKAGE_JSON,
  applyNativeVersions,
  parseVersion,
  writeAppVersion,
} from './lib/native-version.js';

function parseArgs(argv) {
  const args = argv.slice(2);
  const noGit = args.includes('--no-git');
  const versionArg = args.find((arg) => !arg.startsWith('--'));
  return { noGit, versionArg };
}

function runGit(gitRoot, args, options = {}) {
  return execFileSync('git', args, {
    cwd: gitRoot,
    encoding: 'utf8',
    ...options,
  });
}

function gitRootFrom(appDir) {
  return execFileSync('git', ['rev-parse', '--show-toplevel'], {
    cwd: appDir,
    encoding: 'utf8',
  }).trim();
}

function isIgnored(gitRoot, filePath) {
  try {
    execFileSync('git', ['check-ignore', '-q', filePath], { cwd: gitRoot });
    return true;
  } catch (err) {
    if (err.status === 1) return false;
    return true;
  }
}

function relFromGitRoot(gitRoot, filePath) {
  return path.relative(gitRoot, filePath);
}

try {
  const { noGit, versionArg } = parseArgs(process.argv);
  if (!versionArg) {
    console.error('Usage : npm run bump:version -- <major.minor.patch> [--no-git]');
    process.exit(1);
  }

  const version = parseVersion(versionArg);
  writeAppVersion(version);
  console.log(`package.json : ${version}`);
  applyNativeVersions(version);

  if (noGit) {
    process.exit(0);
  }

  const gitRoot = gitRootFrom(APP_DIR);
  const toStage = [PACKAGE_JSON];
  if (ANDROID_GRADLE && !isIgnored(gitRoot, ANDROID_GRADLE)) {
    toStage.push(ANDROID_GRADLE);
  }
  if (IOS_PBXPROJ && !isIgnored(gitRoot, IOS_PBXPROJ)) {
    toStage.push(IOS_PBXPROJ);
  }

  const tag = `v${version}`;
  for (const file of toStage) {
    runGit(gitRoot, ['add', '--', relFromGitRoot(gitRoot, file)]);
  }

  const staged = runGit(gitRoot, ['diff', '--cached', '--name-only']).trim();
  if (!staged) {
    console.error('Aucun fichier de version à committer.');
    process.exit(1);
  }

  runGit(gitRoot, ['commit', '-m', version]);
  runGit(gitRoot, ['tag', tag]);

  console.log(`Commit et tag ${tag} créés. Pour publier : git push && git push origin ${tag}`);
} catch (err) {
  console.error(err.message || err);
  process.exit(1);
}
