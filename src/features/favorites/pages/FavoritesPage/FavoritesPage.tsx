import { PageHeader } from '@/shared/ui/PageHeader';
import { SlideUpPage } from '@/shared/ui/SlideUpPage';

import screen from '@/shared/styles/screen.module.css';
import typography from '@/shared/styles/typography.module.css';

export interface FavoritesPageProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FavoritesPage({ isOpen, onClose }: FavoritesPageProps) {
  return (
    <SlideUpPage isOpen={isOpen} onClose={onClose}>
      <PageHeader title="Mes favoris" onClose={onClose} />

      <main className={screen.screenContainer}>
        <h1 className={typography.title}>Mes favoris</h1>
      </main>
    </SlideUpPage>
  );
}
