# Déploiement iOS (CI GitHub)

Même déclencheur que Android : push du tag `vX.Y.Z` (voir [README](../README.md)). Workflow : [`.github/workflows/ios-deploy.yml`](../.github/workflows/ios-deploy.yml).

## Prérequis Apple

1. **App Store Connect** : application avec le bundle ID `fr.ign.canex` (même identifiant que l’app Android).
2. **Certificat** : *Apple Distribution* exporté en `.p12` (mot de passe connu de l’équipe).
3. **Profil de provisioning** : type *App Store* / distribution pour `fr.ign.canex`.
4. **Clé API App Store Connect** (Users and Access → Integrations) : fichier `.p8`, Key ID, Issuer ID.

Modèle d’export IPA : [`ios/ExportOptions.plist.example`](../ios/ExportOptions.plist.example). Adapter `teamID` et le nom du profil, puis encoder pour le secret `IOS_EXPORT_PRODUCTION` :

```bash
base64 -i ExportOptions.plist | pbcopy   # macOS
```

## Secrets GitHub (dépôt `gdp-mobile`)

### Build web (partagés avec Android)

Tous les `VITE_*` du workflow Android, plus :

| Secret | Rôle |
| --- | --- |
| `VITE_OAUTH_IOS_REDIRECT_URI` | `fr.ign.canex://auth/callback` (Keycloak) |

### Signature & upload

| Secret | Rôle |
| --- | --- |
| `SSH_PRIVATE_KEY` | `npm install` (deps `@ign/*` en Git SSH) |
| `DISTRIBUTION_CERTIFICATE_P12` | Certificat distribution, encodé base64 |
| `P12_PASSWORD_DISTR` | Mot de passe du `.p12` |
| `DEPLOY_PROVISION_PROFILE_BASE64` | Profil App Store, encodé base64 |
| `KEYCHAIN_PASSWORD` | Mot de passe aléatoire pour le keychain éphémère du runner |
| `APPSTORE_TEAM_ID` | Team ID Apple (10 caractères) |
| `IOS_EXPORT_PRODUCTION` | `ExportOptions.plist` encodé base64 |
| `APPSTORE_API_KEY_ID` | ID de la clé API |
| `APPSTORE_ISSUER_ID` | Issuer ID du compte |
| `APPSTORE_API_PRIVATE_KEY` | Contenu du `.p8` encodé base64 |

Encodage certificat / profil :

```bash
base64 -i distribution.p12 | pbcopy
base64 -i GDP_AppStore.mobileprovision | pbcopy
base64 -i AuthKey_XXXX.p8 | pbcopy
```

Ne jamais committer de certificats, profils ou clés API dans le dépôt.

## Variable de dépôt (upload TestFlight)

| Variable | Valeur | Effet |
| --- | --- | --- |
| `IOS_DEPLOY_TO_TESTFLIGHT` | `true` | Envoie l’IPA sur TestFlight après build |
| (absente ou autre) | — | Build + artefact IPA uniquement |

Équivalent Android : `ANDROID_DEPLOY_TO_PLAY`.

## Renouvellement annuel (certificat / profil)

1. Créer ou renouveler le certificat *Apple Distribution* sur [developer.apple.com](https://developer.apple.com/account/resources/certificates/list).
2. Regénérer le profil App Store si le certificat a changé.
3. Ré-exporter le `.p12` et mettre à jour les secrets `DISTRIBUTION_CERTIFICATE_P12`, `P12_PASSWORD_DISTR`, `DEPLOY_PROVISION_PROFILE_BASE64` et, si besoin, `IOS_EXPORT_PRODUCTION`.
4. Lancer un `workflow_dispatch` sur **iOS Deploy** avant le prochain tag de prod.

## Développement local (macOS)

```bash
npm run setup-ios
npm run build:mobile && npx cap sync ios
open ios/App/App.xcodeproj
```

OAuth : schéma `fr.ign.canex` dans `ios/App/App/Info.plist`.
