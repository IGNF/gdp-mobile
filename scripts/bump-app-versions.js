#!/usr/bin/env node
/**
 * Aligne les versions natives Android / iOS sur une version major.minor.patch.
 * Équivalent de cartes-ign-app `bump_version.py`.
 *
 * Usage :
 *   npm run bump:app:versions                 # package.json courant
 *   npm run bump:app:versions -- 4.0.1        # version explicite
 */
import { applyNativeVersions, readAppVersion } from './lib/native-version.js';

try {
  const version = process.argv[2] || readAppVersion();
  applyNativeVersions(version);
} catch (err) {
  console.error(err.message);
  process.exit(1);
}
