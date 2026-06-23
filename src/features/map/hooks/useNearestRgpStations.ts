import {
  GEODESY_ANNEX_LAYERS,
  clearGeodesyAnnexFeaturesCache,
  getGeodesyAnnexFeaturesLastLoadedAt,
  isGdpRgp2StationAvailable,
  loadGeodesyAnnexFeatures,
  parseGdpRgp2DispoStates,
  reloadGeodesyAnnexLayerOnMap,
  type GdpRgp2DispoState,
} from '@ign/gdp-tools';
import type Map from 'ol/Map';
import Point from 'ol/geom/Point';
import { toLonLat } from 'ol/proj';
import { useCallback, useEffect, useState } from 'react';

import { distanceKm } from '@/shared/utils/geo';

const RGP_LAYER = GEODESY_ANNEX_LAYERS.find((layer) => layer.id === 'GDP_RGP2');
const NEAREST_RGP_COUNT = 10;
const MAX_RGP_DISTANCE_KM = 100;

export interface NearestRgpStation {
  id: string;
  name: string;
  commune: string;
  longitude: number;
  latitude: number;
  distanceKm: number;
  isAvailable: boolean;
  dispoStates: readonly GdpRgp2DispoState[];
}

export interface UseNearestRgpStationsOptions {
  map: Map | null;
  isMapReady: boolean;
  limit?: number;
}

interface RefreshStationsOptions {
  silent?: boolean;
}

export function useNearestRgpStations({
  map,
  isMapReady,
  limit = NEAREST_RGP_COUNT,
}: UseNearestRgpStationsOptions) {
  const [stations, setStations] = useState<NearestRgpStation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isReloading, setIsReloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastLoadedAt, setLastLoadedAt] = useState<Date | null>(null);

  const syncLastLoadedAt = useCallback(() => {
    if (!RGP_LAYER) {
      setLastLoadedAt(null);
      return;
    }

    setLastLoadedAt(getGeodesyAnnexFeaturesLastLoadedAt({ definition: RGP_LAYER }));
  }, []);

  const refresh = useCallback(async (options?: RefreshStationsOptions) => {
    if (!map || !isMapReady || !RGP_LAYER) {
      return;
    }

    const center = map.getView().getCenter();
    if (!center) {
      return;
    }

    const [longitude, latitude] = toLonLat(center);

    if (!options?.silent) {
      setIsLoading(true);
    }
    setError(null);

    try {
      const features = await loadGeodesyAnnexFeatures({ definition: RGP_LAYER });
      const ranked = features
        .map((feature) => {
          const geometry = feature.getGeometry();
          if (!(geometry instanceof Point)) {
            return null;
          }

          const [stationLon, stationLat] = toLonLat(geometry.getCoordinates());
          const name = String(feature.get('nom') ?? 'Station RGP');
          const commune = String(feature.get('commune') ?? '');
          const dispo = feature.get('dispo');

          return {
            id: `${name}-${stationLon}-${stationLat}`,
            name,
            commune,
            longitude: stationLon,
            latitude: stationLat,
            distanceKm: distanceKm({ longitude, latitude }, { longitude: stationLon, latitude: stationLat }),
            isAvailable: isGdpRgp2StationAvailable(dispo),
            dispoStates: parseGdpRgp2DispoStates(dispo),
          } satisfies NearestRgpStation;
        })
        .filter((station): station is NearestRgpStation => station !== null)
        .filter((station) => station.distanceKm <= MAX_RGP_DISTANCE_KM)
        .sort((left, right) => left.distanceKm - right.distanceKm)
        .slice(0, limit);

      setStations(ranked);
      syncLastLoadedAt();
    } catch {
      setError('Impossible de charger les stations RGP.');
      setStations([]);
    } finally {
      if (!options?.silent) {
        setIsLoading(false);
      }
    }
  }, [isMapReady, limit, map, syncLastLoadedAt]);

  const reloadFromServer = useCallback(async () => {
    if (!RGP_LAYER || isReloading) {
      return;
    }

    setIsReloading(true);
    setError(null);

    try {
      clearGeodesyAnnexFeaturesCache(RGP_LAYER);

      if (map) {
        try {
          await reloadGeodesyAnnexLayerOnMap(map, 'GDP_RGP2');
        } catch {
          await loadGeodesyAnnexFeatures({ definition: RGP_LAYER });
        }
      } else {
        await loadGeodesyAnnexFeatures({ definition: RGP_LAYER });
      }

      await refresh({ silent: true });
    } catch {
      setError('Impossible de mettre à jour les stations RGP.');
    } finally {
      setIsReloading(false);
    }
  }, [isReloading, map, refresh]);

  useEffect(() => {
    if (!map || !isMapReady) {
      return;
    }

    void refresh();

    const handleMoveEnd = () => {
      void refresh();
    };

    map.on('moveend', handleMoveEnd);
    return () => {
      map.un('moveend', handleMoveEnd);
    };
  }, [isMapReady, map, refresh]);

  return { stations, isLoading, isReloading, error, lastLoadedAt, refresh, reloadFromServer };
}
