import { useEffect, useMemo, useState } from 'react';
import { defaultGeodesyLayerVisibility } from '@ign/gdp-tools';
import type {
  GeodesyCatalog,
  GeodesyLayerId,
  GeodesyLayerVisibility,
  GeodesyWfsAttributeFilterValues,
} from '@ign/gdp-tools';

export interface GeodesyUiLayerItem {
  id: GeodesyLayerId;
  title: string;
  shortLabel?: string;
}

import { MapGeodesyFiltersPanel, countActiveMapGeodesyFilters } from '@/features/map/components/MapGeodesyFiltersPanel';
import { MapLayerGroupDetails } from '@/features/map/components/MapLayerGroupDetails';
import { MapLayersPanel } from '@/features/map/components/MapLayersPanel';
import type {
  MapLayerGroupDetails as MapLayerGroupDetailsType,
  MapLayerGroupId,
  MapLayerGroupSummary,
} from '@/features/map/types/mapLayerGroups';
import { DEFAULT_GEOPORTAIL_LAYERS } from '@/shared/constants/map';
import { getGeoportailLayerTitle } from '@/infra/map/openlayers/geoportailLayers';
import type { GdpGeodesyMode } from '@/shared/constants/geodesy';

export interface MapLayersPanelFlowProps {
  isOpen: boolean;
  onClose: () => void;
  focusGroupId?: MapLayerGroupId | null;
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
}

export function MapLayersPanelFlow({
  isOpen,
  onClose,
  focusGroupId = null,
  activeBasemap,
  onActiveBasemapChange,
  geoservicesVisible,
  onGeoservicesVisibleChange,
  geodesyMode,
  geodesyVisibility,
  onGeodesyVisibilityChange,
  onGeodesyToggle,
  geodesyUiLayers,
  geodesyCatalog,
  geodesyDefaultActive = ['RBF'],
  geodesyWfsAttributeFilterValues,
  onGeodesyWfsAttributeFilterValuesChange,
  onClearGeodesyWfsAttributeFilterValues,
}: MapLayersPanelFlowProps) {
  const [activeGroupId, setActiveGroupId] = useState<MapLayerGroupId | null>(null);

  useEffect(() => {
    if (isOpen && focusGroupId) {
      setActiveGroupId(focusGroupId);
      return;
    }

    if (!isOpen) {
      setActiveGroupId(null);
    }
  }, [focusGroupId, isOpen]);

  const geodesyActiveCount = geodesyUiLayers.filter((layer) => geodesyVisibility[layer.id]).length;
  const geodesyGroupVisible = geodesyActiveCount > 0;
  const expertFilters = geodesyCatalog.wfsAttributeFilters;
  const showExpertFilters = geodesyMode === 'expert' && expertFilters.length > 0;
  const activeFilterCount = countActiveMapGeodesyFilters(
    expertFilters,
    geodesyWfsAttributeFilterValues,
  );

  const groups = useMemo<MapLayerGroupSummary[]>(
    () => [
      {
        id: 'geoservices',
        title: 'Géoservices',
        count: DEFAULT_GEOPORTAIL_LAYERS.length,
        visible: geoservicesVisible,
        canToggle: true,
      },
      {
        id: 'geodesy',
        title: 'Géodésie',
        count: geodesyActiveCount,
        visible: geodesyGroupVisible,
        canToggle: true,
      },
      ...(showExpertFilters
        ? [
            {
              id: 'geodesy-filters' as const,
              title: 'Filtres repères',
              count: activeFilterCount,
              visible: activeFilterCount > 0,
              canToggle: false,
            },
          ]
        : []),
    ],
    [
      activeFilterCount,
      geodesyActiveCount,
      geodesyGroupVisible,
      geoservicesVisible,
      showExpertFilters,
    ],
  );

  const groupDetails = useMemo<MapLayerGroupDetailsType | null>(() => {
    if (!activeGroupId || activeGroupId === 'geodesy-filters') {
      return null;
    }

    if (activeGroupId === 'geoservices') {
      return {
        id: 'geoservices',
        title: 'Géoservices',
        items: DEFAULT_GEOPORTAIL_LAYERS.map((layerName) => ({
          id: layerName,
          title: getGeoportailLayerTitle(layerName),
          visible: activeBasemap === layerName,
          selectionMode: 'single' as const,
        })),
      };
    }

    return {
      id: 'geodesy',
      title: 'Géodésie',
      items: geodesyUiLayers.map((layer) => ({
        id: layer.id,
        title: layer.title,
        visible: geodesyVisibility[layer.id] ?? false,
        selectionMode: 'multiple' as const,
      })),
    };
  }, [activeBasemap, activeGroupId, geodesyUiLayers, geodesyVisibility]);

  const isGroupOpen = isOpen && activeGroupId !== null && activeGroupId !== 'geodesy-filters';
  const isFiltersOpen = isOpen && activeGroupId === 'geodesy-filters';
  const isPanelOpen = isOpen && activeGroupId === null;

  const handleClosePanel = () => {
    setActiveGroupId(null);
    onClose();
  };

  const handleCloseGroup = () => {
    setActiveGroupId(null);
  };

  const handleToggleGroupVisibility = (groupId: MapLayerGroupId) => {
    if (groupId === 'geoservices') {
      onGeoservicesVisibleChange(!geoservicesVisible);
      return;
    }

    if (geodesyGroupVisible) {
      onGeodesyVisibilityChange(defaultGeodesyLayerVisibility([], geodesyCatalog));
      return;
    }

    onGeodesyVisibilityChange(
      defaultGeodesyLayerVisibility([...geodesyDefaultActive], geodesyCatalog),
    );
  };

  const handleSelectBasemap = (layerName: string) => {
    onActiveBasemapChange(layerName);
    if (!geoservicesVisible) {
      onGeoservicesVisibleChange(true);
    }
  };

  const handleToggleGeodesyLayer = (layerId: string) => {
    onGeodesyToggle(layerId as GeodesyLayerId);
  };

  return (
    <>
      <MapLayersPanel
        isOpen={isPanelOpen}
        onClose={handleClosePanel}
        groups={groups}
        onOpenGroup={setActiveGroupId}
        onToggleGroupVisibility={handleToggleGroupVisibility}
      />
      <MapLayerGroupDetails
        isOpen={isGroupOpen}
        onClose={handleCloseGroup}
        group={groupDetails}
        onToggleLayer={handleToggleGeodesyLayer}
        onSelectLayer={handleSelectBasemap}
      />
      <MapGeodesyFiltersPanel
        isOpen={isFiltersOpen}
        onClose={handleCloseGroup}
        filters={expertFilters}
        values={geodesyWfsAttributeFilterValues}
        onChange={onGeodesyWfsAttributeFilterValuesChange}
        onClear={onClearGeodesyWfsAttributeFilterValues}
      />
    </>
  );
}
