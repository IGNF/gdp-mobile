import onboarding1 from '@/shared/assets/onboarding/onboarding_1.png';
import onboarding2 from '@/shared/assets/onboarding/onboarding_2.png';
import onboarding3 from '@/shared/assets/onboarding/onboarding_3.png';

export interface OnboardingStep {
  illustration: string;
  title: string;
  description: string;
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    illustration: onboarding1,
    title: 'La précision géodésique, partout avec vous',
    description:
      'Retrouvez instantanément des données certifiées et fiables et accédez aux réseaux de référence nationaux',
  },
  {
    illustration: onboarding2,
    title: 'Devenez acteur des réseaux',
    description:
      'Signalez l’état des points, partagez vos photos et participez à la mise à jour du patrimoine géodésique !',
  },
  {
    illustration: onboarding3,
    title: 'Simple, rapide et efficace',
    description:
      'Une interface pensée pour l’action. Gagnez un temps précieux : consultez et signalez en quelques clics',
  },
];
