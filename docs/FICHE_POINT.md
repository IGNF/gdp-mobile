# Fiche point — carte

Documentation de la fiche affichée au clic sur un repère géodésique ou de nivellement sur la carte (`/map`).

## Vue d'ensemble

```mermaid
flowchart TB
  click["Clic repère<br/>useMapGeodesyClick"] --> sheet["MapBottomSheet<br/>mode point"]
  sheet --> shell["MapPointSheet<br/>shell commun"]
  shell --> header["MapPointSheetHeader"]
  shell --> body["Corps selon variante"]
  shell --> footer["MapPointSheetFooter"]
  body --> geod["MapPointGeodesyFicheBody"]
  body --> niv["MapPointNivellementFicheBody"]
  click --> gdp["@ign/gdp-tools<br/>buildGeodesyPointDisplay"]
```

| Élément | Rôle |
|---------|------|
| `MapBottomSheet` | Bottom sheet carte : recherche/RGP (mode navigation) ou fiche repère (mode point) |
| `MapPointSheet` | Shell fixe : en-tête + corps (si snap ≥ 1) + pied de page |
| `MapPointGeodesyFicheBody` | Contenu géodésie (snap 1 → 3) |
| `MapPointNivellementFicheBody` | Contenu nivellement (snap 1 → 3) |
| `@ign/gdp-tools` | Données repère : titre, attributs, photos, contexte signalement |

**Chemin des sources :** `src/features/map/components/MapBottomSheet/pointFiche/`

## Ouverture d'une fiche

1. L'utilisateur clique un repère sur la carte.
2. `useMapGeodesyClick` construit un `MapGeodesyClickAction` via `buildGeodesyPointDisplay` (`gdp-tools`).
3. `MapPage` passe `mapClick.pendingAction` à `MapBottomSheet` en `selectedPoint`.
4. Le bottom sheet bascule en **mode point** : snaps dédiés, tabbar masquée, recherche RGP désactivée.

## Snaps (4 niveaux)

Gérés par `useBottomSheetSnap` dans `MapBottomSheet`. Hauteurs recalculées au resize fenêtre.

| Snap | Index | Hauteur | Contenu visible |
|------|-------|---------|-----------------|
| Mini | 0 | auto (~220 px) | Poignée + en-tête + pied de page (pas de corps) |
| Medium 1 | 1 | ~48 % viewport | Corps snap 1 : carrousel, identité, description… |
| Medium 2 | 2 | ~68 % viewport | + coordonnées / remarques / partenaire (placeholders partiels) |
| Full | 3 | ~82 % viewport (max 720 px) | + vue complète (placeholder) |

- **Snap 0** : hauteur automatique (`sheetAuto`), pas de scroll corps.
- **Snaps 1–3** : hauteur fixe, corps scrollable (`data-scroll-root="true"`).
- Agrandissement : tirer la **poignée** grise en haut du sheet.

```ts
// MapBottomSheet.tsx — hauteurs mode point
[220, 48% vh, 68% vh, min(82% vh, 720)]
```

## Shell commun (`MapPointSheet`)

### En-tête (`MapPointSheetHeader`)

Toujours visible (tous snaps) :

- Titre + picto (`GeodesyPointTitle` de `gdp-tools`)
- Badge état (vert si « BON ETAT »)
- Méta : année de visite, distance au centre de la carte
- Bouton fermer ; favori (placeholder, désactivé)

### Pied de page (`MapPointSheetFooter`)

Toujours visible :

- **S'y rendre** — recentre la carte sur le repère
- **Signaler** — navigation vers le formulaire de signalement (si couche autorisée)

### Corps

Affiché uniquement si `snapIndex >= 1`. Variante résolue par `resolvePointFicheVariant`.

## Variantes géodésie / nivellement

`resolvePointFicheVariant(action)` retourne `'geodesy'` ou `'nivellement'` :

| Critère | Variante |
|---------|----------|
| Domaine `nivf`, `nivo`, `nive` | nivellement |
| Domaine `rsgf`, `rsgo`, `rsge` | géodésie |
| `layerId === 'RN'` ou `'DOMAIN_NIVELLEMENT'` | nivellement |
| Défaut | géodésie |

### Contenu par snap (état actuel)

**Géodésie — snap 1** : carrousel photo/croquis, n° point, ID croquis, exploitabilité GPS, description.

**Géodésie — snap 2** : coordonnées, commune, dernière MAJ, lien PDF, remarques, partenaire (placeholder).

**Géodésie — snap 3** : vue complète (placeholder).

**Nivellement — snap 1** : carrousel, système d'altitude, altitude, complément, type.

**Nivellement — snap 2** : remarques, partenaire (placeholder).

**Nivellement — snap 3** : vue complète (placeholder).

Les maquettes Figma de référence sont à la racine du monorepo : `figma/fiche_geod_medium.png`, `figma/fiche_niv_medium.png`.

## Carrousel photos / croquis

`PointImageCarousel` + `PointImageLightbox`.

- **Source unique** : `action.point.photos` (`collectGeodesyPointPhotos` dans `gdp-tools`), dédoublonnage par URL.
- **Navigation** : balayage horizontal (`scroll-snap`), indicateurs points.
- **Plein écran** : bouton en haut à droite de chaque image → lightbox portail (`z-index: 200`), navigation clavier (‹ ›, Échap).

Les onglets de contenu (coords, etc.) se changent par **clic**, pas par swipe. Seules les images utilisent le swipe horizontal.

## Mode debug — champs non affichés

Section `UnmappedFieldsDebug` en bas du corps (snap ≥ 1).

Objectif : lister les propriétés WFS / attributs pas encore mappés dans la fiche, pour ne rien oublier lors de l'implémentation Figma.

| Fichier | Rôle |
|---------|------|
| `collectAllPointFields` | Agrège propriétés scalaires + attributs + commentaire |
| `displayedFieldKeys.ts` | Clés considérées comme « affichées » par zone (header, snap 1, snap 2…) |
| `getDisplayedFieldIds` | Union des clés selon variante + `snapIndex` |
| `filterUnmappedPointFields` | Différence = liste debug |

**Pour marquer un champ comme couvert** : ajouter sa clé dans `displayedFieldKeys.ts` (et l'afficher dans le corps correspondant).

## Interaction avec le chrome carte (`MapPage`)

Quand une fiche repère est ouverte (`selectedPoint !== null`) :

| Comportement | Détail |
|--------------|--------|
| Tabbar | Masquée (`onTabbarVisibleChange(false)`) |
| Boutons carte (GPS, légende, couches…) | Restent en bas de l'écran (`--map-fab-sheet-offset: 0`), **sous** la fiche (`z-index` sheet > overlays) |
| Mode navigation | `--map-fab-sheet-offset` = hauteur du sheet recherche/RGP |

Variables CSS sur `.mapPage` :

- `--map-sheet-height` — hauteur rapportée par le bottom sheet
- `--map-fab-sheet-offset` — offset des FAB / échelle OL (0 en mode fiche)
- `--map-tabbar-height` — `5.5rem` ou `0` si tabbar masquée

## Données et utilitaires

| Utilitaire | Rôle |
|----------|------|
| `readProperty(action, key)` | Lit une propriété WFS (casse `key` / `KEY`) |
| `findEtatLabel` / `findVisitYear` | Champs en-tête depuis propriétés ou attributs |
| `buildPointCarouselItems` | Liste images pour le carrousel |
| `pointFicheUtils.ts` | Helpers partagés entre les deux corps |

Type principal : `MapGeodesyClickAction` (`useMapGeodesyClick`) — contient `point` (affichage) et `reportContext` (signalement).

## Extension — checklist

1. **Nouveau champ affiché** : lire via `readProperty` ou `action.point.attributes`, l'ajouter au JSX du corps, puis sa clé dans `displayedFieldKeys.ts`.
2. **Nouvelle section snap** : condition `snapIndex >= N` dans le corps concerné, clés associées dans `getDisplayedFieldIds`.
3. **Nouvelle variante** : étendre `PointFicheVariant`, `resolvePointFicheVariant`, créer un `MapPoint…FicheBody`.
4. **Figma** : comparer avec les PNG `figma/fiche_*` ; placeholders « à remplir » signalent le travail restant.

## Fichiers principaux

```
MapBottomSheet/
├── MapBottomSheet.tsx          # Orchestration sheet + snaps
└── pointFiche/
    ├── MapPointSheet.tsx       # Shell
    ├── MapPointSheetHeader.tsx
    ├── MapPointSheetFooter.tsx
    ├── MapPointGeodesyFicheBody.tsx
    ├── MapPointNivellementFicheBody.tsx
    ├── PointImageCarousel.tsx
    ├── PointImageLightbox.tsx
    ├── UnmappedFieldsDebug.tsx
    ├── resolvePointFicheVariant.ts
    ├── displayedFieldKeys.ts
    ├── getDisplayedFieldIds.ts
    └── pointFicheUtils.ts
```

## Voir aussi

- [Architecture](./ARCHITECTURE.md) — couches `src/`, flux carte
- `@ign/gdp-tools` — `buildGeodesyPointDisplay`, `collectGeodesyPointPhotos`, catalogues attributs
- `useMapGeodesyClick` — déclenchement au clic carte
