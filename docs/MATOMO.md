# Statistiques Matomo

L’application envoie des **pages vues** à [Matomo IGN](https://matomo.ign.fr/) pour mesurer la fréquentation des écrans (web et APK).

## Configuration

Variables d’environnement :

| Variable | Rôle |
|---|---|
| `VITE_MATOMO_URL` | URL de base du serveur Matomo (sans `/matomo.php`) |
| `VITE_MATOMO_SITE_ID` | Identifiant du site dans Matomo |

Exemple (production) :

```bash
VITE_MATOMO_URL=https://matomo.ign.fr
VITE_MATOMO_SITE_ID=19
```

- Déclarées dans `gdp-mobile/.env` (dev) ou `gdp-mobile/.env.qualif` (qualification).
- Si les variables sont **absentes**, les valeurs ci-dessus sont utilisées par défaut (`matomo.ign.fr`, site `19`).
- Si l’une des deux est **vide**, Matomo est **désactivé** (aucun script chargé, aucune requête).

Pour couper le tracking en local après des tests :

```bash
VITE_MATOMO_URL=
VITE_MATOMO_SITE_ID=
```

En qualification, préférer un **site Matomo dédié** (autre `VITE_MATOMO_SITE_ID`) pour ne pas mélanger les stats avec la production.

La config est centralisée dans `src/shared/config/env.ts` (`config.matomo`). Ne pas lire `import.meta.env` ailleurs.

## Fonctionnement

L’app est une SPA React Router : Matomo ne peut pas compter les changements d’écran via le script HTML seul.

| Fichier | Rôle |
|---|---|
| `src/infra/analytics/matomo.ts` | Initialisation du script, titres d’écrans, `trackPageView`, `trackEvent`, `trackOverlayOpen` |
| `src/infra/analytics/MatomoPageTracker.tsx` | Envoie une page vue à chaque changement de route |
| `src/app/router/routes.tsx` | Monte `MatomoPageTracker` sur toutes les routes |
| `src/features/map/hooks/useMapPageMatomoTracking.ts` | Événements Matomo pour les overlays carte (menu, légende, couches) |

Au premier affichage, le script `matomo.js` est injecté dynamiquement. À chaque navigation, une requête `matomo.php` part avec `action_name` (titre) et `url` (URL courante), via `setCustomUrl` puis `trackPageView(title)`.

## Écrans suivis

| Route | Titre Matomo |
|---|---|
| `/welcome` | Accueil |
| `/login`, `/auth/callback` | Connexion |
| `/map` | Carte |
| `/reports` | Mes signalements |
| `/reports/history` | Anciens signalements |
| `/reports/history/:id` | Détail ancien signalement |
| `/reports/:id` | Détail du signalement |

Les overlays ne changent pas l’URL : ils sont comptés via des **événements** (`trackOverlayOpen`), pas des pages vues.

## Overlays carte (menu, légende, couches)

Sur `/map`, les panneaux modaux n’ont pas de route React Router. Le hook `useMapPageMatomoTracking` (dans `MapPage`) envoie un événement à chaque ouverture :

| Catégorie | Action | Nom | Déclencheur |
|---|---|---|---|
| `Menu` | `Ouverture` | Mon compte, Paramètres, Mes favoris, Communauté, Aide, À propos | Menu latéral → overlay |
| `Auth` | `Déconnexion` | — | Menu latéral → Déconnexion |
| `Carte` | `Ouverture` | Légende | FAB légende |
| `Carte` | `Ouverture` | Couches | FAB couches / filtres |

Dans Matomo : **Comportement → Événements**, filtrer par catégorie `Menu` ou `Carte`.

Les liens externes du menu (ex. « Je donne mon avis ») passent par `enableLinkTracking` (clics sortants).

## Dimension personnalisée (plateforme)

Avant chaque page vue, la dimension **1** reçoit la plateforme Capacitor : `web`, `android` ou `ios`.

Cette dimension doit être créée dans l’administration Matomo du site concerné (index **1**, portée « action ») pour apparaître dans les rapports.

## Événements métier (optionnel)

Pour tracer une action ponctuelle :

```ts
import { trackEvent, trackOverlayOpen } from '@/infra/analytics/matomo';

trackEvent('Signalement', 'Envoi');
trackOverlayOpen('Menu', 'Paramètres');
```

Signatures : `trackEvent(category, action, name?, value?)`, `trackOverlayOpen(scope, name)`.

Ne pas y mettre de données personnelles (e-mail, identifiant de signalement, coordonnées).

## Vérification

1. Redémarrer le serveur dev après modification du `.env` (`npm run dev`).
2. Naviguer entre `/map`, `/reports`, etc.
3. Onglet **Réseau** du navigateur : filtrer `matomo.php` — une requête par écran, avec `action_name=Carte` (ou autre titre).
4. Matomo → **Visiteurs en temps réel** ou **Comportement → Titres des pages** : vérifier le titre et l’URL.

En dev local, les visites remontent sur le site configuré (par défaut le site prod `19`) : limiter les tests ou utiliser un site de test.

**localhost** : certaines instances Matomo n’affichent pas (ou filtrent) les hits dont l’URL est `localhost` dans les rapports agrégés. Si `action_name` apparaît dans l’onglet Réseau mais pas dans **Titres des pages**, tester sur [qualif](http://sgm.ign.fr/qlf-gdp/map) ou vérifier avec l’admin Matomo.

## Web et APK

Le même code s’exécute dans le navigateur et dans la WebView Capacitor (`fr.ign.gdp`). La dimension plateforme permet de les distinguer dans Matomo.

Pour tester l’APK avec le serveur Vite : `npm run dev` + `adb reverse tcp:5173 tcp:5173`, puis ouvrir `http://localhost:5173` sur le téléphone.
