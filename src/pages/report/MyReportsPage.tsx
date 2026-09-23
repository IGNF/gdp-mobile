import { useMemo, useState, type CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import { GeodesyPointTitle } from '@ign/gdp-tools/react';
import type { GeodesyPointTitlePicto } from '@ign/gdp-tools';
import type { ReportStatus } from '@ign/mobile-core';

import { BottomTabbar } from '@/app/components/BottomTabbar';
import type { GroupReport } from '@/domain/report/groupReportModels';
import type { LocalReportDraft, LocalReportDraftStatus } from '@/domain/report/localReportDraft';
import { useAuth } from '@/features/auth/hooks/useAuth';
import {
  NON_CONFORM_REASON_LABELS,
  type NonConformReason,
} from '@/features/report/components/GeodesyPointReportWizard';
import { useLocalReportDrafts } from '@/features/report/hooks/useLocalReportDrafts';
import { useSentReportRemoteStatuses } from '@/features/report/hooks/useSentReportRemoteStatuses';
import { useUserServerReports } from '@/features/report/hooks/useUserServerReports';
import { resolveGdpReportReasonLabelFromEtat } from '@/features/report/utils/gdpWizardThemeAttributes';
import {
  getLocalReportDraftStatusAccentRgb,
  getLocalReportDraftStatusColors,
  getLocalReportDraftStatusLabel,
} from '@/features/report/utils/localReportDraftStatus';
import {
  getReportInstructionStatusColors,
  getReportInstructionStatusLabel,
} from '@/features/report/utils/reportInstructionStatus';
import { formatRelativeDayLabel } from '@/shared/utils/date';
import { joinCSSClassNames } from '@/shared/utils/join';
import { EXTERNAL_LINKS } from '@/shared/constants/externalLinks';
import { Button } from '@/shared/ui/Button';
import { ExternalLink } from '@/shared/ui/ExternalLink';
import { PageHeader } from '@/shared/ui/PageHeader';
import IconAngleRight from '@/shared/assets/icons/icon-angle-right.svg?react';
import IconCalendar from '@/shared/assets/icons/icon-calendar.svg?react';
import IconLocation from '@/shared/assets/icons/icon-location.svg?react';
import IconSearch from '@/shared/assets/icons/icon-search.svg?react';

import styles from './MyReportsPage.module.css';

type StatusFilter = 'all' | LocalReportDraftStatus;

const FILTERS: Array<{ value: StatusFilter; label: string }> = [
  { value: 'all', label: 'Tous' },
  { value: 'not_sent', label: 'Pas envoyés' },
  { value: 'sent', label: 'Envoyés' },
];

/** Carte de la liste, commune aux brouillons locaux et aux signalements lus sur le serveur. */
interface ReportListItem {
  key: string;
  path: string;
  searchLabel: string;
  title: string;
  titlePicto?: GeodesyPointTitlePicto;
  status: LocalReportDraftStatus;
  remoteStatus?: ReportStatus;
  reasonLabel: string;
  createdAt: Date;
  commune?: string;
  voieSuivie?: string;
}

function draftToListItem(
  draft: LocalReportDraft,
  remoteStatuses: Map<number, ReportStatus>,
): ReportListItem {
  return {
    key: draft.id,
    path: `/reports/${draft.id}`,
    searchLabel: `ID_${draft.geodesyId ?? draft.title}`,
    title: draft.title,
    titlePicto: draft.titlePicto,
    status: draft.status,
    remoteStatus: draft.serverId ? remoteStatuses.get(draft.serverId) : undefined,
    reasonLabel: draft.isConform
      ? 'Conforme'
      : (draft.nonConformReasons ?? [])
          .map((reason) => NON_CONFORM_REASON_LABELS[reason as NonConformReason])
          .join(', ') || 'Non conforme',
    createdAt: new Date(draft.createdAt),
    commune: draft.commune,
    voieSuivie: draft.voieSuivie,
  };
}

/** Signalement `gdp-tools` envoyé sans brouillon sur cet appareil (autre appareil, stockage vidé…). */
function serverReportToListItem(report: GroupReport): ReportListItem {
  const geodesyId = report.themeAttributes.id?.trim();

  return {
    key: `server-${report.id}`,
    path: `/reports/history/${report.id}`,
    searchLabel: `ID_${geodesyId || report.id}`,
    title: geodesyId || `Signalement #${report.id}`,
    status: 'sent',
    remoteStatus: report.status,
    reasonLabel: resolveGdpReportReasonLabelFromEtat(report.themeAttributes.etat),
    createdAt: report.createdAt,
  };
}

export function MyReportsPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { drafts, isLoading } = useLocalReportDrafts();
  const remoteStatuses = useSentReportRemoteStatuses(drafts);
  const { currentReports: serverReports, isLoading: isLoadingServerReports } = useUserServerReports();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const items = useMemo(() => {
    const draftServerIds = new Set(drafts.map((draft) => draft.serverId));

    return [
      ...drafts.map((draft) => draftToListItem(draft, remoteStatuses)),
      ...serverReports
        .filter((report) => !draftServerIds.has(report.id))
        .map(serverReportToListItem),
    ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }, [drafts, remoteStatuses, serverReports]);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();

    return items.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) {
        return false;
      }

      return !query || item.searchLabel.toLowerCase().includes(query);
    });
  }, [items, search, statusFilter]);

  return (
    <div className={styles.page}>
      <PageHeader
        title="Signalements"
        showBackButton
        showCloseButton={false}
        onBack={() => navigate('/map')}
      />

      <main className={styles.main}>
        {!isAuthenticated ? (
          <div className={styles.notConnected}>
            <p className="body">
              Vous n'êtes pas connecté. Connectez-vous pour consulter vos signalements.
            </p>

            <Button type="button" className={styles.actionButton} fullWidth onClick={() => navigate('/login')}>
              Se connecter
            </Button>
          </div>
        ) : (
          <>
            <div className={styles.searchWrap}>
              <IconSearch className={styles.searchIcon} aria-hidden />
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Rechercher par ID"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>

            <div className={styles.filterRow}>
              {FILTERS.map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  className={joinCSSClassNames(
                    styles.filterChip,
                    statusFilter === filter.value && styles.filterChipActive,
                  )}
                  onClick={() => setStatusFilter(filter.value)}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            {isLoading || (isLoadingServerReports && items.length === 0) ? (
              <p className={styles.empty}>Chargement…</p>
            ) : filteredItems.length === 0 ? (
              <p className={styles.empty}>Aucun signalement.</p>
            ) : (
              <ul className={styles.reportList}>
                {filteredItems.map((item) => {
                  const statusColors = getLocalReportDraftStatusColors(item.status);
                  const { remoteStatus } = item;

                  return (
                    <li key={item.key}>
                      <button
                        type="button"
                        className={styles.reportCard}
                        style={{
                          '--report-card-hover-color': statusColors.color,
                          '--report-card-hover-rgb': getLocalReportDraftStatusAccentRgb(
                            item.status,
                          ),
                        } as CSSProperties}
                        onClick={() => navigate(item.path, { state: { from: 'reports' } })}
                      >
                        <div className={styles.reportCardHeader}>
                          <GeodesyPointTitle
                            title={item.title}
                            picto={item.titlePicto}
                            className={styles.reportId}
                          />
                          <div className={styles.statusBadges}>
                            <span
                              className={styles.statusBadge}
                              style={{ color: statusColors.color, background: statusColors.background }}
                            >
                              {getLocalReportDraftStatusLabel(item.status)}
                            </span>
                            {remoteStatus ? (
                              <span
                                className={styles.statusBadge}
                                style={getReportInstructionStatusColors(remoteStatus)}
                              >
                                {getReportInstructionStatusLabel(remoteStatus)}
                              </span>
                            ) : null}
                          </div>
                        </div>
                        <p className={styles.reportReason}>
                          <span>{item.reasonLabel}</span>
                          <span className={styles.reportReasonSeparator}>·</span>
                          <span className={styles.reportDateInline}>
                            <IconCalendar className={styles.reportMetaIcon} aria-hidden />
                            {formatRelativeDayLabel(item.createdAt)}
                          </span>
                        </p>
                        {item.voieSuivie || item.commune ? (
                          <div className={styles.reportLocationRow}>
                            <IconLocation className={styles.reportMetaIcon} aria-hidden />
                            <span className={styles.reportLocationText}>
                              {item.commune ? (
                                <span className={styles.reportCommuneText}>{item.commune}</span>
                              ) : null}
                              {item.commune && item.voieSuivie ? (
                                <span className={styles.reportLocationSeparator}>,</span>
                              ) : null}
                              {item.voieSuivie ? (
                                <span className={styles.reportVoieText} title={item.voieSuivie}>
                                  {item.voieSuivie}
                                </span>
                              ) : null}
                            </span>
                          </div>
                        ) : null}
                        <IconAngleRight className={styles.reportChevron} aria-hidden />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}

            <button
              type="button"
              className={styles.historyLink}
              onClick={() => navigate('/reports/history')}
            >
              Mes anciens signalements
            </button>

            <p className={styles.espaceCollaboratifNote}>
              Pour plus de détails sur vos signalements (statut, historique…), rendez-vous sur{' '}
              <ExternalLink href={EXTERNAL_LINKS.ESPACE_COLLABORATIF_PROFILE}>l'espace collaboratif</ExternalLink>.
            </p>
          </>
        )}
      </main>

      <BottomTabbar activeTab="signalements" />
    </div>
  );
}
