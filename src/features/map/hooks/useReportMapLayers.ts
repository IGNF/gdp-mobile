import { useEffect, useRef } from 'react';

import Feature from 'ol/Feature';
import type { FeatureLike } from 'ol/Feature';
import LayerGroup from 'ol/layer/Group';
import VectorLayer from 'ol/layer/Vector';
import type OlMap from 'ol/Map';
import { transformExtent } from 'ol/proj';
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
  REPORT_MAP_LAYER_GROUP_NAME,
  REPORT_MAP_LAYER_Z_INDEX,
  type ReportMapLayerVisibility,
} from '@/shared/constants/reportMapLayers';

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
    const myReportsLayer = new VectorLayer({
      source: myReportsSource,
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
      myReportsLayer.getSource()?.clear(true);
    }
  }, [isMapReady, map, visibility.myReports]);

  useEffect(() => {
    if (!map || !isMapReady || !visibility.myReports) {
      return;
    }

    const myReportsLayer = getReportLayerByName(map, MY_REPORTS_MAP_LAYER_NAME);
    const source = myReportsLayer?.getSource();
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

    const handleMapClick = (event: { pixel: number[] }) => {
      if (!visibility.myReports) {
        return;
      }

      const reportLayerGroup = findReportLayerGroup(map);
      if (!reportLayerGroup?.getVisible()) {
        return;
      }

      let selectedFeature: Feature | null = null;

      map.forEachFeatureAtPixel(
        event.pixel,
        (featureLike: FeatureLike, layer) => {
          if (!(layer instanceof VectorLayer)) {
            return undefined;
          }

          if (layer.get('name') !== MY_REPORTS_MAP_LAYER_NAME) {
            return undefined;
          }

          selectedFeature = featureLike as Feature;
          return true;
        },
        {
          layerFilter: (layer) => layer.getVisible(),
          hitTolerance: 8,
        },
      );

      if (!selectedFeature) {
        return;
      }

      const report = getGroupReportFromMapFeature(selectedFeature);
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
