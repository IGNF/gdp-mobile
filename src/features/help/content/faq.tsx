import type { ReactNode } from 'react';

import { TrackedExternalLink } from '@/infra/analytics/TrackedExternalLink';
import { EXTERNAL_LINKS } from '@/shared/constants/externalLinks';

export interface FaqItem {
  question: string;
  answer: ReactNode;
}

export const FAQ_ITEMS: readonly FaqItem[] = [
  {
      question: "Comment consulter les informations d'un point ?",
      answer:
      'Rendez-vous sur la carte, cliquez sur un point, la mini-fiche s\'ouvre au bas de votre écran. Glissez le bandeau déroulant vers haut pour avoir accès à l\'ensemble des informations.',
  },
  {
    question: 'Comment créer un signalement ?',
    answer:
    'Rendez-vous sur la Carte, puis sélectionner le point à signaler. Si vous êtes connecté, vous pouvez cliquer sur Signaler.',
  },
  {
    question: 'Où sont stockés mes signalements ?',
    answer:
    'Les signalements sont enregistrés localement sur votre appareil. Consultez-les via « Mes signalements » dans le menu. Une fois connecté, la même page affiche aussi vos signalements déjà envoyés sur le serveur.',
  },
  {
    question: 'Dois-je être connecté ?',
    answer:
    'La connexion est nécessaire pour consulter vos signalements envoyés et pour transmettre vos contributions.',
  },
  {
    question: 'Comment filtrer les données ?',
    answer:
    'Depuis la carte, sélectionner la première icône en haut à droite, puis activer ou désactiver les filtres souhaités, ou saisissez les dates de "Vu en place" ou de "Détermination" des coordonnées du point',
  },
  {
    question: 'Comment changer de couche ?',
    answer:
    'Depuis la carte, sélectionner la deuxième icône en haut à droite, puis choisir les données et les fonds de cartes disponibles.',
  },
  {
    question: 'Comment me connecter ?',
    answer: (
      <>
      Ouvrez le menu latéral, section « Mon compte », puis « Se connecter ». Vous pouvez aussi créer un
      compte sur{' '}
      <TrackedExternalLink
        href={EXTERNAL_LINKS.ESPACE_COLLABORATIF}
        tracking={{ context: 'Aide', label: 'Espace collaboratif' }}
        >
        l’Espace collaboratif IGN
      </TrackedExternalLink>.
      </>
    ),
  },
  ];