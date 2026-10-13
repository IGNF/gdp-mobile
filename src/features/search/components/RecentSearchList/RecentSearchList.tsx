import type { AddressSearchHistoryEntry } from '@/features/search/utils/addressSearchHistory';
import IconClock from '@/shared/assets/icons/icon-clock.svg?react';
import { joinCSSClassNames } from '@/shared/utils/join';
import layout from '@/shared/styles/tabPage.module.css';

import styles from './RecentSearchList.module.css';

export interface RecentSearchListProps {
  entries: readonly AddressSearchHistoryEntry[];
  onSelect: (entry: AddressSearchHistoryEntry) => void;
}

export function RecentSearchList({ entries, onSelect }: RecentSearchListProps) {
  return (
    <section className={styles.section}>
      <h2 className={styles.title}>Recherches récentes</h2>
      {entries.length === 0 ? (
        <p className={layout.empty}>Aucune recherche récente.</p>
      ) : (
        <ul className={joinCSSClassNames(layout.cardSurface, styles.list)}>
          {entries.map((entry) => (
            <li key={entry.id}>
              <button type="button" className={styles.item} onClick={() => onSelect(entry)}>
                <span className={styles.iconWrap} aria-hidden>
                  <IconClock className={styles.icon} />
                </span>
                <span className={styles.text}>
                  <span className={styles.itemTitle}>{entry.title}</span>
                  {entry.subtitle ? (
                    <span className={styles.itemSubtitle}>{entry.subtitle}</span>
                  ) : null}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
