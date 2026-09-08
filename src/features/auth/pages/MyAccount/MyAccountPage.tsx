import { useNavigate } from 'react-router-dom';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { useUserStats } from '@/features/auth/hooks/useUserStats';
import { Button } from '@/shared/ui/Button';
import { ExternalLink } from '@/shared/ui/ExternalLink';
import { PageHeader } from '@/shared/ui/PageHeader';
import { SlideUpPage } from '@/shared/ui/SlideUpPage';
import { EXTERNAL_LINKS } from '@/shared/constants/externalLinks';
import { joinTruthy } from '@/shared/utils/join';

import IconCamera from '@/shared/assets/icons/icon-camera.svg?react';
import IconLocation from '@/shared/assets/icons/icon-location.svg?react';
import IconBook from '@/shared/assets/icons/icon-book.svg?react';


import screen from '@/shared/styles/screen.module.css';
import styles from './MyAccountPage.module.css';

export interface MyAccountPageProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MyAccountPage({ isOpen, onClose }: MyAccountPageProps) {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { stats, isLoading: isLoadingStats } = useUserStats();

  const fullName = joinTruthy([user?.firstName, user?.lastName], ' ') || null;
  const displayName = fullName || user?.username || '—';

  return (
    <SlideUpPage isOpen={isOpen} onClose={onClose}>
      <PageHeader title="Mon compte" onClose={onClose} showCloseButton={false} showBackButton={true} onBack={onClose}/>

      <main className={`${screen.screenContainer} ${styles.content}`}>
        {!isAuthenticated ? (
          <div className={styles.notConnected}>
            <p className="body">
              Vous n'êtes pas connecté. Connectez-vous pour consulter vos signalements envoyés
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
            {/* Avatar et nom */}
            <div className={styles.profileHeader}>
              <div className={styles.avatarContainer}>
                <div className={styles.avatar}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className={styles.avatarIcon}>
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="currentColor"/>
                  </svg>
                </div>
                <button className={styles.cameraButton} type="button" aria-label="Modifier la photo"  aria-hidden>
                  <IconCamera className={styles.photoIcon} aria-hidden />
                </button>
              </div>
              <h2 className={styles.profileName}>{displayName}</h2>
            </div>

            {/* Informations */}
            <div className={styles.infoCard}>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Identifiant</span>
                <span className={styles.infoValue}>@{user?.username ?? '—'}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Email</span>
                <span className={styles.infoValue}>{user?.email ?? '—'}</span>
              </div>
            </div>

            {/* Mes contributions */}
            <section className={styles.contributionsSection}>
              <h3 className={styles.sectionTitle}>Mes contributions</h3>
              <div className={styles.contributionsGrid}>
                <div className={styles.contributionCard}>
                  <span className={styles.iconWrap} aria-hidden>
                    <IconLocation className={styles.locationIcon} aria-hidden />
                  </span>
                  <span className={styles.contributionValue}>
                    {isLoadingStats ? '—' : stats.reportsCount}
                  </span>
                  <span className={styles.contributionLabel}>Signalements</span>
                </div>
                <div className={styles.contributionCard}>
                  <span className={styles.iconWrap} aria-hidden>
                    <IconBook className={styles.bookIcon} aria-hidden />
                  </span>
                  <span className={styles.contributionValue}>
                    {isLoadingStats ? '—' : stats.viewedSheetsCount}
                  </span>
                  <span className={styles.contributionLabel}>Fiches consultées</span>
                </div>
              </div>
            </section>

            {/* Note en bas */}
            <p className={styles.footerNote}>
              Pour modifier votre profil, rendez-vous sur{' '}
              <ExternalLink href={EXTERNAL_LINKS.ESPACE_COLLABORATIF}>
                l'espace collaboratif
              </ExternalLink>
              .
            </p>
          </>
        )}
      </main>
    </SlideUpPage>
  );
}
