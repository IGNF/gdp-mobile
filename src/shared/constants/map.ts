export const GEOLOCATION_DOUBLE_TAP_DELAY_MS = 300;
export const GEOLOCATION_TRACKING_RECENTER_INTERVAL_MS = 1000;
export const GEOLOCATION_LOCK_RECENTER_INTERVAL_MS = 30000;
export const GEOLOCATION_LOCK_RECENTER_ANIMATION_DURATION_MS = 1000;
export const GEOLOCATION_RECENTER_AFTER_MOVEMENT_MS = 10000;

export const USER_LOCATION_LAYER_NAME = 'UserLocationMarker';
export const USER_LOCATION_MARKER_Z_INDEX = Number.POSITIVE_INFINITY;

export const GROUP_REPORT_MARKER_LAYER_NAME = 'GroupReportMarker';
export const GROUP_REPORT_MARKER_Z_INDEX = 9999;

export const MAP_CLICK_SELECTION_MARKER_LAYER_NAME = 'MapClickSelectionMarker';
export const MAP_CLICK_SELECTION_MARKER_Z_INDEX = 9998;

/** Zoom appliqué lors de l’ouverture d’un signalement groupe sur la carte. */
export const GROUP_REPORT_MAP_FOCUS_ZOOM = 17;

/** Zoom par défaut de la mini-carte de positionnement d’un signalement. */
export const REPORT_POSITION_MAP_DEFAULT_ZOOM = 19;

export const DEFAULT_MAP_CENTER_LON_LAT: [number, number] = [2.3522, 48.8566];
export const DEFAULT_MAP_ZOOM = 11;
export const DEFAULT_MAP_FOCUS_ZOOM = 13;
export const DEFAULT_MAP_FOCUS_ZOOM_ON_USER_LOCATION = 16;
export const DEFAULT_MAP_SEARCH_ZOOM = 16;
/** Nombre de recherches d’adresse mémorisées (ol-ext + localStorage). */
export const SEARCH_ADDRESS_MAX_HISTORY = 10;
export const DEFAULT_MAP_SHOW_SCALELINE = true;

/** Clé publique Géoportail (services essentiels, proxy wxs.ign.fr). */
export const GEOPORTAIL_API_KEY = 'essentiels';

/** Clé publique Géoplateforme (WMTS ouvert data.geopf.fr/wmts). */
export const GEOPORTAIL_PUBLIC_GPF_KEY = 'gpf';

/** Serveur WMTS privé Géoplateforme (couches nécessitant une apikey). */
export const GEOPORTAIL_PRIVATE_WMTS_SERVER = 'https://data.geopf.fr/private/wmts';

/**
 * Clé WMTS privée pour les fonds SCAN (MAPS, SCAN25TOUR, …).
 * Surcharge possible via VITE_GEOPORTAIL_SCAN_API_KEY.
 */
export const GEOPORTAIL_PRIVATE_SCAN_API_KEY = (
  import.meta.env.VITE_GEOPORTAIL_SCAN_API_KEY || 'ign_scan_ws'
).trim();

export const GEOPORTAIL_LAYERS = {
  MAPS: 'GEOGRAPHICALGRIDSYSTEMS.MAPS',
  MAPS_SCAN25TOUR: 'GEOGRAPHICALGRIDSYSTEMS.MAPS.SCAN25TOUR',
  PLAN_IGN: 'GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2',
  ORTHOPHOTOS: 'ORTHOIMAGERY.ORTHOPHOTOS',
} as const;

/** Fonds WMTS privés Géoplateforme (apikey ign_scan_ws par défaut). */
export const GEOPORTAIL_PRIVATE_SCAN_LAYERS = [
  GEOPORTAIL_LAYERS.MAPS,
  GEOPORTAIL_LAYERS.MAPS_SCAN25TOUR,
] as const;

export const GEOPORTAIL_PRIVATE_SCAN_LAYER_SET = new Set<string>(GEOPORTAIL_PRIVATE_SCAN_LAYERS);

export const DEFAULT_GEOPORTAIL_LAYERS = [
  GEOPORTAIL_LAYERS.PLAN_IGN,
  GEOPORTAIL_LAYERS.ORTHOPHOTOS,
  GEOPORTAIL_LAYERS.MAPS,
  GEOPORTAIL_LAYERS.MAPS_SCAN25TOUR,
] as const;

export const GEOPORTAIL_LAYER_TITLES: Record<string, string> = {
  [GEOPORTAIL_LAYERS.MAPS]: 'Cartes',
  [GEOPORTAIL_LAYERS.MAPS_SCAN25TOUR]: 'SCAN 25',
  [GEOPORTAIL_LAYERS.PLAN_IGN]: 'Plans',
  [GEOPORTAIL_LAYERS.ORTHOPHOTOS]: 'Photos',
};

export const GEOPORTAIL_SERVER = 'https://data.geopf.fr/wmts';
