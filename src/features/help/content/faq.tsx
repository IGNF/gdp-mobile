import type { ReactNode } from 'react';

import { EXTERNAL_LINKS } from '@/shared/constants/externalLinks';
import { ExternalLink } from '@/shared/ui/ExternalLink';

export interface FaqItem {
  question: string;
  answer: ReactNode;
}

export const FAQ_ITEMS: readonly FaqItem[] = [
  {
    question: 'Comment créer un signalement ?',
    answer:
      'Rendez-vous dans le menu Carte, puis appuyez sur le bouton de téléchargement. Sélectionnez la zone souhaitée et confirmez.',
  },
  {
    question: 'Où sont stockés mes brouillons ?',
    answer:
      'Les brouillons sont enregistrés localement sur votre appareil. Consultez-les via « Mes signalements » dans le menu. Une fois connecté, la même page affiche aussi vos signalements déjà envoyés sur le serveur.',
  },
  {
    question: 'Dois-je être connecté ?',
    answer:
      'La connexion est nécessaire pour consulter vos signalements envoyés et pour transmettre vos contributions.',
  },
  {
    question: 'Comment me connecter ?',
    answer: (
      <>
        Ouvrez le menu latéral, section « Mon compte », puis « Se connecter ». Vous pouvez aussi créer un
        compte sur{' '}
        <ExternalLink href={EXTERNAL_LINKS.ESPACE_COLLABORATIF}>l’Espace collaboratif IGN</ExternalLink>.
      </>
    ),
  },
];
