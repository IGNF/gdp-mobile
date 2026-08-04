import { useEffect, useRef } from 'react';

import Feature from 'ol/Feature';
import type { FeatureLike } from 'ol/Feature';
import { createEmpty, extend, getCenter, isEmpty } from 'ol/extent';
import LayerGroup from 'ol/layer/Group';
import VectorLayer from 'ol/layer/Vector';
import type OlMap from 'ol/Map';
import { transformExtent } from 'ol/proj';
import Cluster from 'ol/source/Cluster';
import VectorSource from 'ol/source/Vector';

import type { GroupReport } from '@/domain/report/groupReportModels';
import {
  createGroupReportMapFeatures,
  getGroupReportFromMapFeature,
} from '@/features/map/utils/reportMapFeatures';
import { loadReportsInMapBbox } from '@/features/map/utils/loadReportsInMapBbox';
import { styleReportMapFeature } from '@/features/map/utils/reportStatusMapMarkerStyle';
import {
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
  onReportSelect: (report: GroupReport) => void;
}

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
  onReportSelect,
}: UseReportMapLayersOptions): void {
  const onReportSelectRef = useRef(onReportSelect);
  onReportSelectRef.current = onReportSelect;

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
      style: (feature) => styleReportMapFeature(feature as Feature),
      properties: {
        name: MY_REPORTS_MAP_LAYER_NAME,
        title: 'Mes signalements',
        displayInLayerSwitcher: false,
      },
      zIndex: REPORT_MAP_LAYER_Z_INDEX,
    });

    const reportLayerGroup = new LayerGroup({
      properties: {
        name: REPORT_MAP_LAYER_GROUP_NAME,
        title: 'Signalements',
        displayInLayerSwitcher: false,
      },
      layers: [myReportsLayer],
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
    const reportLayerGroup = findReportLayerGroup(map);

    if (!myReportsLayer || !reportLayerGroup) {
      return;
    }

    myReportsLayer.setVisible(visibility.myReports);
    reportLayerGroup.setVisible(visibility.myReports);

    if (!visibility.myReports) {
      const clusterSource = myReportsLayer.getSource();
      if (clusterSource instanceof Cluster) {
        const innerSource = clusterSource.getSource();
        innerSource?.clear(true);
      }
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
    if (!map || !isMapReady) {
      return;
    }

    const handleMapClick = (event: { pixel: number[]; coordinate: number[] }) => {
      if (!visibility.myReports) {
        return;
      }

      const reportLayerGroup = findReportLayerGroup(map);
      if (!reportLayerGroup?.getVisible()) {
        return;
      }

      const hit = { feature: null as Feature | null };

      map.forEachFeatureAtPixel(
        event.pixel,
        (featureLike: FeatureLike, layer) => {
          if (!(layer instanceof VectorLayer)) {
            return undefined;
          }

          if (layer.get('name') !== MY_REPORTS_MAP_LAYER_NAME) {
            return undefined;
          }

          hit.feature = featureLike as Feature;
          return true;
        },
        {
          layerFilter: (layer) => layer.getVisible(),
          hitTolerance: 8,
        },
      );

      if (!hit.feature) {
        return;
      }

      const selectedFeature = hit.feature;
      const clusteredFeatures = selectedFeature.get('features') as Feature[] | undefined;
      if (Array.isArray(clusteredFeatures) && clusteredFeatures.length > 1) {
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

      const targetFeature = clusteredFeatures?.[0] ?? selectedFeature;
      const report = getGroupReportFromMapFeature(targetFeature);
      if (report) {
        onReportSelectRef.current(report);
      }
    };

    map.on('singleclick', handleMapClick);

    return () => {
      map.un('singleclick', handleMapClick);
    };
  }, [isMapReady, map, visibility.myReports]);
}
