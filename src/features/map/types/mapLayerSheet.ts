export type MapLayerSheetGroup = 'data' | 'basemap';

export interface MapLayerSheetItem {
  id: string;
  group: MapLayerSheetGroup;
  title: string;
  thumbnail?: string;
  visible: boolean;
  opacity: number;
  showOpacity?: boolean;
  toggleDisabled?: boolean;
}
