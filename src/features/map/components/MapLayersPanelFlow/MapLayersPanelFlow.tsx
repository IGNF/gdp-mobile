import { useCallback, useEffect, useMemo, useState } from 'react';
import type Map from 'ol/Map';
import type {
  GeodesyCatalog,
  GeodesyLayerId,
  GeodesyLayerVisibility,
  GeodesyWfsAttributeFilterValues,
} from '@ign/gdp-tools';
import {
  GEODESY_ANNEX_LAYERS,
  getGeodesyAnnexFeaturesLastLoadedAt,
  loadGeodesyAnnexFeatures,
  reloadGeodesyAnnexLayerOnMap,
} from '@ign/gdp-tools';

export interface GeodesyUiLayerItem {
  id: GeodesyLayerId;
  title: string;
  shortLabel?: string;
}

import { MapGeodesyFiltersPanel } from '@/features/map/components/MapGeodesyFiltersPanel';
import { MapLayerInfoPanel } from '@/features/map/components/MapLayerInfoPanel';
import { MapLayersPanel } from '@/features/map/components/MapLayersPanel';
import type { MapLayerGroupId } from '@/features/map/types/mapLayerGroups';
import type { MapLayerSheetItem } from '@/features/map/types/mapLayerSheet';
import { GEOPORTAIL_LAYERS } from '@/shared/constants/map';
import type { GdpGeodesyMode } from '@/shared/constants/geodesy';
import type { ReportMapLayerVisibility } from '@/shared/constants/reportMapLayers';
import { Alert } from '@/shared/ui/Alert';
import { formatDateTime } from '@/shared/utils/date';

const RGP_ANNEX_LAYER = GEODESY_ANNEX_LAYERS.find((layer) => layer.id === 'GDP_RGP2');

function formatRgpLastLoadedSubtitle(loadedAt: Date | null): string | undefined {
  if (!loadedAt) {
    return undefined;
  }

  return `MAJ : ${formatDateTime(loadedAt)}`;
}

const BASEMAP_SHEET_LAYERS = [
  {
    id: GEOPORTAIL_LAYERS.PLAN_IGN,
    title: 'Plan IGN v2',
    detailDescription:
      'Fond de plan vectoriel IGN à l’échelle nationale, optimisé pour la consultation et l’orientation sur le terrain.',
  },
  {
    id: GEOPORTAIL_LAYERS.ORTHOPHOTOS,
    title: 'Ortho',
    detailDescription:
      'Orthophotographies aériennes IGN : imagerie haute résolution pour visualiser le terrain et les constructions.',
  },
  {
    id: GEOPORTAIL_LAYERS.MAPS_SCAN25TOUR,
    title: 'SCAN 25',
    detailDescription:
      'Carte topographique SCAN 25® Tour : fond détaillé pour la randonnée et la lecture du relief.',
  },
] as const;

export interface MapLayersPanelFlowProps {
  isOpen: boolean;
  onClose: () => void;
  focusGroupId?: MapLayerGroupId | null;
  map: Map | null;
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
  onFiltersPanelOpenChange?: (isOpen: boolean) => void;
}

function isWfsLayerId(catalog: GeodesyCatalog, layerId: GeodesyLayerId): boolean {
  return catalog.wfsUiLayerIds.includes(layerId);
}

function isAnnexLayerId(catalog: GeodesyCatalog, layerId: GeodesyLayerId): boolean {
  return catalog.annexUiLayerIds.includes(layerId as (typeof catalog.annexUiLayerIds)[number]);
}

export function MapLayersPanelFlow({
  isOpen,
  onClose,
  focusGroupId = null,
  map,
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
  onFiltersPanelOpenChange,
}: MapLayersPanelFlowProps) {
  const [activeInfoLayerId, setActiveInfoLayerId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [isRgpReloadConfirmOpen, setIsRgpReloadConfirmOpen] = useState(false);
  const [isRgpReloading, setIsRgpReloading] = useState(false);
  const [rgpLastLoadedAt, setRgpLastLoadedAt] = useState<Date | null>(null);
  const reportsLayerVisible = isAuthenticated && reportMapLayers.myReports;

  useEffect(() => {
    const isFiltersPanelOpen = isOpen && showFilters;
    onFiltersPanelOpenChange?.(isFiltersPanelOpen);
    return () => {
      onFiltersPanelOpenChange?.(false);
    };
  }, [isOpen, onFiltersPanelOpenChange, showFilters]);

  const refreshRgpLastLoadedAt = useCallback(() => {
    if (!RGP_ANNEX_LAYER) {
      setRgpLastLoadedAt(null);
      return;
    }

    setRgpLastLoadedAt(getGeodesyAnnexFeaturesLastLoadedAt({
      definition: RGP_ANNEX_LAYER,
      catalog: geodesyCatalog,
    }));
  }, [geodesyCatalog]);

  useEffect(() => {
    if (!isOpen || !RGP_ANNEX_LAYER) {
      return;
    }

    refreshRgpLastLoadedAt();

    void loadGeodesyAnnexFeatures({ definition: RGP_ANNEX_LAYER, catalog: geodesyCatalog })
      .then(() => {
        refreshRgpLastLoadedAt();
      })
      .catch(() => {
        // La date reste inchangée en cas d'échec.
      });
  }, [geodesyCatalog, isOpen, refreshRgpLastLoadedAt]);

  useEffect(() => {
    if (isOpen && focusGroupId === 'geodesy-filters') {
      setShowFilters(true);
      setActiveInfoLayerId(null);
      return;
    }

    if (!isOpen) {
      setActiveInfoLayerId(null);
      setShowFilters(false);
      setIsRgpReloadConfirmOpen(false);
    }
  }, [focusGroupId, isOpen]);

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

  const rgpLastLoadedSubtitle = formatRgpLastLoadedSubtitle(rgpLastLoadedAt);

  const sheetItems = useMemo<readonly MapLayerSheetItem[]>(() => {
    const basemapItems = BASEMAP_SHEET_LAYERS.map(
      (layer) =>
        ({
          id: `basemap:${layer.id}`,
          title: layer.title,
          visible: geoservicesVisible && activeBasemap === layer.id,
          opacity: geoservicesVisible && activeBasemap === layer.id ? 100 : 0,
          showInfo: true,
          detailTitle: layer.title,
          detailDescription: layer.detailDescription,
        }) satisfies MapLayerSheetItem,
    );

    return [
      {
        id: 'reports',
        title: 'Mes signalements',
        visible: reportsLayerVisible,
        opacity: reportsLayerVisible ? 100 : 0,
        toggleDisabled: !isAuthenticated,
        showInfo: true,
        subtitle: isAuthenticated ? undefined : 'Connexion requise',
        detailTitle: 'Mes signalements',
        detailDescription: isAuthenticated
          ? 'Affiche vos signalements repère géodésique sur la carte, dans la zone visible.'
          : 'Connectez-vous pour afficher vos signalements sur la carte.',
      },
      {
        id: 'geodesy-wfs',
        title: 'Géodésie',
        visible: isWfsVisible,
        opacity: isWfsVisible ? 100 : 0,
        showInfo: true,
        detailTitle: 'Géodésie',
        detailDescription:
          'Repères géodésiques issus des flux WFS IGN : réseaux de repères, données associées et symboles métier.',
      },
      ...(annexLayerIds.length > 0
        ? [
            {
              id: 'geodesy-annex-rgp',
              title: 'Réseau GNSS permanent',
              visible: isAnnexVisible,
              opacity: isAnnexVisible ? 100 : 0,
              showInfo: true,
              showRefresh: true,
              subtitle: rgpLastLoadedSubtitle,
              detailTitle: 'Réseau GNSS permanent',
              detailDescription:
                'Stations du Réseau Géodésique Permanent (RGP) : disponibilité et localisation des stations GNSS permanentes.',
            } satisfies MapLayerSheetItem,
          ]
        : []),
      ...basemapItems,
    ];
  }, [activeBasemap, annexLayerIds.length, geoservicesVisible, isAnnexVisible, isAuthenticated, isWfsVisible, reportsLayerVisible, rgpLastLoadedSubtitle]);

  const activeInfoItem = sheetItems.find((item) => item.id === activeInfoLayerId) ?? null;

  const expertFilters = geodesyCatalog.wfsAttributeFilters;
  const showExpertFilters = geodesyMode === 'expert' && expertFilters.length > 0;

  const handleClosePanel = () => {
    setActiveInfoLayerId(null);
    setShowFilters(false);
    setIsRgpReloadConfirmOpen(false);
    onClose();
  };

  const handleCloseInfo = () => {
    setActiveInfoLayerId(null);
  };

  const handleCloseFilters = () => {
    setShowFilters(false);
    if (focusGroupId === 'geodesy-filters') {
      onClose();
    }
  };

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
      return;
    }

    if (layerId.startsWith('basemap:')) {
      const basemapId = layerId.slice('basemap:'.length);
      if (visible) {
        onActiveBasemapChange(basemapId);
        onGeoservicesVisibleChange(true);
      } else if (activeBasemap === basemapId) {
        onGeoservicesVisibleChange(false);
      }
    }
  };

  const handleRefresh = (layerId: string) => {
    if (layerId === 'geodesy-annex-rgp') {
      setIsRgpReloadConfirmOpen(true);
    }
  };

  const handleConfirmRgpReload = async () => {
    if (!map) {
      return;
    }

    setIsRgpReloading(true);
    try {
      await reloadGeodesyAnnexLayerOnMap(map, 'GDP_RGP2');
      refreshRgpLastLoadedAt();
      setIsRgpReloadConfirmOpen(false);
    } catch (error) {
      console.error('[gdp-mobile] RGP reload failed:', error);
    } finally {
      setIsRgpReloading(false);
    }
  };

  const isLayersListOpen = isOpen && !showFilters && activeInfoLayerId === null;

  return (
    <>
      <MapLayersPanel
        isOpen={isLayersListOpen}
        onClose={handleClosePanel}
        items={sheetItems}
        onOpacityChange={handleOpacityChange}
        onInfo={setActiveInfoLayerId}
        onRefresh={handleRefresh}
      />
      <MapLayerInfoPanel
        isOpen={isOpen && activeInfoItem !== null}
        title={activeInfoItem?.detailTitle ?? activeInfoItem?.title ?? ''}
        description={
          activeInfoItem?.id === 'geodesy-annex-rgp' && rgpLastLoadedSubtitle
            ? `${activeInfoItem.detailDescription ?? ''}\n\n${rgpLastLoadedSubtitle}`
            : (activeInfoItem?.detailDescription ?? '')
        }
        onClose={handleClosePanel}
        onBack={handleCloseInfo}
      />
      {showExpertFilters ? (
        <MapGeodesyFiltersPanel
          isOpen={isOpen && showFilters}
          onClose={handleCloseFilters}
          filters={expertFilters}
          values={geodesyWfsAttributeFilterValues}
          onChange={onGeodesyWfsAttributeFilterValuesChange}
          onClear={onClearGeodesyWfsAttributeFilterValues}
        />
      ) : null}
      <Alert
        isOpen={isRgpReloadConfirmOpen}
        onClose={() => {
          if (!isRgpReloading) {
            setIsRgpReloadConfirmOpen(false);
          }
        }}
        title="Recharger les données"
        subtitle="Les données vont être mises à jour. Souhaitez-vous poursuivre ?"
        buttons={[
          {
            label: 'Annuler',
            variant: 'outline',
            disabled: isRgpReloading,
            onClick: () => setIsRgpReloadConfirmOpen(false),
          },
          {
            label: 'Recharger',
            loading: isRgpReloading,
            onClick: () => {
              void handleConfirmRgpReload();
            },
          },
        ]}
      />
    </>
  );
}

export { countActiveMapGeodesyFilters } from '@/features/map/components/MapGeodesyFiltersPanel';
