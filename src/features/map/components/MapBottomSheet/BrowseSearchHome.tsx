import type { AddressSearchHistoryEntry } from '@/features/search/utils/addressSearchHistory';
import IconAngleRight from '@/shared/assets/icons/icon-angle-right.svg?react';
import IconClock from '@/shared/assets/icons/icon-clock.svg?react';
import IconSpeaker from '@/shared/assets/icons/icon-speaker.svg?react';

import styles from './MapBottomSheet.module.css';

export interface BrowseSearchHomeProps {
  historyEntries: readonly AddressSearchHistoryEntry[];
  onOpenRgpList: () => void;
  onSelectHistoryEntry: (entry: AddressSearchHistoryEntry) => void;
}

export function BrowseSearchHome({
  historyEntries,
  onOpenRgpList,
  onSelectHistoryEntry,
}: BrowseSearchHomeProps) {
  return (
    <div className={styles.browseHome}>
      <button type="button" className={styles.rgpNavigateRow} onClick={onOpenRgpList}>
        <span className={styles.rgpNavigateIconWrap} aria-hidden>
          <IconSpeaker className={styles.rgpNavigateIcon} />
        </span>
        <span className={styles.rgpNavigateLabel}>Stations RGP</span>
        <IconAngleRight className={styles.rgpNavigateChevron} aria-hidden />
      </button>

      <section className={styles.recentSearchesSection}>
        <h2 className={styles.recentSearchesTitle}>Recherches récentes</h2>
        {historyEntries.length === 0 ? (
          <p className={styles.recentSearchesEmpty}>Aucune recherche récente.</p>
        ) : (
          <ul className={styles.recentSearchesList}>
            {historyEntries.map((entry) => (
              <li key={entry.id}>
                <button
                  type="button"
                  className={styles.recentSearchItem}
                  onClick={() => onSelectHistoryEntry(entry)}
                >
                  <span className={styles.recentSearchIconWrap} aria-hidden>
                    <IconClock className={styles.recentSearchIcon} />
                  </span>
                  <span className={styles.recentSearchText}>
                    <span className={styles.recentSearchTitle}>{entry.title}</span>
                    {entry.subtitle ? (
                      <span className={styles.recentSearchSubtitle}>{entry.subtitle}</span>
                    ) : null}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
