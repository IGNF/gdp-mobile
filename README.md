# Géodésie de poche

Application React web-first pour la consultation de points géodésiques et les signalements (`@ign/gdp-tools`).

Gestion du projet (intranet) : [Loop](https://loop.cloud.microsoft/p/eyJ3Ijp7InUiOiJodHRwczovL2lnbmYuc2hhcmVwb2ludC5jb20vP25hdj1jejBsTWtZbVpEMWlJV2gwZUhkWlpHNTZiakJYVlVRMlpsZDNSRlJtVEZCQldVVnVSSE5sVms1RmN5MWxkRUpGVURselRWZDNRWGMxUTJvelZtNVJXbmh2WDJreE9EZFZZMEVtWmowd01VSlFTa1pMTnpKUlExSkNTRWREUzBkSVdrSkxSazB6VEVSVlYwWlhVMHhXSm1NOUptWnNkV2xrUFRFJTNEIiwiciI6ZmFsc2V9LCJwIjp7InUiOiJodHRwczovL2lnbmYuc2hhcmVwb2ludC5jb20vOmZsOi9yL2NvbnRlbnRzdG9yYWdlL0NTUF82MTcwZGM4Ni1mM2Q5LTQ1OWYtOTQwZi1hN2Q2YzAzNGRmMmMvQmlibGlvdGglQzMlQThxdWUlMjBkZSUyMGRvY3VtZW50cy9Mb29wQXBwRGF0YS9TYW5zJTIwdGl0cmUubG9vcD9kPXc4NzQzZjU1OGRhNTA0ZTg3OWIxOTNhY2Y5MjczNzNiYSZjc2Y9MSZ3ZWI9MSZuYXY9Y3owbE1rWmpiMjUwWlc1MGMzUnZjbUZuWlNVeVJrTlRVRjgyTVRjd1pHTTROaTFtTTJRNUxUUTFPV1l0T1RRd1ppMWhOMlEyWXpBek5HUm1NbU1tWkQxaUlXaDBlSGRaWkc1NmJqQlhWVVEyWmxkM1JGUm1URkJCV1VWdVJITmxWazVGY3kxbGRFSkZVRGx6VFZkM1FYYzFRMm96Vm01UlduaHZYMmt4T0RkVlkwRW1aajB3TVVKUVNrWkxOekpaTmxaQ1dVOVZSekpSTlVoS1YwZEtNbG8yU2toSE5EVXlKbU05SlRKR0ptWnNkV2xrUFRFbVlUMU1iMjl3UVhCd0puQTlKVFF3Wm14MWFXUjRKVEpHYkc5dmNDMXdZV2RsTFdOdmJuUmhhVzVsY2laNFBTVTNRaVV5TW5jbE1qSWxNMEVsTWpKVU1GSlVWVWg0Y0ZveU5XMU1iazV2V1ZoS2JHTkhPWEJpYmxGMVdUSTVkR1pIU1doaFNGSTBaREZzYTJKdWNIVk5SbVJXVWtSYWJWWXpaRVZXUjFwTlZVVkdXbEpYTlVWak1sWlhWR3RXZWt4WFZqQlJhMVpSVDFoT1RsWXpaRUprZWxaRVlXcE9WMkpzUm1GbFJ6bG1ZVlJGTkU0eFZtcFJXSGQzVFZWS1VWTnJXa3hPZWtwU1VURktRMU5GWkVSVE1HUkpWMnRLVEZKck1IcFVSVkpXVmpCYVdGVXdlRmNsTWpJbE1rTWxNakpwSlRJeUpUTkJKVEl5Wm1VeU9UTXdPR1l0TWpoaVppMDBOV1U0TFRoallUY3RNelZpTkdSbU5HSTVNVGMzSlRJeUpUZEUiLCJyIjpmYWxzZX0sImkiOnsiaSI6ImZlMjkzMDhmLTI4YmYtNDVlOC04Y2E3LTM1YjRkZjRiOTE3NyJ9fQ).

En cas de blocage : [Dépannage](./docs/DEPANNAGE.md).

## Installation initiale

Prérequis : Node.js ≥ 22, accès SSH GitHub IGNF (`mobile-core`, `mobile-device`, `collaboratif-client-api`).

Depuis la racine du monorepo `geodesie-de-poche/` :

```bash
cp gdp-mobile/.env.dist gdp-mobile/.env   # puis renseigner les variables
npm install
```

## Run en dev (local)

```bash
npm run dev
```

Ouvre l’app sur [http://localhost:5173](http://localhost:5173) (`gdp-tools` en watch + Vite).

## Déploiement en qualif

Sur `main`, en local :
La première fois, pensez à créer le fichier `.env.qualif` depuis `.env.qualif.dist`

```bash
git checkout main
git pull
npm run build:qualif
```

Déposer le contenu de `gdp-mobile/dist/` via SFTP :

`sftp://cadillac2.ign.fr/var/www/intranet/qlf-gdp/`

Consultation : [http://sgm.ign.fr/qlf-gdp/map](http://sgm.ign.fr/qlf-gdp/map)

Aperçu local du même build : `npm run preview:qualif -w gdp-mobile` → [http://localhost:4173/qlf-gdp/](http://localhost:4173/qlf-gdp/).

| Variable (`.env.qualif`)         | Rôle                                 |
| -------------------------------- | ------------------------------------ |
| `VITE_BASE_PATH`                 | Sous-chemin, ex. `/qlf-gdp/`         |
| `VITE_USE_QUALIF`                | `true`                               |
| `VITE_OAUTH_WEB_REDIRECT_URI`    | `<url-qualif>/qlf-gdp/auth/callback` |
| `VITE_GDP_REPORT_COMMUNITY_ID`   | ID de la communauté géodésie         |
| `VITE_GDP_REPORT_DISPLAY_THEMES` | Thèmes à afficher                    |
| `VITE_GDP_REPORT_SUBMISSION_THEME` | Thème pour les signalements        |
| `VITE_GDP_NEWS_URL`              | JSON news / alertes ([docs/NEWS.md](./docs/NEWS.md)) |


## Déploiement avec tag 
!! A terme, cette commande lancera aussi le déploiement sur les stores. !!
Un numéro semver dans `package.json`, recopié dans Android / iOS. Pas de suffixe. Le `versionCode` Android vaut `major × 10000 + minor × 100 + patch` (`4.0.1` → `40001`). L’écran **À propos** affiche cette version.

Semver = semantic versioning : un numéro en trois parties, majeur.mineur.patch.

Depuis `main` :

```bash
git checkout main
git pull
npm run bump:version -- 4.0.1
git push && git push origin v4.0.1
```

Commit `4.0.1` + tag `v4.0.1`. Le push du tag déclenche la CI store.

## Test sur mobile avec Chrome

Hot-reload via le serveur Vite, sans APK. Brancher le téléphone en USB (débogage USB activé).

```bash
npm run dev
adb reverse tcp:5173 tcp:5173    # à refaire après chaque reconnexion USB
```

Sur le téléphone : Chrome → `http://localhost:5173`. Inspecter depuis le poste : `chrome://inspect`. Redirect OAuth : `http://localhost:5173/auth/callback`.

## Création d’un APK de test

Prérequis : JDK 17 ou 21, [Android SDK](https://developer.android.com/studio) (`ANDROID_HOME`). Première fois :

```bash
npm run setup-android
```

Téléphone branché en USB (débogage USB activé) — build, installe et lance l’app (sans Android Studio) :

```bash
npm run run-apk
```

Pour seulement produire le fichier (clé USB, mail, etc.) :

```bash
npm run generate-apk
```

APK : `gdp-mobile/android/app/build/outputs/apk/debug/app-debug.apk`. Identifiant `fr.ign.gdp` : cohabite avec l’ancienne app `fr.ign.canex`.

Inspecter la WebView (bundle `dist`, pas Vite) : `chrome://inspect/#devices` → **WebView in fr.ign.gdp**.

## Scripts (`gdp-mobile`)

| Commande | Rôle |
| --- | --- |
| `npm run dev` | Serveur Vite (local) |
| `npm run build` | Build web à la racine `/` |
| `npm run build:qualif` | Build qualification (`/qlf-gdp/`) |
| `npm run build:mobile` | Build web pour l’APK (`gdp-tools` en `dist`) — appelé par `generate-apk` / `run-apk` |
| `npm run preview:qualif` | Aperçu local du build qualif |
| `npm run setup-android` | Première config Android |
| `npm run generate-apk` | Produit le fichier APK debug |
| `npm run run-apk` | Build, installe et lance l’APK sur le téléphone USB |
| `npm run bump:version -- 4.0.1` | Version + commit + tag `v4.0.1` |
| `npm run lint` | ESLint |
| `npm run lint:css-modules` | Contrôle des CSS modules |

Depuis la racine du monorepo, les mêmes noms marchent pour `dev`, `build`, `build:qualif`, `setup-android`, `generate-apk`, `run-apk` et `bump:version`.

## Documentation

- [Dépannage](./docs/DEPANNAGE.md)
- [Architecture](./docs/ARCHITECTURE.md)
- [Fiche point (carte)](./docs/FICHE_POINT.md)
- [Mode d'emploi](./docs/MODE_EMPLOI.md)
- [Configuration des thèmes de signalement](./docs/CONFIGURATION_THEMES.md)
- [News et alertes](./docs/NEWS.md)
