#!/bin/bash

# Build APK debug Android pour Géodésie de poche (monorepo-aware).

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
REPO_ROOT="$(cd "${APP_DIR}/.." && pwd)"

# shellcheck source=resolve-java-home.sh
source "${SCRIPT_DIR}/resolve-java-home.sh"

if [[ ! -d "${APP_DIR}/android" ]]; then
  echo "Erreur : le projet Android Capacitor est absent."
  echo "Exécutez une fois : npm run setup-android"
  echo "  (depuis gdp-mobile ou la racine du monorepo)"
  exit 1
fi

ensure_java_home

NODE_MAJOR="$(node -p "process.versions.node.split('.')[0]")"
if [[ "${NODE_MAJOR}" -lt 22 ]]; then
  echo "Erreur : Capacitor CLI 8 requiert Node.js >= 22 (actuel : $(node -v))."
  echo "Avec nvm : nvm install 22 && nvm use 22"
  echo "Puis relancez : npm run generate-apk"
  exit 1
fi

echo "Building @ign/gdp-tools…"
npm run build -w @ign/gdp-tools --prefix "${REPO_ROOT}"

echo "Building gdp-mobile web assets (dist)…"
npm run build:mobile -w gdp-mobile --prefix "${REPO_ROOT}"

echo "Syncing Capacitor with Android…"
cd "${APP_DIR}"
npx cap sync android

echo "Building APK…"
cd android
./gradlew --stop >/dev/null 2>&1 || true
./gradlew -Dorg.gradle.java.home="${JAVA_HOME}" assembleDebug
cd ..

APK_FILE="${APP_DIR}/android/app/build/outputs/apk/debug/app-debug.apk"
APK_PATH="${APP_DIR}/android/app/build/outputs/apk/debug"

echo "Opening APK folder…"
case "$(uname -s)" in
  Darwin*)
    open "${APK_PATH}"
    ;;
  Linux*)
    xdg-open "${APK_PATH}" 2>/dev/null || true
    ;;
  MINGW*|MSYS*|CYGWIN*)
    explorer "${APK_PATH}"
    ;;
esac

echo "✓ APK generation complete!"
echo "  ${APK_FILE}"
