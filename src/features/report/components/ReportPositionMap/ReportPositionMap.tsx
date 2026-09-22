import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useGeodesyOnMap } from '@ign/gdp-tools/react';

import Collection from 'ol/Collection';
import Feature from 'ol/Feature';
import Map from 'ol/Map';
import View from 'ol/View';
import Point from 'ol/geom/Point';
import { defaults as defaultControls } from 'ol/control';
import { defaults as defaultInteractions } from 'ol/interaction';
import Translate from 'ol/interaction/Translate';
import LayerGroup from 'ol/layer/Group';
import VectorLayer from 'ol/layer/Vector';
import { fromLonLat, toLonLat } from 'ol/proj';
import VectorSource from 'ol/source/Vector';
import { Icon, Style } from 'ol/style';
import 'ol/ol.css';

import {
  createGeoportailLayerGroup,
  preloadGeoportailCapabilities,
  setActiveGeoportailLayer,
} from '@/infra/map/openlayers/geoportailLayers';
import {
  DEFAULT_MAP_CENTER_LON_LAT,
  GEOPORTAIL_LAYERS,
  REPORT_POSITION_MAP_DEFAULT_ZOOM,
} from '@/shared/constants/map';
import { Loading } from '@/shared/ui/Loading';
import { getColorCode } from '@/shared/utils/color';
import { joinCSSClassNames } from '@/shared/utils/join';
import IconClose from '@/shared/assets/icons/icon-close.svg?react';
import IconFullscreen from '@/shared/assets/icons/icon-fullscreen.svg?react';
import IconLayers from '@/shared/assets/icons/icon-layers.svg?react';

import styles from './ReportPositionMap.module.css';

/** Fonds de carte proposés par le sélecteur — mêmes choix que la carte principale (Plan/Photos/SCAN 25). */
const BASEMAP_LAYER_NAMES = [
  GEOPORTAIL_LAYERS.ORTHOPHOTOS,
  GEOPORTAIL_LAYERS.PLAN_IGN,
  GEOPORTAIL_LAYERS.MAPS_SCAN25TOUR,
] as const;

const BASEMAP_LABELS: Record<string, string> = {
  [GEOPORTAIL_LAYERS.ORTHOPHOTOS]: 'Photos aériennes',
  [GEOPORTAIL_LAYERS.PLAN_IGN]: 'Plan IGN',
  [GEOPORTAIL_LAYERS.MAPS_SCAN25TOUR]: 'Topo 25',
};

/** Couche géodésie affichée par la case à cocher « Géodésie » (réseau RBF, actif par défaut côté gdp-tools). */
const GEODESY_TOGGLE_LAYER_ID = 'RBF' as const;

export interface ReportPositionMapProps {
  longitude: number | null;
  latitude: number | null;
  initialLongitude?: number | null;
  initialLatitude?: number | null;
  canResetPosition?: boolean;
  isLocating?: boolean;
  onPositionChange: (position: { longitude: number; latitude: number }) => void;
  onResetPosition?: () => void;
  /** Preview-only rendering (recap step): no drag/tap-to-move interaction, no hint/coordinates text. */
  readOnly?: boolean;
  /** Bouton de sélection du fond de carte (Photos aériennes / Plan IGN / SCAN 25). */
  showLayerSwitcher?: boolean;
  /** Bouton d'agrandissement en plein écran. */
  showFullscreenButton?: boolean;
  /** Fond de carte initial — sert à synchroniser la vue plein écran avec la mini-carte. */
  initialBasemap?: string;
  /** Couche Géodésie visible au montage — sert à synchroniser la vue plein écran avec la mini-carte. */
  initialGeodesyVisible?: boolean;
  /** Usage interne (vue plein écran) : la carte occupe toute la hauteur de son conteneur. */
  fillContainer?: boolean;
}

function createReportMarkerIconSrc(color: string): string {
  const contrast = getColorCode('white');
  const markerSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36">
      <circle cx="18" cy="18" r="14" fill="${color}" fill-opacity="0.2"/>
      <circle cx="18" cy="18" r="7" fill="${color}" stroke="${contrast}" stroke-width="3"/>
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
  readOnly = false,
  showLayerSwitcher = false,
  showFullscreenButton = false,
  initialBasemap,
  initialGeodesyVisible = false,
  fillContainer = false,
}: ReportPositionMapProps) {
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);
  const [olMap, setOlMap] = useState<Map | null>(null);
  const geoportailGroupRef = useRef<LayerGroup | null>(null);
  const markerFeatureRef = useRef<Feature<Point> | null>(null);
  const hasCenteredOnPositionRef = useRef(false);
  const onPositionChangeRef = useRef(onPositionChange);
  onPositionChangeRef.current = onPositionChange;
  const readOnlyRef = useRef(readOnly);
  readOnlyRef.current = readOnly;

  const [activeBasemap, setActiveBasemap] = useState(
    () => initialBasemap ?? GEOPORTAIL_LAYERS.ORTHOPHOTOS,
  );
  const [isLayerPickerOpen, setIsLayerPickerOpen] = useState(false);
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);

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

      const markerColor = getColorCode('primary');
      if (!markerColor) {
        return;
      }

      const markerFeature = new Feature<Point>();
      markerFeatureRef.current = markerFeature;

      const markerSource = new VectorSource<Feature<Point>>({
        features: [markerFeature],
      });

      const markerLayer = new VectorLayer({
        source: markerSource,
        // Au-dessus de la couche Géodésie (zIndex ~20 côté gdp-tools) : le repère du
        // signalement doit toujours rester visible par-dessus les points géodésiques.
        zIndex: 50,
      });

      const initialCenter =
        longitude !== null && latitude !== null
          ? fromLonLat([longitude, latitude])
          : fromLonLat(DEFAULT_MAP_CENTER_LON_LAT);

      if (aborted || !mapElementRef.current || mapRef.current) {
        return;
      }

      const geoportailGroup = createGeoportailLayerGroup(BASEMAP_LAYER_NAMES);
      setActiveGeoportailLayer(geoportailGroup, initialBasemap ?? GEOPORTAIL_LAYERS.ORTHOPHOTOS);
      geoportailGroupRef.current = geoportailGroup;

      const map = new Map({
        target: mapElementRef.current,
        layers: [geoportailGroup, markerLayer],
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

      if (!readOnlyRef.current) {
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
      }

      mapRef.current = map;
      setOlMap(map);
    })();

    return () => {
      aborted = true;
      mapRef.current?.setTarget(undefined);
      mapRef.current = null;
      setOlMap(null);
      markerFeatureRef.current = null;
      geoportailGroupRef.current = null;
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

  const handleSelectBasemap = (name: string) => {
    setActiveBasemap(name);
    if (geoportailGroupRef.current) {
      setActiveGeoportailLayer(geoportailGroupRef.current, name);
    }
    setIsLayerPickerOpen(false);
  };

  // Couche Géodésie (points), montée uniquement quand le sélecteur est affiché — ne change
  // rien pour les autres usages de ReportPositionMap (formulaire de signalement).
  const geodesy = useGeodesyOnMap(showLayerSwitcher ? olMap : null, {
    initialActive: initialGeodesyVisible ? [GEODESY_TOGGLE_LAYER_ID] : [],
    popup: false,
  });
  const isGeodesyVisible = geodesy.visibility[GEODESY_TOGGLE_LAYER_ID] ?? false;
  const handleToggleGeodesy = () => geodesy.toggleLayer(GEODESY_TOGGLE_LAYER_ID);

  useEffect(() => {
    if (!isFullscreenOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsFullscreenOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFullscreenOpen]);

  const layerSwitcher = showLayerSwitcher ? (
    <div className={styles.layerSwitcher}>
      <button
        type="button"
        className={styles.layerButton}
        onClick={() => setIsLayerPickerOpen((open) => !open)}
        aria-label="Changer le fond de carte"
        aria-expanded={isLayerPickerOpen}
      >
        <IconLayers className={styles.layerButtonIcon} aria-hidden />
      </button>

      {isLayerPickerOpen ? (
        <ul className={styles.layerMenu} aria-label="Fonds et couches de la carte">
          {BASEMAP_LAYER_NAMES.map((name) => (
            <li key={name} role="none">
              <button
                type="button"
                role="menuitemradio"
                aria-checked={name === activeBasemap}
                className={joinCSSClassNames(
                  styles.layerMenuItem,
                  name === activeBasemap && styles.layerMenuItemActive,
                )}
                onClick={() => handleSelectBasemap(name)}
              >
                {BASEMAP_LABELS[name]}
              </button>
            </li>
          ))}

          <li role="none" className={styles.layerMenuSeparator} aria-hidden />

          <li role="none">
            <button
              type="button"
              role="menuitemcheckbox"
              aria-checked={isGeodesyVisible}
              className={joinCSSClassNames(
                styles.layerMenuItem,
                isGeodesyVisible && styles.layerMenuItemActive,
              )}
              onClick={handleToggleGeodesy}
            >
              Géodésie
            </button>
          </li>
        </ul>
      ) : null}
    </div>
  ) : null;

  return (
    <>
      <div className={joinCSSClassNames(styles.wrapper, fillContainer && styles.wrapperFill)}>
        <div className={joinCSSClassNames(styles.mapShell, fillContainer && styles.mapShellFill)}>
          <div
            ref={mapElementRef}
            className={joinCSSClassNames(styles.mapTarget, fillContainer && styles.mapTargetFill)}
            aria-label="Carte de position du signalement"
          />

          {!readOnly && canResetPosition && onResetPosition ? (
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

          {layerSwitcher}

          {showFullscreenButton ? (
            <button
              type="button"
              className={styles.fullscreenButton}
              onClick={() => setIsFullscreenOpen(true)}
              aria-label="Agrandir la carte"
            >
              <IconFullscreen className={styles.fullscreenButtonIcon} aria-hidden />
            </button>
          ) : null}
        </div>

        {!readOnly ? (
          <>
            <p className={styles.hint}>Déplacez le repère ou touchez la carte pour ajuster la position.</p>
            <p className={styles.coordinates}>{coordinateLabel}</p>
          </>
        ) : null}
      </div>

      {isFullscreenOpen
        ? createPortal(
            <div
              className={styles.fullscreenOverlay}
              role="dialog"
              aria-modal="true"
              aria-label="Carte de position en plein écran"
            >
              <button
                type="button"
                className={styles.fullscreenClose}
                onClick={() => setIsFullscreenOpen(false)}
                aria-label="Fermer"
              >
                <IconClose className={styles.fullscreenCloseIcon} aria-hidden />
              </button>
              <div className={styles.fullscreenMapWrap}>
                <ReportPositionMap
                  longitude={longitude}
                  latitude={latitude}
                  onPositionChange={() => {}}
                  readOnly
                  showLayerSwitcher={showLayerSwitcher}
                  initialBasemap={activeBasemap}
                  initialGeodesyVisible={isGeodesyVisible}
                  fillContainer
                />
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
