export type MapLayerGroupId = 'geoservices' | 'geodesy' | 'geodesy-filters' | 'reports';

export interface MapLayerGroupSummary {
  id: MapLayerGroupId;
  title: string;
  count: number;
  visible: boolean;
  canToggle: boolean;
}

export interface MapLayerGroupItem {
  id: string;
  title: string;
  visible: boolean;
  /** Fonds Géoportail : une seule couche active à la fois. */
  selectionMode: 'single' | 'multiple';
}

export interface MapLayerGroupDetails {
  id: MapLayerGroupId;
  title: string;
  items: MapLayerGroupItem[];
}
