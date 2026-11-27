# Dépannage

Complément du [README](../README.md) (déploiement qualif et Apache : section *Déploiement en qualif*).

## CI GitHub : `npm install` échoue (deps Git)

Les workflows `CI` et `Dépendances de production` installent `@ign/gdp-tools`, `@ign/mobile-core`, etc. via SSH. Si l’install Git échoue en CI, vérifier la clé deploy / secret SSH déjà utilisé pour les autres deps IGNF (`webfactory/ssh-agent`, `ssh-keyscan github.com` si configuré dans les workflows).

`@ign/gdp-tools` doit livrer un **`dist/` versionné** dans son dépôt Git (même modèle que `@ign/mobile-core`).

## Proxy IGN (502 OAuth en dev web)

Le navigateur atteint Keycloak sans proxy. Vite (`/__sso`) parle en Node : sans `HTTPS_PROXY`, `/token` fait `bad_gateway` / `ECONNREFUSED`.

`HTTPS_PROXY` / `NO_PROXY` (souvent dans `~/.bashrc` : `http://proxy.ign.fr:3128`) sont lus par le proxy Vite. `NO_PROXY` doit contenir `localhost`. Cursor ne charge pas `~/.bashrc` : les mettre dans `gdp-mobile/.env` (voir `.env.dist`) ou les exporter dans le terminal qui lance `npm run dev`. Au démarrage, le terminal doit afficher `[vite oauth proxy] sso.geopf.fr via http://proxy.ign.fr:3128`.

## Qualif : `POST /qlf-gdp/__sso/token` → 403 Invalid origin

Le navigateur envoie `Origin: http://sgm.ign.fr`. Si Apache le transmet, Keycloak répond `{"error":"Invalid origin"}`. Le message d’UI sur `VITE_OAUTH_WEB_REDIRECT_URI` est alors trompeur.

Contrôle : le même POST **sans** `Origin` doit répondre `400` `Code not valid` (proxy OK). **Avec** `Origin`, après config correcte, on doit aussi avoir 400, plus 403.

Config qui marche : `SetEnvIf` + `RequestHeader unset Origin` / `Referer` au niveau du VirtualHost (pas `unset … early` dans `<Location>`, ignoré sur Apache 2.4). Snippet : [scripts/apache-qlf-gdp.conf.example](../scripts/apache-qlf-gdp.conf.example). Puis `apachectl configtest` et reload.

Le `.htaccess` du `dist-qualif/` ne s’applique pas au `ProxyPass`.

## Qualif / prod : panier PDF — fusion échoue ou « pas un PDF »

Symptômes :

- **Télécharger les PDF** → « Aucune fiche PDF n’a pu être téléchargée »
- `GET /qlf-gdp/__gdp-pdf?url=…` → **404 React Router** (« Unexpected Application Error ») = fallback SPA (`index.html`) : le proxy PDF **n’est pas actif**
- Même URL → **404 Apache** (« The requested URL was not found on this server ») = garde-fou Directory déployé mais **réécriture/proxy PDF inactive** (souvent `<LocationMatch>` + `RewriteMap` qui ne s’appliquent pas sur Apache 2.4) ; le fichier `/var/www/…/__gdp-pdf` n’existe pas

Dans tous les cas, la requête n’est **pas** proxifiée vers `data.geopf.fr` / `*.ign.fr`.

Autres causes : script `RewriteMap prg:…` absent ou non exécutable (`python3` → utiliser `/usr/bin/python3` dans le script), `RewriteMap` qui renvoie `-` (URL hors liste blanche), modules `proxy` / `proxy_http` / `rewrite` désactivés.

Cause générale : l’app appelle `GET /qlf-gdp/__gdp-pdf?url=…` (same-origin). En dev, Vite relaie vers les annexes Géoplateforme. En qualif, il faut **`RewriteEngine` + `RewriteRule` au niveau VirtualHost** (avant `Alias`), voir [scripts/apache-qlf-gdp.conf.example](../scripts/apache-qlf-gdp.conf.example) — pas seulement un bloc `<LocationMatch>`.

Ce n’est **pas** un second `ProxyPass` fixe comme `__sso` : la cible change à chaque fiche (`paramètre url=`).

Config de référence : [scripts/apache-qlf-gdp.conf.example](../scripts/apache-qlf-gdp.conf.example) (section `__gdp-pdf`) + [scripts/apache-qlf-gdp-pdf-rewrite-map.sh](../scripts/apache-qlf-gdp-pdf-rewrite-map.sh) installé sous `/etc/apache2/gdp/`, `chmod 755`. Garder `GDP_SSO` / `unset Origin` **limités à `__sso`**.

Test rapide (remplacer `URL_PDF` par une vraie `url_pdf`) :

```bash
curl -sS -D- -o /dev/null \
  'http://sgm.ign.fr/qlf-gdp/__gdp-pdf?url='$(python3 -c "import urllib.parse; print(urllib.parse.quote('URL_PDF', safe=''))")
```

Attendu : `200` et un corps PDF, pas `text/html`.

**Contournement applicatif (depuis une version avec `createGeodesyPdfFetchWithProxyFallback`)** : le panier tente d’abord le téléchargement **direct** vers `*.geopf.fr` / `*.ign.fr` (CORS `*` sur les annexes Géoplateforme). **Télécharger les PDF** peut donc fonctionner en qualif **sans** proxy Apache, même si ouvrir `/__gdp-pdf?url=…` dans le navigateur affiche encore une 404 React (cette URL sert surtout au proxy ; elle n’est pas une route de l’app). Le relais Apache reste nécessaire pour les PDF sans CORS direct.

## Chrome inspect — le téléphone n’apparaît pas

Prérequis : Google Chrome (pas Chromium / Firefox), débogage USB, `adb`, câble en transfert de fichiers, popup « Autoriser le débogage USB » acceptée.

```bash
adb devices
```

L’appareil doit être en état `device` (pas `unauthorized`, pas `offline`). L’app (APK) ou Chrome mobile (Vite) doit être au premier plan.

| Symptôme                                     | Piste |
| -------------------------------------------- | ----- |
| `adb devices` → `unauthorized`               | Débrancher/rebrancher ; accepter la popup ; révoquer les autorisations USB (*Options développeur*) puis reconnecter |
| `adb devices` → liste vide                   | Changer de câble ou de port ; activer *Débogage USB* ; sur Linux, règles udev ci-dessous |
| ADB OK mais pas de **WebView in fr.ign.canex** | L’app doit être **ouverte** ; utiliser l’APK **debug** (`npm run generate-apk`, pas release) ; redémarrer l’app |
| Page `chrome://inspect` vide                 | Utiliser **Google Chrome** ; cocher *Discover USB devices* ; `adb kill-server && adb start-server` puis `adb devices` |

**Linux — règles udev** (si `adb devices` ne voit rien sans `sudo`) :

```bash
sudo apt install android-sdk-platform-tools-common
# Débrancher/rebrancher le téléphone, puis :
adb devices
```

Ajouter l’utilisateur au groupe `plugdev` si besoin, puis se reconnecter.

Pour tester l’APK sur le téléphone USB : `npm run run-apk` (pas Android Studio). En cas de crash natif, ouvrir `gdp-mobile/android` à la main dans Android Studio (**File → Open**).

## Play Store : photos / `READ_MEDIA_*`

Google exige le **sélecteur système** (pas `READ_MEDIA_IMAGES` / `READ_MEDIA_VIDEO`). Les signalements utilisent `<input type="file" accept="image/*">` ; la prise de photo utilise `CAMERA` + `capture="environment"`.

Si la console signale un `versionCode` **ancien** (ex. `30106` = v3.1.x Cordova) alors qu’un bundle **4.0.x** (`400xx`) est conforme : l’alerte vient d’une **release encore active** sur un canal. Publier le nouveau AAB sur **production** (et autres pistes concernées).

Dans **Contenu de l’application** → **Autorisations liées aux photos et vidéos**, déclarer un accès **ponctuel** via sélecteur, sans accès large à la médiathèque.

Vérifier le manifeste fusionné release :

```bash
cd android && ./gradlew :app:processReleaseMainManifest
rg READ_MEDIA app/build/intermediates/merged_manifests/release/*/AndroidManifest.xml
```

(résultat attendu : aucune correspondance ; les suppressions sont dans `android/app/src/main/AndroidManifest.xml` via `tools:node="remove"`.)
