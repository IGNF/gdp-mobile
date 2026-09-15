# Dépannage

Complément du [README](../README.md) (déploiement qualif et Apache : section *Déploiement en qualif*).

## Proxy IGN (502 OAuth en dev web)

Le navigateur atteint Keycloak sans proxy. Vite (`/__sso`) parle en Node : sans `HTTPS_PROXY`, `/token` fait `bad_gateway` / `ECONNREFUSED`.

`HTTPS_PROXY` / `NO_PROXY` (souvent dans `~/.bashrc` : `http://proxy.ign.fr:3128`) sont lus par le proxy Vite. `NO_PROXY` doit contenir `localhost`. Cursor ne charge pas `~/.bashrc` : les mettre dans `gdp-mobile/.env` (voir `.env.dist`) ou les exporter dans le terminal qui lance `npm run dev`. Au démarrage, le terminal doit afficher `[vite oauth proxy] sso.geopf.fr via http://proxy.ign.fr:3128`.

## Qualif : `POST /qlf-gdp/__sso/token` → 403 Invalid origin

Le navigateur envoie `Origin: http://sgm.ign.fr`. Si Apache le transmet, Keycloak répond `{"error":"Invalid origin"}`. Le message d’UI sur `VITE_OAUTH_WEB_REDIRECT_URI` est alors trompeur.

Contrôle : le même POST **sans** `Origin` doit répondre `400` `Code not valid` (proxy OK). **Avec** `Origin`, après config correcte, on doit aussi avoir 400, plus 403.

Config qui marche : `SetEnvIf` + `RequestHeader unset Origin` / `Referer` au niveau du VirtualHost (pas `unset … early` dans `<Location>`, ignoré sur Apache 2.4). Snippet : [scripts/apache-qlf-gdp-sso.conf.example](../scripts/apache-qlf-gdp-sso.conf.example). Puis `apachectl configtest` et reload.

Le `.htaccess` du `dist/` ne s’applique pas au `ProxyPass`.

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
| ADB OK mais pas de **WebView in fr.ign.gdp** | L’app doit être **ouverte** ; utiliser l’APK **debug** (`npm run generate-apk`, pas release) ; redémarrer l’app |
| Page `chrome://inspect` vide                 | Utiliser **Google Chrome** ; cocher *Discover USB devices* ; `adb kill-server && adb start-server` puis `adb devices` |

**Linux — règles udev** (si `adb devices` ne voit rien sans `sudo`) :

```bash
sudo apt install android-sdk-platform-tools-common
# Débrancher/rebrancher le téléphone, puis :
adb devices
```

Ajouter l’utilisateur au groupe `plugdev` si besoin, puis se reconnecter.

Pour tester l’APK sur le téléphone USB : `npm run run-apk` (pas Android Studio). En cas de crash natif, ouvrir `gdp-mobile/android` à la main dans Android Studio (**File → Open**).
