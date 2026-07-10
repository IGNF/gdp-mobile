---
name: "tâche technique \U0001F527"
about: pour spécifier un travail technique (infrastructure, API, outillage, mise à
  niveau)
title: ''
labels: ''
assignees: ''
type: Task

---

<!--
Comment utiliser ce gabarit :
- les consignes entre <!- - et - -> disparaissent à la publication, inutile de les effacer
- ce gabarit est pour ce qui n'a pas d'écran ni d'utilisateur final : préprod, point d'accès API, migration, mise à jour de dépendances, outillage
- si le travail a un visage utilisateur (un écran, un geste), utilisez plutôt le gabarit « Fonctionnalité »
- visez une page maximum ; un ticket reste un support de discussion, pas une spécification complète
-->

## Objectif
<!--
Ce qu'on veut obtenir et pourquoi c'est utile maintenant. Le « pourquoi » est important : il aide à trancher les arbitrages en cours de route.
Exemple : « mettre en place une préprod pour tester les signalements sur des données réalistes avant de brancher la vraie base de l'IGN. »
-->


## Ce qui doit fonctionner
<!--
L'équivalent des règles métier, en termes techniques observables : ce qui doit être vrai une fois le travail terminé.
Décrivez le résultat attendu, pas la façon de l'implémenter (elle reste au choix des développeurs).
Exemple : « la préprod est accessible à une adresse dédiée, isolée de la production, réinitialisable à volonté. »
-->
-
-

## Hors périmètre
<!--
Ce qu'on ne fait volontairement pas dans ce ticket, pour éviter qu'il gonfle.
Exemple : « le branchement à la vraie base IGN : ticket séparé, une fois la préprod validée. »
-->
-

## Comment on vérifie que c'est bon
<!--
L'équivalent des critères d'acceptation, version technique : ce qu'on fait concrètement pour confirmer que c'est terminé.
Souvent une commande qui répond, une adresse qui s'ouvre, un test qui passe, un jeu de données qui se charge.
Exemple : « l'adresse de préprod répond ; un signalement de test y est créé puis retrouvé ; la réinitialisation vide bien les données. »
-->
- [ ]
- [ ]

## Dépendances et risques
<!--
Ce qui doit exister avant de commencer, et ce qui pourrait coincer (accès à obtenir, décision d'un partenaire, brique instable).
Signaler un risque tôt, c'est permettre d'en parler avant qu'il bloque.
-->
-

## Questions ouvertes
<!--
Les points techniques à trancher en équipe avant ou pendant le travail.
Formulez de vraies questions, si possible avec les options envisagées.
-->
-

## Découpage technique (rempli par les développeurs)
<!--
Se remplit après la discussion du ticket. Pour un petit travail, peut rester vide.
-->
- [ ]
