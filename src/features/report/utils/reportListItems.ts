import {
  buildGeodesyPointTitleDisplay,
  geodesyPointRefKey,
  type GeodesyPointRef,
  type GeodesyPointTitlePicto,
} from '@ign/gdp-tools';

import type { GroupReport } from '@/domain/report/groupReportModels';
import {
  getLocalReportDraftEffectiveStatus,
  isLocalReportDraftSent,
  type LocalReportDraft,
  type LocalReportDraftStatus,
} from '@/domain/report/localReportDraft';
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
import { normalizeSearchText } from '@/shared/utils/text';

/** Carte de la liste « Signalements » : brouillon local, signalement serveur, ou les deux fusionnés. */
export interface ReportListItem {
  key: string;
  /** Statut servant aux filtres « Pas envoyés / Envoyés ». */
  filterStatus: LocalReportDraftStatus;
  /** Route de détail (brouillon local si présent, sinon fiche serveur). */
  detailPath: string;
  title: string;
  titlePicto?: GeodesyPointTitlePicto;
  /** Identifiant EspaceCo, une fois le signalement envoyé. */
  serverId?: number;
  /**
   * Texte de la recherche (normalisé, cf. `normalizeSearchText`) : nom et identifiant du repère,
   * id du signalement (« #1234 »), commune et voie suivie.
   */
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

function buildSearchLabel(parts: ReadonlyArray<string | number | null | undefined>): string {
  return normalizeSearchText(parts.filter((part) => part !== null && part !== undefined && part !== '').join(' '));
}

function buildLocalDraftItem(draft: LocalReportDraft, serverReport?: GroupReport): ReportListItem {
  const status = getLocalReportDraftEffectiveStatus(draft);
  const base: ReportListItem = {
    key: `local:${draft.id}`,
    filterStatus: status,
    detailPath: `/reports/${draft.id}`,
    title: draft.title,
    titlePicto: draft.titlePicto,
    serverId: serverReport?.id ?? draft.serverId,
    searchLabel: buildSearchLabel([
      draft.title,
      draft.geodesyId,
      serverReport?.id ?? draft.serverId ? `#${serverReport?.id ?? draft.serverId}` : null,
      draft.commune,
      draft.voieSuivie,
    ]),
    positionModified: draft.positionModified,
    createdAt: new Date(draft.createdAt),
    commune: draft.commune,
    voieSuivie: draft.voieSuivie,
    statusLabel: getLocalReportDraftStatusLabel(status),
    statusColors: getLocalReportDraftStatusColors(status),
    accentRgb: getLocalReportDraftStatusAccentRgb(status),
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

  const title = titleDisplay?.title ?? (pointRef ? `Repère ${pointRef.id}` : `Signalement #${report.id}`);
  const commune = (point && resolveCommuneLabel(point)) || report.communeTitle;
  const voieSuivie = (point && resolveVoieSuivieLabel(point)) || undefined;

  return {
    key: `server:${report.id}`,
    filterStatus: 'sent',
    detailPath: `/reports/history/${report.id}`,
    title,
    titlePicto: titleDisplay?.titlePicto,
    serverId: report.id,
    searchLabel: buildSearchLabel([title, pointRef?.id, `#${report.id}`, commune, voieSuivie]),
    // Attribut `move` du thème `gdp-tools` (cf. `buildGdpWizardThemeFormAttributes`).
    positionModified: report.themeAttributes.move?.trim().toLowerCase() === 'true',
    createdAt: report.createdAt,
    commune,
    voieSuivie,
    statusLabel: getStatusLabel(report.status),
    statusColors: getStatusColors(report.status),
    accentRgb: getLocalReportDraftStatusAccentRgb('sent'),
  };
}

/**
 * Fusionne brouillons locaux et signalements serveur (`serverReports`, `null` si non chargés) :
 * - brouillons « Pas envoyés » (sans `serverId`) : toujours affichés (propres à l'appareil) ;
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
    .filter((draft) => !isLocalReportDraftSent(draft))
    .map((draft) => buildLocalDraftItem(draft));

  if (!serverReports) {
    const sent = drafts
      .filter(isLocalReportDraftSent)
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
