# Configuration des thèmes de signalement

## Variables d'environnement

### `VITE_GDP_REPORT_DISPLAY_THEMES`

Liste des thèmes à afficher sur la carte (séparés par des virgules).

**Exemple :**
```bash
VITE_GDP_REPORT_DISPLAY_THEMES="gdp-tools,theme-nivellement,theme-gravimetrie"
```

**Par défaut :** `gdp-tools`

**Utilisation :**
- Ces thèmes sont utilisés pour filtrer les signalements affichés sur la carte
- Tous les signalements correspondant à l'un de ces thèmes seront visibles
- Le filtre API sera : `[{community: 96, theme: "gdp-tools"}, {community: 96, theme: "theme-nivellement"}, ...]`

### `VITE_GDP_REPORT_SUBMISSION_THEME`

Thème utilisé lors de la création d'un nouveau signalement.

**Exemple :**
```bash
VITE_GDP_REPORT_SUBMISSION_THEME="gdp-tools"
```

**Par défaut :** `gdp-tools`

**Utilisation :**
- Ce thème sera associé automatiquement à tous les signalements créés
- Doit correspondre à un thème configuré dans la communauté EspaceCo (ID 96)

## Exemples de configuration

### Cas 1 : Afficher et créer sur un seul thème

```bash
VITE_GDP_REPORT_DISPLAY_THEMES="gdp-tools"
VITE_GDP_REPORT_SUBMISSION_THEME="gdp-tools"
```

### Cas 2 : Afficher plusieurs thèmes, créer sur un seul

```bash
# Afficher tous les thèmes historiques
VITE_GDP_REPORT_DISPLAY_THEMES="gdp-tools,mobile-geodesy,legacy-theme"

# Mais créer uniquement sur le nouveau
VITE_GDP_REPORT_SUBMISSION_THEME="gdp-tools"
```

### Cas 3 : Thèmes par type de repère

```bash
# Afficher tous les types
VITE_GDP_REPORT_DISPLAY_THEMES="theme-planimetre,theme-altimetre,theme-gravimetre"

# Créer par défaut sur planimétrique
VITE_GDP_REPORT_SUBMISSION_THEME="theme-planimetre"
```

## Migration depuis l'ancienne configuration

**Avant :**
```bash
VITE_GDP_REPORT_THEME="gdp-tools"
```

**Après :**
```bash
VITE_GDP_REPORT_DISPLAY_THEMES="gdp-tool,Géodésies"
VITE_GDP_REPORT_SUBMISSION_THEME="gdp-tools"
```

## Notes techniques

- Les thèmes doivent exister dans la communauté configurée (ID communauté dans `VITE_GDP_REPORT_COMMUNITY_ID`)
- Les espaces autour des virgules sont automatiquement supprimés
- Si `VITE_GDP_REPORT_DISPLAY_THEMES` est vide ou invalide, le système utilise `['gdp-tools']` par défaut
- Le système cherche d'abord le thème exact, puis essaie les alias connus (`mobile-geodesy`, `mobile_geodesy`, etc.)
