---
name: nouvelle fonctionnalité
about: Décrire une fonctionnalité du point de vue de l'utilisateur (écrans, règles
  métier, critères d'acceptation)
title: ''
labels: ''
assignees: ''
type: Feature

---

<!-- 
Comment utiliser ce gabarit : - les consignes entre <!- - et - -> sont là pour vous guider ; elles disparaissent à la publication du ticket, inutile de les effacer
- un ticket = une seule intention utilisateur ; si vous décrivez deux besoins, faites deux tickets
- visez une page maximum et 20 à 30 minutes de rédaction ; un ticket n'est pas une spécification complète, c'est un support de discussion
- pas de solution technique ici : on décrit ce que l'utilisateur doit pouvoir faire, pas comment le coder
-->

## Besoin utilisateur
<!--
Une seule phrase, du point de vue de l'utilisateur final (jamais « en tant qu'équipe » ou « en tant que produit »).
Elle répond à trois questions : dans quelle situation ? que veut-il faire ? qu'est-ce que ça lui apporte ?
Exemple : « Quand je touche un point sur la carte, je veux voir l'essentiel du repère afin de décider s'il mérite mon attention. »
-->
Quand [situation], je veux [action] afin de [bénéfice].
Signe de réussite : [ce qu'on observera si la fonctionnalité remplit son rôle].

## Écrans concernés
<!--
Le lien Figma doit pointer vers l'écran précis (clic droit sur le cadre > « Copier le lien »), pas vers le fichier entier.
Nommez chaque écran comme dans la maquette pour que tout le monde parle de la même chose.
S'il n'y a pas de maquette pour ce ticket, dites-le explicitement : c'est une information utile, pas un oubli.
-->
Lien vers la maquette + nom des écrans.

## Règles métier
<!--
Ce qui doit toujours être vrai, quelle que soit la façon de le coder : contenus affichés, comportements, cas particuliers connus.
2 à 5 règles maximum ; au-delà, le ticket est probablement trop gros, découpez-le.
Une règle décrit le « quoi », jamais le « comment » technique.
Bon exemple : « si le repère n'a pas de photo, un croquis type est affiché à la place »
Mauvais exemple : « le composant carrousel utilise la bibliothèque X » (décision technique, elle appartient aux développeurs)
-->
-
-

## Hors périmètre
<!--
Ce qu'on ne fait volontairement PAS dans ce ticket, pour éviter les malentendus et garder le ticket petit.
Indiquez où ce sera traité si vous le savez (autre ticket, plus tard, jamais).
Exemple : « le fonctionnement hors connexion : traité dans un ticket dédié »
Si un élément visible sur la maquette n'est pas couvert par ce ticket, c'est ici qu'on le dit.
-->
-

## Critères d'acceptation
<!--
La liste que les développeurs cochent pour dire « c'est terminé » et que l'équipe rejoue pour valider la livraison.
Un critère = un scénario vérifiable, au format : étant donné [contexte de départ], quand [action de l'utilisateur], alors [résultat observable].
Chaque règle métier ci-dessus doit se retrouver dans au moins un critère ; pensez aussi aux cas limites (donnée absente, liste vide, erreur).
Exemple : « étant donné un repère sans photo, quand j'ouvre sa fiche, alors un croquis type remplace le carrousel »
Si vous dépassez 8 critères, le ticket est trop gros : découpez-le.
-->
- [ ] étant donné [contexte], quand [action], alors [résultat attendu]
- [ ]

## Questions ouvertes
<!--
Les points encore flous, à trancher avec l'équipe avant ou pendant le développement.
Avoir des questions ouvertes est normal et même souhaitable : un ticket n'a pas besoin d'être parfait pour être publié, la discussion fait partie du travail.
Formulez de vraies questions, si possible avec les options envisagées.
Exemple : « que fait-on des champs non renseignés : masqués ou mention "non renseigné" ? »
Quand une question est tranchée, reportez la décision dans les règles métier et cochez-la ici.
-->
- [ ]

## Découpage technique (rempli par les développeurs)
<!--
Cette section appartient aux développeurs : la personne qui rédige le ticket la laisse vide.
Elle se remplit APRÈS la discussion du ticket en équipe, jamais avant : les règles métier et les questions ouvertes doivent avoir été échangées d'abord.
Listez les tâches sous forme de cases à cocher ; GitHub affichera automatiquement la progression du ticket.
Pour un petit ticket (moins d'une journée), cette section peut rester vide : inutile de découper pour découper.
Exemple :
- [ ] point d'accès API pour récupérer les données du repère
- [ ] composant volet déroulant avec bandeau fixe
-->
- [ ]
