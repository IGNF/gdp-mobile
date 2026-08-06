import { MapOverlaySheet } from '@/features/map/components/MapOverlaySheet';

import styles from './MapLayerInfoPanel.module.css';

export interface MapLayerInfoPanelProps {
  isOpen: boolean;
  title: string;
  description: string;
  legend?: string;
  thumbnail?: string;
  onClose: () => void;
  onBack: () => void;
}

export function MapLayerInfoPanel({
  isOpen,
  title,
  description,
  legend,
  thumbnail,
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
      {thumbnail ? (
        <div className={styles.preview}>
          <img src={thumbnail} alt="" className={styles.previewImage} />
        </div>
      ) : null}
      <p className={styles.description}>{description}</p>
      {legend ? (
        <div className={styles.legend}>
          <h3 className={styles.legendTitle}>Légende</h3>
          <img src={legend} alt="Légende" className={styles.previewImage} />
        </div>
      ) : null}
    </MapOverlaySheet>
  );
}
