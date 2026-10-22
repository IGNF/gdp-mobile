import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RiBaseStationFill } from 'react-icons/ri';

import { BottomTabbar } from '@/app/components/BottomTabbar';
import { RecentSearchList } from '@/features/search/components/RecentSearchList';
import { useAddressSearchHistory } from '@/features/search/hooks/useAddressSearchHistory';
import { useSearchGeoportail } from '@/features/search/hooks/useSearchGeoportail';
import { useMapOutletContext } from '@/pages/map/mapOutletContext';
import { PageHeader } from '@/shared/ui/PageHeader';
import { joinCSSClassNames } from '@/shared/utils/join';
import IconAngleRight from '@/shared/assets/icons/icon-angle-right.svg?react';
import IconSearch from '@/shared/assets/icons/icon-search.svg?react';
import layout from '@/shared/styles/tabPage.module.css';

import styles from './SearchPage.module.css';

export function SearchPage() {
  const navigate = useNavigate();
  const { map, isMapReady, onSelectSearchResult } = useMapOutletContext();
  const [searchContainer, setSearchContainer] = useState<HTMLDivElement | null>(null);
  const { entries: historyEntries } = useAddressSearchHistory(true);

  const { selectHistoryEntry } = useSearchGeoportail({
    map,
    addressContainer: searchContainer,
    isOpen: isMapReady,
    placeholder: 'Rechercher une adresse',
    onSelect: onSelectSearchResult,
  });

  return (
    <div className={joinCSSClassNames(layout.page, layout.pageOverlay)}>
      <PageHeader
        title="Recherche"
        className={layout.pageHeader}
        showBackButton
        showCloseButton={false}
        onBack={() => navigate('/map')}
      />

      <main className={layout.main}>
        <div className={joinCSSClassNames(layout.searchWrap, styles.searchField)}>
          <IconSearch className={layout.searchIcon} aria-hidden />
          <div ref={setSearchContainer} className={styles.searchContainer} />
        </div>

        <div className={styles.content}>
          <button
            type="button"
            className={joinCSSClassNames(layout.card, styles.navCard)}
            onClick={() => navigate('/map/search/rgp')}
          >
            <span className={styles.navCardIconWrap} aria-hidden>
              <RiBaseStationFill className={styles.navCardIcon} />
            </span>
            <span className={styles.navCardLabel}>Stations RGP</span>
            <IconAngleRight className={layout.cardChevron} aria-hidden />
          </button>

          <RecentSearchList entries={historyEntries} onSelect={selectHistoryEntry} />
        </div>
      </main>

      <div className={layout.tabbarBand}>
        <BottomTabbar activeTab="recherche" />
      </div>
    </div>
  );
}
