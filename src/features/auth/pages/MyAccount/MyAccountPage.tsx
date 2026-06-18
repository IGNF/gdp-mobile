import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { Button } from '@/shared/ui/Button';
import { ExternalLink } from '@/shared/ui/ExternalLink';
import { PageHeader } from '@/shared/ui/PageHeader';
import { SlideUpPage } from '@/shared/ui/SlideUpPage';
import { EXTERNAL_LINKS } from '@/shared/constants/externalLinks';
import { joinTruthy } from '@/shared/utils/join';

import screen from '@/shared/styles/screen.module.css';
import typography from '@/shared/styles/typography.module.css';

import styles from './MyAccountPage.module.css';

export interface MyAccountPageProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MyAccountPage({ isOpen, onClose }: MyAccountPageProps) {
  const navigate = useNavigate();
  const { user, isAuthenticated, refreshCurrentUser } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);

  const fullName = joinTruthy([user?.firstName, user?.lastName], ' ') || null;

  const handleRefresh = async () => {
    setRefreshError(null);
    setIsRefreshing(true);
    try {
      const updatedUser = await refreshCurrentUser();
      if (!updatedUser) {
        setRefreshError('Impossible de mettre à jour vos informations. Réessayez plus tard.');
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <SlideUpPage isOpen={isOpen} onClose={onClose}>
      <PageHeader title="Mon compte" onClose={onClose} />

      <main className={`${screen.screenContainer} ${styles.content}`}>
        <h1 className={typography.title}>Mon compte</h1>
        <p className={typography.subtitle}>Informations de votre compte IGN.</p>

        {!isAuthenticated ? (
          <div className={styles.notConnected}>
            <p className={typography.paragraph}>
              Vous n’êtes pas connecté. Connectez-vous pour consulter vos signalements envoyés
              et transmettre vos contributions.
            </p>
            <Button
              type="button"
              fullWidth
              onClick={() => {
                onClose();
                navigate('/login');
              }}
            >
              Se connecter
            </Button>
          </div>
        ) : (
          <>
            <p className={`${typography.paragraph} ${typography.italic}`}>
              Pour modifier votre profil, rendez-vous sur{' '}
              <ExternalLink href={EXTERNAL_LINKS.ESPACE_COLLABORATIF}>
                l’Espace collaboratif
              </ExternalLink>
              .
            </p>

            <div className={styles.infoTable}>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Identifiant</span>
                <span className={styles.infoValue}>{user?.username ?? '—'}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Nom</span>
                <span className={styles.infoValue}>{fullName ?? '—'}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>E-mail</span>
                <span className={styles.infoValue}>{user?.email ?? '—'}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Identifiant utilisateur</span>
                <span className={styles.infoValue}>{user?.id ?? '—'}</span>
              </div>
            </div>

            <div className={styles.actions}>
              <Button
                type="button"
                color="secondary"
                variant="outline"
                fullWidth
                loading={isRefreshing}
                onClick={() => void handleRefresh()}
              >
                Synchroniser mon profil et le formulaire de signalement
              </Button>
              {refreshError && <p className={typography.error}>{refreshError}</p>}
            </div>
          </>
        )}
      </main>
    </SlideUpPage>
  );
}
