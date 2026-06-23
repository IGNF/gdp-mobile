import type { GeodesyLayerId, GeodesyLayerVisibility, GeodesyWfsAttributeFilterValues } from '@ign/gdp-tools';
import { getGeodesyCatalogLayerIds } from '@ign/gdp-tools';
import { Storage } from '@ign/mobile-device';

import {
  DEFAULT_GDP_WFS_CLUSTER_PREFERENCES,
  GDP_GEODESY_DEFAULT_MODE,
  GDP_GEODESY_EXPERT_CATALOG,
  GDP_GEODESY_EXPERT_WFS_ATTRIBUTE_FILTERS,
  GDP_GEODESY_PUBLIC_CATALOG,
  GDP_WFS_CLUSTER_DISTANCE_MAX,
  GDP_WFS_CLUSTER_DISTANCE_MIN,
  getGdpGeodesyDefaultActive,
  getGdpGeodesyDefaultWfsAttributeFilterValues,
  isGdpGeodesyMode,
  type GdpGeodesyMode,
  type GdpWfsClusterPreferences,
} from '@/shared/constants/geodesy';
import { clampNumber } from '@/shared/utils/number';
import {
  DEFAULT_GEOPORTAIL_LAYERS,
  DEFAULT_MAP_CENTER_LON_LAT,
  DEFAULT_MAP_ZOOM,
  GEOPORTAIL_LAYERS,
} from '@/shared/constants/map';
import {
  DEFAULT_REPORT_MAP_LAYER_VISIBILITY,
  type ReportMapLayerVisibility,
} from '@/shared/constants/reportMapLayers';
import { storageKey } from '@/shared/constants/storage';

const MAP_PREFERENCES_STORAGE_KEY = storageKey('MAP_VIEWPORT');

const DEFAULT_BASEMAP = GEOPORTAIL_LAYERS.PLAN_IGN;

const GDP_GEODESY_LAYER_IDS = Array.from(
  new Set([
    ...getGeodesyCatalogLayerIds(GDP_GEODESY_PUBLIC_CATALOG),
    ...getGeodesyCatalogLayerIds(GDP_GEODESY_EXPERT_CATALOG),
  ]),
);

export interface PersistedMapViewport {
  longitude: number;
  latitude: number;
  zoom: number;
}

export interface PersistedMapPreferences extends PersistedMapViewport {
  basemap: string;
  geodesyMode: GdpGeodesyMode;
  geodesyVisibility: GeodesyLayerVisibility;
  geodesyWfsAttributeFilterValues: GeodesyWfsAttributeFilterValues;
  wfsClusterPreferences: GdpWfsClusterPreferences;
  reportMapLayers: ReportMapLayerVisibility;
}

function readFiniteNumber(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return null;
  }
  return value;
}

function normalizeViewport(rawViewport: unknown): PersistedMapViewport | null {
  if (!rawViewport || typeof rawViewport !== 'object') {
    return null;
  }

  const candidate = rawViewport as Partial<PersistedMapViewport>;
  const longitude = readFiniteNumber(candidate.longitude);
  const latitude = readFiniteNumber(candidate.latitude);
  const zoom = readFiniteNumber(candidate.zoom);

  if (longitude === null || latitude === null || zoom === null) {
    return null;
  }

  if (longitude < -180 || longitude > 180 || latitude < -90 || latitude > 90) {
    return null;
  }

  if (zoom < 0 || zoom > 28) {
    return null;
  }

  return { longitude, latitude, zoom };
}

function isValidBasemap(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    DEFAULT_GEOPORTAIL_LAYERS.includes(value as (typeof DEFAULT_GEOPORTAIL_LAYERS)[number])
  );
}

function createDefaultGeodesyVisibility(mode: GdpGeodesyMode): GeodesyLayerVisibility {
  const defaultActive = new Set(getGdpGeodesyDefaultActive(mode));

  return Object.fromEntries(
    GDP_GEODESY_LAYER_IDS.map((layerId) => [layerId, defaultActive.has(layerId)]),
  ) as GeodesyLayerVisibility;
}

function normalizeGeodesyVisibility(
  rawVisibility: unknown,
  mode: GdpGeodesyMode,
): GeodesyLayerVisibility {
  const visibility = createDefaultGeodesyVisibility(mode);

  if (!rawVisibility || typeof rawVisibility !== 'object') {
    return visibility;
  }

  const candidate = rawVisibility as Partial<Record<GeodesyLayerId, unknown>>;
  GDP_GEODESY_LAYER_IDS.forEach((layerId) => {
    const value = candidate[layerId];
    if (typeof value === 'boolean') {
      visibility[layerId] = value;
    }
  });

  return visibility;
}

function normalizeWfsClusterPreferences(rawPreferences: unknown): GdpWfsClusterPreferences {
  const defaults = DEFAULT_GDP_WFS_CLUSTER_PREFERENCES;

  if (!rawPreferences || typeof rawPreferences !== 'object') {
    return defaults;
  }

  const candidate = rawPreferences as Partial<GdpWfsClusterPreferences>;
  const enabled =
    typeof candidate.enabled === 'boolean' ? candidate.enabled : defaults.enabled;
  const distance =
    typeof candidate.distance === 'number' && Number.isFinite(candidate.distance)
      ? Math.round(
          clampNumber(candidate.distance, GDP_WFS_CLUSTER_DISTANCE_MIN, GDP_WFS_CLUSTER_DISTANCE_MAX),
        )
      : defaults.distance;

  return { enabled, distance };
}

function normalizeGeodesyWfsAttributeFilterValues(
  rawValues: unknown,
  mode: GdpGeodesyMode,
): GeodesyWfsAttributeFilterValues {
  const values = getGdpGeodesyDefaultWfsAttributeFilterValues(mode);

  if (mode !== 'expert' || !rawValues || typeof rawValues !== 'object') {
    return values;
  }

  const candidate = rawValues as Partial<Record<string, unknown>>;
  GDP_GEODESY_EXPERT_WFS_ATTRIBUTE_FILTERS.forEach((filter) => {
    const value = candidate[filter.id];
    if (value === null || value === undefined) {
      values[filter.id] = null;
      return;
    }

    if (filter.type === 'boolean' && typeof value === 'boolean') {
      values[filter.id] = value;
      return;
    }

    if ((filter.type === 'date' || filter.type === 'text' || filter.type === 'choice' || filter.type === 'multiChoice') && typeof value === 'string') {
      values[filter.id] = value;
    }
  });

  return values;
}

function normalizeReportMapLayers(rawLayers: unknown): ReportMapLayerVisibility {
  const defaults = DEFAULT_REPORT_MAP_LAYER_VISIBILITY;

  if (!rawLayers || typeof rawLayers !== 'object') {
    return defaults;
  }

  const candidate = rawLayers as Partial<ReportMapLayerVisibility>;

  return {
    myReports: typeof candidate.myReports === 'boolean' ? candidate.myReports : defaults.myReports,
    groupReports:
      typeof candidate.groupReports === 'boolean' ? candidate.groupReports : defaults.groupReports,
  };
}

function normalizeMapPreferences(rawPreferences: unknown): PersistedMapPreferences | null {
  const viewport = normalizeViewport(rawPreferences);
  if (!viewport) {
    return null;
  }

  const candidate = (rawPreferences ?? {}) as Partial<PersistedMapPreferences>;
  const basemap = isValidBasemap(candidate.basemap) ? candidate.basemap : DEFAULT_BASEMAP;
  const geodesyMode = isGdpGeodesyMode(candidate.geodesyMode)
    ? candidate.geodesyMode
    : GDP_GEODESY_DEFAULT_MODE;
  const geodesyVisibility = normalizeGeodesyVisibility(candidate.geodesyVisibility, geodesyMode);
  const geodesyWfsAttributeFilterValues = normalizeGeodesyWfsAttributeFilterValues(
    candidate.geodesyWfsAttributeFilterValues,
    geodesyMode,
  );
  const wfsClusterPreferences = normalizeWfsClusterPreferences(candidate.wfsClusterPreferences);
  const reportMapLayers = normalizeReportMapLayers(candidate.reportMapLayers);

  return {
    ...viewport,
    basemap,
    geodesyMode,
    geodesyVisibility,
    geodesyWfsAttributeFilterValues,
    wfsClusterPreferences,
    reportMapLayers,
  };
}

export async function getMapPreferences(): Promise<PersistedMapPreferences | null> {
  const stored = await Storage.get(MAP_PREFERENCES_STORAGE_KEY, 'object');
  return normalizeMapPreferences(stored);
}

export async function saveMapPreferences(
  partial: Partial<PersistedMapPreferences>,
): Promise<void> {
  const current = (await getMapPreferences()) ?? getDefaultMapPreferences();
  const merged: Partial<PersistedMapPreferences> = {
    ...current,
    ...partial,
  };

  if (partial.geodesyVisibility) {
    merged.geodesyVisibility = {
      ...current.geodesyVisibility,
      ...partial.geodesyVisibility,
    };
  }

  if (partial.geodesyWfsAttributeFilterValues) {
    merged.geodesyWfsAttributeFilterValues = {
      ...current.geodesyWfsAttributeFilterValues,
      ...partial.geodesyWfsAttributeFilterValues,
    };
  }

  if (partial.wfsClusterPreferences) {
    merged.wfsClusterPreferences = {
      ...current.wfsClusterPreferences,
      ...partial.wfsClusterPreferences,
    };
  }

  if (partial.reportMapLayers) {
    merged.reportMapLayers = {
      ...current.reportMapLayers,
      ...partial.reportMapLayers,
    };
  }

  const normalized = normalizeMapPreferences(merged);
  if (!normalized) {
    return;
  }

  await Storage.set(MAP_PREFERENCES_STORAGE_KEY, normalized, 'object');
}

export function getDefaultMapPreferences(): PersistedMapPreferences {
  const geodesyMode = GDP_GEODESY_DEFAULT_MODE;

  return {
    longitude: DEFAULT_MAP_CENTER_LON_LAT[0],
    latitude: DEFAULT_MAP_CENTER_LON_LAT[1],
    zoom: DEFAULT_MAP_ZOOM,
    basemap: DEFAULT_BASEMAP,
    geodesyMode,
    geodesyVisibility: createDefaultGeodesyVisibility(geodesyMode),
    geodesyWfsAttributeFilterValues: getGdpGeodesyDefaultWfsAttributeFilterValues(geodesyMode),
    wfsClusterPreferences: DEFAULT_GDP_WFS_CLUSTER_PREFERENCES,
    reportMapLayers: DEFAULT_REPORT_MAP_LAYER_VISIBILITY,
  };
}

export async function getMapViewport(): Promise<PersistedMapViewport | null> {
  const preferences = await getMapPreferences();
  return preferences;
}

export async function saveMapViewport(viewport: PersistedMapViewport): Promise<void> {
  await saveMapPreferences(viewport);
}

export function getDefaultMapViewport(): PersistedMapViewport {
  return getDefaultMapPreferences();
}
