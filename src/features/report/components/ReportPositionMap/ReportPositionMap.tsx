import { useEffect, useRef } from 'react';

import Collection from 'ol/Collection';
import Feature from 'ol/Feature';
import Map from 'ol/Map';
import View from 'ol/View';
import Point from 'ol/geom/Point';
import { defaults as defaultControls } from 'ol/control';
import { defaults as defaultInteractions } from 'ol/interaction';
import Translate from 'ol/interaction/Translate';
import VectorLayer from 'ol/layer/Vector';
import { fromLonLat, toLonLat } from 'ol/proj';
import VectorSource from 'ol/source/Vector';
import { Icon, Style } from 'ol/style';
import 'ol/ol.css';

import {
  createGeoportailLayer,
  getGeoportailLayerTitle,
  preloadGeoportailCapabilities,
} from '@/infra/map/openlayers/geoportailLayers';
import {
  DEFAULT_MAP_CENTER_LON_LAT,
  GEOPORTAIL_LAYERS,
  REPORT_POSITION_MAP_DEFAULT_ZOOM,
} from '@/shared/constants/map';
import { Loading } from '@/shared/ui/Loading';
import { getColorCode } from '@/shared/utils/color';

import styles from './ReportPositionMap.module.css';

export interface ReportPositionMapProps {
  longitude: number | null;
  latitude: number | null;
  initialLongitude?: number | null;
  initialLatitude?: number | null;
  canResetPosition?: boolean;
  isLocating?: boolean;
  onPositionChange: (position: { longitude: number; latitude: number }) => void;
  onResetPosition?: () => void;
}

function createReportMarkerIconSrc(color: string): string {
  const markerSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36">
      <circle cx="18" cy="18" r="14" fill="${color}" fill-opacity="0.2"/>
      <circle cx="18" cy="18" r="7" fill="${color}" stroke="#ffffff" stroke-width="3"/>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(markerSvg)}`;
}

function createReportMarkerStyle(color: string): Style {
  return new Style({
    image: new Icon({
      src: createReportMarkerIconSrc(color),
      anchor: [0.5, 0.5],
      scale: 1,
    }),
  });
}

export function ReportPositionMap({
  longitude,
  latitude,
  initialLongitude = null,
  initialLatitude = null,
  canResetPosition = false,
  isLocating = false,
  onPositionChange,
  onResetPosition,
}: ReportPositionMapProps) {
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);
  const markerFeatureRef = useRef<Feature<Point> | null>(null);
  const hasCenteredOnPositionRef = useRef(false);
  const onPositionChangeRef = useRef(onPositionChange);
  onPositionChangeRef.current = onPositionChange;

  useEffect(() => {
    if (!mapElementRef.current || mapRef.current) {
      return;
    }

    let aborted = false;

    void (async () => {
      preloadGeoportailCapabilities();

      if (aborted || !mapElementRef.current || mapRef.current) {
        return;
      }

      const markerColor = getColorCode('primary') || '#26a581';
      const markerFeature = new Feature<Point>();
      markerFeatureRef.current = markerFeature;

      const markerSource = new VectorSource<Feature<Point>>({
        features: [markerFeature],
      });

      const markerLayer = new VectorLayer({
        source: markerSource,
        zIndex: 10,
      });

      const initialCenter =
        longitude !== null && latitude !== null
          ? fromLonLat([longitude, latitude])
          : fromLonLat(DEFAULT_MAP_CENTER_LON_LAT);

      if (aborted || !mapElementRef.current || mapRef.current) {
        return;
      }

      const map = new Map({
        target: mapElementRef.current,
        layers: [
          createGeoportailLayer({
            name: GEOPORTAIL_LAYERS.ORTHOPHOTOS,
            visible: true,
            title: getGeoportailLayerTitle(GEOPORTAIL_LAYERS.ORTHOPHOTOS),
          }),
          markerLayer,
        ],
        controls: defaultControls({ zoom: false, attribution: false, rotate: false }),
        interactions: defaultInteractions({
          altShiftDragRotate: false,
          pinchRotate: false,
        }),
        view: new View({
          center: initialCenter,
          zoom: REPORT_POSITION_MAP_DEFAULT_ZOOM,
          enableRotation: false,
        }),
      });

      markerFeature.setStyle(createReportMarkerStyle(markerColor));

      if (longitude !== null && latitude !== null) {
        markerFeature.setGeometry(new Point(fromLonLat([longitude, latitude])));
      }

      const translate = new Translate({
        features: new Collection([markerFeature]),
      });

      translate.on('translateend', () => {
        const geometry = markerFeature.getGeometry();
        if (!geometry) {
          return;
        }

        const [nextLongitude, nextLatitude] = toLonLat(geometry.getCoordinates());
        onPositionChangeRef.current({ longitude: nextLongitude, latitude: nextLatitude });
      });

      map.addInteraction(translate);

      map.on('singleclick', (event) => {
        markerFeature.setGeometry(new Point(event.coordinate));
        const [nextLongitude, nextLatitude] = toLonLat(event.coordinate);
        onPositionChangeRef.current({ longitude: nextLongitude, latitude: nextLatitude });
      });

      mapRef.current = map;
    })();

    return () => {
      aborted = true;
      mapRef.current?.setTarget(undefined);
      mapRef.current = null;
      markerFeatureRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const markerFeature = markerFeatureRef.current;
    if (!map || !markerFeature) {
      return;
    }

    if (longitude === null || latitude === null) {
      markerFeature.setGeometry(undefined);
      hasCenteredOnPositionRef.current = false;
      return;
    }

    markerFeature.setGeometry(new Point(fromLonLat([longitude, latitude])));

    if (!hasCenteredOnPositionRef.current) {
      map.getView().setCenter(fromLonLat([longitude, latitude]));
      hasCenteredOnPositionRef.current = true;
    }
  }, [latitude, longitude]);

  const coordinateLabel =
    longitude !== null && latitude !== null
      ? `${longitude.toFixed(6)}, ${latitude.toFixed(6)}`
      : 'Touchez la carte ou déplacez le repère pour positionner le signalement.';

  const handleResetPosition = () => {
    if (
      initialLongitude === null ||
      initialLatitude === null ||
      !onResetPosition
    ) {
      return;
    }

    const markerFeature = markerFeatureRef.current;
    const map = mapRef.current;
    const nextCoordinate = fromLonLat([initialLongitude, initialLatitude]);

    markerFeature?.setGeometry(new Point(nextCoordinate));
    map?.getView().setCenter(nextCoordinate);
    onResetPosition();
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.mapShell}>
        <div ref={mapElementRef} className={styles.mapTarget} aria-label="Carte de position du signalement" />

        {canResetPosition && onResetPosition ? (
          <button
            type="button"
            className={styles.resetButton}
            onClick={handleResetPosition}
          >
            Annuler
          </button>
        ) : null}

        {isLocating && (
          <div className={styles.loadingOverlay}>
            <Loading size="small" label="Localisation…" />
          </div>
        )}
      </div>

      <p className={styles.hint}>Déplacez le repère ou touchez la carte pour ajuster la position.</p>
      <p className={styles.coordinates}>{coordinateLabel}</p>
    </div>
  );
}
