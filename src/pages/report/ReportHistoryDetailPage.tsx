import { geodesyPointRefKey } from '@ign/gdp-tools';
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import type { GroupReport } from '@/domain/report/groupReportModels';
import {
  mapApiReportToGroupReport,
  type ApiGroupReportResponse,
} from '@/domain/report/groupReportMappers';
import { useReportGeodesyPoints } from '@/features/report/hooks/useReportGeodesyPoints';
import { readPointFicheReturn } from '@/features/report/utils/pointFicheReturn';
import { readGroupReportPointRef } from '@/features/report/utils/reportListItems';
import { collabApiClient, ensureCollabApiSession } from '@/infra/api';
import { PageHeader } from '@/shared/ui/PageHeader';

import { ReportDetailContent } from './ReportDetailContent';
import { buildReportDetailViewFromGroupReport } from './reportDetailView';
import styles from './ReportDetailPage.module.css';

export function ReportHistoryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;
  const cameFromMap = from === 'map';
  const [report, setReport] = useState<GroupReport | null | undefined>(undefined);
  const reportId = Number(id);
  const hasValidId = Boolean(id) && Number.isFinite(reportId);

  // Identifiant absent/invalide : introuvable, pendant le rendu plutôt que dans l'effet
  // ci-dessous (qui n'a alors plus qu'à charger le signalement, une vraie resynchronisation
  // avec l'API).
  if (!hasValidId && report !== null) {
    setReport(null);
  }

  useEffect(() => {
    if (!hasValidId) {
      return;
    }

    let cancelled = false;

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
  }, [hasValidId, reportId]);

  // Repère relu dans le WFS : l'Espace collaboratif ne stocke pas son picto.
  const pointRef = useMemo(() => (report ? readGroupReportPointRef(report) : null), [report]);
  const pointRefs = useMemo(() => (pointRef ? [pointRef] : []), [pointRef]);
  const points = useReportGeodesyPoints(pointRefs);
  const point = pointRef ? points.get(geodesyPointRefKey(pointRef)) : undefined;

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

  const handleBack = () => {
    const pointFiche = readPointFicheReturn(location.state);
    if (pointFiche) {
      navigate('/map', { state: { openReportPoint: pointFiche } });
      return;
    }

    if (cameFromMap && report && report.longitude !== null && report.latitude !== null) {
      navigate('/map', {
        state: { focusReport: { longitude: report.longitude, latitude: report.latitude } },
      });
      return;
    }

    navigate(from === 'reports' ? '/reports' : '/reports/history');
  };

  return (
    <div className={styles.page}>
      <PageHeader
        title="Détail du signalement"
        className={styles.pageHeader}
        showBackButton
        showCloseButton={false}
        onBack={handleBack}
      />

      <main className={styles.main}>
        {report === undefined ? (
          <p className={styles.empty}>Chargement…</p>
        ) : report === null ? (
          <p className={styles.empty}>Ce signalement est introuvable.</p>
        ) : (
          <ReportDetailContent
            report={buildReportDetailViewFromGroupReport(report, point)}
            onViewOnMap={handleViewOnMap}
          />
        )}
      </main>
    </div>
  );
}
