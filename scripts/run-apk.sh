#!/bin/bash

# Build, installe et lance l’APK debug sur le téléphone USB.
# Pas besoin d’Android Studio.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
REPO_ROOT="$(cd "${APP_DIR}/.." && pwd)"

# shellcheck source=resolve-java-home.sh
source "${SCRIPT_DIR}/resolve-java-home.sh"

if [[ ! -d "${APP_DIR}/android" ]]; then
  echo "Erreur : le projet Android Capacitor est absent."
  echo "Exécutez une fois : npm run setup-android"
  exit 1
fi

ensure_java_home

NODE_MAJOR="$(node -p "process.versions.node.split('.')[0]")"
if [[ "${NODE_MAJOR}" -lt 22 ]]; then
  echo "Erreur : Capacitor CLI 8 requiert Node.js >= 22 (actuel : $(node -v))."
  echo "Avec nvm : nvm install 22 && nvm use 22"
  echo "Puis relancez : npm run run-apk"
  exit 1
fi

if ! command -v adb >/dev/null 2>&1; then
  echo "Erreur : adb introuvable. Installez les platform-tools Android."
  exit 1
fi

DEVICE_IDS="$(adb devices | awk 'NR>1 && $2=="device" {print $1}')"
if [[ -z "${DEVICE_IDS}" ]]; then
  echo "Erreur : aucun téléphone USB prêt."
  echo "Brancher le téléphone, activer le débogage USB, accepter la popup, puis :"
  echo "  adb devices"
  exit 1
fi

DEVICE_COUNT="$(printf '%s\n' "${DEVICE_IDS}" | grep -c .)"
TARGET_ARGS=()
if [[ "${DEVICE_COUNT}" -eq 1 ]]; then
  TARGET_ARGS=(--target "${DEVICE_IDS}")
  echo "Téléphone : ${DEVICE_IDS}"
else
  echo "Plusieurs appareils USB. Le CLI Capacitor demandera lequel utiliser."
  printf '  %s\n' ${DEVICE_IDS}
fi

echo "Building @ign/gdp-tools…"
npm run build -w @ign/gdp-tools --prefix "${REPO_ROOT}"

echo "Building gdp-mobile web assets (dist)…"
npm run build:mobile -w gdp-mobile --prefix "${REPO_ROOT}"

echo "Install et lancement sur le téléphone…"
cd "${APP_DIR}"
npx cap run android "${TARGET_ARGS[@]}"

echo "✓ App lancée. Inspecter la WebView : chrome://inspect/#devices"
