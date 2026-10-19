import { extractGeodesyPointReportDomaine, type GeodesyPointReportContext } from '@ign/gdp-tools';
import { useEffect, useMemo, useState } from 'react';

import type { GroupReport } from '@/domain/report/groupReportModels';
import type { LocalReportDraft } from '@/domain/report/localReportDraft';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { loadReportsInMapBbox } from '@/features/map/utils/loadReportsInMapBbox';
import { useLocalReportDrafts } from '@/features/report/hooks/useLocalReportDrafts';
import {
  buildReportListItems,
  readGroupReportPointRef,
  type ReportListItem,
} from '@/features/report/utils/reportListItems';

/**
 * Demi-côté (degrés, ~1 km) de l'emprise interrogée autour du repère : un signalement « mal
 * positionné » porte la position corrigée, pas celle du repère.
 */
const POINT_REPORTS_BBOX_HALF_SIZE_DEG = 0.01;

interface PointRef {
  id: string;
  domaine?: string;
}

function isSamePoint(point: PointRef, id: string | undefined, domaine: string | undefined): boolean {
  if (!id || id !== point.id) {
    return false;
  }

  // Domaine absent d'un côté (anciens brouillons) : l'identifiant suffit.
  return !point.domaine || !domaine || domaine === point.domaine;
}

function readDraftDomaine(draft: LocalReportDraft): string | undefined {
  const domaine = draft.themeAttributes?.domaine ?? draft.properties?.domaine;
  return typeof domaine === 'string' ? domaine : undefined;
}

/**
 * Signalements de l'utilisateur sur un repère : brouillons de cet appareil et signalements
 * envoyés (cherchés autour du repère, compte connecté seulement), fusionnés comme dans la
 * liste « Signalements ».
 */
export function usePointUserReports(reportContext: GeodesyPointReportContext): ReportListItem[] {
  const { user, isAuthenticated } = useAuth();
  const { drafts } = useLocalReportDrafts();
  const [serverReports, setServerReports] = useState<GroupReport[] | null>(null);

  const pointId = reportContext.geodesyId;
  const pointDomaine = extractGeodesyPointReportDomaine(reportContext) ?? undefined;
  const { longitude, latitude } = reportContext;
  const userId = isAuthenticated ? user?.id : undefined;

  useEffect(() => {
    if (!pointId || userId === undefined) {
      return;
    }

    let cancelled = false;
    void loadReportsInMapBbox({
      extent4326: [
        longitude - POINT_REPORTS_BBOX_HALF_SIZE_DEG,
        latitude - POINT_REPORTS_BBOX_HALF_SIZE_DEG,
        longitude + POINT_REPORTS_BBOX_HALF_SIZE_DEG,
        latitude + POINT_REPORTS_BBOX_HALF_SIZE_DEG,
      ],
      authorId: userId,
    })
      .then((reports) => {
        if (!cancelled) {
          setServerReports(reports);
        }
      })
      .catch(() => {
        // Hors ligne / API indisponible : seuls les brouillons locaux sont affichés.
      });

    return () => {
      cancelled = true;
    };
  }, [latitude, longitude, pointId, userId]);

  return useMemo(() => {
    if (!pointId) {
      return [];
    }

    const point: PointRef = { id: pointId, domaine: pointDomaine };
    const pointDrafts = drafts.filter((draft) => isSamePoint(point, draft.geodesyId, readDraftDomaine(draft)));
    const pointServerReports =
      userId === undefined || !serverReports
        ? null
        : serverReports.filter((report) => {
            const ref = readGroupReportPointRef(report);
            return ref !== null && isSamePoint(point, ref.id, ref.domaine);
          });

    return buildReportListItems(pointDrafts, pointServerReports, new Map());
  }, [drafts, pointDomaine, pointId, serverReports, userId]);
}
