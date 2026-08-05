import { useMemo, useState, type CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';

import { BottomTabbar } from '@/app/components/BottomTabbar';
import type { LocalReportDraftStatus } from '@/domain/report/localReportDraft';
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
import { formatRelativeDayLabel, formatTime } from '@/shared/utils/date';
import { joinCSSClassNames } from '@/shared/utils/join';
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
  { value: 'taken_into_account', label: 'Pris en compte' },
  { value: 'rejected', label: 'Rejeté' },
];

export function MyReportsPage() {
  const navigate = useNavigate();
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
                      '--report-card-hover-rgb': getLocalReportDraftStatusAccentRgb(draft.status),
                    } as CSSProperties}
                    onClick={() => navigate(`/reports/${draft.id}`)}
                  >
                    <div className={styles.reportCardHeader}>
                      <span className={styles.reportId}>ID_{draft.geodesyId ?? draft.title}</span>
                      <span
                        className={styles.statusBadge}
                        style={{ color: statusColors.color, background: statusColors.background }}
                      >
                        {getLocalReportDraftStatusLabel(draft.status)}
                      </span>
                    </div>
                    <p className={styles.reportReason}>{reasonLabel}</p>
                    <div className={styles.reportMeta}>
                      <span className={styles.reportMetaItem}>
                        <IconLocation className={styles.reportMetaIcon} aria-hidden />
                        {draft.latitude.toFixed(4)}° N
                      </span>
                      <span className={styles.reportMetaItem}>
                        <IconCalendar className={styles.reportMetaIcon} aria-hidden />
                        {formatRelativeDayLabel(createdAt)} · {formatTime(createdAt)}
                      </span>
                    </div>
                    <IconAngleRight className={styles.reportChevron} aria-hidden />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </main>

      <BottomTabbar activeTab="signalements" />
    </div>
  );
}
