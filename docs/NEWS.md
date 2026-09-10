# News et alertes GDP

Au démarrage (et au retour au premier plan sur mobile), l’application lit un JSON distant pour afficher des actualités ou alertes de service.

## Configuration

URL du flux : variable d’environnement `VITE_GDP_NEWS_URL`.

```bash
VITE_GDP_NEWS_URL=https://fiches-geodesie.ign.fr/checkinfo-gdp.json
```

- Déclarée dans `gdp-mobile/.env` (dev) ou `gdp-mobile/.env.qualif` (qualification).
- Si la variable est **absente**, l’URL ci-dessus est utilisée par défaut.
- Si la variable est **vide**, le flux est désactivé (aucune requête).
- Le fetch ne bloque pas la carte : en cas d’erreur réseau, timeout (8 s) ou JSON invalide, l’app continue sans bannière.

Fichier de production actuel : [https://fiches-geodesie.ign.fr/checkinfo-gdp.json](https://fiches-geodesie.ign.fr/checkinfo-gdp.json)

Côté web, le serveur qui héberge le JSON doit autoriser CORS pour l’origine de l’app (ou passer par un reverse proxy). En APK / iOS, CORS ne s’applique pas.

## Format du JSON

```json
{
  "schemaVersion": 1,
  "items": [ { "...": "voir ci-dessous" } ]
}
```

| Champ racine | Type | Obligatoire | Description |
|---|---|---|---|
| `schemaVersion` | number | non | Version du contrat. Valeur actuelle : `1`. Les items inconnus sont ignorés. |
| `items` | array | oui | Liste des news. Les objets mal formés sont ignorés. |

### Item

| Champ | Type | Obligatoire | Description |
|---|---|---|---|
| `id` | string | oui | Identifiant stable. Sert à mémoriser les news déjà fermées (`showOnce`). Ne pas réutiliser un `id` pour un autre message. |
| `severity` | `"info"` \| `"warning"` \| `"error"` | oui | Niveau : information, avertissement, alerte bloquante (style). |
| `title` | string | oui | Titre court. |
| `body` | string | oui | Texte (pas de HTML). Les retours à la ligne sont conservés. |
| `startsAt` | string ISO 8601 | oui | Début d’affichage (inclus), fuseau explicite recommandé (`+02:00`). |
| `endsAt` | string ISO 8601 | oui | Fin d’affichage (inclus). |
| `platforms` | array | non | `"web"`, `"android"`, `"ios"`. Défaut : les trois. |
| `audience` | `"all"` \| `"authenticated"` | non | `all` : tout le monde. `authenticated` : uniquement les utilisateurs connectés. Défaut : `all`. |
| `display` | `"banner"` \| `"modal"` | non | `banner` : bandeau sur la carte. `modal` : fenêtre au-dessus. Défaut : `banner`. |
| `dismissible` | boolean | non | `true` : l’utilisateur peut fermer. `false` : le message reste tant que les dates sont valides. Défaut : `true`. |
| `showOnce` | boolean | non | `true` : après fermeture, ne plus jamais réafficher (stockage local). `false` : réaffichage à la prochaine session. Défaut : `false`. |
| `cta` | object | non | Bouton / lien optionnel. |

### CTA

| Champ | Type | Obligatoire | Description |
|---|---|---|---|
| `label` | string | oui | Libellé du lien (ex. « En savoir plus »). |
| `url` | string | oui | URL HTTPS ouverte dans un nouvel onglet. |

## Exemple

```json
{
  "schemaVersion": 1,
  "items": [
    {
      "id": "espaceco-maintenance-2026-09-21",
      "severity": "warning",
      "title": "Espace collaboratif indisponible",
      "body": "Les signalements ne pourront pas être envoyés le 21 septembre.",
      "startsAt": "2026-09-21T00:00:00+02:00",
      "endsAt": "2026-09-22T00:00:00+02:00",
      "platforms": ["web", "android", "ios"],
      "audience": "authenticated",
      "display": "banner",
      "dismissible": true,
      "showOnce": false,
      "cta": {
        "label": "En savoir plus",
        "url": "https://espacecollaboratif.ign.fr/"
      }
    }
  ]
}
```

## Règles d’affichage

1. La date du moment est comprise entre `startsAt` et `endsAt`.
2. La plateforme courante est dans `platforms`.
3. `audience` : `authenticated` n’est montré que si l’utilisateur est connecté.
4. Si `showOnce` et que l’`id` a déjà été fermé sur cet appareil, l’item est masqué.
5. Si l’utilisateur ferme un item `dismissible` pendant la session, il disparaît jusqu’au prochain lancement (sauf `showOnce`, alors définitif).
6. Plusieurs bandeaux peuvent s’empiler. Ordre : `error`, puis `warning`, puis `info`.
7. Une seule modale à la fois (la plus sévère parmi les items `display: "modal"` visibles).
8. Le menu **Aide** affiche un badge `News` s’il existe au moins une actualité encore valide. La liste se consulte depuis un lien **Actualités** dans la page d’aide (y compris les items déjà fermés sur la carte).

## Conseils de rédaction

- Un `id` par campagne (`service-sujet-date`), jamais recyclé.
- Retirer ou dater les messages périmés pour garder le fichier lisible.
- `dismissible: false` seulement pour une panne en cours qu’il ne faut pas pouvoir ranger.
- `audience: "authenticated"` pour tout ce qui concerne signalements / compte ; `all` pour la carte et les fonds.
