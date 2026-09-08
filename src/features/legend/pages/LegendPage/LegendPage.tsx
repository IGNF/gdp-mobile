import { MapOverlaySheet } from '@/features/map/components/MapOverlaySheet';

export interface LegendPageProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LegendPage({ isOpen, onClose }: LegendPageProps) {
  return (
    <MapOverlaySheet isOpen={isOpen} onClose={onClose} titleAlign="left" title="Légende" ariaLabel="Légende">
      <p className="debug-banner">TODO — Écran pas encore développé</p>
      <p className="page-subtitle">
        Symboles des repères, clusters et stations affichés sur la carte.
      </p>
    </MapOverlaySheet>
  );
}
