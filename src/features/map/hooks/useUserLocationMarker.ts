import { useEffect } from 'react';

import Feature from 'ol/Feature';
import { asArray } from 'ol/color';
import Point from 'ol/geom/Point';
import { circular } from 'ol/geom/Polygon';
import type Polygon from 'ol/geom/Polygon';
import VectorLayer from 'ol/layer/Vector';
import type Map from 'ol/Map';
import { fromLonLat } from 'ol/proj';
import VectorSource from 'ol/source/Vector';
import { Fill, Icon, Stroke, Style } from 'ol/style';

import { Gdp_Geolocation, type CallbackID, type WatchPositionCallback } from '@/platform/device/geolocation';
import {
  USER_LOCATION_LAYER_NAME,
  USER_LOCATION_MARKER_Z_INDEX,
} from '@/shared/constants/map';
import { getColorCode } from '@/shared/utils/color';

const USER_LOCATION_MARKER_FALLBACK_COLOR = '#26a581';
const USER_LOCATION_MARKER_CONTRAST_FALLBACK = '#ffffff';
/** Même vert que le bouton de géolocalisation actif (`.mapFabActive` / `.mapFabLocked`). */
const USER_LOCATION_ACCURACY_FALLBACK_COLOR = '#26a581';
const USER_LOCATION_ACCURACY_FILL_OPACITY = 0.15;
/** Nombre de sommets du polygone approchant le cercle d'incertitude. */
const USER_LOCATION_ACCURACY_CIRCLE_VERTICES = 64;

function createUserLocationIconSrc(color: string, contrast: string): string {
  const markerSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="42" height="42" viewBox="0 0 42 42">
      <path d="M21 3 L34 35 L21 28 L8 35 Z" fill="${color}" stroke="${contrast}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M21 9 L25.5 28 L21 25 L16.5 28 Z" fill="${contrast}" fill-opacity="0.32"/>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(markerSvg)}`;
}

function createUserLocationStyle(color: string, contrast: string): Style {
  return new Style({
    image: new Icon({
      src: createUserLocationIconSrc(color, contrast),
      anchor: [0.5, 0.5],
      width: 42,
      height: 42,
      rotateWithView: true,
    }),
  });
}

function createUserLocationAccuracyStyle(color: string): Style {
  const [red, green, blue] = asArray(color);

  return new Style({
    fill: new Fill({ color: [red, green, blue, USER_LOCATION_ACCURACY_FILL_OPACITY] }),
    stroke: new Stroke({ color, width: 1 }),
  });
}

interface UseUserLocationMarkerOptions {
  map: Map | null;
  isMapReady: boolean;
  /** Affiche le curseur uniquement quand le suivi de position est actif. */
  enabled?: boolean;
}

export function useUserLocationMarker({
  map,
  isMapReady,
  enabled = true,
}: UseUserLocationMarkerOptions): void {
  useEffect(() => {
    if (!map || !isMapReady || !enabled) {
      return;
    }

    const userLocationColor =
      getColorCode('primary') || getColorCode('action-primary') || USER_LOCATION_MARKER_FALLBACK_COLOR;
    const contrast = getColorCode('white') || USER_LOCATION_MARKER_CONTRAST_FALLBACK;

    const accuracyColor =
      getColorCode('text-primary') || USER_LOCATION_ACCURACY_FALLBACK_COLOR;

    const source = new VectorSource<Feature<Point | Polygon>>();
    const feature = new Feature<Point>();
    const accuracyFeature = new Feature<Polygon>();
    let watchId: CallbackID | null = null;
    let cancelled = false;

    const markerLayer = new VectorLayer({
      source,
      className: 'ol-layer gdp-user-location',
      updateWhileAnimating: true,
      updateWhileInteracting: true,
      properties: {
        name: USER_LOCATION_LAYER_NAME,
        title: 'Position utilisateur',
        displayInLayerSwitcher: false,
      },
      zIndex: USER_LOCATION_MARKER_Z_INDEX,
    });

    const updateMarkerPosition: WatchPositionCallback = (position) => {
      if (!position || cancelled) {
        return;
      }

      const { longitude, latitude, accuracy } = position.coords;
      feature.setGeometry(new Point(fromLonLat([longitude, latitude])));

      // Cercle géodésique (rayon en mètres) reprojeté : reste juste en Web Mercator, où un
      // mètre au sol ne vaut pas une unité de carte hors de l'équateur.
      accuracyFeature.setGeometry(
        Number.isFinite(accuracy) && accuracy > 0
          ? circular([longitude, latitude], accuracy, USER_LOCATION_ACCURACY_CIRCLE_VERTICES).transform(
              'EPSG:4326',
              'EPSG:3857',
            )
          : undefined,
      );
    };

    // Overlay non géré : reste au-dessus des fonds / WFS, y compris pendant le recentrage.
    markerLayer.setMap(map);
    feature.setStyle(createUserLocationStyle(userLocationColor, contrast));
    accuracyFeature.setStyle(createUserLocationAccuracyStyle(accuracyColor));
    // Disque ajouté en premier : dessiné sous la flèche.
    source.addFeatures([accuracyFeature, feature]);

    void (async () => {
      const initialPosition = await Gdp_Geolocation.getUsersLocation({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 1000,
      });

      if (!cancelled) {
        updateMarkerPosition(initialPosition);
      }

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

      markerLayer.setMap(null);
    };
  }, [enabled, isMapReady, map]);
}
