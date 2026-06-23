import { MapOverlaySheet } from '@/features/map/components/MapOverlaySheet';

import styles from './MapLayerInfoPanel.module.css';

export interface MapLayerInfoPanelProps {
  isOpen: boolean;
  title: string;
  description: string;
  onClose: () => void;
  onBack: () => void;
}

export function MapLayerInfoPanel({
  isOpen,
  title,
  description,
  onClose,
  onBack,
}: MapLayerInfoPanelProps) {
  return (
    <MapOverlaySheet
      isOpen={isOpen}
      onClose={onClose}
      showBackButton
      onBack={onBack}
      ariaLabel={title}
    >
      <h3 className={styles.title}>{title}</h3>
      <div className={styles.preview} aria-hidden />
      <p className={styles.description}>{description}</p>
    </MapOverlaySheet>
  );
}
