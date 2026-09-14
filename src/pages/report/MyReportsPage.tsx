import { useMemo, useState, type CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import { GeodesyPointTitle } from '@ign/gdp-tools/react';

import { BottomTabbar } from '@/app/components/BottomTabbar';
import type { LocalReportDraftStatus } from '@/domain/report/localReportDraft';
import { useAuth } from '@/features/auth/hooks/useAuth';
import {
  NON_CONFORM_REASON_LABELS,
  type NonConformReason,
} from '@/features/report/components/GeodesyPointReportWizard';
import { useLocalReportDrafts } from '@/features/report/hooks/useLocalReportDrafts';
import {
  getLocalReportDraftStatusAccentRgb,
  getLocalReportDraftStatusColors,
  getLocalReportDraftStatusLabel,
} from '@/features/report/utils/localReportDraftStatus';
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

export function MyReportsPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { drafts, isLoading } = useLocalReportDrafts();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const filteredDrafts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return drafts.filter((draft) => {
      if (statusFilter !== 'all' && draft.status !== statusFilter) {
        return false;
      }

      if (query) {
        const idLabel = `ID_${draft.geodesyId ?? draft.title}`.toLowerCase();
        if (!idLabel.includes(query)) {
          return false;
        }
      }

      return true;
    });
  }, [drafts, search, statusFilter]);

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
            <Button type="button" fullWidth onClick={() => navigate('/login')}>
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
            ) : filteredDrafts.length === 0 ? (
              <p className={styles.empty}>Aucun signalement.</p>
            ) : (
              <ul className={styles.reportList}>
                {filteredDrafts.map((draft) => {
                  const statusColors = getLocalReportDraftStatusColors(draft.status);
                  const reasonLabel = draft.isConform
                    ? 'Conforme'
                    : (draft.nonConformReasons ?? [])
                        .map((reason) => NON_CONFORM_REASON_LABELS[reason as NonConformReason])
                        .join(', ') || 'Non conforme';
                  const createdAt = new Date(draft.createdAt);

                  return (
                    <li key={draft.id}>
                      <button
                        type="button"
                        className={styles.reportCard}
                        style={{
                          '--report-card-hover-color': statusColors.color,
                          '--report-card-hover-rgb': getLocalReportDraftStatusAccentRgb(
                            draft.status,
                          ),
                        } as CSSProperties}
                        onClick={() => navigate(`/reports/${draft.id}`)}
                      >
                        <div className={styles.reportCardHeader}>
                          <GeodesyPointTitle
                            title={draft.title}
                            picto={draft.titlePicto}
                            className={styles.reportId}
                          />
                          <span
                            className={styles.statusBadge}
                            style={{ color: statusColors.color, background: statusColors.background }}
                          >
                            {getLocalReportDraftStatusLabel(draft.status)}
                          </span>
                        </div>
                        <p className={styles.reportReason}>
                          <span>{reasonLabel}</span>
                          <span className={styles.reportReasonSeparator}>·</span>
                          <span className={styles.reportDateInline}>
                            <IconCalendar className={styles.reportMetaIcon} aria-hidden />
                            {formatRelativeDayLabel(createdAt)}
                          </span>
                        </p>
                        {draft.voieSuivie || draft.commune ? (
                          <div className={styles.reportLocationRow}>
                            <IconLocation className={styles.reportMetaIcon} aria-hidden />
                            <span className={styles.reportLocationText}>
                              {draft.commune ? (
                                <span className={styles.reportCommuneText}>{draft.commune}</span>
                              ) : null}
                              {draft.commune && draft.voieSuivie ? (
                                <span className={styles.reportLocationSeparator}>,</span>
                              ) : null}
                              {draft.voieSuivie ? (
                                <span className={styles.reportVoieText} title={draft.voieSuivie}>
                                  {draft.voieSuivie}
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
