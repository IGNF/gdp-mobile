import { useMemo, useState, type CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import { GeodesyPointTitle } from '@ign/gdp-tools/react';

import { BottomTabbar } from '@/app/components/BottomTabbar';
import type { GeodesyPointRef } from '@ign/gdp-tools';

import type { LocalReportDraftStatus } from '@/domain/report/localReportDraft';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { GDP_REPORT_SUBMISSION_THEME } from '@/features/report/constants/reportApi';
import { useLocalReportDrafts } from '@/features/report/hooks/useLocalReportDrafts';
import { useReportGeodesyPoints } from '@/features/report/hooks/useReportGeodesyPoints';
import { useUserReportHistory } from '@/features/report/hooks/useUserReportHistory';
import {
  buildReportListItems,
  readGroupReportPointRef,
} from '@/features/report/utils/reportListItems';
import { formatRelativeDayLabel } from '@/shared/utils/date';
import { joinCSSClassNames } from '@/shared/utils/join';
import { EXTERNAL_LINKS } from '@/shared/constants/externalLinks';
import { Button } from '@/shared/ui/Button';
import { ExternalLink } from '@/shared/ui/ExternalLink';
import { PageHeader } from '@/shared/ui/PageHeader';
import IconAngleRight from '@/shared/assets/icons/icon-angle-right.svg?react';
import IconLocation from '@/shared/assets/icons/icon-location.svg?react';
import IconSearch from '@/shared/assets/icons/icon-search.svg?react';

import styles from './MyReportsPage.module.css';

type StatusFilter = 'all' | LocalReportDraftStatus;

/** Signalements envoyés par cette version de l'app (les anciens, thème `Géodésie`, sont dans l'historique). */
const SENT_REPORT_THEMES = [GDP_REPORT_SUBMISSION_THEME];

const FILTERS: Array<{ value: StatusFilter; label: string }> = [
  { value: 'all', label: 'Tous' },
  { value: 'not_sent', label: 'Pas envoyés' },
  { value: 'sent', label: 'Envoyés' },
];

export function MyReportsPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { drafts, isLoading: isLoadingDrafts } = useLocalReportDrafts();
  const serverHistory = useUserReportHistory(SENT_REPORT_THEMES);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const serverReports = serverHistory.isLoaded ? serverHistory.reports : null;

  // Seuls les signalements sans brouillon local sur cet appareil ont besoin du WFS.
  const pointRefs = useMemo(() => {
    const localServerIds = new Set(drafts.map((draft) => draft.serverId));
    return (serverReports ?? [])
      .filter((report) => !localServerIds.has(report.id))
      .map(readGroupReportPointRef)
      .filter((ref): ref is GeodesyPointRef => ref !== null);
  }, [drafts, serverReports]);
  const points = useReportGeodesyPoints(pointRefs);

  const items = useMemo(
    () => buildReportListItems(drafts, serverReports, points),
    [drafts, serverReports, points],
  );

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();

    return items.filter((item) => {
      if (statusFilter !== 'all' && item.filterStatus !== statusFilter) {
        return false;
      }

      return !query || item.searchLabel.toLowerCase().includes(query);
    });
  }, [items, search, statusFilter]);

  const isLoading = isLoadingDrafts || (serverHistory.isLoading && items.length === 0);

  return (
    <div className={styles.page}>
      <PageHeader
        title="Mes Signalements"
        className={styles.pageHeader}
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

            {isLoading ? (
              <p className={styles.empty}>Chargement…</p>
            ) : filteredItems.length === 0 ? (
              <p className={styles.empty}>Aucun signalement.</p>
            ) : (
              <ul className={styles.reportList}>
                {filteredItems.map((item) => (
                  <li key={item.key}>
                    <button
                      type="button"
                      className={joinCSSClassNames(styles.reportCard, styles.reportCardSpaced)}
                      style={{
                        '--report-card-hover-color': item.statusColors.color,
                        '--report-card-hover-rgb': item.accentRgb,
                      } as CSSProperties}
                      onClick={() => navigate(item.detailPath, { state: { from: 'reports' } })}
                    >
                      <div className={styles.reportCardHeader}>
                        <span className={styles.reportTitleGroup}>
                          <GeodesyPointTitle
                            title={item.title}
                            picto={item.titlePicto}
                            className={styles.reportId}
                          />
                          <span className={styles.reportDate}>
                            {formatRelativeDayLabel(item.createdAt)}
                          </span>
                        </span>
                        <span
                          className={styles.statusBadge}
                          style={{ color: item.statusColors.color, background: item.statusColors.background }}
                        >
                          {item.statusLabel}
                        </span>
                      </div>
                      {item.positionModified ? (
                        <p className={styles.reportReason}>Position modifiée</p>
                      ) : null}
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
                ))}
              </ul>
            )}

            {serverHistory.error ? (
              <p className={styles.empty}>
                Signalements envoyés indisponibles pour le moment : seuls ceux de cet appareil sont affichés.
              </p>
            ) : null}

            {serverHistory.hasMore ? (
              <Button
                type="button"
                variant="outline"
                fullWidth
                onClick={serverHistory.loadMore}
                loading={serverHistory.isLoadingMore}
              >
                Charger plus
              </Button>
            ) : null}

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

      <div className={styles.tabbarFloat}>
        <BottomTabbar activeTab="signalements" />
      </div>
    </div>
  );
}
