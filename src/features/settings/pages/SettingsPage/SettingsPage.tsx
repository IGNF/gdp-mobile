import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { useAppCacheMaintenance } from '@/features/settings/hooks/useAppCacheMaintenance';
import { WELCOME_SEEN_STORAGE_KEY } from '@/features/welcome/hooks/useFirstRun';
import { getClearableCacheSizeBytes } from '@/infra/cache/appCache';
import { getViewedSheetsCount, resetViewedSheets, subscribeViewedSheets } from '@/infra/storage/viewedSheetsStore';
import { Alert } from '@/shared/ui/Alert';
import { Button } from '@/shared/ui/Button';
import { Loading } from '@/shared/ui/Loading';
import { PageHeader } from '@/shared/ui/PageHeader';
import { SlideUpPage } from '@/shared/ui/SlideUpPage';
import { Toggle } from '@/shared/ui/Toggle';
import { formatSizeFromBytes } from '@/shared/utils/storageSize';

import screen from '@/shared/styles/screen.module.css';
import styles from './SettingsPage.module.css';

export interface SettingsPageProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsPage({ isOpen, onClose }: SettingsPageProps) {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { stats, isLoading, isClearing, loadStats, clearCaches } = useAppCacheMaintenance();
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
  const [isResetViewsConfirmOpen, setIsResetViewsConfirmOpen] = useState(false);
  const [viewedSheetsCount, setViewedSheetsCount] = useState(0);
  const [isResettingViews, setIsResettingViews] = useState(false);
  const [welcomeSeen, setWelcomeSeen] = useState(
    () => localStorage.getItem(WELCOME_SEEN_STORAGE_KEY) === 'true',
  );

  useEffect(() => {
    if (isOpen) {
      void loadStats();
      setWelcomeSeen(localStorage.getItem(WELCOME_SEEN_STORAGE_KEY) === 'true');
    }
  }, [isOpen, loadStats]);

  useEffect(() => {
    if (!isOpen || !isAuthenticated || user?.id === undefined) {
      setViewedSheetsCount(0);
      return;
    }

    const userId = user.id;
    let cancelled = false;

    void getViewedSheetsCount(userId).then((count) => {
      if (!cancelled) {
        setViewedSheetsCount(count);
      }
    });

    const unsubscribe = subscribeViewedSheets(() => {
      void getViewedSheetsCount(userId).then((count) => {
        if (!cancelled) {
          setViewedSheetsCount(count);
        }
      });
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [isOpen, isAuthenticated, user?.id]);

  const handleReactivateOnboarding = (checked: boolean) => {
    if (checked) {
      localStorage.removeItem(WELCOME_SEEN_STORAGE_KEY);
      setWelcomeSeen(false);
      onClose();
      navigate('/welcome');
      return;
    }

    localStorage.setItem(WELCOME_SEEN_STORAGE_KEY, 'true');
    setWelcomeSeen(true);
  };

  const clearableSizeBytes = stats ? getClearableCacheSizeBytes(stats) : 0;

  const handleConfirmClear = async () => {
    await clearCaches();
    setIsClearConfirmOpen(false);
  };

  const handleConfirmResetViews = async () => {
    if (user?.id === undefined) {
      return;
    }

    setIsResettingViews(true);
    try {
      await resetViewedSheets(user.id);
      setIsResetViewsConfirmOpen(false);
    } finally {
      setIsResettingViews(false);
    }
  };

  return (
    <SlideUpPage isOpen={isOpen} onClose={onClose}>
      <PageHeader title="Paramètres" onClose={onClose} showCloseButton={false} showBackButton={true} onBack={onClose}/>

      <main className={`${screen.screenContainer} ${styles.content}`}>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Carte</h2>
          <p className={styles.sectionText}>
            La position, le zoom, les calques visibles et les filtres des points sont mémorisés
            automatiquement entre les sessions.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Onboarding</h2>
          <div className={styles.settingRow}>
            <span className={styles.settingLabel}>Réactiver l&apos;onboarding</span>
            <Toggle
              checked={!welcomeSeen}
              onChange={handleReactivateOnboarding}
            />
          </div>
          <p className={styles.modeHint}>
            Permet de revoir l’onboarding même s&apos;il a déjà été consulté.
          </p>
        </section>

        {isAuthenticated ? (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Compte</h2>
            <p className={styles.sectionText}>
              {viewedSheetsCount === 0
                ? 'Aucune fiche consultée n’est enregistrée sur cet appareil.'
                : `${viewedSheetsCount} fiche${viewedSheetsCount > 1 ? 's' : ''} consultée${viewedSheetsCount > 1 ? 's' : ''} enregistrée${viewedSheetsCount > 1 ? 's' : ''} sur cet appareil.`}
            </p>
            <Button
              fullWidth
              className={styles.actionButton}
              disabled={viewedSheetsCount === 0 || isResettingViews}
              loading={isResettingViews}
              onClick={() => setIsResetViewsConfirmOpen(true)}
            >
              Remettre le compteur de fiches à 0
            </Button>
          </section>
        ) : null}

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Cache</h2>
          <p className={styles.sectionText}>
            Données temporaires mises en cache pour accélérer l’application (API, popups,
            géodésie).
          </p>

          {isLoading || !stats ? (
            <Loading size="small" label="Calcul de l’espace utilisé…" />
          ) : (
            <dl className={styles.cacheSummary}>
              <div className={styles.cacheSummaryRow}>
                <dt>Cache API</dt>
                <dd>
                  {formatSizeFromBytes(stats.apiCacheSizeBytes)}
                  {stats.apiCacheEntryCount > 0
                    ? ` (${stats.apiCacheEntryCount} entrée${stats.apiCacheEntryCount > 1 ? 's' : ''})`
                    : ''}
                </dd>
              </div>
              <div className={styles.cacheSummaryRow}>
                <dt>Géodésie</dt>
                <dd>
                  {formatSizeFromBytes(stats.geodesyFeatureInfoSizeBytes)}
                  {stats.geodesyFeatureInfoEntryCount > 0
                    ? ` (${stats.geodesyFeatureInfoEntryCount} entrée${stats.geodesyFeatureInfoEntryCount > 1 ? 's' : ''})`
                    : ''}
                </dd>
              </div>
              <div className={styles.cacheSummaryRow}>
                <dt>Photos géodésie</dt>
                <dd>
                  {formatSizeFromBytes(stats.geodesyImageSizeBytes)}
                  {stats.geodesyImageEntryCount > 0
                    ? ` (${stats.geodesyImageEntryCount} photo${stats.geodesyImageEntryCount > 1 ? 's' : ''})`
                    : ''}
                </dd>
              </div>
              <div className={styles.cacheSummaryRow}>
                <dt>Total vidage cache</dt>
                <dd>{formatSizeFromBytes(clearableSizeBytes)}</dd>
              </div>
            </dl>
          )}

          <Button
            fullWidth
            className={styles.actionButton}
            disabled={isLoading || isClearing || clearableSizeBytes === 0}
            loading={isClearing}
            onClick={() => setIsClearConfirmOpen(true)}
          >
            Vider le cache
          </Button>
        </section>
      </main>

      <Alert
        isOpen={isResetViewsConfirmOpen}
        onClose={() => setIsResetViewsConfirmOpen(false)}
        title="Remettre le compteur à 0 ?"
        subtitle="Les fiches déjà consultées ne seront plus comptées. Les prochaines ouvertures relanceront le compteur."
        buttons={[
          {
            label: 'Annuler',
            variant: 'outline',
            onClick: () => setIsResetViewsConfirmOpen(false),
          },
          {
            label: 'Réinitialiser',
            color: 'danger',
            loading: isResettingViews,
            onClick: () => {
              void handleConfirmResetViews();
            },
          },
        ]}
      />

      <Alert
        isOpen={isClearConfirmOpen}
        onClose={() => setIsClearConfirmOpen(false)}
        title="Vider le cache ?"
        subtitle="Les réponses API et les popups géodésie seront rechargées au prochain usage."
        buttons={[
          {
            label: 'Annuler',
            variant: 'outline',
            onClick: () => setIsClearConfirmOpen(false),
          },
          {
            label: 'Vider',
            color: 'danger',
            loading: isClearing,
            onClick: () => {
              void handleConfirmClear();
            },
          },
        ]}
      />
    </SlideUpPage>
  );
}
