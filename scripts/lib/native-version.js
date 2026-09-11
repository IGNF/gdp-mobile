import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const APP_DIR = path.resolve(__dirname, '../..');
export const PACKAGE_JSON = path.join(APP_DIR, 'package.json');
export const ANDROID_GRADLE = path.join(APP_DIR, 'android', 'app', 'build.gradle');
export const IOS_PBXPROJ = path.join(APP_DIR, 'ios', 'App', 'App.xcodeproj', 'project.pbxproj');

const VERSION_RE = /^(\d+)\.(\d+)\.(\d+)$/;

/** Parse et refuse tout suffixe (prerelease). Aligné sur Cartes IGN : major.minor.patch uniquement. */
export function parseVersion(version) {
  const trimmed = String(version || '').trim();
  const match = trimmed.match(VERSION_RE);
  if (!match) {
    throw new Error(
      `Version invalide « ${trimmed} ». Attendu : major.minor.patch (ex. 4.0.1), sans suffixe.`,
    );
  }

  const major = Number(match[1]);
  const minor = Number(match[2]);
  const patch = Number(match[3]);
  if (minor > 99 || patch > 99) {
    throw new Error('minor et patch doivent être ≤ 99 (encodage versionCode Cartes IGN).');
  }

  return trimmed;
}

export function readAppVersion() {
  const pkg = JSON.parse(fs.readFileSync(PACKAGE_JSON, 'utf8'));
  return parseVersion(pkg.version);
}

export function writeAppVersion(version) {
  const parsed = parseVersion(version);
  const pkg = JSON.parse(fs.readFileSync(PACKAGE_JSON, 'utf8'));
  pkg.version = parsed;
  fs.writeFileSync(PACKAGE_JSON, `${JSON.stringify(pkg, null, 2)}\n`, 'utf8');
  return parsed;
}

/** Même formule que cartes-ign-app `bump_version.py` : major * 10000 + minor * 100 + patch. */
export function versionToCode(version) {
  const [major, minor, patch] = parseVersion(version).split('.').map(Number);
  return major * 10000 + minor * 100 + patch;
}

export function applyAndroidVersions(version) {
  if (!fs.existsSync(ANDROID_GRADLE)) {
    return null;
  }

  const parsed = parseVersion(version);
  const versionCode = versionToCode(parsed);
  let txt = fs.readFileSync(ANDROID_GRADLE, 'utf8');

  if (!/versionCode\s+\d+/.test(txt) || !/versionName\s+"[^"]+"/.test(txt)) {
    throw new Error('Android : versionCode ou versionName introuvable dans build.gradle');
  }

  txt = txt.replace(/versionCode\s+\d+/g, `versionCode ${versionCode}`);
  txt = txt.replace(/versionName\s+"[^"]+"/g, `versionName "${parsed}"`);
  fs.writeFileSync(ANDROID_GRADLE, txt, 'utf8');

  return { versionName: parsed, versionCode };
}

export function applyIosVersions(version) {
  if (!fs.existsSync(IOS_PBXPROJ)) {
    return null;
  }

  const parsed = parseVersion(version);
  let txt = fs.readFileSync(IOS_PBXPROJ, 'utf8');

  if (!/CURRENT_PROJECT_VERSION = [^;]+;/.test(txt) || !/MARKETING_VERSION = [^;]+;/.test(txt)) {
    throw new Error('iOS : CURRENT_PROJECT_VERSION ou MARKETING_VERSION introuvable dans project.pbxproj');
  }

  // Cartes IGN : MARKETING_VERSION et CURRENT_PROJECT_VERSION reçoivent la même chaîne semver.
  txt = txt.replace(/CURRENT_PROJECT_VERSION = [^;]+;/g, `CURRENT_PROJECT_VERSION = ${parsed};`);
  txt = txt.replace(/MARKETING_VERSION = [^;]+;/g, `MARKETING_VERSION = ${parsed};`);
  fs.writeFileSync(IOS_PBXPROJ, txt, 'utf8');

  return { marketingVersion: parsed, currentProjectVersion: parsed };
}

export function applyNativeVersions(version) {
  const parsed = parseVersion(version);
  const result = {
    version: parsed,
    android: applyAndroidVersions(parsed),
    ios: applyIosVersions(parsed),
  };

  if (result.android) {
    console.log(`Android : versionName=${result.android.versionName} versionCode=${result.android.versionCode}`);
  } else {
    console.warn('Android : projet natif absent, version non écrite dans build.gradle');
  }

  if (result.ios) {
    console.log(`iOS : MARKETING_VERSION=${result.ios.marketingVersion} CURRENT_PROJECT_VERSION=${result.ios.currentProjectVersion}`);
  }

  return result;
}
