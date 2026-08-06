export interface MapLayerSheetItem {
  id: string;
  title: string;
  thumbnail?: string;
  legend?: string;
  visible: boolean;
  opacity: number;
  showInfo?: boolean;
  showRefresh?: boolean;
  showOpacity?: boolean;
  toggleDisabled?: boolean;
  subtitle?: string;
  detailTitle?: string;
  detailDescription?: string;
}
