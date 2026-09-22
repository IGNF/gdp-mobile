# Contrat d’échange — signalements GDP

Spécification de ce que **Géodésie de poche** envoie à l’API Espace collaboratif IGN, destinée à un programme d’ingestion / une mise en base.

| | |
|---|---|
| Application | Géodésie de poche (`gdp-mobile`) |
| **Version de l’appli** | **4.0.1** |
| Date du contrat | 18 septembre 2026 |
| Communauté EspaceCo | `96` (`VITE_GDP_REPORT_COMMUNITY_ID`) |
| Thème d’envoi | `gdp-tools` (`VITE_GDP_REPORT_SUBMISSION_THEME`) |
| API | `https://espacecollaboratif.ign.fr/gcms/api/` (`VITE_BASE_API_URL`) |

La version **4.0.1** est celle de `gdp-mobile/package.json`. Elle est recopiée dans Android / iOS et injectée au build (`__APP_VERSION__`). Chaque signalement la reporte en pied de `comment` sous la forme `GDP Mobile 4.0.1 | …`.

---

## 1. Vue d’ensemble

Un signalement GDP n’est **pas** un JSON métier autonome. C’est une **alerte EspaceCo** (`report`) :

- **communauté** : `96`
- **thème** : `gdp-tools`
- **géométrie** : un point WKT en WGS84
- **attributs métier** : objet JSON sérialisé dans le champ `attributes`
- **photos** : pièces jointes **après** création de l’alerte (2ᵉ appel)

L’identifiant serveur est un **entier** EspaceCo (`id`). L’auteur n’est pas dans le corps POST : il vient du **jeton OAuth**.

---

## 2. Prérequis d’envoi

| Condition | Détail |
|-----------|--------|
| Session | OAuth 2 + PKCE, header `Authorization: Bearer <access_token>` |
| Droit | utilisateur membre de la communauté 96 |
| Origine | clic sur un **repère existant** (WFS / GetFeatureInfo) |
| Interdit | domaines WFS `rsge` et `nive` (canevas) — pas de signalement |
| Position déplaçable | uniquement nivellement `nivf` / `nivo` |

Le programme d’ingestion n’a **pas** besoin du wizard. Il doit consommer **ce qui arrive en base EspaceCo**.

---

## 3. Flux d’envoi (2 appels HTTP)

```
1. POST /reports          → crée l’alerte, retourne { id, … }
2. POST /reports/{id}/attachments  → photos (si présentes)
```

Si l’étape 2 échoue, **l’alerte existe déjà sans photos**. Le client conserve `serverId`.

Pas de `sketch`. Pas de dump de fiche WFS.

---

## 4. Appel 1 — création

**Méthode / URL**

```
POST {BASE}/reports
Content-Type: multipart/form-data
Authorization: Bearer …
```

**Champs du formulaire** (tous en texte, sauf les blobs photo qui ne sont pas dans cet appel) :

| Champ | Obligatoire (client GDP) | Type | Valeur |
|-------|--------------------------|------|--------|
| `geometry` | oui (seul champ obligatoire côté validateur API) | string WKT | `POINT({lon} {lat})` |
| `community` | oui | number (string form-data) | `96` |
| `comment` | oui (peut être seulement le pied technique) | string UTF-8 | voir [§7](#7-commentaire-comment) |
| `status` | oui | string | toujours `submit` à la création |
| `attributes` | oui | **string JSON** | objet thème, voir [§6](#6-attributs-thème-attributes) |

Champs API possibles **non utilisés** par GDP 4.0.1 : `sketch`, `input_device`, `device_version` (les métadonnées appareil vont dans `comment`).

**Exemple de corps logique** (avant FormData), version **4.0.1** :

```json
{
  "geometry": "POINT(2.3488 48.8534)",
  "community": 96,
  "comment": "Repère oxydé, plaque illisible.\n\nPhoto non conforme ou absente\n\nGDP Mobile 4.0.1 | Web (Chrome 131.0.0.0)",
  "status": "submit",
  "attributes": "{\"community\":96,\"theme\":\"gdp-tools\",\"attributes\":{\"id\":\"75056A\",\"domaine\":\"rsgf\",\"etat\":\"MAUVAIS ETAT\",\"gps\":\"EXPLOITABLE DIRECTEMENT PAR GPS\",\"move\":\"false\"}}"
}
```

Le champ `attributes` est **une chaîne JSON**, pas un objet FormData imbriqué.

---

## 5. Géométrie

| Propriété | Valeur |
|-----------|--------|
| Format | WKT `POINT(longitude latitude)` |
| CRS | **EPSG:4326** (lon/lat WGS84), ordre **lon puis lat** |
| Origine | coordonnées du repère WFS, éventuellement corrigées par l’utilisateur (nivellement) |
| Précision | nombres JS (souvent ~6–10 décimales) |

À la lecture, l’API peut renvoyer `POINT`, `POINT Z`, etc. Le parseur GDP accepte `POINT\s*(?:Z|M)?\s*\(\s*{lon}\s+{lat}`.

**À stocker en base** : `geometry` WKT **et** colonnes `longitude` / `latitude` numériques.

---

## 6. Attributs thème (`attributes`)

### 6.1 Enveloppe (création)

```json
{
  "community": 96,
  "theme": "gdp-tools",
  "attributes": {
    "id": "…",
    "domaine": "…",
    "etat": "…",
    "gps": "…",
    "move": "true|false"
  }
}
```

À l’envoi : **un objet unique**, pas un tableau.

À la **lecture** `GET /reports` / `GET /reports/{id}`, EspaceCo peut renvoyer :

- un **tableau** de blocs `{ community, theme, attributes }`
- ou une **chaîne JSON** (objet ou tableau)

`attributes` internes : objet `{ nom: valeur }` **ou** liste `{ name, value }`.

### 6.2 Contrat métier GDP (clés canoniques)

Toujours visées par l’app 4.0.1, même si le thème EspaceCo évolue :

| Clé | Sens | Obligatoire si connue | Source | Exemple |
|-----|------|------------------------|--------|---------|
| `id` | identifiant du **repère** (métier géodésie, **pas** l’id EspaceCo) | oui si le WFS l’a | WFS `id` / `ID` | `75056A`, `N.123456` |
| `domaine` | code réseau | oui si connu | WFS `domaine` / `DOMAINE` | `rsgf`, `rsgo`, `nivf`, `nivo` |
| `etat` | état constaté | souvent présent | wizard **ou** WFS | voir [§6.3](#63-valeurs-etat) |
| `gps` | exploitabilité GPS | prérempli WFS | `expl_gps` / `expl_gpscode` / `gps` | voir [§6.4](#64-valeurs-gps) |
| `move` | position modifiée par l’utilisateur | toujours forcé | wizard | `"true"` ou `"false"` (strings) |

**Règle d’ingestion** : clés **insensibles à la casse**. Alias possibles côté thème EspaceCo (`Etat du point`, `identifiant`, `expl_gps`, etc.). Normaliser vers les 5 clés ci-dessus.

D’autres clés peuvent apparaître si le thème communauté 96 en définit (`nom`, `no`, `type`, `commune`, champs `autofilled_attributes`). Les ignorer n’empêche pas l’ingestion ; les conserver en JSONB est plus sûr.

### 6.3 Valeurs `etat`

Libellés **exactement** (après coercition) :

| Valeur stockée | Code WFS `etatcode` | Origine wizard |
|----------------|---------------------|----------------|
| `BON ETAT` | `E` | conforme |
| `MAUVAIS ETAT` | `M` | motif « Mauvais état » |
| `DETRUIT` | `D` | motif « Détruit » |
| `NON RETROUVE` | `N` | motif « Non retrouvé » |
| `PRESUME DEPLACE` | `P` | motif « Mal positionné » (nivellement seulement) |
| `IMPRENABLE` | `I` | WFS uniquement (pas le wizard 4.0.1) |
| `DETRUIT APRES OBSERVATION` | `Y` | WFS uniquement |

Priorité wizard si **non conforme** (exclusif) : `nonRetrouve` → `detruit` → `mauvaisEtat`, puis `malPositionne` → `PRESUME DEPLACE`.  
Si conforme : toujours `BON ETAT` (écrase l’état WFS).

Si aucun motif d’état n’est choisi (ex. seulement « photo non conforme »), `etat` peut rester celui du WFS, ou être absent.

### 6.4 Valeurs `gps`

| Valeur stockée | Code WFS `expl_gpscode` |
|----------------|-------------------------|
| `NON RENSEIGNE` | `N` |
| `EXPLOITABLE DIRECTEMENT PAR GPS` | `E` |
| `INEXPLOITABLE PAR GPS` | `I` |
| `EXPLOITABLE PAR GPS DEPUIS UNE STATION EXCENTREE` | `R` |
| `AUCUNE INFORMATION` | (repli liste) |

Le wizard **ne saisit pas** `gps` : valeur WFS, coercée vers cette liste.

### 6.5 `domaine` WFS

| Code | Famille | Signalable | Position éditable |
|------|---------|------------|-------------------|
| `rsgf` | géodésie | oui | non |
| `rsgo` | géodésie | oui | non |
| `rsge` | géodésie canevas | **non** | — |
| `nivf` | nivellement | oui | oui |
| `nivo` | nivellement | oui | oui |
| `nive` | nivellement canevas | **non** | — |

### 6.6 `move`

- `"false"` par défaut
- `"true"` si l’utilisateur a déplacé le point (nivellement, écart > ~1e-6°)
- Toujours des **chaînes**, jamais des booléens JSON

---

## 7. Commentaire (`comment`)

Texte unique, UTF-8, structure **concaténée** (pas de champs séparés côté API) :

```
[{commentaire libre utilisateur}]

[{libellés de motifs « commentaire only »}]

GDP Mobile {version} | {plateforme}
```

Blocs présents seulement s’ils sont non vides, séparés par `\n\n`.

**Motif uniquement dans le commentaire** (pas dans `etat`) :

| Code wizard | Texte injecté |
|-------------|---------------|
| `photoNonConforme` | `Photo non conforme ou absente` |

**Pied technique** (toujours, même sans commentaire utilisateur). Pour l’appli **4.0.1** :

```
GDP Mobile 4.0.1 | {platformLabel}
```

La version est celle du build (`package.json` / `__APP_VERSION__`), pas un champ API dédié.

Exemples `platformLabel` :

- `Web (Chrome 131.0.0.0)`
- `Web (Firefox 128.0)`
- `Web (Edge 131.0)`
- `Web (Safari 18.0)`
- `Android 14`
- `iOS 18.1`

Pour une base propre : parser la dernière ligne si elle matche `^GDP Mobile (.+) \| (.+)$`.  
Le groupe 1 est la version d’appli (`4.0.1` pour ce contrat).

---

## 8. Appel 2 — photos

```
POST {BASE}/reports/{id}/attachments
Content-Type: multipart/form-data
Authorization: Bearer …
```

| Rôle UI | Clé FormData | Obligatoire UI 4.0.1 | Contenu |
|---------|--------------|----------------------|---------|
| `photo1` « Photo du repère » | **`photo0`** | oui dans le wizard | JPEG |
| `photo2` « Photo complémentaire » | **`photo1`** | non ; **l’UI 4.0.1 n’envoie que photo1** | JPEG |

Contraintes côté app avant envoi :

- orientation **paysage** (largeur ≥ hauteur, EXIF pris en compte)
- recompression JPEG qualité **0,8**, plus grand côté ≤ **1920 px**
- `File` / `Blob`, type `image/jpeg`
- max **4** documents par requête (limite API)

Le client FormData peut renommer le fichier en `document1.jpg` : **seule la clé `photo0` / `photo1` fait foi**, pas le nom de fichier.

À la lecture `GET /reports/{id}` :

```json
"attachments": [
  { "uri": "https://espacecollaboratif.ign.fr/document/…", "download_uri": "https://…" }
]
```

URLs **absolues, publiques** (pas d’auth) d’après le code 4.0.1. Ordre ≈ ordre d’upload (`photo0` puis `photo1`).

---

## 9. Réponse de création et lecture

### Création (`POST /reports`) — champs utilisés

```json
{
  "id": 123456,
  "community": 96,
  "geometry": "POINT(2.3488 48.8534)",
  "comment": "…\n\nGDP Mobile 4.0.1 | Android 14",
  "status": "submit",
  "opening_date": "2026-09-18T12:34:56+00:00"
}
```

`id` = **identifiant EspaceCo** (PK à utiliser pour l’ingestion).

### Lecture (`GET /reports/{id}` ou liste)

| Champ API | Usage |
|-----------|--------|
| `id` | PK EspaceCo |
| `community` | 96 |
| `geometry` | WKT |
| `comment` | texte + pied `GDP Mobile 4.0.1 \| …` |
| `status` | cycle de vie (voir [§10](#10-statuts-espaceco-status)) |
| `opening_date` | création |
| `updating_date` | dernière MAJ |
| `author.id` / `author.username` | auteur |
| `attributes` | thème + champs métier |
| `attachments[]` | photos |

Liste filtrée GDP :

```
GET /reports?communities=96&author={userId}&page=&limit=&sort=id:DESC
          &attributes=[{"community":96,"theme":"gdp-tools"}]
```

`attributes` query = JSON stringifié d’un tableau `{ community, theme }`. Thèmes d’affichage possibles en plus : `mobile-geodesy`, etc. (`VITE_GDP_REPORT_DISPLAY_THEMES`).

---

## 10. Statuts EspaceCo (`status`)

À la création GDP 4.0.1 envoie **`submit`**. Ensuite le back-office fait évoluer :

| Valeur API | Signification |
|------------|----------------|
| `draft` | brouillon serveur |
| `cluster` | regroupé |
| `submit` | soumis (état initial GDP) |
| `pending` | en attente |
| `pending0` | en qualification |
| `pending1` | en saisie |
| `pending2` | en validation |
| `valid` | validé |
| `valid0` | validé (déjà traité) |
| `reject` | rejeté |
| `reject0` | rejeté (non pertinent) |

---

## 11. Ce que le wizard saisit vs ce qui part

Le wizard **n’envoie pas** `isConform` ni `nonConformReasons` comme champs API.

| Saisie UI | Destination |
|-----------|-------------|
| Conforme / non conforme | `attributes.etat` |
| Mauvais état / Détruit / Non retrouvé | `etat` (exclusif) |
| Mal positionné | `etat = PRESUME DEPLACE` (nivellement) |
| Photo non conforme | **commentaire** uniquement |
| Commentaire libre | `comment` |
| Photo | `photo0` |
| Déplacement carte | `geometry` + `move` |
| Identifiant / domaine / GPS | préremplis WFS, renvoyés dans `attributes` |

Brouillon **local** (IndexedDB / Storage) : `isConform`, `nonConformReasons`, photos en data-URL. **Inutile pour l’ingestion serveur** : seuls les POSTs EspaceCo comptent.

---

## 12. Exemple complet — non conforme, nivellement déplacé (appli 4.0.1)

**POST `/reports`**

```json
{
  "geometry": "POINT(5.0415 47.3220)",
  "community": 96,
  "status": "submit",
  "comment": "Repère trouvé 8 m plus à l'est, tige tordue.\n\nGDP Mobile 4.0.1 | Android 14",
  "attributes": "{\"community\":96,\"theme\":\"gdp-tools\",\"attributes\":{\"id\":\"21TOTO1\",\"domaine\":\"nivf\",\"etat\":\"PRESUME DEPLACE\",\"gps\":\"INEXPLOITABLE PAR GPS\",\"move\":\"true\"}}"
}
```

**POST `/reports/98765/attachments`**

- `photo0` = Blob JPEG (repère + environnement)

---

## 13. Schéma cible recommandé (ingestion)

```text
reports
  id_espaceco          INTEGER PK          -- response.id
  community_id         INTEGER             -- 96
  theme                TEXT                -- gdp-tools
  status               TEXT                -- submit / pending* / valid* / reject*
  geom                 geometry(Point,4326)
  longitude            DOUBLE
  latitude             DOUBLE
  comment_raw          TEXT
  comment_user         TEXT                -- optionnel, sans pied GDP
  app_version          TEXT                -- parsé du pied, ex. 4.0.1
  platform             TEXT
  author_id            INTEGER             -- GET only
  author_username      TEXT
  opened_at            TIMESTAMPTZ
  updated_at           TIMESTAMPTZ

  -- métier (depuis attributes.attributes)
  repere_id            TEXT                -- NE PAS confondre avec id_espaceco
  domaine              TEXT                -- rsgf, nivf, …
  etat                 TEXT                -- BON ETAT, DETRUIT, …
  gps                  TEXT
  position_moved       BOOLEAN             -- move == "true"
  theme_attributes     JSONB               -- copie brute (évolution thème)

report_attachments
  report_id            INTEGER FK
  slot                 TEXT                -- photo0, photo1
  uri                  TEXT
  download_uri         TEXT
```

**Règles d’idempotence** : upsert sur `id_espaceco`.  
**Ne pas** utiliser `repere_id` comme PK : plusieurs signalements pour le même point.

---

## 14. Pièges pour le générateur de programme

1. `attributes` en POST = **string JSON** ; en GET = souvent **tableau** de blocs.
2. `id` dans le thème = **repère** ; `id` de la ressource = **alerte**.
3. `move`, `community`, `status` : types **string** / number selon le champ ; `move` est `"true"`/`"false"`.
4. Photos **après** création ; alerte sans pièce = cas normal.
5. Clé photo `photo0` ≠ rôle UI `photo1`.
6. Commentaire = 3 couches fusionnées ; parser le pied `GDP Mobile {version} | {plateforme}` (version **4.0.1** pour ce contrat).
7. Thème EspaceCo peut ajouter des clés : garder un JSONB.
8. Coordonnées = lon/lat 4326, **pas** Web Mercator.
9. Auth obligatoire à l’écriture ; lecture des `attachments.uri` actuellement publique.
10. Pas de champ `isConform` en base EspaceCo : le dériver de `etat` (`BON ETAT` ≈ conforme).

---

## 15. Sources dans le code (gdp-mobile 4.0.1)

| Sujet | Fichier |
|-------|---------|
| Envoi | `src/features/report/hooks/useSubmitGeodesyPointReport.ts` |
| Corps `report.add` | `gdp-tools/src/report/mapGeodesyPointReportToApiBody.ts` |
| Attributs thème | `gdp-tools/src/report/buildGeodesyPointReportThemeAttributes.ts` |
| Clés / photos | `gdp-tools/src/report/geodesyPointReportConstants.ts` |
| Wizard → `etat` / `move` | `src/features/report/utils/gdpWizardThemeAttributes.ts` |
| Pied version / plateforme | `src/platform/device/reportDeviceMetadata.ts` |
| Communauté / thème | `src/features/report/constants/reportApi.ts` |
| Client HTTP | `collaboratif-client-api` → `POST /reports`, `POST /reports/{id}/attachments` |
