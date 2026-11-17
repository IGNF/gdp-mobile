import {
  featureMatchesVisibleNetworkLayers,
  geodesyWfsFeatureMatchesAttributeFilters,
  getGeodesyCatalogFromMap,
  getGeodesyLayersVisibility,
  queryGeodesyAtCoordinate,
  type GeodesyFeatureInfoHit,
  type GeodesyWfsAttributeFilterDefinition,
  type GeodesyWfsAttributeFilterValues,
  type GeodesyWmsLayerId,
} from '@ign/gdp-tools';
import type { Extent } from 'ol/extent';
import type Map from 'ol/Map';
import type { Coordinate } from 'ol/coordinate';
import Point from 'ol/geom/Point';

const DEFAULT_MAX_SAMPLES = 56;
const DEFAULT_CONCURRENCY = 6;

export interface FetchGeodesyHitsInMapExtentOptions {
  maxSamples?: number;
  concurrency?: number;
  wfsAttributeFilters?: readonly GeodesyWfsAttributeFilterDefinition[];
  wfsAttributeFilterValues?: GeodesyWfsAttributeFilterValues;
}

function buildSampleCoordinates(extent: Extent, maxSamples: number): Coordinate[] {
  const [minX, minY, maxX, maxY] = extent;
  const width = maxX - minX;
  const height = maxY - minY;

  if (width <= 0 || height <= 0) {
    return [[(minX + maxX) / 2, (minY + maxY) / 2]];
  }

  const aspect = width / height;
  const cols = Math.max(1, Math.ceil(Math.sqrt(maxSamples * aspect)));
  const rows = Math.max(1, Math.ceil(maxSamples / cols));
  const coordinates: Coordinate[] = [];

  for (let col = 0; col < cols; col += 1) {
    for (let row = 0; row < rows; row += 1) {
      if (coordinates.length >= maxSamples) {
        return coordinates;
      }

      const x = minX + ((col + 0.5) / cols) * width;
      const y = minY + ((row + 0.5) / rows) * height;
      coordinates.push([x, y]);
    }
  }

  return coordinates;
}

function buildHitDedupeKey(hit: GeodesyFeatureInfoHit): string {
  const properties = hit.feature.getProperties();
  const businessId = properties.id ?? properties.ID ?? properties.no ?? properties.NO;
  if (businessId !== undefined && businessId !== null) {
    return `${hit.layerId}:${String(businessId)}`;
  }

  const geometry = hit.feature.getGeometry();
  if (geometry instanceof Point) {
    const [x, y] = geometry.getCoordinates();
    return `${hit.layerId}:${x.toFixed(3)}:${y.toFixed(3)}`;
  }

  return `${hit.layerId}:${hit.feature.getId() ?? 'unknown'}`;
}

/** Types de réseau cochés dans le panneau Couches (WMS, sans WFS). */
function resolveActiveNetworkLayerIds(map: Map): GeodesyWmsLayerId[] {
  const catalog = getGeodesyCatalogFromMap(map);
  const visibility = getGeodesyLayersVisibility(map);

  return catalog.layers
    .filter((layer) => layer.id !== catalog.dataLayerId && visibility[layer.id])
    .map((layer) => layer.id);
}

function filterHitsByNetworkVisibility(
  map: Map,
  hits: GeodesyFeatureInfoHit[],
): GeodesyFeatureInfoHit[] {
  const activeNetworkLayerIds = resolveActiveNetworkLayerIds(map);

  if (activeNetworkLayerIds.length === 0) {
    return hits;
  }

  const catalog = getGeodesyCatalogFromMap(map);

  return hits.filter((hit) =>
    featureMatchesVisibleNetworkLayers(
      hit.feature.getProperties(),
      activeNetworkLayerIds,
      catalog,
    ),
  );
}

function filterHitsByExpertFilters(
  hits: GeodesyFeatureInfoHit[],
  options: FetchGeodesyHitsInMapExtentOptions,
): GeodesyFeatureInfoHit[] {
  const definitions = options.wfsAttributeFilters ?? [];
  const values = options.wfsAttributeFilterValues ?? {};

  if (!definitions.length) {
    return hits;
  }

  return hits.filter((hit) =>
    geodesyWfsFeatureMatchesAttributeFilters(hit.feature, definitions, values),
  );
}

function mergeUniqueHits(hitGroups: readonly GeodesyFeatureInfoHit[][]): GeodesyFeatureInfoHit[] {
  const seen = new Set<string>();
  const merged: GeodesyFeatureInfoHit[] = [];

  for (const hits of hitGroups) {
    for (const hit of hits) {
      const key = buildHitDedupeKey(hit);
      if (seen.has(key)) {
        continue;
      }

      seen.add(key);
      merged.push(hit);
    }
  }

  return merged;
}

async function runWithConcurrency<T>(
  tasks: readonly (() => Promise<T>)[],
  concurrency: number,
): Promise<T[]> {
  const results: T[] = new Array(tasks.length);
  let nextIndex = 0;

  async function worker(): Promise<void> {
    while (nextIndex < tasks.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await tasks[index]();
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, tasks.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

/**
 * Repères dans une emprise via GetFeatureInfo WMS (couche data / TOUT), comme un clic carte.
 * Pas de source vectorielle WFS.
 */
export async function fetchGeodesyHitsInMapExtent(
  map: Map,
  extent: Extent,
  options: FetchGeodesyHitsInMapExtentOptions = {},
): Promise<GeodesyFeatureInfoHit[]> {
  const maxSamples = options.maxSamples ?? DEFAULT_MAX_SAMPLES;
  const concurrency = options.concurrency ?? DEFAULT_CONCURRENCY;
  const coordinates = buildSampleCoordinates(extent, maxSamples);

  const hitGroups = await runWithConcurrency(
    coordinates.map(
      (coordinate) => () =>
        queryGeodesyAtCoordinate(map, coordinate, { filterByVisibleNetworkLayers: false }),
    ),
    concurrency,
  );

  const merged = mergeUniqueHits(hitGroups);
  const networkFiltered = filterHitsByNetworkVisibility(map, merged);

  return filterHitsByExpertFilters(networkFiltered, options);
}
