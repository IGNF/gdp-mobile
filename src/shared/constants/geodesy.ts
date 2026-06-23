import {
  createGeodesyCatalogForProfile,
  defaultGeodesyActiveLayerIdsForProfile,
  defaultGeodesyWfsAttributeFilterValuesForProfile,
  isGeodesyProfile,
  type GeodesyCatalog,
  type GeodesyLayerId,
  type GeodesyProfile,
  type GeodesyWfsAttributeFilterDefinition,
  type GeodesyWfsAttributeFilterValues,
} from '@ign/gdp-tools';

/** Clé API WFS privé Géoplateforme (`.env` : `VITE_GEODESY_WFS_API_KEY`). */
export const GDP_GEODESY_WFS_API_KEY = import.meta.env.VITE_GEODESY_WFS_API_KEY?.trim() ?? '';

/** Mode d'affichage géodésie (alias du profil package). */
export type GdpGeodesyMode = GeodesyProfile;

export const GDP_GEODESY_DEFAULT_MODE: GdpGeodesyMode = 'expert';

/** Pastille « Chargement des repères… » sur la carte (mode expert, couches WFS actives). */
export const GDP_GEODESY_SHOW_WFS_LOADING_INDICATOR = true;

/** Champs GEODESIE_DATA affichés dans la fiche repère (ActionSheet). */
export const GDP_GEODESY_ATTRIBUTE_KEYS = [
  'groupe_type',
  'type',
  'nom',
  'no',
  'img1_url',
  'img2_url',
  'etat',
  'vis_date',
  'commune',
  'expl_gps',
  'localisation',
  'groupe_img1_url',
  'groupe_croquis1_url',
  'url_pdf',
  'maj_date',
] as const;

const wfsApiKeyOption = GDP_GEODESY_WFS_API_KEY || undefined;

/** Filtres expert GDP — ordre et libellés alignés sur la maquette Figma. */
export const GDP_GEODESY_EXPERT_WFS_ATTRIBUTE_FILTERS: readonly GeodesyWfsAttributeFilterDefinition[] =
  [
    {
      id: 'NETWORK_CATEGORY',
      type: 'multiChoice',
      title: 'Type de point',
      property: 'groupe_type',
      matcher: 'network-category',
      options: [
        { value: 'RBF', label: 'RBF' },
        { value: 'RDF', label: 'RDF' },
        { value: 'TRIPLET', label: 'Triplets' },
        { value: 'NON_TRIPLET', label: 'Non triplets' },
      ],
    },
    {
      id: 'PROPRIO',
      type: 'choice',
      title: 'Origine',
      property: 'proprio_sigle',
      options: [
        { value: 'IGN', label: 'IGN' },
        { value: '__other__', label: 'Partenaire', matchOthers: true },
      ],
    },
    {
      id: 'HAS_PHOTO',
      type: 'boolean',
      title: 'Photo',
      property: 'img1_url',
      trueLabel: 'Avec photo',
      falseLabel: 'Sans photo',
    },
    {
      id: 'OBS_DATE_FROM',
      type: 'date',
      title: "Date d'observation",
      property: 'obs_date',
      operator: 'after',
    },
    {
      id: 'OBS_DATE_TO',
      type: 'date',
      title: "Date d'observation",
      property: 'obs_date',
      operator: 'before',
    },
  ];

/** Préférences utilisateur pour le regroupement des repères WFS (mode expert). */
export interface GdpWfsClusterPreferences {
  enabled: boolean;
  /** Distance de fusion des points, en pixels (ol/source/Cluster). */
  distance: number;
}

export const GDP_WFS_CLUSTER_DISTANCE_MIN = 10;
export const GDP_WFS_CLUSTER_DISTANCE_MAX = 100;

export const DEFAULT_GDP_WFS_CLUSTER_PREFERENCES: GdpWfsClusterPreferences = {
  enabled: true,
  distance: 40,
};

function createGdpGeodesyProfileOptions(
  clusterPreferences: GdpWfsClusterPreferences = DEFAULT_GDP_WFS_CLUSTER_PREFERENCES,
) {
  return {
    wfsApiKey: wfsApiKeyOption,
    attributeKeys: GDP_GEODESY_ATTRIBUTE_KEYS,
    wfsAttributeFilters: GDP_GEODESY_EXPERT_WFS_ATTRIBUTE_FILTERS,
    wfsCluster: {
      enabled: clusterPreferences.enabled,
      distance: clusterPreferences.distance,
      maxResolution: 80,
    },
  } as const;
}

export const GDP_GEODESY_PUBLIC_CATALOG = createGeodesyCatalogForProfile(
  'public',
  createGdpGeodesyProfileOptions(),
);

export const GDP_GEODESY_EXPERT_CATALOG = createGeodesyCatalogForProfile(
  'expert',
  createGdpGeodesyProfileOptions(),
);

export const GDP_GEODESY_CATALOG = GDP_GEODESY_EXPERT_CATALOG;

export function createGdpGeodesyCatalog(
  mode: GdpGeodesyMode,
  clusterPreferences: GdpWfsClusterPreferences = DEFAULT_GDP_WFS_CLUSTER_PREFERENCES,
): GeodesyCatalog {
  return createGeodesyCatalogForProfile(mode, createGdpGeodesyProfileOptions(clusterPreferences));
}

export function getGdpGeodesyDefaultActive(mode: GdpGeodesyMode): readonly GeodesyLayerId[] {
  return defaultGeodesyActiveLayerIdsForProfile(mode, { wfsApiKey: wfsApiKeyOption });
}

export function getGdpGeodesyDefaultWfsAttributeFilterValues(
  mode: GdpGeodesyMode,
): GeodesyWfsAttributeFilterValues {
  return defaultGeodesyWfsAttributeFilterValuesForProfile(mode, {
    wfsAttributeFilters: GDP_GEODESY_EXPERT_WFS_ATTRIBUTE_FILTERS,
  });
}

export function isGdpGeodesyMode(value: unknown): value is GdpGeodesyMode {
  return isGeodesyProfile(value);
}
