import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { BottomTabbar } from '@/app/components/BottomTabbar';
import type { GroupReport } from '@/domain/report/groupReportModels';
import {
  mapApiReportToGroupReport,
  type ApiGroupReportResponse,
} from '@/domain/report/groupReportMappers';
import { PointImageLightbox } from '@/features/map/components/MapBottomSheet/pointFiche/PointImageLightbox';
import { ReportPositionMap } from '@/features/report/components/ReportPositionMap';
import { collabApiClient, ensureCollabApiSession } from '@/infra/api';
import { getStatusColors, getStatusLabel } from '@/shared/utils/reportStatus';
import { Button } from '@/shared/ui/Button';
import { PageHeader } from '@/shared/ui/PageHeader';
import IconAlertCircle from '@/shared/assets/icons/icon-alert-circle.svg?react';
import IconArticle from '@/shared/assets/icons/icon-article.svg?react';
import IconEye from '@/shared/assets/icons/icon-eye.svg?react';
import IconFullscreen from '@/shared/assets/icons/icon-fullscreen.svg?react';

import styles from './ReportDetailPage.module.css';

export function ReportHistoryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [report, setReport] = useState<GroupReport | null | undefined>(undefined);
  const [photoFailed, setPhotoFailed] = useState(false);
  const [isPhotoLightboxOpen, setIsPhotoLightboxOpen] = useState(false);

  useEffect(() => {
    const reportId = Number(id);
    if (!id || !Number.isFinite(reportId)) {
      setReport(null);
      return;
    }

    let cancelled = false;
    setPhotoFailed(false);

    void (async () => {
      const sessionReady = await ensureCollabApiSession();
      if (!sessionReady) {
        if (!cancelled) {
          setReport(null);
        }
        return;
      }

      try {
        const response = await collabApiClient.report.get(reportId);
        if (!cancelled) {
          setReport(mapApiReportToGroupReport(response.data as ApiGroupReportResponse));
        }
      } catch {
        if (!cancelled) {
          setReport(null);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleViewOnMap = () => {
    if (!report || report.longitude === null || report.latitude === null) {
      return;
    }

    navigate('/map', {
      state: {
        openReportPoint: {
          longitude: report.longitude,
          latitude: report.latitude,
        },
      },
    });
  };

  return (
    <div className={styles.page}>
      <PageHeader
        title="Détail du signalement"
        showBackButton
        showCloseButton={false}
        onBack={() => navigate('/reports/history')}
      />

      <main className={styles.main}>
        {report === undefined ? (
          <p className={styles.empty}>Chargement…</p>
        ) : report === null ? (
          <p className={styles.empty}>Ce signalement est introuvable.</p>
        ) : (
          <>
            <div className={styles.headerRow}>
              <span className={styles.reportId}>Signalement #{report.id}</span>
              <span className={styles.statusBadge} style={getStatusColors(report.status)}>
                {getStatusLabel(report.status)}
              </span>
            </div>

            {report.photoUrls[0] && !photoFailed ? (
              <div className={styles.photoCard}>
                <img
                  src={report.photoUrls[0]}
                  alt=""
                  className={styles.photoImage}
                  onError={() => setPhotoFailed(true)}
                />
                <button
                  type="button"
                  className={styles.photoExpandButton}
                  onClick={() => setIsPhotoLightboxOpen(true)}
                  aria-label="Afficher la photo en grand"
                >
                  <IconFullscreen className={styles.photoExpandIcon} aria-hidden />
                </button>
              </div>
            ) : (
              <div className={styles.photoWarning}>
                <IconAlertCircle className={styles.photoWarningIcon} aria-hidden />
                <span>Pas de photo pour ce signalement.</span>
              </div>
            )}

            {isPhotoLightboxOpen && report.photoUrls[0] ? (
              <PointImageLightbox
                items={[
                  { id: 'report-photo', label: `Signalement #${report.id}`, imageUrl: report.photoUrls[0] },
                ]}
                activeIndex={0}
                onClose={() => setIsPhotoLightboxOpen(false)}
                onActiveIndexChange={() => {}}
              />
            ) : null}

            {report.longitude !== null && report.latitude !== null ? (
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
              onClick={handleViewOnMap}
              disabled={report.longitude === null || report.latitude === null}
            >
              <IconEye className={styles.actionIcon} aria-hidden />
              Voir sur la carte
            </Button>
          </>
        )}
      </main>

      <BottomTabbar activeTab="signalements" />
    </div>
  );
}
