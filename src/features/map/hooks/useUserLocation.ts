import { useEffect, useState } from 'react';

import { Gdp_Geolocation, type CallbackID, type WatchPositionCallback } from '@/platform/device/geolocation';

export interface UserLocation {
  longitude: number;
  latitude: number;
}

export interface UseUserLocationOptions {
  enabled?: boolean;
}

/**
 * Hook pour suivre la position GPS de l'utilisateur.
 * Retourne null si la géolocalisation n'est pas disponible, désactivée, ou si enabled=false.
 */
export function useUserLocation(options: UseUserLocationOptions = {}): UserLocation | null {
  const { enabled = true } = options;
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);

  useEffect(() => {
    if (!enabled) {
      setUserLocation(null);
      return;
    }

    let watchId: CallbackID | null = null;
    let cancelled = false;

    const updateLocation: WatchPositionCallback = (position) => {
      if (!position || cancelled) {
        return;
      }

      const { longitude, latitude } = position.coords;
      setUserLocation({ longitude, latitude });
    };

    void (async () => {
      watchId = await Gdp_Geolocation.watchUsersLocation(updateLocation, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 1000,
        minimumUpdateInterval: 1000,
      });

      if (cancelled && watchId) {
        void Gdp_Geolocation.clearWatch(watchId);
      }
    })();

    return () => {
      cancelled = true;

      if (watchId) {
        void Gdp_Geolocation.clearWatch(watchId);
      }

      setUserLocation(null);
    };
  }, [enabled]);

  return userLocation;
}
