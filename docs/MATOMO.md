# Statistiques Matomo

L’application envoie des statistiques anonymes à [Matomo IGN](https://matomo.ign.fr/) pour comprendre comment Géodésie de poche est utilisée — sur le web, dans l’application Android et, à terme, sur iOS — et orienter les évolutions.

Aucune donnée personnelle n’est collectée : ni e-mail, ni identifiant de signalement, ni coordonnées géographiques.

## Description des métriques

Résumé à destination des non-développeurs (pilotage, administrateurs Matomo). Le détail technique figure dans les sections suivantes.

### 1. Fréquentation des écrans (pages vues)

Une page vue est comptée à chaque ouverture d’un écran, avec un titre lisible : Accueil, Connexion, Carte, Recherche, Recherche Stations RGP, Mes signalements, Anciens signalements, Détail du signalement…

Questions auxquelles ces chiffres répondent :

- combien de visites et de visiteurs uniques reçoit l’application ;
- quels écrans sont les plus consultés ;
- quel est le parcours type (ex. Accueil → Carte → Recherche) ;
- quelle part des utilisateurs passe par la connexion.

### 2. Usage de la carte et des signalements (événements)

Les panneaux ouverts par-dessus la carte et les actions ponctuelles ne changent pas d’URL : ils sont comptés comme **événements** (*Comportement → Événements*).

| Catégorie | Ce qui est mesuré | Question |
|---|---|---|
| **Menu** | Ouverture de Mon compte, Paramètres, Communauté, Aide, À propos | Quelles rubriques du menu sont réellement utilisées ? |
| **Auth** | Déconnexion | À quelle fréquence les utilisateurs se déconnectent-ils ? |
| **Carte** | Ouverture de la Légende et du panneau Couches | La légende et le choix des couches sont-ils trouvés ? |
| **Couche** | Affichage / masquage d’une couche (Géodésie, Réseau GNSS permanent, Mes signalements, fonds IGN…), rechargement des stations RGP, changement de fond sur la mini-carte de signalement | Quelles couches et quels fonds intéressent les utilisateurs ? |
| **Filtre géodésie** | Application des filtres (nombre de filtres actifs), chaque critère retenu séparément (ex. `Filtre – Type de point : RBF`), réinitialisation | Le mode expert est-il utilisé ? Quels critères reviennent le plus ? |
| **Géolocalisation** | Passage entre suivi activé, suivi verrouillé et désactivé | La géolocalisation sert-elle sur le terrain ? |
| **Signalement** | Brouillon enregistré, envoi réussi, envoi partiel (photos non jointes), envoi échoué ; conformité du repère, nombre de photos, point d’entrée (carte ou brouillon) | Combien de signalements sont produits et envoyés ? Quelle part échoue, et pourquoi ? Quelle proportion de repères non conformes ? |

Seules les actions de l’utilisateur sont comptées : la restauration automatique des préférences au démarrage ne génère pas d’événement.

Les clics vers des liens externes (ex. « Je donne mon avis ») sont mesurés comme liens sortants.

**Lecture des rapports.** Matomo présente séparément les catégories, les actions et les noms. Les noms suivent donc la forme `Contexte – Détail` (ex. `Mini-carte – Géodésie`, `Signalement – Carte – Conforme`) pour rester compréhensibles seuls dans le rapport « Noms d’événement ». Pour voir catégorie, action et nom sur une même ligne, utiliser l’icône **Rendre plat** (*Flatten*) sous le tableau des événements.

### 3. Contexte technique (dimensions personnalisées)

| Dimension | Valeurs | Utilité |
|---|---|---|
| **Version app** | ex. `4.0.16` | Suivre l’adoption des nouvelles versions et relier une variation des stats à une livraison |
| **Plateforme** | `web`, `android`, `ios` | Comparer l’usage navigateur / application mobile. `ios` est déjà prévu : il remontera sans modification dès qu’une application iOS sera publiée |

### 4. Indicateurs clés suggérés

- Visites par mois, ventilées par plateforme (web / Android / iOS).
- Taux d’utilisation de la carte : visites contenant l’écran Carte / visites totales.
- Taux de consultation de la recherche et des stations RGP.
- Part des visites avec au moins un filtre géodésie appliqué (adoption du mode expert).
- Couches les plus activées.
- Signalements envoyés par mois (`Envoi réussi` + `Envoi partiel`), part conforme / non conforme.
- Taux d’échec d’envoi (`Envoi échoué` + `Envoi partiel`) / tentatives, ventilé par motif.
- Taux de conversion brouillon → envoi (`Envoi réussi` / `Brouillon enregistré`).
- Nombre moyen de photos par signalement (valeur moyenne de l’événement).
- Répartition des versions d’application en circulation.

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
| `src/infra/analytics/matomo.ts` | Initialisation du script, titres d’écrans, `trackPageView`, `trackEvent` et helpers par catégorie |
| `src/infra/analytics/MatomoPageTracker.tsx` | Envoie une page vue à chaque changement de route |
| `src/app/router/AppLayout.tsx` | Monte `MatomoPageTracker` sur toutes les routes |
| `src/features/map/hooks/useMapPageMatomoTracking.ts` | Événements Matomo pour les overlays carte (menu, légende, couches) |

Au premier affichage, le script `matomo.js` est injecté dynamiquement. À chaque navigation, une requête `matomo.php` part avec l’URL courante et un titre lisible.

## Écrans suivis

| Route | Titre Matomo |
|---|---|
| `/welcome` | Accueil |
| `/login`, `/auth/callback` | Connexion |
| `/map` | Carte |
| `/map/search` | Recherche |
| `/map/search/rgp` | Recherche Stations RGP |
| `/reports` | Mes signalements |
| `/reports/history` | Anciens signalements |
| `/reports/history/:id` | Détail ancien signalement |
| `/reports/:id` | Détail du signalement |

Les overlays ne changent pas l’URL : ils sont comptés via des **événements** (`trackOverlayOpen`), pas des pages vues.

## Overlays carte (menu, légende, couches)

Sur `/map`, les panneaux modaux n’ont pas de route React Router. Le hook `useMapPageMatomoTracking` (dans `MapPage`) envoie un événement à chaque ouverture :

| Catégorie | Action | Nom | Déclencheur |
|---|---|---|---|
| `Menu` | `Ouverture` | `Menu – Mon compte`, `Menu – Paramètres`, `Menu – Communauté`, `Menu – Aide`, `Menu – À propos` | Menu latéral → overlay |
| `Auth` | `Déconnexion` | `Menu – Déconnexion` | Menu latéral → Déconnexion |
| `Carte` | `Ouverture` | `Carte – Légende` | FAB légende |
| `Carte` | `Ouverture` | `Carte – Couches` | FAB couches / filtres |

Helpers : `trackOverlayOpen`, `trackLogout`.

Dans Matomo : **Comportement → Événements**, filtrer par catégorie `Menu` ou `Carte`.

Les liens externes du menu (ex. « Je donne mon avis ») passent par `enableLinkTracking` (clics sortants).

## Couches carte (panneau Couches, mini-carte signalement)

Les changements de couches ne passent pas par React Router : événements Matomo catégorie **`Couche`**, déclenchés uniquement par une **action utilisateur** (pas la restauration des préférences au chargement).

| Action | Nom (exemples) | Déclencheur |
|---|---|---|
| `Activer` / `Masquer` | `Couches – Mes signalements`, `Couches – Géodésie`, `Couches – Réseau GNSS permanent`, `Couches – Plan IGN`, … | Panneau **Couches** sur `/map` (`MapLayersPanelFlow`) |
| `Recharger` | `Stations RGP – Réseau GNSS permanent` | Bouton recharger de la liste des stations RGP, panneau recherche (`useNearestRgpStations`, après succès) |
| `Changer fond` | `Mini-carte – Plan IGN`, … | Sélecteur de fond sur la mini-carte (`ReportPositionMap`) |
| `Activer` / `Masquer` | `Mini-carte – Géodésie` | Case à cocher Géodésie sur la mini-carte |

Le préfixe (`Couches` ou `Mini-carte`) regroupe les lignes par origine dans les rapports triés par nom.

Helpers : `trackLayerVisibilityChange`, `trackLayerReload`, `trackMiniMapBasemapChange` dans `src/infra/analytics/matomo.ts`.

Dans Matomo : **Comportement → Événements**, catégorie `Couche`.

## Filtres géodésie (mode expert)

Le panneau **Filtres** (`MapGeodesyFiltersPanel`) n’envoie des événements qu’au clic **Appliquer** ou **Réinitialiser** (brouillon), pas à la restauration des préférences au chargement.

| Catégorie | Action | Nom (3ᵉ arg.) | Valeur (4ᵉ arg.) |
|---|---|---|---|
| `Filtre géodésie` | `Appliquer` | `Filtres – 3 actifs`, `Filtres – 1 actif`, `Filtres – par défaut` | Nombre de filtres actifs (badge) |
| `Filtre géodésie` | `Critère` | `Filtre – Type de point : RBF`, `Filtre – Origine : IGN`, `Filtre – Vu en place : 2015–2020`, … | — |
| `Filtre géodésie` | `Réinitialiser` | `Filtres – réinitialisés` | — |

Un clic sur **Appliquer** envoie un événement `Appliquer`, puis un événement `Critère` **par valeur retenue** : un choix multiple avec RBF et RDF cochés produit `Filtre – Type de point : RBF` et `Filtre – Type de point : RDF`. Chaque valeur a ainsi sa propre ligne, cumulable dans le temps, au lieu d’une ligne par combinaison de filtres.

Pour savoir combien de fois un critère a été utilisé : action `Critère`, puis lire la ligne du nom correspondant.

Helpers : `trackGeodesyFiltersApplied`, `trackGeodesyFiltersResetDraft` ; critères : `listGeodesyFiltersMatomoCriteria` dans `mapGeodesyFiltersUtils.ts`.

Dans Matomo : **Comportement → Événements**, catégorie `Filtre géodésie`.

## Géolocalisation (FAB carte)

Le bouton géolocalisation sur `/map` enchaîne trois modes au clic : **suivi activé** → **suivi verrouillé** (recentrage) → **désactivé**. Un événement est envoyé **à chaque clic** sur le FAB (`handleGeolocationButtonClick`), pas quand le suivi s’arrête via déplacement carte, recherche, etc.

| Catégorie | Action | Nom |
|---|---|---|
| `Géolocalisation` | `Mode` | `Suivi position activé` |
| `Géolocalisation` | `Mode` | `Suivi position verrouillé` |
| `Géolocalisation` | `Mode` | `Suivi position désactivé` |

Helper : `trackGeolocationMode` dans `src/infra/analytics/matomo.ts`.

Dans Matomo : **Comportement → Événements**, catégorie `Géolocalisation`.

## Signalements

Deux points d’entrée envoient un signalement, tous deux via `useSubmitGeodesyPointReport` (option `tracking`) :

- **`Carte`** : wizard `GeodesyPointReportWizard` ouvert depuis la fiche point, bouton « Envoyer maintenant » à l’étape de confirmation ;
- **`Brouillon`** : bouton « Envoyer » sur `/reports/:id` (`ReportDetailPage`).

| Catégorie | Action | Nom (3ᵉ arg.) | Valeur (4ᵉ arg.) | Déclencheur |
|---|---|---|---|---|
| `Signalement` | `Brouillon enregistré` | `Signalement – Conforme` / `Signalement – Non conforme` | Nombre de photos | Fin du wizard (récapitulatif validé, brouillon local créé) |
| `Signalement` | `Envoi réussi` | `Signalement – Carte – Conforme`, `Signalement – Brouillon – Non conforme`, … | Nombre de photos | Signalement créé et photos jointes |
| `Signalement` | `Envoi partiel` | idem | Nombre de photos à joindre | Signalement créé, mais l’envoi des photos a échoué (brouillon conservé) |
| `Signalement` | `Envoi échoué` | `Signalement – Carte – Connexion requise`, `Signalement – Brouillon – Création impossible` | — | Pas de session, ou erreur API à la création |

Lecture :

- signalements créés côté serveur = `Envoi réussi` + `Envoi partiel` ;
- tentatives d’envoi = `Envoi réussi` + `Envoi partiel` + `Envoi échoué` ;
- un brouillon envoyé plus tard depuis « Mes signalements » compte un `Brouillon enregistré` (source carte) puis un envoi `Signalement – Brouillon – …`.

Helpers : `trackReportDraftSaved`, `trackReportSubmitted`, `trackReportSubmittedWithoutPhotos`, `trackReportSubmitFailed` dans `src/infra/analytics/matomo.ts`.

Dans Matomo : **Comportement → Événements**, catégorie `Signalement`. Ces événements sont de bons candidats pour des **objectifs** (ex. objectif « Signalement envoyé » sur catégorie `Signalement`, action `Envoi réussi`).

## Dimensions personnalisées

| Index | Nom | Portée | Valeur | Envoi |
|---|---|---|---|---|
| **1** | Version app | visite | version de `gdp-mobile/package.json` (ex. `4.0.16`, via `__APP_VERSION__`) | une fois dans `initMatomo()`, reprise par toutes les requêtes suivantes |
| **2** | Plateforme | action | `web`, `android` ou `ios` (`Capacitor.getPlatform()`) | avant chaque page vue, reprise par les événements suivants |

Ces dimensions doivent être créées dans l’administration Matomo du site concerné, avec les mêmes index, pour apparaître dans les rapports. Si Matomo attribue un autre identifiant à la création, aligner `src/infra/analytics/matomo.ts`.

La version permet surtout de suivre l’adoption des APK et de relier une variation de stats à une release. Penser à incrémenter `version` dans `gdp-mobile/package.json` à chaque livraison (sinon la valeur par défaut `4.0.0` de `vite.config.ts` est envoyée si le champ est absent).

**iOS** : aucune application iOS n’est publiée pour l’instant, mais la valeur `ios` est déjà renvoyée par Capacitor sur cette plateforme. Prévoir dès maintenant le segment Matomo correspondant (`Plateforme == ios`) pour que les rapports soient prêts le jour de la publication.

## Convention de nommage et nouveaux événements

Matomo affiche les catégories, actions et noms dans des rapports séparés : un nom seul (`Géodésie`, `Brouillon`…) y est ambigu. Règles :

- **Nom au format `Contexte – Détail`**, séparateur ` – ` (tiret demi-cadratin entouré d’espaces), construit par `eventName()` dans `matomo.ts`.
- **Une valeur agrégeable par événement** : éviter les noms qui concatènent plusieurs informations variables (une ligne par combinaison). Préférer plusieurs événements, comme pour les critères de filtre.
- **Catégorie = domaine** (`Couche`, `Signalement`…), **action = verbe** (`Activer`, `Envoi réussi`…).
- **Pas de données personnelles** (e-mail, identifiant de signalement, coordonnées).

`trackEvent` n’est pas exporté : pour un nouvel événement, ajouter un helper dédié dans `src/infra/analytics/matomo.ts` qui applique cette convention, par exemple :

```ts
export function trackFavoriteAdded(): void {
  trackEvent('Favoris', 'Ajout', eventName('Fiche point', 'Favori'));
}
```

Helpers existants : `trackOverlayOpen`, `trackLogout`, `trackLayerVisibilityChange`, `trackLayerReload`, `trackMiniMapBasemapChange`, `trackGeodesyFiltersApplied`, `trackGeodesyFiltersResetDraft`, `trackGeolocationMode`, `trackReportDraftSaved`, `trackReportSubmitted`, `trackReportSubmittedWithoutPhotos`, `trackReportSubmitFailed`.

**Changement de nommage (octobre 2026)** : les noms d’événements sont passés au format `Contexte – Détail` et les filtres sont découpés par critère. Sur une période à cheval sur ce changement, anciens noms (ex. `Géodésie (mini-carte)`, `Type de point: RBF · Origine: IGN`) et nouveaux coexistent dans les rapports.

## Vérification

1. Redémarrer le serveur dev après modification du `.env` (`npm run dev`).
2. Naviguer entre `/map`, `/reports`, etc.
3. Onglet **Réseau** du navigateur : filtrer `matomo.php` — une requête par écran ou événement.
4. Matomo → **Visiteurs en temps réel** : vérifier le titre, l’URL et les événements.

En dev local, les visites remontent sur le site configuré (par défaut le site prod `19`) : limiter les tests ou utiliser un site de test.

## Web, Android et iOS

Le même code s’exécute dans le navigateur et dans la WebView Capacitor (`fr.ign.canex`), sur Android aujourd’hui et sur iOS si l’application y est publiée. La dimension plateforme permet de les distinguer dans Matomo, la dimension version de comparer les versions installées.

Pour tester l’APK avec le serveur Vite : `npm run dev` + `adb reverse tcp:5173 tcp:5173`, puis ouvrir `http://localhost:5173` sur le téléphone.
