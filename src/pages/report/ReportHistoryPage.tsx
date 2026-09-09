import { useNavigate } from 'react-router-dom';

import { BottomTabbar } from '@/app/components/BottomTabbar';
import { getGroupReportSummaryLabel } from '@/domain/report/groupReportMappers';
import { useUserReportHistory } from '@/features/report/hooks/useUserReportHistory';
import { formatRelativeDayLabel } from '@/shared/utils/date';
import { getStatusColors, getStatusLabel } from '@/shared/utils/reportStatus';
import { Button } from '@/shared/ui/Button';
import { PageHeader } from '@/shared/ui/PageHeader';
import IconAngleRight from '@/shared/assets/icons/icon-angle-right.svg?react';
import IconCalendar from '@/shared/assets/icons/icon-calendar.svg?react';

import styles from './MyReportsPage.module.css';

export function ReportHistoryPage() {
  const navigate = useNavigate();
  const { reports, isLoading, isLoadingMore, error, hasMore, loadMore } = useUserReportHistory();

  return (
    <div className={styles.page}>
      <PageHeader
        title="Anciens signalements"
        showBackButton
        showCloseButton={false}
        onBack={() => navigate('/reports')}
      />

      <main className={styles.main}>
        {isLoading ? (
          <p className={styles.empty}>Chargement…</p>
        ) : error ? (
          <p className={styles.empty}>{error.message}</p>
        ) : reports.length === 0 ? (
          <p className={styles.empty}>Aucun ancien signalement trouvé pour ce compte.</p>
        ) : (
          <>
            <ul className={styles.reportList}>
              {reports.map((report) => {
                const statusColors = getStatusColors(report.status);

                return (
                  <li key={report.id}>
                    <button
                      type="button"
                      className={styles.reportCard}
                      onClick={() => navigate(`/reports/history/${report.id}`)}
                    >
                      <div className={styles.reportCardHeader}>
                        <span className={styles.reportId}>Signalement #{report.id}</span>
                        <span
                          className={styles.statusBadge}
                          style={{ color: statusColors.color, background: statusColors.background }}
                        >
                          {getStatusLabel(report.status)}
                        </span>
                      </div>
                      <p className={styles.reportReason}>{getGroupReportSummaryLabel(report)}</p>
                      <div className={styles.reportMeta}>
                        <span className={styles.reportMetaItem}>
                          <IconCalendar className={styles.reportMetaIcon} aria-hidden />
                          {formatRelativeDayLabel(report.createdAt)}
                        </span>
                      </div>
                      <IconAngleRight className={styles.reportChevron} aria-hidden />
                    </button>
                  </li>
                );
              })}
            </ul>

            {hasMore ? (
              <Button type="button" variant="outline" fullWidth onClick={loadMore} loading={isLoadingMore}>
                Charger plus
              </Button>
            ) : null}
          </>
        )}
      </main>

      <BottomTabbar activeTab="signalements" />
    </div>
  );
}
