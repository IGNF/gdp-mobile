import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAppCacheMaintenance } from '@/features/settings/hooks/useAppCacheMaintenance';
import { WELCOME_SEEN_STORAGE_KEY } from '@/features/welcome/hooks/useFirstRun';
import { getClearableCacheSizeBytes } from '@/infra/cache/appCache';
import { Alert } from '@/shared/ui/Alert';
import { Button } from '@/shared/ui/Button';
import { Checkbox } from '@/shared/ui/Checkbox';
import { Loading } from '@/shared/ui/Loading';
import { PageHeader } from '@/shared/ui/PageHeader';
import { SlideUpPage } from '@/shared/ui/SlideUpPage';
import { formatSizeFromBytes } from '@/shared/utils/storageSize';

import screen from '@/shared/styles/screen.module.css';
import typography from '@/shared/styles/typography.module.css';

import styles from './SettingsPage.module.css';

export interface SettingsPageProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsPage({ isOpen, onClose }: SettingsPageProps) {
  const navigate = useNavigate();
  const { stats, isLoading, isClearing, loadStats, clearCaches } = useAppCacheMaintenance();
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
  const [welcomeSeen, setWelcomeSeen] = useState(
    () => localStorage.getItem(WELCOME_SEEN_STORAGE_KEY) === 'true',
  );

  useEffect(() => {
    if (isOpen) {
      void loadStats();
      setWelcomeSeen(localStorage.getItem(WELCOME_SEEN_STORAGE_KEY) === 'true');
    }
  }, [isOpen, loadStats]);

  const handleWelcomeSeenChange = (checked: boolean) => {
    if (checked) {
      localStorage.setItem(WELCOME_SEEN_STORAGE_KEY, 'true');
      setWelcomeSeen(true);
      return;
    }

    localStorage.removeItem(WELCOME_SEEN_STORAGE_KEY);
    setWelcomeSeen(false);
    onClose();
    navigate('/welcome');
  };

  const clearableSizeBytes = stats ? getClearableCacheSizeBytes(stats) : 0;

  const handleConfirmClear = async () => {
    await clearCaches();
    setIsClearConfirmOpen(false);
  };

  return (
    <SlideUpPage isOpen={isOpen} onClose={onClose}>
      <PageHeader title="Paramètres" onClose={onClose} />

      <main className={`${screen.screenContainer} ${styles.content}`}>
        <h1 className={typography.title}>Paramètres</h1>
        <p className={typography.subtitle}>Préférences de l’application.</p>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Carte</h2>
          <p className={typography.paragraph}>
            La position, le zoom, les calques visibles et les filtres des points sont mémorisés
            automatiquement entre les sessions.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Onboarding</h2>
          <Checkbox
            label="Onboarding déjà vu"
            checked={welcomeSeen}
            onChange={handleWelcomeSeenChange}
          />
          <p className={styles.modeHint}>
            Décochez pour rouvrir l’onboarding immédiatement.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Cache</h2>
          <p className={typography.paragraph}>
            Données temporaires mises en cache pour accélérer l’application (API, popups
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
                <dt>Géodésie (GetFeatureInfo)</dt>
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
            color="danger"
            variant="outline"
            fullWidth
            disabled={isLoading || isClearing || clearableSizeBytes === 0}
            loading={isClearing}
            onClick={() => setIsClearConfirmOpen(true)}
          >
            Vider le cache
          </Button>
        </section>
      </main>

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
