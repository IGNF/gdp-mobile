import type Map from 'ol/Map';
import type { Coordinate } from 'ol/coordinate';
import { useOutletContext } from 'react-router-dom';

/** Contexte transmis par `MapPage` aux écrans enfants de `/map` (recherche, stations RGP). */
export interface MapOutletContext {
  map: Map | null;
  isMapReady: boolean;
  /** Coordonnée en projection carte : pose le marqueur, recentre et revient sur la carte. */
  onSelectSearchResult: (coordinate: Coordinate) => void;
  onSelectRgpStation: (longitude: number, latitude: number) => void;
}

export function useMapOutletContext(): MapOutletContext {
  return useOutletContext<MapOutletContext>();
}
