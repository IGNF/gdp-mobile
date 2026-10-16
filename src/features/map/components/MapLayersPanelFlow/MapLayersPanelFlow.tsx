import { useMemo } from 'react';
import type {
  GeodesyCatalog,
  GeodesyLayerId,
  GeodesyLayerVisibility,
  GeodesyWfsAttributeFilterValues,
} from '@ign/gdp-tools';

import { MapGeodesyFiltersPanel } from '@/features/map/components/MapGeodesyFiltersPanel';
import { MapLayersPanel } from '@/features/map/components/MapLayersPanel';
import type { MapLayerSheetItem } from '@/features/map/types/mapLayerSheet';
import type { MapPanelId } from '@/features/map/types/mapPanels';
import { GEOPORTAIL_LAYERS } from '@/shared/constants/map';
import type { GdpGeodesyMode } from '@/shared/constants/geodesy';
import type { ReportMapLayerVisibility } from '@/shared/constants/reportMapLayers';
import { trackLayerVisibilityChange } from '@/infra/analytics/matomo';
import thumnailSignalement from '@/shared/assets/thumbnails/thumbnail-signalement.jpg';

import thumbnailPlanIgn from '@/shared/assets/thumbnails/thumbnail-plan.jpg';
import thumbnailOrtho from '@/shared/assets/thumbnails/thumbnail-ortho.jpg';
import thumbnailScan25 from '@/shared/assets/thumbnails/thumbnail-scan-25.jpg';
import thumbnailGeodesie from '@/shared/assets/thumbnails/thumbnail-geodesie.jpg';
import thumbnailRGP from '@/shared/assets/thumbnails/thumbnail-rgp.jpg';

export interface GeodesyUiLayerItem {
  id: GeodesyLayerId;
  title: string;
  shortLabel?: string;
}

const BASEMAP_SHEET_LAYERS = [
  { id: GEOPORTAIL_LAYERS.PLAN_IGN, title: 'Plan IGN', thumbnail: thumbnailPlanIgn },
  { id: GEOPORTAIL_LAYERS.ORTHOPHOTOS, title: 'Photographies aériennes', thumbnail: thumbnailOrtho },
  { id: GEOPORTAIL_LAYERS.MAPS_SCAN25TOUR, title: 'Carte TOPO 25', thumbnail: thumbnailScan25 },
] as const;

function resolveLayerSheetMatomoLabel(layerId: string): string | null {
  switch (layerId) {
    case 'reports':
      return 'Mes signalements';
    case 'geodesy-wfs':
      return 'Géodésie';
    case 'geodesy-annex-rgp':
      return 'Réseau GNSS permanent';
    default:
      if (layerId.startsWith('basemap:')) {
        const basemapId = layerId.slice('basemap:'.length);
        return BASEMAP_SHEET_LAYERS.find((layer) => layer.id === basemapId)?.title ?? null;
      }
      return null;
  }
}

function trackLayerSheetVisibility(layerId: string, visible: boolean): void {
  const label = resolveLayerSheetMatomoLabel(layerId);
  if (label) {
    trackLayerVisibilityChange('Couches', label, visible);
  }
}

export interface MapLayersPanelFlowProps {
  /** Vue affichée : liste des couches, filtres, ou `null` (flow fermé). */
  view: Extract<MapPanelId, 'layers' | 'filters'> | null;
  onClose: () => void;
  activeBasemap: string;
  onActiveBasemapChange: (layerName: string) => void;
  geoservicesVisible: boolean;
  onGeoservicesVisibleChange: (visible: boolean) => void;
  geodesyMode: GdpGeodesyMode;
  geodesyVisibility: GeodesyLayerVisibility;
  onGeodesyVisibilityChange: (visibility: GeodesyLayerVisibility) => void;
  onGeodesyToggle: (layerId: GeodesyLayerId) => void;
  geodesyUiLayers: readonly GeodesyUiLayerItem[];
  geodesyCatalog: GeodesyCatalog;
  geodesyDefaultActive?: readonly GeodesyLayerId[];
  geodesyWfsAttributeFilterValues: GeodesyWfsAttributeFilterValues;
  onGeodesyWfsAttributeFilterValuesChange: (values: GeodesyWfsAttributeFilterValues) => void;
  onClearGeodesyWfsAttributeFilterValues: () => void;
  reportMapLayers: ReportMapLayerVisibility;
  onReportMapLayersChange: (layers: ReportMapLayerVisibility) => void;
  isAuthenticated: boolean;
}

function isWfsLayerId(catalog: GeodesyCatalog, layerId: GeodesyLayerId): boolean {
  return catalog.wfsUiLayerIds.includes(layerId);
}

function isAnnexLayerId(catalog: GeodesyCatalog, layerId: GeodesyLayerId): boolean {
  return catalog.annexUiLayerIds.includes(layerId as (typeof catalog.annexUiLayerIds)[number]);
}

export function MapLayersPanelFlow({
  view,
  onClose,
  activeBasemap,
  onActiveBasemapChange,
  geoservicesVisible,
  onGeoservicesVisibleChange,
  geodesyMode,
  geodesyVisibility,
  onGeodesyVisibilityChange,
  geodesyUiLayers,
  geodesyCatalog,
  geodesyDefaultActive = ['RBF'],
  geodesyWfsAttributeFilterValues,
  onGeodesyWfsAttributeFilterValuesChange,
  onClearGeodesyWfsAttributeFilterValues,
  reportMapLayers,
  onReportMapLayersChange,
  isAuthenticated,
}: MapLayersPanelFlowProps) {
  const reportsLayerVisible = isAuthenticated && reportMapLayers.myReports;

  const wfsLayerIds = useMemo(
    () => geodesyUiLayers.filter((layer) => isWfsLayerId(geodesyCatalog, layer.id)).map((layer) => layer.id),
    [geodesyCatalog, geodesyUiLayers],
  );

  const annexLayerIds = useMemo(
    () => geodesyUiLayers.filter((layer) => isAnnexLayerId(geodesyCatalog, layer.id)).map((layer) => layer.id),
    [geodesyCatalog, geodesyUiLayers],
  );

  const isWfsVisible = wfsLayerIds.some((layerId) => geodesyVisibility[layerId]);
  const isAnnexVisible = annexLayerIds.some((layerId) => geodesyVisibility[layerId]);

  const sheetItems = useMemo<readonly MapLayerSheetItem[]>(() => {
    const basemapItems = BASEMAP_SHEET_LAYERS.map(
      (layer) =>
        ({
          id: `basemap:${layer.id}`,
          group: 'basemap',
          title: layer.title,
          visible: geoservicesVisible && activeBasemap === layer.id,
          opacity: geoservicesVisible && activeBasemap === layer.id ? 100 : 0,
          showOpacity: false,
          thumbnail: layer.thumbnail,
        }) satisfies MapLayerSheetItem,
    );

    return [
      {
        id: 'reports',
        group: 'data',
        title: 'Mes signalements',
        visible: reportsLayerVisible,
        opacity: reportsLayerVisible ? 100 : 0,
        toggleDisabled: !isAuthenticated,
        showOpacity: false,
        thumbnail: thumnailSignalement,
      },
      {
        id: 'geodesy-wfs',
        group: 'data',
        title: 'Géodésie',
        visible: isWfsVisible,
        opacity: isWfsVisible ? 100 : 0,
        showOpacity: false,
        thumbnail: thumbnailGeodesie,
      },
      ...(annexLayerIds.length > 0
        ? [
            {
              id: 'geodesy-annex-rgp',
              group: 'data',
              title: 'Réseau GNSS permanent',
              visible: isAnnexVisible,
              opacity: isAnnexVisible ? 100 : 0,
              showOpacity: false,
              thumbnail: thumbnailRGP,
            } satisfies MapLayerSheetItem,
          ]
        : []),
      ...basemapItems,
    ];
  }, [activeBasemap, annexLayerIds.length, geoservicesVisible, isAnnexVisible, isAuthenticated, isWfsVisible, reportsLayerVisible]);

  const expertFilters = geodesyCatalog.wfsAttributeFilters;
  const showExpertFilters = geodesyMode === 'expert' && expertFilters.length > 0;

  const setWfsVisibility = (visible: boolean) => {
    const nextVisibility = { ...geodesyVisibility };
    wfsLayerIds.forEach((layerId) => {
      nextVisibility[layerId] = visible;
    });
    onGeodesyVisibilityChange(nextVisibility);
  };

  const setAnnexVisibility = (visible: boolean) => {
    const nextVisibility = { ...geodesyVisibility };
    annexLayerIds.forEach((layerId) => {
      nextVisibility[layerId] = visible;
    });
    onGeodesyVisibilityChange(nextVisibility);
  };

  const handleOpacityChange = (layerId: string, opacity: number) => {
    const visible = opacity > 0;

    if (layerId === 'reports') {
      if (!isAuthenticated) {
        return;
      }

      onReportMapLayersChange({
        ...reportMapLayers,
        myReports: visible,
      });
      trackLayerSheetVisibility(layerId, visible);
      return;
    }

    if (layerId === 'geodesy-wfs') {
      if (visible) {
        const nextVisibility = { ...geodesyVisibility };
        wfsLayerIds.forEach((id) => {
          if (nextVisibility[id] === undefined) {
            nextVisibility[id] = geodesyDefaultActive.includes(id);
          }
        });
        if (!wfsLayerIds.some((id) => nextVisibility[id])) {
          wfsLayerIds.forEach((id) => {
            nextVisibility[id] = true;
          });
        }
        onGeodesyVisibilityChange(nextVisibility);
      } else {
        setWfsVisibility(false);
      }
      trackLayerSheetVisibility(layerId, visible);
      return;
    }

    if (layerId === 'geodesy-annex-rgp') {
      if (visible) {
        const nextVisibility = { ...geodesyVisibility };
        annexLayerIds.forEach((id) => {
          nextVisibility[id] = true;
        });
        onGeodesyVisibilityChange(nextVisibility);
      } else {
        setAnnexVisibility(false);
      }
      trackLayerSheetVisibility(layerId, visible);
      return;
    }

    if (layerId.startsWith('basemap:')) {
      const basemapId = layerId.slice('basemap:'.length);
      if (visible) {
        onActiveBasemapChange(basemapId);
        onGeoservicesVisibleChange(true);
        trackLayerSheetVisibility(layerId, true);
      } else if (activeBasemap === basemapId) {
        onGeoservicesVisibleChange(false);
        trackLayerSheetVisibility(layerId, false);
      }
    }
  };

  return (
    <>
      <MapLayersPanel
        isOpen={view === 'layers'}
        onClose={onClose}
        items={sheetItems}
        onOpacityChange={handleOpacityChange}
      />
      {showExpertFilters ? (
        <MapGeodesyFiltersPanel
          isOpen={view === 'filters'}
          onClose={onClose}
          filters={expertFilters}
          values={geodesyWfsAttributeFilterValues}
          onChange={onGeodesyWfsAttributeFilterValuesChange}
          onClear={onClearGeodesyWfsAttributeFilterValues}
        />
      ) : null}
    </>
  );
}
