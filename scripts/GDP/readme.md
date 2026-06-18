# Application Géodésie de poche (GDP)

Branding et ressources pour l’APK Android (sans switcher multi-apps).

## Fichiers optionnels

- `assets/icon.png` — icône lanceur (1024×1024 recommandé), copiée vers `resources/icon.png` lors de `setup-android`.
- `assets/android/icon-foreground.png` et `icon-background.png` — icône adaptive Android (via `@capacitor/assets`).

Après ajout ou mise à jour des visuels :

```bash
nvm install 22 && nvm use 22 # version necessaire (a faire une seule fois)
npm run build:gdp-tools    # ou npm run dev:gdp-tools (
npm run setup-android   # ou copie manuelle + npx @capacitor/assets generate --android
npm run generate-apk
```

## Identifiants

| Élément | Valeur |
|---------|--------|
| Application ID | `fr.ign.gdp` |
| Schéma OAuth | `fr.ign.gdp://auth/callback` |
| Nom affiché | Géodésie de poche |
