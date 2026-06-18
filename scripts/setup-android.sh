#!/bin/bash

# Première configuration Android pour Géodésie de poche (Capacitor).
# À exécuter une fois après le clonage, puis : npm run generate-apk

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
REPO_ROOT="$(cd "${APP_DIR}/.." && pwd)"

# shellcheck source=resolve-java-home.sh
source "${SCRIPT_DIR}/resolve-java-home.sh"

NODE_MAJOR="$(node -p "process.versions.node.split('.')[0]")"
if [[ "${NODE_MAJOR}" -lt 22 ]]; then
  echo "Erreur : Capacitor CLI 8 requiert Node.js >= 22 (actuel : $(node -v))."
  echo "Avec nvm : nvm install 22 && nvm use 22"
  exit 1
fi

ensure_java_home

echo "Installation des dépendances npm (monorepo)…"
cd "${REPO_ROOT}"
npm install

cd "${APP_DIR}"

if [[ ! -d "${APP_DIR}/android" ]]; then
  echo "Ajout de la plateforme Android Capacitor…"
  npx cap add android
fi

bash "${SCRIPT_DIR}/patch-android.sh"

ICON_SOURCE="${SCRIPT_DIR}/GDP/assets/icon.png"
if [[ -f "${ICON_SOURCE}" ]]; then
  mkdir -p "${APP_DIR}/resources"
  cp "${ICON_SOURCE}" "${APP_DIR}/resources/icon.png"
  if command -v npx >/dev/null 2>&1; then
    echo "Génération des icônes Android…"
    npx --yes @capacitor/assets generate --android || true
  fi
else
  echo "Astuce : placez une icône 1024×1024 dans scripts/GDP/assets/icon.png"
  echo "         puis relancez setup-android pour régénérer les icônes lanceur."
fi

echo ""
echo "Projet Android prêt."
echo "  Depuis la racine du monorepo : npm run generate-apk"
echo "  Depuis gdp-mobile            : npm run generate-apk"
