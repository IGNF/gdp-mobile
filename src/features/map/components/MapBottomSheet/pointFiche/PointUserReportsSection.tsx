import { useNavigate } from 'react-router-dom';

import type { MapGeodesyClickAction } from '@/features/map/hooks/useMapGeodesyClick';
import { usePointUserReports } from '@/features/report/hooks/usePointUserReports';
import { buildPointFicheReturnState } from '@/features/report/utils/pointFicheReturn';
import IconAngleRight from '@/shared/assets/icons/icon-angle-right.svg?react';

import styles from './MapPointSheet.module.css';

export interface PointUserReportsSectionProps {
  action: MapGeodesyClickAction;
}

/** Signalements de l'utilisateur sur ce repère, en bas de la fiche : un encart cliquable chacun. */
export function PointUserReportsSection({ action }: PointUserReportsSectionProps) {
  const navigate = useNavigate();
  const reports = usePointUserReports(action.reportContext);

  if (reports.length === 0) {
    return null;
  }

  return (
    <section className={styles.userReports}>
      {reports.map((report) => (
        <button
          key={report.key}
          type="button"
          className={styles.userReportCard}
          onClick={() =>
            navigate(report.detailPath, {
              state: buildPointFicheReturnState(action.point),
            })
          }
        >
          {/* Même libellé que la fiche détail : nom du repère tant que le signalement n'est pas envoyé. */}
          <span className={styles.userReportId}>
            {report.serverId !== undefined ? `ID : #${report.serverId}` : report.title}
          </span>
          <span className={styles.userReportEnd}>
            <span
              className={styles.userReportBadge}
              style={{ color: report.statusColors.color, background: report.statusColors.background }}
            >
              {report.statusLabel}
            </span>
            <IconAngleRight className={styles.userReportChevron} aria-hidden />
          </span>
        </button>
      ))}
    </section>
  );
}
