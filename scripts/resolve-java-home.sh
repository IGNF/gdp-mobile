#!/bin/bash

# Resolve a JDK (not JRE) for Gradle/Android builds.

resolve_java_home() {
  local candidate=""

  if [[ -n "${JAVA_HOME:-}" && ! -x "${JAVA_HOME}/bin/javac" ]]; then
    echo "Attention : JAVA_HOME=${JAVA_HOME} est invalide (javac absent)." >&2
    echo "Recherche d'un JDK installé sur le système…" >&2
    unset JAVA_HOME
  fi

  if [[ -n "${JAVA_HOME:-}" && -x "${JAVA_HOME}/bin/javac" ]]; then
    echo "${JAVA_HOME}"
    return 0
  fi

  for candidate in \
    /usr/lib/jvm/java-21-openjdk-amd64 \
    /usr/lib/jvm/java-17-openjdk-amd64 \
    /usr/lib/jvm/java-1.21.0-openjdk-amd64 \
    /usr/lib/jvm/default-java; do
    if [[ -x "${candidate}/bin/javac" ]]; then
      echo "${candidate}"
      return 0
    fi
  done

  if command -v javac >/dev/null 2>&1; then
    dirname "$(dirname "$(readlink -f "$(command -v javac)")")"
    return 0
  fi

  return 1
}

ensure_java_home() {
  local resolved=""

  if ! resolved="$(resolve_java_home)"; then
    echo "Erreur : JDK introuvable (javac absent)."
    echo "Gradle a besoin d'un JDK complet, pas seulement d'un JRE."
    echo ""
    echo "Sur Ubuntu/Debian :"
    echo "  sudo apt update"
    echo "  sudo apt install openjdk-21-jdk"
    echo "  export JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64"
    echo ""
    echo "Puis relancez : npm run generate-apk"
    exit 1
  fi

  export JAVA_HOME="${resolved}"
  export PATH="${JAVA_HOME}/bin:${PATH}"
  echo "Using JAVA_HOME=${JAVA_HOME}"
  "${JAVA_HOME}/bin/javac" -version
}
