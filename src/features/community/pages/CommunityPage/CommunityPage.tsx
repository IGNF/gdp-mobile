import { PageHeader } from '@/shared/ui/PageHeader';
import { SlideUpPage } from '@/shared/ui/SlideUpPage';

import screen from '@/shared/styles/screen.module.css';
import typography from '@/shared/styles/typography.module.css';

export interface CommunityPageProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommunityPage({ isOpen, onClose }: CommunityPageProps) {
  return (
    <SlideUpPage isOpen={isOpen} onClose={onClose}>
      <PageHeader title="Communauté" onClose={onClose} />

      <main className={screen.screenContainer}>
        <h1 className={typography.title}>Communauté</h1>
      </main>
    </SlideUpPage>
  );
}
