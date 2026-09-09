import { MapOverlaySheet } from '@/features/map/components/MapOverlaySheet';

import styles from './LegendPage.module.css';

export interface LegendPageProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LegendPage({ isOpen, onClose }: LegendPageProps) {
  return (
    <MapOverlaySheet isOpen={isOpen} onClose={onClose} titleAlign="left" title="Légende" ariaLabel="Légende">
     <main className={` ${styles.content}`}>
        <p className="debug-banner">TODO — Écran pas encore développé</p>
        <p className="page-subtitle">
          Symboles des repères, clusters et stations affichés sur la carte.
        </p>
      </main>
    </MapOverlaySheet>
  );
}
