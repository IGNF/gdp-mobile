# Mode d'emploi — Géodésie de poche

Guide utilisateur de l’application (web et APK). Pour l’installation et le déploiement, voir le [README](../README.md).

## Navigation

Barre du bas :

| Onglet | Rôle |
|--------|------|
| **Carte** | Consultation des repères |
| **Signalements** | Brouillons locaux et contributions envoyées |
| **Recherche** | Recherche d’adresse (Géoportail) sur la carte |

Le **menu latéral** (icône en haut à gauche de la carte) ouvre le compte, les paramètres, l’aide et à propos. Favoris et communauté sont des écrans encore vides.

## Carte

- Fond IGN (plans, photos, SCAN) via le panneau **couches**.
- Couches géodésie et filtres expert (type de point, origine, dates…) via le panneau **filtres**.
- Recentrage GPS : bouton de localisation.
- **Légende** : écran non développé (bandeau TODO).

## Consulter un repère

1. Toucher un picto (ou un cluster, puis le point) sur la carte.
2. La fiche s’ouvre en bas : titre, état, photos, attributs.
3. Tirer la poignée pour agrandir (quatre hauteurs, jusqu’au plein écran).
4. **S’y rendre** recentre la carte ; **Signaler** ouvre le formulaire.

Détail technique : [Fiche point](./FICHE_POINT.md).

## Signaler un repère

La connexion Espace collaboratif est nécessaire pour **envoyer**. Un brouillon peut être enregistré sur l’appareil.

1. Ouvrir la fiche d’un repère → **Signaler**.
2. Indiquer si le point est conforme.
3. Si non conforme : motif(s), puis photos (paysage).
4. Relire le résumé, envoyer maintenant ou plus tard.

Les brouillons et envois se retrouvent dans **Signalements**.

## Compte et paramètres

- **Se connecter** : menu → Mon compte, ou écran `/login` (SSO Géoplateforme).
- **Paramètres** : cache carte, compteur de fiches consultées, réafficher l’onboarding.
- **Aide** : FAQ et actualités (si un flux news est configuré).

## Limites actuelles

- Légende carte : pas encore renseignée.
- Favoris et communauté : placeholders.
