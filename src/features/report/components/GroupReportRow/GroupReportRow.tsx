import type { GroupReport } from '@/domain/report/groupReportModels';
import { getGroupReportSummaryLabel } from '@/domain/report/groupReportMappers';
import { ReportStatusIcon } from '@/features/report/components/ReportStatusIcon';
import { formatDate, formatDateTime } from '@/shared/utils/date';

import IconAngleRight from '@/shared/assets/icons/icon-angle-right.svg?react';

import styles from './GroupReportRow.module.css';

export interface GroupReportRowProps {
  report: GroupReport;
  onSelect?: (report: GroupReport) => void;
}

export function GroupReportRow({ report, onSelect }: GroupReportRowProps) {
  const summaryLabel = getGroupReportSummaryLabel(report);
  const hasPosition = report.longitude !== null && report.latitude !== null;
  const wasUpdated =
    report.modifiedAt !== undefined &&
    report.modifiedAt.getTime() !== report.createdAt.getTime();

  const handleClick = () => {
    if (!hasPosition) {
      return;
    }
    onSelect?.(report);
  };

  return (
    <button
      className={styles.row}
      type="button"
      onClick={handleClick}
      disabled={!hasPosition}
      aria-label={
        hasPosition
          ? `Voir le signalement n°${report.id} sur la carte`
          : `Signalement n°${report.id} sans position sur la carte`
      }
    >
      <ReportStatusIcon status={report.status} />
      <div className={styles.content}>
        <span className={styles.title}>Signalement n°{report.id}</span>
        <span className={styles.theme}>{summaryLabel}</span>
        {report.authorName ? (
          <span className={styles.author}>Par {report.authorName}</span>
        ) : null}
        {report.comment ? <span className={styles.comment}>{report.comment}</span> : null}
        <div className={styles.dateTime}>
          <span className={styles.date}>
            {formatDate(report.createdAt)}
            {wasUpdated && report.modifiedAt
              ? ` — modifié le ${formatDateTime(report.modifiedAt)}`
              : null}
          </span>
        </div>
        {!hasPosition ? (
          <span className={styles.noPosition}>Position indisponible</span>
        ) : null}
      </div>
      {hasPosition ? <IconAngleRight className={styles.chevron} aria-hidden /> : null}
    </button>
  );
}
