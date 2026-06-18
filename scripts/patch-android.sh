#!/bin/bash

# Applique la configuration Android GDP (OAuth, permissions, libellés).

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
TEMPLATES_DIR="${SCRIPT_DIR}/android/templates"

if [[ ! -d "${APP_DIR}/android" ]]; then
  echo "Erreur : dossier android/ absent. Lancez d'abord setup-android.sh"
  exit 1
fi

cp "${TEMPLATES_DIR}/AndroidManifest.xml" \
  "${APP_DIR}/android/app/src/main/AndroidManifest.xml"

cp "${TEMPLATES_DIR}/strings.xml" \
  "${APP_DIR}/android/app/src/main/res/values/strings.xml"

echo "Configuration Android GDP appliquée (OAuth fr.ign.gdp, géoloc, caméra)."
