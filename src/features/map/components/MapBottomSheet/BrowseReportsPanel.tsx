import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import type { GroupReport } from '@/domain/report/groupReportModels';
import { getGroupReportSummaryLabel } from '@/domain/report/groupReportMappers';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useMyReports } from '@/features/report/hooks/useMyReports';
import { formatDate } from '@/shared/utils/date';
import { getStatusColor, getStatusLabel } from '@/shared/utils/reportStatus';
import { Button } from '@/shared/ui/Button';
import { Loading } from '@/shared/ui/Loading';

import IconAngleRight from '@/shared/assets/icons/icon-angle-right.svg?react';

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
        {serverReports.map((report) => {
          const hasPosition = report.longitude !== null && report.latitude !== null;

          return (
            <button
              key={report.id}
              type="button"
              className={styles.reportRow}
              disabled={!hasPosition}
              onClick={() => handleReportSelect(report)}
              aria-label={
                hasPosition
                  ? `Voir le signalement n°${report.id} sur la carte`
                  : `Signalement n°${report.id} sans position sur la carte`
              }
            >
              <div className={styles.reportRowContent}>
                <div className={styles.reportRowHeader}>
                  <span className={styles.reportRowId}>Signalement n°{report.id}</span>
                  <span
                    className={styles.reportRowBadge}
                    style={{ color: getStatusColor(report.status) }}
                  >
                    {getStatusLabel(report.status)}
                  </span>
                </div>
                <span className={styles.reportRowSummary}>
                  {getGroupReportSummaryLabel(report)}
                </span>
                <span className={styles.reportRowDate}>{formatDate(report.createdAt)}</span>
                {!hasPosition ? (
                  <span className={styles.reportRowNoPosition}>Position indisponible</span>
                ) : null}
              </div>
              {hasPosition ? (
                <IconAngleRight className={styles.reportRowChevron} aria-hidden />
              ) : null}
            </button>
          );
        })}
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
