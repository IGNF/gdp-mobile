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
import { TrackedExternalLink } from '@/infra/analytics/TrackedExternalLink';
import { PageHeader } from '@/shared/ui/PageHeader';
import IconAngleRight from '@/shared/assets/icons/icon-angle-right.svg?react';
import IconLocation from '@/shared/assets/icons/icon-location.svg?react';
import IconSearch from '@/shared/assets/icons/icon-search.svg?react';

import layout from '@/shared/styles/tabPage.module.css';

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
    <div className={layout.page}>
      <PageHeader
        title="Mes Signalements"
        className={layout.pageHeader}
        showBackButton
        showCloseButton={false}
        onBack={() => navigate('/map')}
      />

      <main className={layout.main}>
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
            <div className={layout.searchWrap}>
              <IconSearch className={layout.searchIcon} aria-hidden />
              <input
                type="text"
                className={layout.searchInput}
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
              <p className={layout.empty}>Chargement…</p>
            ) : filteredItems.length === 0 ? (
              <p className={layout.empty}>Aucun signalement.</p>
            ) : (
              <ul className={layout.cardList}>
                {filteredItems.map((item) => {
                  const location = [item.commune, item.voieSuivie].filter(Boolean).join(', ');
                  // Chevron « ouvrir » au bout de la dernière ligne de la carte.
                  const chevron = <IconAngleRight className={styles.reportChevron} aria-hidden />;
                  const lastRow = location ? 'location' : item.positionModified ? 'reason' : 'header';

                  return (
                    <li key={item.key}>
                      <button
                        type="button"
                        className={joinCSSClassNames(layout.card, styles.reportCard, styles.reportCardSpaced)}
                        style={{
                          '--card-hover-rgb': item.accentRgb,
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
                          {lastRow === 'header' ? chevron : null}
                        </div>
                        {item.positionModified ? (
                          <p className={styles.reportReason}>
                            <span className={styles.reportRowText}>Position modifiée</span>
                            {lastRow === 'reason' ? chevron : null}
                          </p>
                        ) : null}
                        {location ? (
                          <div className={styles.reportLocationRow}>
                            <IconLocation className={styles.reportMetaIcon} aria-hidden />
                            <span className={styles.reportRowText} title={location}>
                              {location}
                            </span>
                            {chevron}
                          </div>
                        ) : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}

            {serverHistory.error ? (
              <p className={layout.empty}>
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
              <TrackedExternalLink
                href={EXTERNAL_LINKS.ESPACE_COLLABORATIF_PROFILE}
                tracking={{ context: 'Mes signalements', label: 'Profil Espace collaboratif' }}
              >
                l'espace collaboratif
              </TrackedExternalLink>.
            </p>
          </>
        )}
      </main>

      <div className={layout.tabbarBand}>
        <BottomTabbar activeTab="signalements" />
      </div>
    </div>
  );
}
