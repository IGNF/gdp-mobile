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
# shellcheck source=resolve-java-home.sh
source "${SCRIPT_DIR}/resolve-java-home.sh"

NODE_MAJOR="$(node -p "process.versions.node.split('.')[0]")"
if [[ "${NODE_MAJOR}" -lt 22 ]]; then
  echo "Erreur : Capacitor CLI 8 requiert Node.js >= 22 (actuel : $(node -v))."
  echo "Avec nvm : nvm install 22 && nvm use 22"
  exit 1
fi

ensure_java_home

echo "Installation des dépendances npm…"
cd "${APP_DIR}"
npm install

if [[ ! -d "${APP_DIR}/android" ]]; then
  echo "Ajout de la plateforme Android Capacitor…"
  npx cap add android
  echo "Attention : android/ était absent. Vérifiez le manifeste OAuth (fr.ign.canex) et les icônes lanceur."
fi

echo ""
echo "Projet Android prêt."
echo "  npm run generate-apk"
