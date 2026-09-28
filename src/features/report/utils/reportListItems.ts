import {
  buildGeodesyPointTitleDisplay,
  geodesyPointRefKey,
  type GeodesyPointRef,
  type GeodesyPointTitlePicto,
} from '@ign/gdp-tools';

import type { GroupReport } from '@/domain/report/groupReportModels';
import type { LocalReportDraft, LocalReportDraftStatus } from '@/domain/report/localReportDraft';
import {
  resolveCommuneLabel,
  resolveVoieSuivieLabel,
} from '@/features/map/components/MapBottomSheet/pointFiche/pointFicheUtils';
import {
  getLocalReportDraftStatusAccentRgb,
  getLocalReportDraftStatusColors,
  getLocalReportDraftStatusLabel,
} from '@/features/report/utils/localReportDraftStatus';
import { GDP_GEODESY_POINT_DISPLAY_OPTIONS } from '@/features/map/utils/geodesyReportContext';
import { getStatusColors, getStatusLabel } from '@/shared/utils/reportStatus';

/** Carte de la liste « Signalements » : brouillon local, signalement serveur, ou les deux fusionnés. */
export interface ReportListItem {
  key: string;
  /** Statut servant aux filtres « Pas envoyés / Envoyés ». */
  filterStatus: LocalReportDraftStatus;
  /** Route de détail (brouillon local si présent, sinon fiche serveur). */
  detailPath: string;
  title: string;
  titlePicto?: GeodesyPointTitlePicto;
  /** Texte recherché par « Rechercher par ID ». */
  searchLabel: string;
  /** L'utilisateur a déplacé le repère (signalement non conforme, « mal positionné »). */
  positionModified: boolean;
  createdAt: Date;
  commune?: string;
  voieSuivie?: string;
  statusLabel: string;
  statusColors: { color: string; background: string };
  accentRgb: string;
}

/** Référence WFS (`id` + `domaine`) stockée dans les attributs du thème `gdp-tools`. */
export function readGroupReportPointRef(report: GroupReport): GeodesyPointRef | null {
  const id = report.themeAttributes.id?.trim();
  const domaine = report.themeAttributes.domaine?.trim();
  return id && domaine ? { id, domaine } : null;
}

function buildLocalDraftItem(draft: LocalReportDraft, serverReport?: GroupReport): ReportListItem {
  const base: ReportListItem = {
    key: `local:${draft.id}`,
    filterStatus: draft.status,
    detailPath: `/reports/${draft.id}`,
    title: draft.title,
    titlePicto: draft.titlePicto,
    searchLabel: `ID_${draft.geodesyId ?? draft.title}`,
    positionModified: draft.positionModified,
    createdAt: new Date(draft.createdAt),
    commune: draft.commune,
    voieSuivie: draft.voieSuivie,
    statusLabel: getLocalReportDraftStatusLabel(draft.status),
    statusColors: getLocalReportDraftStatusColors(draft.status),
    accentRgb: getLocalReportDraftStatusAccentRgb(draft.status),
  };

  // Brouillon envoyé retrouvé côté serveur : son vrai statut (soumis, validé…) prime.
  return serverReport
    ? {
        ...base,
        statusLabel: getStatusLabel(serverReport.status),
        statusColors: getStatusColors(serverReport.status),
      }
    : base;
}

function buildServerReportItem(
  report: GroupReport,
  point: Record<string, unknown> | undefined,
): ReportListItem {
  const pointRef = readGroupReportPointRef(report);
  const titleDisplay = point
    ? buildGeodesyPointTitleDisplay(point, { ...GDP_GEODESY_POINT_DISPLAY_OPTIONS, layerId: 'DATA_GEOD' })
    : null;

  return {
    key: `server:${report.id}`,
    filterStatus: 'sent',
    detailPath: `/reports/history/${report.id}`,
    title: titleDisplay?.title ?? (pointRef ? `Repère ${pointRef.id}` : `Signalement #${report.id}`),
    titlePicto: titleDisplay?.titlePicto,
    searchLabel: `ID_${pointRef?.id ?? report.id} ${titleDisplay?.title ?? ''}`,
    // Attribut `move` du thème `gdp-tools` (cf. `buildGdpWizardThemeFormAttributes`).
    positionModified: report.themeAttributes.move?.trim().toLowerCase() === 'true',
    createdAt: report.createdAt,
    commune: (point && resolveCommuneLabel(point)) || report.communeTitle,
    voieSuivie: (point && resolveVoieSuivieLabel(point)) || undefined,
    statusLabel: getStatusLabel(report.status),
    statusColors: getStatusColors(report.status),
    accentRgb: getLocalReportDraftStatusAccentRgb('sent'),
  };
}

/**
 * Fusionne brouillons locaux et signalements serveur (`serverReports`, `null` si non chargés) :
 * - brouillons « Pas envoyés » : toujours affichés (propres à l'appareil) ;
 * - signalements serveur : affichés, enrichis par le brouillon local de même `serverId`
 *   s'il existe, sinon par le repère relu dans le WFS (`points`) ;
 * - brouillons « Envoyés » sans correspondance : affichés uniquement si le serveur n'a pas
 *   répondu (hors ligne), sinon ils figurent déjà (ou figureront via « Charger plus ») côté serveur.
 */
export function buildReportListItems(
  drafts: readonly LocalReportDraft[],
  serverReports: readonly GroupReport[] | null,
  points: ReadonlyMap<string, Record<string, unknown>>,
): ReportListItem[] {
  const draftsByServerId = new Map(
    drafts.filter((draft) => draft.serverId !== undefined).map((draft) => [draft.serverId, draft]),
  );

  const unsent = drafts
    .filter((draft) => draft.status === 'not_sent')
    .map((draft) => buildLocalDraftItem(draft));

  if (!serverReports) {
    const sent = drafts
      .filter((draft) => draft.status === 'sent')
      .map((draft) => buildLocalDraftItem(draft));
    return [...unsent, ...sent].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  const sent = serverReports.map((report) => {
    const draft = draftsByServerId.get(report.id);
    if (draft) {
      return buildLocalDraftItem(draft, report);
    }

    const pointRef = readGroupReportPointRef(report);
    return buildServerReportItem(report, pointRef ? points.get(geodesyPointRefKey(pointRef)) : undefined);
  });

  // Brouillons non envoyés en tête, puis signalements envoyés (déjà triés du plus récent au plus ancien).
  return [...unsent.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()), ...sent];
}
