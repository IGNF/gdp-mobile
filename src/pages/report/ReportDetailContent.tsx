import { ReportPositionMap } from '@/features/report/components/ReportPositionMap';
import { Button } from '@/shared/ui/Button';
import { joinCSSClassNames } from '@/shared/utils/join';
import IconArticle from '@/shared/assets/icons/icon-article.svg?react';
import IconCamera from '@/shared/assets/icons/icon-camera.svg?react';
import IconCheck from '@/shared/assets/icons/icon-check.svg?react';
import IconClose from '@/shared/assets/icons/icon-close.svg?react';
import IconEye from '@/shared/assets/icons/icon-eye.svg?react';
import IconPencil from '@/shared/assets/icons/icon-pencil.svg?react';

import styles from './ReportDetailPage.module.css';
import type { ReportDetailView } from './reportDetailView';

export interface ReportDetailContentProps {
  report: ReportDetailView;
  onViewOnMap: () => void;
}

/** Fiche détail d'un signalement — même présentation pour les brouillons locaux et les signalements envoyés. */
export function ReportDetailContent({ report, onViewOnMap }: ReportDetailContentProps) {
  const hasPosition = report.longitude !== null && report.latitude !== null;

  return (
    <>
      <div className={styles.headerRow}>
        <span className={styles.reportId}>{report.idLabel}</span>
        <span className={styles.statusBadge} style={report.statusColors}>
          {report.statusLabel}
        </span>
      </div>

      <div className={styles.photoCard}>
        {report.photoUrl ? (
          <img src={report.photoUrl} alt="" className={styles.photoImage} />
        ) : (
          <div className={styles.photoPlaceholder}>
            <IconCamera className={styles.photoPlaceholderIcon} aria-hidden />
          </div>
        )}
      </div>

      <div className={styles.grid}>
        <div className={styles.card}>
          <p className={styles.cardLabel}>État</p>
          <p className={styles.cardValue}>
            <span
              className={joinCSSClassNames(
                styles.cardValueIcon,
                report.isConform ? styles.cardValueIconConform : styles.cardValueIconNonConform,
              )}
            >
              {report.isConform ? (
                <IconCheck className={styles.cardValueIconSvg} aria-hidden />
              ) : (
                <IconClose className={styles.cardValueIconSvg} aria-hidden />
              )}
            </span>
            {report.isConform ? 'Conforme' : 'Non conforme'}
          </p>
          <p className={styles.cardDetail}>{report.etatDetail}</p>
        </div>

        <div className={styles.card}>
          <p className={styles.cardLabel}>Position</p>
          <p className={styles.cardValue}>
            <span className={joinCSSClassNames(styles.cardValueIcon, styles.cardValueIconConform)}>
              {report.positionModified ? (
                <IconPencil className={styles.cardValueIconSvg} aria-hidden />
              ) : (
                <IconCheck className={styles.cardValueIconSvg} aria-hidden />
              )}
            </span>
            {report.positionModified ? 'Modifiée' : 'Confirmée'}
          </p>
          <p className={styles.cardDetail}>
            {hasPosition
              ? `${report.latitude!.toFixed(4)}° N, ${report.longitude!.toFixed(4)}° E`
              : '—'}
          </p>
        </div>
      </div>

      {hasPosition ? (
        <div className={styles.mapPreview}>
          <ReportPositionMap
            longitude={report.longitude}
            latitude={report.latitude}
            onPositionChange={() => {}}
            readOnly
            showLayerSwitcher
            showFullscreenButton
          />
        </div>
      ) : null}

      <div className={styles.commentCard}>
        <div className={styles.commentHeader}>
          <span className={styles.commentTitle}>
            <IconArticle className={styles.commentIcon} aria-hidden />
            Commentaire
          </span>
        </div>
        <p className={styles.commentBody}>
          {report.comment.trim() ? report.comment : 'Aucun commentaire ajouté.'}
        </p>
      </div>

      <Button
        type="button"
        variant="ghost"
        fullWidth
        className={styles.viewOnMap}
        onClick={onViewOnMap}
        disabled={!hasPosition}
      >
        <IconEye className={styles.actionIcon} aria-hidden />
        Voir sur la carte
      </Button>
    </>
  );
}
