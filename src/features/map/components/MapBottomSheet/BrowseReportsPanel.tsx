import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import type { GroupReport } from '@/domain/report/groupReportModels';
import { GroupReportRow } from '@/features/report/components/GroupReportRow';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useMyReports } from '@/features/report/hooks/useMyReports';
import { Button } from '@/shared/ui/Button';
import { Loading } from '@/shared/ui/Loading';

import styles from './MapBottomSheet.module.css';

export interface BrowseReportsPanelProps {
  onReportSelect: (longitude: number, latitude: number) => void;
}

export function BrowseReportsPanel({ onReportSelect }: BrowseReportsPanelProps) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const {
    serverReports,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    loadMore,
  } = useMyReports();

  const handleReportSelect = useCallback(
    (report: GroupReport) => {
      if (report.longitude === null || report.latitude === null) {
        return;
      }

      onReportSelect(report.longitude, report.latitude);
    },
    [onReportSelect],
  );

  if (!isAuthenticated) {
    return (
      <div className={styles.browseEmpty}>
        <p className={styles.browseEmptyText}>
          Connectez-vous pour consulter vos signalements envoyés.
        </p>
        <Button type="button" onClick={() => navigate('/login')}>
          Se connecter
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={styles.browseLoading}>
        <Loading label="Chargement de vos signalements…" />
      </div>
    );
  }

  if (error && serverReports.length === 0) {
    return (
      <div className={styles.browseEmpty}>
        <p className={styles.browseErrorText}>{error}</p>
      </div>
    );
  }

  if (serverReports.length === 0) {
    return (
      <div className={styles.browseEmpty}>
        <p className={styles.browseEmptyText}>
          Aucun signalement repère pour le moment. Touchez un repère sur la carte pour en créer un.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.browseReports}>
      {error ? <p className={styles.browseErrorText}>{error}</p> : null}
      <p className={styles.reportsCount}>
        <strong>
          {serverReports.length} signalement{serverReports.length > 1 ? 's' : ''}
        </strong>
        {!hasMore ? ' (liste complète)' : null}
      </p>
      <div className={styles.reportsList}>
        {serverReports.map((report) => (
          <GroupReportRow
            key={report.id}
            report={report}
            onSelect={handleReportSelect}
          />
        ))}
      </div>
      {hasMore ? (
        <div className={styles.reportsLoadMore}>
          <Button
            type="button"
            variant="outline"
            fullWidth
            loading={isLoadingMore}
            onClick={() => void loadMore()}
          >
            Charger plus
          </Button>
        </div>
      ) : (
        <p className={styles.reportsEndOfList}>Fin de la liste</p>
      )}
    </div>
  );
}
