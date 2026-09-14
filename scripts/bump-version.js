#!/usr/bin/env node
/**
 * Unique commande de version :
 *   package.json + Android/iOS + commit + tag vX.Y.Z
 * Ne pousse pas : le push du tag déclenche la CI store.
 *
 *   npm run bump:version -- 4.0.1
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const APP_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PACKAGE_JSON = path.join(APP_DIR, 'package.json');
const ANDROID_GRADLE = path.join(APP_DIR, 'android', 'app', 'build.gradle');
const IOS_PBXPROJ = path.join(APP_DIR, 'ios', 'App', 'App.xcodeproj', 'project.pbxproj');
const VERSION_RE = /^(\d+)\.(\d+)\.(\d+)$/;

function parseVersion(version) {
  const trimmed = String(version || '').trim();
  const match = trimmed.match(VERSION_RE);
  if (!match) {
    throw new Error(
      `Version invalide « ${trimmed} ». Attendu : major.minor.patch (ex. 4.0.1), sans suffixe.`,
    );
  }

  const minor = Number(match[2]);
  const patch = Number(match[3]);
  if (minor > 99 || patch > 99) {
    throw new Error('minor et patch doivent être ≤ 99 (encodage versionCode).');
  }

  return trimmed;
}

function versionToCode(version) {
  const [major, minor, patch] = parseVersion(version).split('.').map(Number);
  return major * 10000 + minor * 100 + patch;
}

function writeAppVersion(version) {
  const pkg = JSON.parse(fs.readFileSync(PACKAGE_JSON, 'utf8'));
  pkg.version = version;
  fs.writeFileSync(PACKAGE_JSON, `${JSON.stringify(pkg, null, 2)}\n`, 'utf8');
}

function applyAndroidVersions(version) {
  if (!fs.existsSync(ANDROID_GRADLE)) {
    return null;
  }

  const versionCode = versionToCode(version);
  let txt = fs.readFileSync(ANDROID_GRADLE, 'utf8');
  if (!/versionCode\s+\d+/.test(txt) || !/versionName\s+"[^"]+"/.test(txt)) {
    throw new Error('Android : versionCode ou versionName introuvable dans build.gradle');
  }

  txt = txt.replace(/versionCode\s+\d+/g, `versionCode ${versionCode}`);
  txt = txt.replace(/versionName\s+"[^"]+"/g, `versionName "${version}"`);
  fs.writeFileSync(ANDROID_GRADLE, txt, 'utf8');
  return { versionName: version, versionCode };
}

function applyIosVersions(version) {
  if (!fs.existsSync(IOS_PBXPROJ)) {
    return null;
  }

  let txt = fs.readFileSync(IOS_PBXPROJ, 'utf8');
  if (!/CURRENT_PROJECT_VERSION = [^;]+;/.test(txt) || !/MARKETING_VERSION = [^;]+;/.test(txt)) {
    throw new Error('iOS : CURRENT_PROJECT_VERSION ou MARKETING_VERSION introuvable dans project.pbxproj');
  }

  txt = txt.replace(/CURRENT_PROJECT_VERSION = [^;]+;/g, `CURRENT_PROJECT_VERSION = ${version};`);
  txt = txt.replace(/MARKETING_VERSION = [^;]+;/g, `MARKETING_VERSION = ${version};`);
  fs.writeFileSync(IOS_PBXPROJ, txt, 'utf8');
  return version;
}

function runGit(gitRoot, args) {
  return execFileSync('git', args, { cwd: gitRoot, encoding: 'utf8' });
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

try {
  const versionArg = process.argv.slice(2).find((arg) => !arg.startsWith('--'));
  if (!versionArg) {
    console.error('Usage : npm run bump:version -- <major.minor.patch>');
    process.exit(1);
  }

  const version = parseVersion(versionArg);
  writeAppVersion(version);
  console.log(`package.json : ${version}`);

  const android = applyAndroidVersions(version);
  if (android) {
    console.log(`Android : versionName=${android.versionName} versionCode=${android.versionCode}`);
  } else {
    console.warn('Android : projet natif absent, version non écrite dans build.gradle');
  }

  if (applyIosVersions(version)) {
    console.log(`iOS : MARKETING_VERSION=${version} CURRENT_PROJECT_VERSION=${version}`);
  }

  const gitRoot = gitRootFrom(APP_DIR);
  const toStage = [PACKAGE_JSON, ANDROID_GRADLE, IOS_PBXPROJ].filter(
    (file) => fs.existsSync(file) && !isIgnored(gitRoot, file),
  );

  const tag = `v${version}`;
  for (const file of toStage) {
    runGit(gitRoot, ['add', '--', path.relative(gitRoot, file)]);
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
