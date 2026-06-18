# Architecture — gdp-mobile

> Squelette initial. À compléter au fil de l'implémentation.

## Couches `src/`

```
app/ → features/ → infra/ → platform/ → domain/
         ↓
      shared/ + styles/
```

| Couche | Rôle |
|--------|------|
| `domain/` | Modèles purs, sans React ni réseau |
| `infra/` | Auth, API collaboratif, OpenLayers, stockage |
| `platform/` | Wrappers `@ign/mobile-device` / Capacitor |
| `features/` | Hooks et composants métier |
| `pages/` | Écrans routés (fine couche) |
| `shared/` | UI, config, constantes, utils |

## Dépendances externes

- `@ign/gdp-tools` : catalogues WMS/WFS, GetFeatureInfo, hooks carte, signalements repère
- `@ign/mobile-core` : `AuthManager`, OAuth PKCE
- `@ign/mobile-device` : stockage, device, réseau

## Routes MVP

| Route | Écran |
|-------|-------|
| `/` | Redirect → `/map` ou `/welcome` |
| `/map` | Carte (écran central) |
| `/report/geodesy/new` | Signalement repère |
| `/login`, `/auth/callback` | SSO |

Voir `cursor_nouvelle_application_g_od_sie_de.md` pour le plan complet.
