#!/bin/bash

# Première configuration iOS pour Géodésie de poche (Capacitor).
# Prérequis : macOS, Xcode, CocoaPods non requis (Capacitor 8 + SPM).
#
# ios/ est versionné. OAuth : schéma fr.ign.canex dans Info.plist.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

NODE_MAJOR="$(node -p "process.versions.node.split('.')[0]")"
if [[ "${NODE_MAJOR}" -lt 22 ]]; then
  echo "Erreur : Capacitor CLI 8 requiert Node.js >= 22 (actuel : $(node -v))."
  exit 1
fi

if [[ "$(uname -s)" != "Darwin" ]]; then
  echo "Erreur : la plateforme iOS ne se configure que sur macOS (Xcode)."
  exit 1
fi

echo "Installation des dépendances npm…"
cd "${APP_DIR}"
npm install

if [[ ! -d "${APP_DIR}/ios" ]]; then
  echo "Ajout de la plateforme iOS Capacitor…"
  npx cap add ios
  echo "Attention : vérifiez Info.plist (OAuth, localisation, appareil photo)."
fi

echo ""
echo "Projet iOS prêt."
echo "  npm run build:mobile && npx cap sync ios"
echo "  Ouvrir ios/App/App.xcodeproj dans Xcode pour un build local."
