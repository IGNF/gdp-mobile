# Dépannage

Complément du [README](../README.md).

## Proxy IGN (502 OAuth en dev web)

Le navigateur atteint Keycloak, mais Vite (`/__sso`) parle en Node. Sans proxy : `bad_gateway` / `ECONNREFUSED`.

`HTTPS_PROXY` / `NO_PROXY` (souvent dans `~/.bashrc` : `http://proxy.ign.fr:3128`) sont utilisés par le proxy Vite. Relancer `npm run dev` depuis un terminal où `echo $HTTPS_PROXY` affiche le proxy. `NO_PROXY` doit contenir `localhost`. Si Cursor lance Vite sans ces variables, les exporter dans ce terminal-là.

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
