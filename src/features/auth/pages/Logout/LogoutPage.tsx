import { useNavigate } from 'react-router-dom';

import { PageHeader } from '@/shared/ui/PageHeader';
import { SlideUpPage } from '@/shared/ui/SlideUpPage';
import { Button } from '@/shared/ui/Button';

import screen from '@/shared/styles/screen.module.css';
import typography from '@/shared/styles/typography.module.css';

import styles from './LogoutPage.module.css';

export interface LogoutPageProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => Promise<{ redirectedToSso: boolean }>;
}

export function LogoutPage({ isOpen, onClose, onLogout }: LogoutPageProps) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    const result = await onLogout();
    onClose();
    if (!result.redirectedToSso) {
      navigate('/map', { replace: true });
    }
  };

  return (
    <SlideUpPage isOpen={isOpen} onClose={onClose}>
      <PageHeader title="Déconnexion" onClose={onClose} />

      <main className={`${screen.screenContainer} ${styles.content}`}>
        <h1 className={typography.title}>Se déconnecter ?</h1>
        <p className={typography.subtitle}>
          Vous devrez vous reconnecter pour accéder à vos signalements.
        </p>
        <p className={typography.paragraph}>
          Vos brouillons locaux restent enregistrés sur cet appareil.
        </p>

        <div className={styles.actions}>
          <Button type="button" className={styles.actionButton} fullWidth onClick={() => void handleLogout()}>
            Confirmer la déconnexion
          </Button>
          <Button type="button" className={styles.actionButton} fullWidth onClick={onClose}>
            Annuler
          </Button>
        </div>
      </main>
    </SlideUpPage>
  );
}
