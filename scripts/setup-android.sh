#!/bin/bash

# Première configuration Android pour Géodésie de poche (Capacitor).
# À exécuter une fois après le clonage, puis : npm run generate-apk
#
# android/ est versionné (manifest OAuth, permissions, icônes mipmap).
# Icône source : resources/icon.png — pour régénérer les lanceurs :
#   npx @capacitor/assets generate --android

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
  echo "Attention : android/ était absent. Vérifiez le manifeste OAuth (fr.ign.gdp) et les icônes lanceur."
fi

echo "Application de la version native (package.json)…"
node "${SCRIPT_DIR}/bump-app-versions.js"

echo ""
echo "Projet Android prêt."
echo "  Depuis la racine du monorepo : npm run generate-apk"
echo "  Depuis gdp-mobile            : npm run generate-apk"
