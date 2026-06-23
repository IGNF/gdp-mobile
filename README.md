# Géodésie de poche — app mobile

Application React web-first pour la consultation de points géodésiques et les signalements, basée sur `@ign/gdp-tools`.

## Prérequis

- Node.js ≥ 22
- Accès SSH GitHub IGNF (`mobile-core`, `mobile-device`, `collaboratif-client-api`)

## Démarrage

```bash
# Depuis la racine du monorepo
cp gdp-mobile/.env.dist gdp-mobile/.env   # puis renseigner les variables
npm install
npm run dev                                 # gdp-tools (watch) + app (5173)
```

Scripts utiles :


| Commande                     | Description                       |
| ---------------------------- | --------------------------------- |
| `npm run dev:app`            | App seule                         |
| `npm run dev:gdp-tools`      | Package géodésie seul             |
| `npm run build`              | Build complet (racine web `/`)    |
| `npm run build:qualif`       | Build qualification (`/qlf-gdp/`) |
| `npm run lint -w gdp-mobile` | ESLint                            |


## Déploiement qualification

Build dédié lorsque l’app est servie sous un **sous-chemin** (ex. `/qlf-gdp/`) : Vite préfixe les assets (`/qlf-gdp/assets/…`).

```bash
cp gdp-mobile/.env.qualif.dist gdp-mobile/.env.qualif   # renseigner VITE_OAUTH_WEB_REDIRECT_URI
npm run build:qualif
```

Déployer le contenu de `gdp-mobile/dist/` sur le serveur de qualification.


| Variable (`.env.qualif`)      | Rôle                                 |
| ----------------------------- | ------------------------------------ |
| `VITE_BASE_PATH`              | Sous-chemin, ex. `/qlf-gdp/`         |
| `VITE_USE_QUALIF`             | `true`                               |
| `VITE_OAUTH_WEB_REDIRECT_URI` | `<url-qualif>/qlf-gdp/auth/callback` |


Keycloak : enregistrer la même URI de redirection web (http et https si les deux sont utilisés). En web, l’URI réelle est aussi dérivée de `window.location`.

Test local du build :

```bash
npm run preview:qualif -w gdp-mobile
# http://localhost:4173/qlf-gdp/
```

La configuration serveur (fallback SPA, proxy OAuth) est gérée côté infra.

## APK Android

Application unique (`fr.ign.gdp`) — pas de switcher multi-apps.

### Prérequis

- Node.js ≥ 22
- JDK 17 ou 21 (`javac` disponible)
- [Android SDK](https://developer.android.com/studio) (variables `ANDROID_HOME` ou SDK via Android Studio)

### Première fois

```bash
# Depuis la racine du monorepo
npm run setup-android
```

Le script installe les dépendances, ajoute la plateforme Capacitor Android si besoin, et applique la config GDP (OAuth `fr.ign.gdp://`, géolocalisation, caméra).

### Générer l’APK debug

```bash
npm run generate-apk
```

Produit : `gdp-mobile/android/app/build/outputs/apk/debug/app-debug.apk`

Transférer l’APK sur le téléphone (USB, mail, etc.) puis l’installer. L’APK debug accepte l’installation depuis des sources inconnues si besoin.


| Commande                                      | Description                                 |
| --------------------------------------------- | ------------------------------------------- |
| `nvm install 22 && nvm use 22`                | Version necessaire (a faire une seule fois) |
| `npm run setup-android`                       | Configuration initiale Android              |
| `npm run generate-apk`                        | Build web + sync Capacitor + APK debug      |
| `npm run capacitor-build -w gdp-mobile`       | Build dist + `cap sync android`             |
| `npm run capacitor-run-android -w gdp-mobile` | Run sur appareil / émulateur                |
| `npm run open-android -w gdp-mobile`          | Ouvrir le projet dans Android Studio        |


### Déboguer l’APK — `chrome://inspect/#devices`

Pour inspecter la WebView Capacitor (console, réseau, éléments) depuis Chrome sur le poste de dev.

**Prérequis**

- **Google Chrome** sur le poste (pas Chromium, pas Firefox)
- Téléphone Android : *Options pour les développeurs* → **Débogage USB** activé
- [Platform-tools](https://developer.android.com/tools/releases/platform-tools) (`adb`) installés
- Câble USB en mode **transfert de fichiers** (pas « charge seule »)
- Accepter la popup « Autoriser le débogage USB » sur le téléphone (cocher *Toujours autoriser*)

**Étapes**

1. Installer l’APK debug sur le téléphone et **lancer l’app** (Géodésie de poche doit être au premier plan).
2. Brancher le téléphone au poste et vérifier la connexion ADB :
  ```bash
   adb devices
  ```
   La liste doit afficher un appareil en état `device` (pas `unauthorized`, pas `offline`).
3. Sur le poste, ouvrir **chrome://inspect/#devices**
4. Cocher **Discover USB devices** si proposé.
5. Sous **Remote Target**, repérer **WebView in fr.ign.gdp** → cliquer **inspect** ou **inspect fallback** .

L’APK charge le bundle `dist` embarqué (pas le serveur Vite). Pour du hot-reload web, préférer Chrome mobile + `npm run dev` (voir ci-dessous).

**Le téléphone n’apparaît pas dans `chrome://inspect`**


| Symptôme                                     | Piste                                                                                                                                                                                        |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `adb devices` → `unauthorized`               | Débrancher/rebrancher le câble ; accepter la popup sur le téléphone ; révoquer les autorisations USB (*Options développeur* → *Révoquer les autorisations de débogage USB*) puis reconnecter |
| `adb devices` → liste vide                   | Changer de câble ou de port USB ; activer *Débogage USB* ; sur Linux, règles udev (voir ci-dessous)                                                                                          |
| ADB OK mais pas de **WebView in fr.ign.gdp** | L’app doit être **ouverte** ; utiliser l’APK **debug** (`npm run generate-apk`, pas release) ; redémarrer l’app après installation                                                           |
| Page `chrome://inspect` vide                 | Utiliser **Google Chrome** ; cocher *Discover USB devices* ; `adb kill-server && adb start-server` puis `adb devices`                                                                        |


**Linux — règles udev** (si `adb devices` ne voit rien sans `sudo`) :

```bash
# Exemple Debian/Ubuntu — adapter selon la doc Android
sudo apt install android-sdk-platform-tools-common
# Débrancher/rebrancher le téléphone, puis :
adb devices
```

Ajouter l’utilisateur au groupe `plugdev` si besoin, puis se reconnecter.

**Alternative — Chrome mobile + serveur Vite** (sans APK, hot-reload) :

```bash
npm run dev
adb reverse tcp:5173 tcp:5173    # à refaire après chaque reconnexion USB
```

Sur le téléphone : Chrome → `http://localhost:5173` → **inspect** dans `chrome://inspect`. OAuth web avec redirect `http://localhost:5173/auth/callback`.

Branding (icône lanceur) : voir [scripts/GDP/readme.md](./scripts/GDP/readme.md).

## Documentation

- [Architecture](./docs/ARCHITECTURE.md)
- [Fiche point (carte)](./docs/FICHE_POINT.md)
- [Mode d'emploi](./docs/MODE_EMPLOI.md)

## Références

- `@ign/gdp-tools` : logique carto géodésie (WMS/WFS, hooks React)
- `bof-mobile` : patterns auth, API, carte
- `espaceco-mobile-refonte` : charte graphique et composants UI

