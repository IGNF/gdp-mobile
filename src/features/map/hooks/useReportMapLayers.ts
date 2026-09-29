import { useEffect, useRef } from 'react';

import Feature from 'ol/Feature';
import type { FeatureLike } from 'ol/Feature';
import { createEmpty, extend, getCenter, isEmpty } from 'ol/extent';
import LineString from 'ol/geom/LineString';
import Point from 'ol/geom/Point';
import LayerGroup from 'ol/layer/Group';
import VectorLayer from 'ol/layer/Vector';
import type OlMap from 'ol/Map';
import { transformExtent } from 'ol/proj';
import Cluster from 'ol/source/Cluster';
import VectorSource from 'ol/source/Vector';

import type { GroupReport } from '@/domain/report/groupReportModels';
import type { LocalReportDraft } from '@/domain/report/localReportDraft';
import {
  createGroupReportMapFeatures,
  createLocalReportDraftMapFeatures,
  getGroupReportFromMapFeature,
  getLocalReportDraftFromMapFeature,
} from '@/features/map/utils/reportMapFeatures';
import { loadReportsInMapBbox } from '@/features/map/utils/loadReportsInMapBbox';
import {
  areClusteredFeaturesAtSamePoint,
  clusterCenterCoordinate,
  clusterSamePointKey,
  computeSpiderfyLayout,
  getClusteredSubFeatures,
} from '@/features/map/utils/reportClusterSpiderfy';
import {
  styleLocalReportDraftMapFeature,
  styleReportMapFeature,
  styleSpiderfyLegFeature,
  styleSpiderfySatelliteFeature,
} from '@/features/map/utils/reportStatusMapMarkerStyle';
import {
  MY_LOCAL_DRAFTS_MAP_LAYER_NAME,
  MY_REPORTS_MAP_LAYER_NAME,
  REPORT_MAP_CLUSTER_DISTANCE,
  REPORT_MAP_LAYER_GROUP_NAME,
  REPORT_MAP_LAYER_Z_INDEX,
  type ReportMapLayerVisibility,
} from '@/shared/constants/reportMapLayers';
import { GROUP_REPORT_MAP_FOCUS_ZOOM } from '@/shared/constants/map';

interface UseReportMapLayersOptions {
  map: OlMap | null;
  isMapReady: boolean;
  isAuthenticated: boolean;
  userId: number | undefined;
  visibility: ReportMapLayerVisibility;
  localDrafts: readonly LocalReportDraft[];
  onReportSelect: (report: GroupReport) => void;
  onLocalDraftSelect: (draft: LocalReportDraft) => void;
}

/**
 * Couche des marqueurs individuels « éclatés » (spiderfy) et des traits qui les relient à leur
 * point d'origine — voir {@link areClusteredFeaturesAtSamePoint}.
 */
const SPIDERFY_MAP_LAYER_NAME = 'ReportSpiderfyMapLayer';

function findReportLayerGroup(map: OlMap): LayerGroup | null {
  for (const layer of map.getLayers().getArray()) {
    if (layer instanceof LayerGroup && layer.get('name') === REPORT_MAP_LAYER_GROUP_NAME) {
      return layer;
    }
  }

  return null;
}

function getReportLayerByName(map: OlMap, layerName: string): VectorLayer<VectorSource> | null {
  const group = findReportLayerGroup(map);
  if (!group) {
    return null;
  }

  for (const layer of group.getLayers().getArray()) {
    if (layer instanceof VectorLayer && layer.get('name') === layerName) {
      return layer as VectorLayer<VectorSource>;
    }
  }

  return null;
}

function clearClusteredLayerSource(layer: VectorLayer<VectorSource> | null): void {
  const clusterSource = layer?.getSource();
  if (clusterSource instanceof Cluster) {
    clusterSource.getSource()?.clear(true);
  }
}

function deduplicateFeatures(features: Feature[]): Feature[] {
  const byId = new globalThis.Map<string, Feature>();

  for (const feature of features) {
    const featureId = feature.getId();
    const key = featureId === undefined ? `feature-${byId.size}` : String(featureId);
    byId.set(key, feature);
  }

  return Array.from(byId.values());
}

export function useReportMapLayers({
  map,
  isMapReady,
  isAuthenticated,
  userId,
  visibility,
  localDrafts,
  onReportSelect,
  onLocalDraftSelect,
}: UseReportMapLayersOptions): void {
  const onReportSelectRef = useRef(onReportSelect);
  onReportSelectRef.current = onReportSelect;
  const onLocalDraftSelectRef = useRef(onLocalDraftSelect);
  onLocalDraftSelectRef.current = onLocalDraftSelect;
  // Clé (voir `clusterSamePointKey`) du cluster « même point » actuellement éclaté (spiderfy),
  // ou `null`. Un `ref` : lu en direct par les fonctions de style à chaque rendu OpenLayers,
  // sans dépendre d'un re-render React.
  const spiderfiedClusterKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!map || !isMapReady) {
      return;
    }

    const myReportsSource = new VectorSource<Feature>();
    const myReportsClusterSource = new Cluster({
      source: myReportsSource,
      distance: REPORT_MAP_CLUSTER_DISTANCE,
    });

    const myReportsLayer = new VectorLayer({
      source: myReportsClusterSource,
      style: (feature) => styleReportMapFeature(feature as Feature, spiderfiedClusterKeyRef.current),
      properties: {
        name: MY_REPORTS_MAP_LAYER_NAME,
        title: 'Mes signalements',
        displayInLayerSwitcher: false,
      },
      zIndex: REPORT_MAP_LAYER_Z_INDEX,
    });

    const localDraftsSource = new VectorSource<Feature>();
    const localDraftsClusterSource = new Cluster({
      source: localDraftsSource,
      distance: REPORT_MAP_CLUSTER_DISTANCE,
    });

    const localDraftsLayer = new VectorLayer({
      source: localDraftsClusterSource,
      style: (feature) => styleLocalReportDraftMapFeature(feature as Feature, spiderfiedClusterKeyRef.current),
      properties: {
        name: MY_LOCAL_DRAFTS_MAP_LAYER_NAME,
        title: 'Mes brouillons',
        displayInLayerSwitcher: false,
      },
      zIndex: REPORT_MAP_LAYER_Z_INDEX,
    });

    const spiderfySource = new VectorSource<Feature>();
    const spiderfyLayer = new VectorLayer({
      source: spiderfySource,
      style: (feature) =>
        (feature as Feature).get('spiderfyLeg')
          ? styleSpiderfyLegFeature()
          : styleSpiderfySatelliteFeature(feature as Feature),
      properties: {
        name: SPIDERFY_MAP_LAYER_NAME,
        displayInLayerSwitcher: false,
      },
      // Dernière de la liste : rendue au-dessus des pastilles pile des autres couches.
      zIndex: REPORT_MAP_LAYER_Z_INDEX,
    });

    const reportLayerGroup = new LayerGroup({
      properties: {
        name: REPORT_MAP_LAYER_GROUP_NAME,
        title: 'Signalements',
        displayInLayerSwitcher: false,
      },
      layers: [myReportsLayer, localDraftsLayer, spiderfyLayer],
      zIndex: REPORT_MAP_LAYER_Z_INDEX,
    });

    map.addLayer(reportLayerGroup);

    return () => {
      map.removeLayer(reportLayerGroup);
    };
  }, [isMapReady, map]);

  useEffect(() => {
    if (!map || !isMapReady) {
      return;
    }

    const myReportsLayer = getReportLayerByName(map, MY_REPORTS_MAP_LAYER_NAME);
    const localDraftsLayer = getReportLayerByName(map, MY_LOCAL_DRAFTS_MAP_LAYER_NAME);
    const spiderfyLayer = getReportLayerByName(map, SPIDERFY_MAP_LAYER_NAME);
    const reportLayerGroup = findReportLayerGroup(map);

    if (!myReportsLayer || !localDraftsLayer || !spiderfyLayer || !reportLayerGroup) {
      return;
    }

    myReportsLayer.setVisible(visibility.myReports);
    localDraftsLayer.setVisible(visibility.myReports);
    spiderfyLayer.setVisible(visibility.myReports);
    reportLayerGroup.setVisible(visibility.myReports);

    if (!visibility.myReports) {
      clearClusteredLayerSource(myReportsLayer);
      clearClusteredLayerSource(localDraftsLayer);
      spiderfyLayer.getSource()?.clear(true);
      spiderfiedClusterKeyRef.current = null;
    }
  }, [isMapReady, map, visibility.myReports]);

  useEffect(() => {
    if (!map || !isMapReady || !visibility.myReports) {
      return;
    }

    const myReportsLayer = getReportLayerByName(map, MY_REPORTS_MAP_LAYER_NAME);
    const clusterSource = myReportsLayer?.getSource();
    if (!(clusterSource instanceof Cluster)) {
      return;
    }

    const source = clusterSource.getSource();
    if (!source) {
      return;
    }

    let cancelled = false;

    const loadMyReports = async () => {
      try {
        if (!isAuthenticated || userId === undefined) {
          source.clear(true);
          return;
        }

        const view = map.getView();
        const extent = view.calculateExtent(map.getSize());
        const extent4326 = transformExtent(extent, view.getProjection(), 'EPSG:4326');
        const serverReports = await loadReportsInMapBbox({
          extent4326,
          authorId: userId,
        });

        if (cancelled) {
          return;
        }

        source.clear(true);
        source.addFeatures(deduplicateFeatures(createGroupReportMapFeatures(serverReports)));
      } catch (error) {
        console.error('[ReportMapLayers] Failed to load my reports', error);
      }
    };

    void loadMyReports();

    const handleMoveEnd = () => {
      void loadMyReports();
    };

    map.on('moveend', handleMoveEnd);

    return () => {
      cancelled = true;
      map.un('moveend', handleMoveEnd);
    };
  }, [isAuthenticated, isMapReady, map, userId, visibility.myReports]);

  useEffect(() => {
    if (!map || !isMapReady || !visibility.myReports) {
      return;
    }

    const localDraftsLayer = getReportLayerByName(map, MY_LOCAL_DRAFTS_MAP_LAYER_NAME);
    const clusterSource = localDraftsLayer?.getSource();
    if (!(clusterSource instanceof Cluster)) {
      return;
    }

    const source = clusterSource.getSource();
    if (!source) {
      return;
    }

    source.clear(true);
    source.addFeatures(deduplicateFeatures(createLocalReportDraftMapFeatures(localDrafts)));
  }, [isMapReady, localDrafts, map, visibility.myReports]);

  useEffect(() => {
    if (!map || !isMapReady) {
      return;
    }

    const collapseSpiderfy = () => {
      if (spiderfiedClusterKeyRef.current === null) {
        return;
      }

      spiderfiedClusterKeyRef.current = null;
      getReportLayerByName(map, SPIDERFY_MAP_LAYER_NAME)?.getSource()?.clear(true);
      // Force le recalcul du style des deux couches : le marqueur pile, masqué pendant
      // l'éclatement (voir `hiddenClusterKey`), doit redevenir visible.
      getReportLayerByName(map, MY_REPORTS_MAP_LAYER_NAME)?.changed();
      getReportLayerByName(map, MY_LOCAL_DRAFTS_MAP_LAYER_NAME)?.changed();
    };

    /** Éclate un cluster « même point » : un marqueur par signalement, en éventail autour du point. */
    const expandSpiderfy = (
      clusterFeature: Feature,
      clusteredFeatures: Feature[],
      key: string,
      fallbackCenter: number[],
    ) => {
      const spiderfyLayer = getReportLayerByName(map, SPIDERFY_MAP_LAYER_NAME);
      const spiderfySource = spiderfyLayer?.getSource();
      if (!spiderfySource) {
        return;
      }

      const center = clusterCenterCoordinate(clusterFeature) ?? fallbackCenter;
      const centerPixel = map.getPixelFromCoordinate(center) ?? map.getPixelFromCoordinate(fallbackCenter);
      if (!centerPixel) {
        return;
      }

      const layout = computeSpiderfyLayout(clusteredFeatures.length);
      const newFeatures: Feature[] = [];

      clusteredFeatures.forEach((originalFeature, index) => {
        const { angle, radius } = layout[index];
        const satellitePixel = [
          centerPixel[0] + radius * Math.cos(angle),
          centerPixel[1] + radius * Math.sin(angle),
        ];
        const satelliteCoordinate = map.getCoordinateFromPixel(satellitePixel);
        if (!satelliteCoordinate) {
          return;
        }

        const satellite = originalFeature.clone();
        satellite.setId(`spiderfy-${originalFeature.getId() ?? index}`);
        satellite.setGeometry(new Point(satelliteCoordinate));
        newFeatures.push(satellite);

        const leg = new Feature({ geometry: new LineString([center, satelliteCoordinate]) });
        leg.set('spiderfyLeg', true);
        newFeatures.push(leg);
      });

      spiderfySource.clear(true);
      spiderfySource.addFeatures(newFeatures);
      spiderfiedClusterKeyRef.current = key;
      getReportLayerByName(map, MY_REPORTS_MAP_LAYER_NAME)?.changed();
      getReportLayerByName(map, MY_LOCAL_DRAFTS_MAP_LAYER_NAME)?.changed();
    };

    const handleMapClick = (event: { pixel: number[]; coordinate: number[] }) => {
      if (!visibility.myReports) {
        return;
      }

      const reportLayerGroup = findReportLayerGroup(map);
      if (!reportLayerGroup?.getVisible()) {
        return;
      }

      const hit = { feature: null as Feature | null, layerName: null as string | null };

      map.forEachFeatureAtPixel(
        event.pixel,
        (featureLike: FeatureLike, layer) => {
          if (!(layer instanceof VectorLayer)) {
            return undefined;
          }

          const layerName = layer.get('name');
          if (
            layerName !== MY_REPORTS_MAP_LAYER_NAME &&
            layerName !== MY_LOCAL_DRAFTS_MAP_LAYER_NAME &&
            layerName !== SPIDERFY_MAP_LAYER_NAME
          ) {
            return undefined;
          }

          hit.feature = featureLike as Feature;
          hit.layerName = layerName;
          return true;
        },
        {
          layerFilter: (layer) => layer.getVisible(),
          hitTolerance: 8,
        },
      );

      // Marqueur éclaté (spiderfy) : sélectionne son signalement. Un trait de liaison ne
      // sélectionne rien (il n'a pas de statut/signalement associé).
      if (hit.layerName === SPIDERFY_MAP_LAYER_NAME && hit.feature) {
        if (hit.feature.get('spiderfyLeg')) {
          return;
        }

        if (hit.feature.get('reportSource') === 'local') {
          const draft = getLocalReportDraftFromMapFeature(hit.feature);
          if (draft) {
            onLocalDraftSelectRef.current(draft);
          }
          return;
        }

        const report = getGroupReportFromMapFeature(hit.feature);
        if (report) {
          onReportSelectRef.current(report);
        }
        return;
      }

      if (!hit.feature) {
        // Clic dans le vide : referme un éventuel éclatement en cours.
        collapseSpiderfy();
        return;
      }

      const selectedFeature = hit.feature;
      const clusteredFeatures = getClusteredSubFeatures(selectedFeature);

      if (clusteredFeatures.length > 1) {
        if (areClusteredFeaturesAtSamePoint(clusteredFeatures)) {
          const key = clusterSamePointKey(
            hit.layerName === MY_LOCAL_DRAFTS_MAP_LAYER_NAME ? 'local' : 'server',
            selectedFeature,
          );
          const wasAlreadyExpanded = key !== null && key === spiderfiedClusterKeyRef.current;

          collapseSpiderfy();

          if (!wasAlreadyExpanded && key) {
            expandSpiderfy(selectedFeature, clusteredFeatures, key, event.coordinate);
          }
          return;
        }

        // Points proches mais distincts : le zoom finit par les séparer visuellement.
        collapseSpiderfy();

        const clusterExtent = createEmpty();
        for (const clusterFeature of clusteredFeatures) {
          const geometry = clusterFeature.getGeometry();
          if (geometry) {
            extend(clusterExtent, geometry.getExtent());
          }
        }

        if (!isEmpty(clusterExtent)) {
          const view = map.getView();
          const currentZoom = view.getZoom() ?? GROUP_REPORT_MAP_FOCUS_ZOOM;
          const center = getCenter(clusterExtent);

          view.animate({
            center,
            zoom: Math.min(currentZoom + 2, GROUP_REPORT_MAP_FOCUS_ZOOM),
            duration: 300,
          });
        }
        return;
      }

      collapseSpiderfy();
      const targetFeature = clusteredFeatures[0];

      if (hit.layerName === MY_LOCAL_DRAFTS_MAP_LAYER_NAME) {
        const draft = getLocalReportDraftFromMapFeature(targetFeature);
        if (draft) {
          onLocalDraftSelectRef.current(draft);
        }
        return;
      }

      const report = getGroupReportFromMapFeature(targetFeature);
      if (report) {
        onReportSelectRef.current(report);
      }
    };

    // La position des satellites est calculée pour la vue courante : tout déplacement (y
    // compris le zoom déclenché par le clic sur un cluster spatial ci-dessus) la périme.
    const handleMoveStart = () => collapseSpiderfy();

    map.on('singleclick', handleMapClick);
    map.on('movestart', handleMoveStart);

    return () => {
      map.un('singleclick', handleMapClick);
      map.un('movestart', handleMoveStart);
    };
  }, [isMapReady, map, visibility.myReports]);
}
