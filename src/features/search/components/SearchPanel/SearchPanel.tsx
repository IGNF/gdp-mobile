import { useRef } from 'react';
import type Map from 'ol/Map';

import { useSearchGeoportail } from '@/features/search/hooks/useSearchGeoportail';
import IconClose from '@/shared/assets/icons/icon-close.svg?react';

import styles from './SearchPanel.module.css';

export interface SearchPanelProps {
  isOpen: boolean;
  onClose: () => void;
  map: Map | null;
}

export function SearchPanel({ isOpen, onClose, map }: SearchPanelProps) {
  const addressContainerRef = useRef<HTMLDivElement>(null);

  const { clearMarker } = useSearchGeoportail({
    map,
    addressContainerRef,
    isOpen,
  });

  const handleClose = () => {
    clearMarker();
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <span className={styles.title}>Rechercher une adresse</span>
        <button
          type="button"
          className={styles.closeButton}
          onClick={handleClose}
          aria-label="Fermer la recherche"
        >
          <IconClose className={styles.closeIcon} />
        </button>
      </div>
      <div ref={addressContainerRef} className={styles.searchContainer} />
    </div>
  );
}
