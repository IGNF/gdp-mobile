import { useEffect, useState } from 'react';

import { useAppCacheMaintenance } from '@/features/settings/hooks/useAppCacheMaintenance';
import { getClearableCacheSizeBytes } from '@/infra/cache/appCache';
import {
  GDP_WFS_CLUSTER_DISTANCE_MAX,
  GDP_WFS_CLUSTER_DISTANCE_MIN,
  type GdpGeodesyMode,
} from '@/shared/constants/geodesy';
import { Alert } from '@/shared/ui/Alert';
import { Button } from '@/shared/ui/Button';
import { Loading } from '@/shared/ui/Loading';
import { PageHeader } from '@/shared/ui/PageHeader';
import { SlideUpPage } from '@/shared/ui/SlideUpPage';
import { Slider } from '@/shared/ui/Slider';
import { Toggle } from '@/shared/ui/Toggle';
import { formatSizeFromBytes } from '@/shared/utils/storageSize';

import screen from '@/shared/styles/screen.module.css';
import typography from '@/shared/styles/typography.module.css';

import styles from './SettingsPage.module.css';

export interface SettingsPageProps {
  isOpen: boolean;
  onClose: () => void;
  geodesyMode: GdpGeodesyMode;
  onGeodesyModeChange: (mode: GdpGeodesyMode) => void;
  wfsClusterEnabled: boolean;
  onWfsClusterEnabledChange: (enabled: boolean) => void;
  wfsClusterDistance: number;
  onWfsClusterDistanceChange: (distance: number) => void;
  areMapPreferencesHydrated?: boolean;
}

export function SettingsPage({
  isOpen,
  onClose,
  geodesyMode,
  onGeodesyModeChange,
  wfsClusterEnabled,
  onWfsClusterEnabledChange,
  wfsClusterDistance,
  onWfsClusterDistanceChange,
  areMapPreferencesHydrated = true,
}: SettingsPageProps) {
  const { stats, isLoading, isClearing, loadStats, clearCaches } = useAppCacheMaintenance();
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      void loadStats();
    }
  }, [isOpen, loadStats]);

  const clearableSizeBytes = stats ? getClearableCacheSizeBytes(stats) : 0;
  const isExpertMode = geodesyMode === 'expert';

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
            La position, le zoom, les calques visibles et les filtres repères sont mémorisés
            automatiquement entre les sessions.
          </p>
          <Toggle
            label="Mode géodésie expert"
            checked={isExpertMode}
            disabled={!areMapPreferencesHydrated}
            onChange={(checked) => onGeodesyModeChange(checked ? 'expert' : 'public')}
          />
          <p className={styles.modeHint}>
            {isExpertMode
              ? 'Affichage vectoriel WFS (data_geod), symboles repères et fiche complète.'
              : 'Affichage tuiles WMS (RBF, RDF, RN) — usage grand public.'}
          </p>

          <Toggle
            label="Regrouper les repères (clusters)"
            checked={wfsClusterEnabled}
            disabled={!areMapPreferencesHydrated || !isExpertMode}
            onChange={onWfsClusterEnabledChange}
          />
          <p className={styles.modeHint}>
            {isExpertMode
              ? 'Fusionne les repères proches en clusters animés lors du dézoom.'
              : 'Disponible uniquement en mode expert (couches WFS).'}
          </p>

          {isExpertMode && wfsClusterEnabled && (
            <div className={styles.sliderRow}>
              <span className={styles.sliderLabel}>Rayon de regroupement</span>
              <Slider
                value={wfsClusterDistance}
                min={GDP_WFS_CLUSTER_DISTANCE_MIN}
                max={GDP_WFS_CLUSTER_DISTANCE_MAX}
                step={5}
                disabled={!areMapPreferencesHydrated}
                ariaLabel="Rayon de regroupement des clusters en pixels"
                onChange={onWfsClusterDistanceChange}
              />
              <span className={styles.sliderValue}>{wfsClusterDistance} px</span>
            </div>
          )}
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
