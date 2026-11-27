# Politique de confidentialité – Géodésie de poche

Ce fichier est la **source de rédaction** de la politique affichée aux utilisateurs et déclarée dans la Google Play Console (et, le cas échéant, App Store).

## Publication web (IGN)

1. Publier le corps de texte ci-dessous sur une **page dédiée**, sur le modèle de la politique [Cartes IGN](https://www.ign.fr/institut/politique-de-confidentialite-donnees-caractere-personnel-collectees-par-lapplication-cartes-ign).
2. L’URL doit ouvrir **directement** le texte complet (exigence Google Play : pas de page intermédiaire).
3. URL cible (à créer côté CMS IGN, slug à confirmer avec la com) :

   `https://www.ign.fr/institut/politique-de-confidentialite-donnees-caractere-personnel-collectees-par-lapplication-geodesie-de-poche`

4. Relecture **DPO** (`dpo@ign.fr`) avant mise en ligne.
5. Aligner le formulaire **Sécurité des données** Play Console sur ce document.
6. Une fois la page en ligne : vérifier que `EXTERNAL_LINKS.DONNEES_PERSONNELLES` dans `src/shared/constants/externalLinks.ts` pointe bien vers cette URL (déjà préparé dans le dépôt).

---

## Texte à publier

### Politique de confidentialité – Application Géodésie de poche

**Version du 27 novembre 2026**

**Application :** Géodésie de poche (identifiant Android `fr.ign.canex`, versions web et iOS le cas échéant)  
**Éditeur :** Institut national de l’information géographique et forestière (IGN) — 73 avenue de Paris, 94165 Saint-Mandé Cedex — Tél. : 01 43 98 80 00

#### 1. Objet

La présente politique de confidentialité décrit comment l’IGN traite les données à caractère personnel lorsque vous utilisez l’application **Géodésie de poche**, qui permet de consulter des données géodésiques et cartographiques, de vous localiser sur la carte et, le cas échéant, de créer et transmettre des signalements sur l’état de repères géodésiques.

L’utilisation de l’application implique la consultation de la présente politique. Certains traitements reposent sur votre consentement (géolocalisation, appareil photo, création de compte). Vous pouvez retirer votre consentement via les réglages de votre appareil ou en vous déconnectant.

Les services sont réservés aux personnes âgées d’**au moins 15 ans**.

#### 2. Responsable de traitement

**Institut national de l’information géographique et forestière (IGN)**  
73 avenue de Paris, 94165 Saint-Mandé Cedex

**Délégué à la protection des données (DPO) :**  
Courriel : dpo@ign.fr  
Adresse postale : IGN – DPO – 73 avenue de Paris, 94165 Saint-Mandé Cedex

#### 3. Données traitées et finalités

##### 3.1 Consultation de la carte (sans compte)

Sans connexion, l’IGN et ses prestataires peuvent traiter des **données techniques** (adresse IP, horodatage, type d’appareil, version de l’application, journaux de sécurité) et les paramètres nécessaires à l’**affichage des cartes** (requêtes vers les services cartographiques de l’IGN).

- **Finalités :** fourniture du service, sécurité, maintenance.
- **Base légale :** intérêt légitime de l’IGN (exploitation et sécurisation du service).

##### 3.2 Géolocalisation

Si vous activez la géolocalisation, l’application accède à la **position de votre appareil** pour afficher votre position sur la carte.

- La position n’est pas utilisée à des fins publicitaires.
- **Finalité :** affichage cartographique et fonctionnalités associées.
- **Base légale :** **consentement** (autorisation système). Vous pouvez la retirer dans les réglages du téléphone.

##### 3.3 Compte utilisateur et authentification

La connexion est facultative pour la consultation ; elle est requise pour **transmettre des signalements** vers les services IGN.

L’authentification passe par le **service d’identité Géoplateforme** (SSO IGN). Peuvent être traités : identifiant de compte, adresse électronique, nom et prénom le cas échéant, jetons de session stockés sur l’appareil.

- **Finalités :** gestion du compte, accès aux signalements et à l’espace collaboratif, adhésion à la communauté géodésie lorsque applicable.
- **Base légale :** exécution du contrat et intérêt légitime (sécurité).

Informations complémentaires sur le compte : [Géoplateforme / SSO IGN](https://sso.geopf.fr/).

##### 3.4 Signalements

Vous pouvez créer des signalements comprenant texte, choix proposés dans l’application, **photographies** et **localisation du repère** concerné. Si vous êtes connecté, le signalement est rattaché à votre compte.

Les brouillons sont stockés **sur votre appareil** puis, après envoi, transmis aux systèmes de l’IGN (espace collaboratif) pour traitement.

- **Finalités :** connaissance collaborative de l’état du réseau géodésique.
- **Base légale :** exécution du contrat ; consentement pour les éléments facultatifs (photos).

##### 3.5 Données sur l’appareil

L’application stocke localement : préférences cartographiques, filtres, brouillons de signalements, jetons d’authentification, historique récent de recherches d’adresse.

- **Finalités :** confort d’usage, reprise de session, usage limité hors connexion.
- **Base légale :** intérêt légitime et exécution du contrat.

##### 3.6 Mesure d’audience

L’IGN utilise **Matomo** (https://matomo.ign.fr/) pour des statistiques d’usage : écrans consultés, actions sur la carte, version de l’application, plateforme (web, Android, iOS).

La configuration de Géodésie de poche **n’envoie pas à Matomo** votre adresse électronique, le contenu de vos signalements ni les coordonnées de votre position.

- **Finalités :** statistiques et amélioration du service.
- **Base légale :** intérêt légitime (service public d’information géographique), sous réserve des règles applicables aux traceurs sur chaque plateforme.

##### 3.7 Contact

Les données transmises via les canaux d’aide (forum, formulaires externes liés depuis l’application) sont traitées pour **répondre à votre demande**.

- **Base légale :** intérêt légitime ou consentement selon le canal.

#### 4. Destinataires

Peuvent accéder aux données, dans la limite de leurs missions : personnel habilité de l’IGN, prestataires (hébergement, sécurité), services de l’**espace collaboratif IGN** pour les signalements, autorités sur réquisition légale.

#### 5. Durées de conservation

Les données sont conservées pour une durée **proportionnée** aux finalités : durée du compte utilisateur sur la Géoplateforme, durée de gestion des signalements, brouillons locaux jusqu’à suppression ou désinstallation, journaux techniques pour une durée limitée, statistiques Matomo selon la politique IGN (typiquement jusqu’à 13 mois pour les cookies de mesure d’audience sur les interfaces web).

#### 6. Sécurité

L’IGN met en œuvre des mesures techniques et organisationnelles adaptées (communications chiffrées, contrôles d’accès). Les utilisateurs sont invités à maintenir leur appareil à jour et à protéger leurs identifiants.

#### 7. Vos droits

Vous disposez des droits d’**accès**, de **rectification**, d’**effacement**, de **limitation**, d’**opposition**, de **portabilité** lorsque applicable, du **retrait du consentement**, et de **directives post-mortem** selon la loi française.

**Exercice :** dpo@ign.fr ou adresse du DPO (section 2). Réclamation possible auprès de la **CNIL** (www.cnil.fr).

Pour les données liées au compte Géoplateforme, certaines demandes peuvent aussi être adressées via la gestion de compte SSO.

#### 8. Transferts hors Union européenne

Les traitements sont réalisés, en principe, au sein de l’**Union européenne**. Tout transfert hors UE ferait l’objet des garanties prévues par la réglementation.

#### 9. Liens externes

L’application peut ouvrir des sites tiers (IGN, espace collaboratif, applications de navigation, licences géoservices). Ces sites appliquent leurs propres politiques.

#### 10. Modifications

L’IGN peut modifier la présente politique. La date de version est indiquée en tête de document.

#### 11. Contact

- **Aide :** [Géodésie de poche sur geodesie.ign.fr](https://geodesie.ign.fr/geodesie-de-poche) et [forum GeoCommuns](https://forum.geocommuns.fr/t/a-propos-de-la-categorie-geodesie-de-poche/3287)
- **DPO :** dpo@ign.fr