import LayerGroup from 'ol/layer/Group';
import ol_layer_Geoportail from 'ol-ext/layer/Geoportail';
import {
  DEFAULT_GEOPORTAIL_LAYERS,
  GEOPORTAIL_API_KEY,
  GEOPORTAIL_LAYER_TITLES,
  GEOPORTAIL_LAYERS,
  GEOPORTAIL_PRIVATE_SCAN_API_KEY,
  GEOPORTAIL_PRIVATE_SCAN_LAYER_SET,
  GEOPORTAIL_PRIVATE_SCAN_LAYERS,
  GEOPORTAIL_PRIVATE_WMTS_SERVER,
  GEOPORTAIL_PUBLIC_GPF_KEY,
} from '@/shared/constants/map';

export interface GeoportailLayerConfig {
  name: string;
  visible?: boolean;
  opacity?: number;
  server?: string;
  gppKey?: string;
  format?: string;
  minZoom?: number;
  maxZoom?: number;
  title?: string;
}

interface GeoportailCapability {
  server?: string;
  key?: string;
  format?: string;
  minZoom?: number;
  maxZoom?: number;
}

interface GeoportailEndpointConfig {
  server: string;
  gppKey: string;
}

const GEOPORTAIL_PROXY_SERVER = 'https://wxs.ign.fr/proxy/';

// Type augmentation for missing static property in type definitions
const GeoportailClass = ol_layer_Geoportail as typeof ol_layer_Geoportail & {
  capabilities: Record<string, GeoportailCapability>;
};

const GEOSERVICES_ATTRIBUTION = {
  Geoservices: { attribution: 'Géoservices', href: 'https://geoservices.ign.fr/' },
};

const PRIVATE_SCAN_LAYER_FALLBACKS: Record<string, Record<string, unknown>> = {
  [GEOPORTAIL_LAYERS.MAPS_SCAN25TOUR]: {
    layer: GEOPORTAIL_LAYERS.MAPS_SCAN25TOUR,
    theme: 'cartes',
    desc: 'SCAN 25 Touristique',
    format: 'image/jpeg',
    minZoom: 6,
    maxZoom: 16,
    bbox: [-178.206, -46.5029, 77.6492, 51.1751],
    originators: GEOSERVICES_ATTRIBUTION,
    queryable: false,
    style: 'normal',
    tilematrix: 'PM',
    title: 'SCAN 25 Touristique',
  },
};

function patchPrivateScanCapabilities(): void {
  for (const layerName of GEOPORTAIL_PRIVATE_SCAN_LAYERS) {
    GeoportailClass.capabilities[layerName] = {
      ...PRIVATE_SCAN_LAYER_FALLBACKS[layerName],
      ...GeoportailClass.capabilities[layerName],
      server: GEOPORTAIL_PRIVATE_WMTS_SERVER,
      key: GEOPORTAIL_PRIVATE_SCAN_API_KEY,
    };
  }
}

patchPrivateScanCapabilities();

function getGeoportailEndpointConfig(url: string): GeoportailEndpointConfig {
  const serverUrl = url.split('?')[0];

  if (serverUrl.includes('data.geopf.fr/private')) {
    return {
      server: GEOPORTAIL_PRIVATE_WMTS_SERVER,
      gppKey: GEOPORTAIL_PRIVATE_SCAN_API_KEY,
    };
  }

  if (serverUrl.includes('data.geopf.fr')) {
    return {
      server: 'https://data.geopf.fr/wmts',
      gppKey: GEOPORTAIL_PUBLIC_GPF_KEY,
    };
  }

  return {
    server: GEOPORTAIL_PROXY_SERVER,
    gppKey: GEOPORTAIL_API_KEY,
  };
}

function getDefaultGeoportailLayerConfig(
  layerName: string,
): Pick<GeoportailLayerConfig, 'server' | 'gppKey'> {
  if (GEOPORTAIL_PRIVATE_SCAN_LAYER_SET.has(layerName)) {
    return {
      server: GEOPORTAIL_PRIVATE_WMTS_SERVER,
      gppKey: GEOPORTAIL_PRIVATE_SCAN_API_KEY,
    };
  }

  return {};
}

let geoportailCapabilitiesPromise: Promise<void> | null = null;

/**
 * Initialize Geoportail capabilities by loading them from the server.
 * Une seule requête GetCapabilities partagée (même en StrictMode / cartes multiples).
 * Ne bloque pas l’affichage : les defaults ol-ext suffisent en attendant.
 */
export function initGeoportailCapabilities(): Promise<void> {
  if (!geoportailCapabilitiesPromise) {
    geoportailCapabilitiesPromise = (async () => {
      const [publicCapabilities, privateCapabilities] = await Promise.all([
        ol_layer_Geoportail.getCapabilities(GEOPORTAIL_PUBLIC_GPF_KEY),
        ol_layer_Geoportail.getCapabilities(GEOPORTAIL_PRIVATE_SCAN_API_KEY).catch((error) => {
          console.warn('Failed to load private Geoportail capabilities:', error);
          return {};
        }),
      ]);
      Object.assign(GeoportailClass.capabilities, publicCapabilities);
      Object.assign(GeoportailClass.capabilities, privateCapabilities);
      patchPrivateScanCapabilities();
    })().catch((error) => {
      geoportailCapabilitiesPromise = null;
      throw error;
    });
  }

  return geoportailCapabilitiesPromise;
}

/** Lance le chargement des capabilities sans attendre (fond de carte immédiat). */
export function preloadGeoportailCapabilities(): void {
  void initGeoportailCapabilities().catch((error) => {
    console.warn('Failed to preload Geoportail capabilities:', error);
  });
}

export function createGeoportailLayer(config: GeoportailLayerConfig): ol_layer_Geoportail {
  const { name, visible = false, opacity = 1 } = config;
  const capability = GeoportailClass.capabilities[name];
  const server = config.server ?? capability?.server;
  const gppKey =
    config.gppKey ??
    capability?.key ??
    (server?.includes('data.geopf.fr/private') ? GEOPORTAIL_PRIVATE_SCAN_API_KEY : undefined);
  const format = config.format ?? capability?.format;
  const minZoom = config.minZoom ?? capability?.minZoom;
  const maxZoom = config.maxZoom ?? capability?.maxZoom;

  const layerOptions: ConstructorParameters<typeof ol_layer_Geoportail>[1] & {
    gppKey?: string;
    hidpi?: boolean;
  } = {
    hidpi: false,
    visible,
    opacity,
    gppKey,
  };

  const tileOptions: NonNullable<ConstructorParameters<typeof ol_layer_Geoportail>[2]> & {
    maxZoom?: number;
  } = {
    server,
    gppKey,
    format,
    minZoom,
    maxZoom,
  };

  const layer = new ol_layer_Geoportail(name, layerOptions, tileOptions);

  if (config.title) {
    layer.set('title', config.title);
  }
  layer.set('geoportailLayerName', name);
  return layer;
}

export function getGeoportailLayerTitle(layerName: string): string {
  return GEOPORTAIL_LAYER_TITLES[layerName] ?? layerName;
}

export function createGeoportailLayerGroup(
  layerNames: readonly string[] = DEFAULT_GEOPORTAIL_LAYERS,
): LayerGroup {
  const layers = layerNames.map((name, index) =>
    createGeoportailLayer({
      name,
      visible: index === 0,
      opacity: 1,
      title: getGeoportailLayerTitle(name),
      ...getDefaultGeoportailLayerConfig(name),
    }),
  );

  return new LayerGroup({
    properties: {
      title: 'Géoservices',
      name: 'geoportailGroup',
    },
    layers,
  });
}

/** Affiche un fond Géoportail et masque les autres du groupe. */
export function setActiveGeoportailLayer(group: LayerGroup, layerName: string): void {
  group.getLayers().forEach((layer) => {
    const name = layer.get('geoportailLayerName') as string | undefined;
    layer.setVisible(name === layerName);
  });
}

export function getGeoportailLayerGroup(map: import('ol/Map').default): LayerGroup | null {
  const layers = map.getLayers().getArray();
  const group = layers.find(
    (layer) => layer instanceof LayerGroup && layer.get('name') === 'geoportailGroup',
  );
  return group instanceof LayerGroup ? group : null;
}

export { GEOPORTAIL_API_KEY, getGeoportailEndpointConfig };
