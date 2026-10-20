# Déploiement iOS (CI GitHub)

Workflow : [`.github/workflows/ios-deploy.yml`](../.github/workflows/ios-deploy.yml). Déclenchement identique à Android : push du tag `vX.Y.Z` ou `workflow_dispatch` (voir [README](../README.md)).

Bundle ID : **`fr.ign.canex`** (même identifiant que l’app Android).

---

## Où faire quoi (vocabulaire)

| Lieu | URL | Rôle |
| --- | --- | --- |
| **Portail Apple Developer** | [developer.apple.com/account](https://developer.apple.com/account) | Certificats, identifiants (App ID), **profils** de provisioning |
| **App Store Connect** | [appstoreconnect.apple.com](https://appstoreconnect.apple.com) | Fiche app, TestFlight, **clé API** `.p8` (menu **Utilisateurs et accès** → **Intégrations**) |
| **GitHub** | dépôt `IGNF/gdp-mobile` → Settings → Secrets and variables | Secrets de build et signature ; variable `IOS_DEPLOY_TO_TESTFLIGHT` |
| **CI** | GitHub Actions, runner **macOS** | Build, signature, export IPA, upload TestFlight optionnel |

La CI **ne lit pas** un `ExportOptions.plist` versionné : le fichier réel vit en local (Mac) et en secret **`IOS_EXPORT_PRODUCTION`**.

---

## Development vs Distribution (ne pas mélanger)

| | **Development** | **Distribution** (CI GDP) |
| --- | --- | --- |
| **Usage** | Lancer l’app sur **votre iPhone** depuis Xcode | **TestFlight** / App Store / workflow **iOS Deploy** |
| Certificat (portail) | Apple **Development** | Apple **Distribution** |
| Profil (portail) | iOS App **Development** | **App Store** / App Store Connect |
| Secrets GitHub GDP | Non | **Oui** (`DISTRIBUTION_*`, `DEPLOY_*`, etc.) |

Pour remplir les secrets GitHub, ne travaillez qu’avec **Distribution** + profil **App Store**.

---

## Vue d’ensemble : fréquence et plateforme

### Une seule fois (ou tant que l’équipe ne change pas de politique)

| Action | Plateforme | Détail |
| --- | --- | --- |
| Créer l’app dans **App Store Connect** (si absente) | Navigateur | Fiche liée à `fr.ign.canex` |
| Créer l’**App ID** `fr.ign.canex` sur le portail Developer | Navigateur | Identifiers |
| Demander l’accès **App Store Connect API** (première fois) | Navigateur | **Account Holder** : Utilisateurs et accès → Intégrations → *Request Access* |
| Générer une **Team API Key** + télécharger `AuthKey_XXXX.p8` | Navigateur (App Store Connect) | Key ID, Issuer ID, fichier `.p8` (**téléchargement unique**) |
| Renseigner tous les **secrets GitHub** (voir ci‑dessous) | Navigateur ou **Mac/Linux** | Collage des valeurs ; encodage base64 sur Mac ou Linux |
| Créer **`ExportOptions.plist`** local à partir de l’exemple | **Mac** (recommandé) | Copie de [`ios/ExportOptions.plist.example`](../ios/ExportOptions.plist.example) — **ne pas versionner** le fichier rempli |
| Configurer **Keycloak** : redirect iOS `fr.ign.canex://auth/callback` | Serveur / admin IdP | Aligné avec `VITE_OAUTH_IOS_REDIRECT_URI` |
| Variable `IOS_DEPLOY_TO_TESTFLIGHT` | GitHub → Variables | `true` seulement quand l’upload TestFlight est souhaité |

### À renouveler quand c’est périmé ou invalide

| Élément | Validité typique | Secrets à mettre à jour | Plateforme |
| --- | --- | --- | --- |
| Certificat **Apple Distribution** | ~1 an | `DISTRIBUTION_CERTIFICATE_P12`, `P12_PASSWORD_DISTR` | **Mac** (CSR, export `.p12`) + navigateur (portail) |
| Profil **App Store** | Lié au certificat / capacités | `DEPLOY_PROVISION_PROFILE_BASE64` ; **`IOS_EXPORT_PRODUCTION`** si le **nom** du profil change | Navigateur + **Mac** (téléchargement `.mobileprovision`) |
| Clé API `.p8` | Jusqu’à révocation ; perte = nouvelle clé | `APPSTORE_API_KEY_ID`, `APPSTORE_ISSUER_ID`, `APPSTORE_API_PRIVATE_KEY` | App Store Connect (navigateur) |
Après renouvellement : lancer **iOS Deploy** en `workflow_dispatch` (sans tag) pour valider avant la prochaine release.

### À chaque déploiement store

| Action | Qui / où | Plateforme |
| --- | --- | --- |
| Tests, lint, build web | Développeur | **Linux ou Mac** (`npm run lint`, `npm run build`, etc.) |
| `npm run bump:version -- X.Y.Z` | Développeur | **Linux ou Mac** |
| `git push` + `git push origin vX.Y.Z` | Développeur | **Linux ou Mac** |
| Build iOS, IPA, artefact, TestFlight optionnel | **GitHub Actions** | **macOS** (runner GitHub — rien à installer chez vous) |

Aucune commande `xcodebuild` ni export `.p12` n’est requise **à chaque tag** si les secrets sont à jour.

---

## Mise en place détaillée (Distribution)

### 1. Certificat Apple Distribution

**Portail** → Certificates → **+** → **Apple Distribution** (pas Development).

**Mac** — générer la CSR :

1. Trousseau d’accès → Assistant de certification → *Demander un certificat…* → enregistrer le fichier **`.certSigningRequest`**.
2. Uploader cette CSR sur le portail (pas un `.cer` : le `.cer` est **téléchargé** après validation).
3. Double-cliquer sur le `.cer` reçu → vérifier dans **Mes certificats** : **Apple Distribution** + **clé privée** ▼.
4. Exporter en **`.p12`** (mot de passe → futur `P12_PASSWORD_DISTR`).

Encodage pour GitHub (une **seule ligne** base64, sans retours) :

**macOS** (`-w` n’existe pas — `invalid argument` si vous copiez la commande Linux) :

```bash
# Vérifier que le fichier existe et n’est pas vide
ls -la gdp-distribution.p12

# Recommandé : une seule ligne, fiable sur macOS
openssl base64 -in gdp-distribution.p12 -A | pbcopy   # → DISTRIBUTION_CERTIFICATE_P12

# Variante
base64 < gdp-distribution.p12 | tr -d '\n' | pbcopy
```

Si `pbcopy` reste vide : lancer sans `pbcopy` et regarder la sortie (`openssl … -A | head -c 80`). Taille attendue : plusieurs milliers de caractères (`openssl … -A | wc -c`).

**Linux** (GNU base64) :

```bash
base64 -w 0 gdp-distribution.p12
```

### 2. Profil App Store

**Portail** → Profiles → **+** → type **App Store** (pas Development) → App ID **`fr.ign.canex`** → certificat **Distribution** → choisir un **nom** (ex. `GDP`).

Ce **nom** (pas le nom du fichier `.mobileprovision`) est la valeur dans `ExportOptions.plist` :

```xml
<key>fr.ign.canex</key>
<string>GDP</string>   <!-- exemple : nom affiché sur le portail -->
```

Télécharger le profil, puis :

```bash
# Mac — nom exact du profil
security cms -D -i MonProfil.mobileprovision 2>/dev/null | plutil -extract Name raw -

openssl base64 -in MonProfil.mobileprovision -A | pbcopy   # → DEPLOY_PROVISION_PROFILE_BASE64 (macOS)
```

### 3. Team ID (`teamID`)

Identifiant d’équipe **10 caractères** (organisation IGN) :

- Portail Developer → **Membership** / Adhésion, ou
- Xcode → Réglages → Comptes → équipe, ou
- `plutil -extract ApplicationIdentifierPrefix.0 raw -` sur le `.mobileprovision` décodé.

Même valeur dans `ExportOptions.plist`, secret **`APPSTORE_TEAM_ID`**, et champ `teamID` du plist.

### 4. ExportOptions.plist (local, non versionné)

1. Copier `ios/ExportOptions.plist.example` → `ios/ExportOptions.plist` (**ne pas** `git add`).
2. Remplir `teamID` et le **nom du profil** (section `provisioningProfiles`).
3. Encoder :

```bash
openssl base64 -in ios/ExportOptions.plist -A | pbcopy   # → IOS_EXPORT_PRODUCTION (macOS)
```

Seul [`ExportOptions.plist.example`](../ios/ExportOptions.plist.example) est versionné.

### 5. Clé API TestFlight (`AuthKey_XXXX.p8`)

**App Store Connect** (pas developer.apple.com) :

- Lien direct : [Intégrations → API](https://appstoreconnect.apple.com/access/integrations/api)
- Menu **Utilisateurs et accès** → **Intégrations** → **App Store Connect API** → **Team Keys** → générer → **télécharger le `.p8` une seule fois**.

| Secret GitHub | Source |
| --- | --- |
| `APPSTORE_API_KEY_ID` | Key ID (`XXXX` dans `AuthKey_XXXX.p8`) |
| `APPSTORE_ISSUER_ID` | En haut de la page Intégrations (UUID) |
| `APPSTORE_API_PRIVATE_KEY` | `base64 -i AuthKey_XXXX.p8` |

Sans rôle Admin / Account Holder : demander à l’admin IGN de créer la clé d’équipe ou de transmettre ces trois valeurs via un canal sécurisé.

La clé `.p8` **ne signe pas** l’IPA ; elle sert uniquement à **envoyer** le build sur TestFlight.

---

## Secrets GitHub (récapitulatif)

### Build web (alignés sur Android)

Tous les `VITE_*` du workflow [android-deploy.yml](../.github/workflows/android-deploy.yml), plus :

| Secret | Exemple / rôle |
| --- | --- |
| `VITE_OAUTH_IOS_REDIRECT_URI` | `fr.ign.canex://auth/callback` |

### Signature & upload iOS

| Secret | Contenu |
| --- | --- |
| `SSH_PRIVATE_KEY` | Clé deploy pour `npm install` (deps Git `@ign/*`) |
| `DISTRIBUTION_CERTIFICATE_P12` | `.p12` Distribution en base64 |
| `P12_PASSWORD_DISTR` | Mot de passe du `.p12` (texte clair) |
| `DEPLOY_PROVISION_PROFILE_BASE64` | `.mobileprovision` App Store en base64 |
| `APPSTORE_TEAM_ID` | Team ID 10 caractères |
| `IOS_EXPORT_PRODUCTION` | `ExportOptions.plist` complet en base64 |
| `APPSTORE_API_KEY_ID` | Key ID API |
| `APPSTORE_ISSUER_ID` | Issuer ID API |
| `APPSTORE_API_PRIVATE_KEY` | `.p8` en base64 |

Ne jamais committer certificats, profils, clés API ni `ExportOptions.plist` rempli.

### Variable de dépôt

| Variable | `true` | Autre / absente |
| --- | --- | --- |
| `IOS_DEPLOY_TO_TESTFLIGHT` | Upload TestFlight après build | Artefact IPA uniquement |

Équivalent Android : `ANDROID_DEPLOY_TO_PLAY`.

---

## Développement local (optionnel, Development)

Uniquement sur **macOS** (Xcode) :

```bash
npm run setup-ios
npm run build:mobile && npx cap sync ios
open ios/App/App.xcodeproj
```

Profil **Development** + certificat **Development** sur le portail si besoin de tester sur appareil physique. OAuth : schéma `fr.ign.canex` dans `ios/App/App/Info.plist`.

---

## Dépannage rapide

| Symptôme | Cause fréquente |
| --- | --- |
| Échec à l’export IPA | Nom du profil dans `ExportOptions.plist` ≠ nom sur le portail |
| `security import` en CI | Mauvais `P12_PASSWORD_DISTR` ou base64 tronqué |
| `SecKeychainUnlock` / passphrase incorrecte | Ancien secret `KEYCHAIN_PASSWORD` : le workflow génère désormais le mot de passe du trousseau éphémère ; vérifier surtout `P12_PASSWORD_DISTR` |
| Pas de clé à côté du certificat Distribution | `.cer` installé sans CSR du même Mac → refaire certificat + export `.p12` sur ce Mac |
| Pas de menu Utilisateurs et accès | Mauvais site (utiliser App Store Connect) ou rôle insuffisant |
| Upload TestFlight OK, pas d’app visible | Traitement Apple (minutes à heures) ; vérifier la fiche app et le bundle ID |
| `built with the iOS 18.x SDK` / exige **iOS 26 SDK** | Runner trop ancien : le workflow utilise `macos-26` + **Xcode 26** (`setup-xcode`) ; vérifier l’étape *Verify Xcode / iOS SDK* dans les logs |
