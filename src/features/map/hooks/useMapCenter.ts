import { useEffect, useState } from 'react';
import type Map from 'ol/Map';
import { toLonLat } from 'ol/proj';

export interface MapCenter {
  longitude: number;
  latitude: number;
}

function readMapCenter(map: Map): MapCenter | null {
  const center = map.getView().getCenter();
  if (!center) {
    return null;
  }

  const [longitude, latitude] = toLonLat(center);
  return { longitude, latitude };
}

/** Centre de la carte (WGS84), mis à jour à chaque fin de déplacement. `null` si désactivé. */
export function useMapCenter(map: Map | null, enabled = true): MapCenter | null {
  const [center, setCenter] = useState<MapCenter | null>(null);

  // Désactivé : centre vidé pendant le rendu, l'effet ne fait que s'abonner à la carte.
  if ((!enabled || !map) && center !== null) {
    setCenter(null);
  }

  useEffect(() => {
    if (!enabled || !map) {
      return;
    }

    const update = () => setCenter(readMapCenter(map));
    update();
    map.on('moveend', update);
    return () => {
      map.un('moveend', update);
    };
  }, [enabled, map]);

  return center;
}
