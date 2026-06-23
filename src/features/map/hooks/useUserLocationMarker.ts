import { useEffect } from 'react';

import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import VectorLayer from 'ol/layer/Vector';
import type Map from 'ol/Map';
import { fromLonLat } from 'ol/proj';
import VectorSource from 'ol/source/Vector';
import { Icon, Style } from 'ol/style';

import { Gdp_Geolocation, type CallbackID, type WatchPositionCallback } from '@/platform/device/geolocation';
import {
  USER_LOCATION_LAYER_NAME,
  USER_LOCATION_MARKER_Z_INDEX,
} from '@/shared/constants/map';
import { getColorCode } from '@/shared/utils/color';

function createUserLocationIconSrc(color: string): string {
  const contrast = getColorCode('white');
  const markerSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="42" height="42" viewBox="0 0 42 42">
      <path d="M21 3 L34 35 L21 28 L8 35 Z" fill="${color}" stroke="${contrast}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M21 9 L25.5 28 L21 25 L16.5 28 Z" fill="${contrast}" fill-opacity="0.32"/>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(markerSvg)}`;
}

function createUserLocationStyle(color: string): Style {
  return new Style({
    image: new Icon({
      src: createUserLocationIconSrc(color),
      anchor: [0.5, 0.5],
      rotateWithView: true,
    }),
  });
}

interface UseUserLocationMarkerOptions {
  map: Map | null;
  isMapReady: boolean;
}

export function useUserLocationMarker({ map, isMapReady }: UseUserLocationMarkerOptions): void {
  useEffect(() => {
    if (!map || !isMapReady) {
      return;
    }

    const userLocationColor = getColorCode('tertiary');
    if (!userLocationColor) {
      return;
    }

    const source = new VectorSource<Feature<Point>>();
    const feature = new Feature<Point>();
    let watchId: CallbackID | null = null;
    let cancelled = false;

    const markerLayer = new VectorLayer({
      source,
      properties: {
        name: USER_LOCATION_LAYER_NAME,
        title: 'Position utilisateur',
        displayInLayerSwitcher: false,
      },
      zIndex: USER_LOCATION_MARKER_Z_INDEX,
    });

    const updateMarkerPosition: WatchPositionCallback = (position) => {
      if (!position) {
        return;
      }

      const { longitude, latitude } = position.coords;
      feature.setGeometry(new Point(fromLonLat([longitude, latitude])));
    };

    map.addLayer(markerLayer);
    feature.setStyle(createUserLocationStyle(userLocationColor));
    source.addFeature(feature);

    void (async () => {
      watchId = await Gdp_Geolocation.watchUsersLocation(updateMarkerPosition, {
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

      map.removeLayer(markerLayer);
    };
  }, [isMapReady, map]);
}
