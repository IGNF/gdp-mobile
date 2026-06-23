import { MapOverlaySheet } from '@/features/map/components/MapOverlaySheet';

import typography from '@/shared/styles/typography.module.css';

export interface LegendPageProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LegendPage({ isOpen, onClose }: LegendPageProps) {
  return (
    <MapOverlaySheet isOpen={isOpen} onClose={onClose} title="Légende" ariaLabel="Légende">
      <p className={typography.subtitle}>
        Symboles des repères, clusters et stations affichés sur la carte.
      </p>
      <p className="debug-banner">TODO — Écran pas encore développé</p>
    </MapOverlaySheet>
  );
}
