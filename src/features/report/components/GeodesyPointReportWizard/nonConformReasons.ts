import type { FunctionComponent, SVGProps } from 'react';

import IconPhotoNotFound from '@/shared/assets/icons/icon-photo-not-found.svg?react';
import IconPointDammaged from '@/shared/assets/icons/icon-point-dammaged.svg?react';
import IconPointLost from '@/shared/assets/icons/icon-point-lost.svg?react';
import IconPointNotFound from '@/shared/assets/icons/icon-point-not-found.svg?react';
import IconPointWrongPosition from '@/shared/assets/icons/icon-point-wrong-position.svg?react';

export type NonConformReason =
  | 'photoNonConforme'
  | 'mauvaisEtat'
  | 'detruit'
  | 'nonRetrouve'
  | 'malPositionne';

export interface NonConformReasonOption {
  value: NonConformReason;
  label: string;
  Icon: FunctionComponent<SVGProps<SVGSVGElement>>;
}

export interface NonConformReasonGroup {
  title: string;
  exclusive: boolean;
  options: NonConformReasonOption[];
}

export const NON_CONFORM_REASON_GROUPS: NonConformReasonGroup[] = [
  {
    title: 'Des informations sur le point sont-elles incorrectes ?',
    exclusive: false,
    options: [
      { value: 'photoNonConforme', label: 'Photo non conforme ou absente', Icon: IconPhotoNotFound },
      { value: 'malPositionne', label: 'Mal positionné', Icon: IconPointWrongPosition },
    ],
  },
  {
    title: "Quel est l'état du point ?",
    exclusive: true,
    options: [
      { value: 'mauvaisEtat', label: 'Mauvais état', Icon: IconPointDammaged },
      { value: 'detruit', label: 'Détruit', Icon: IconPointLost },
      { value: 'nonRetrouve', label: 'Non retrouvé', Icon: IconPointNotFound },
    ],
  },
];

export const NON_CONFORM_REASON_LABELS: Record<NonConformReason, string> = Object.fromEntries(
  NON_CONFORM_REASON_GROUPS.flatMap((group) => group.options).map(({ value, label }) => [value, label]),
) as Record<NonConformReason, string>;
