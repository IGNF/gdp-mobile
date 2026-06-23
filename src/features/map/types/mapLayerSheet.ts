export interface MapLayerSheetItem {
  id: string;
  title: string;
  visible: boolean;
  opacity: number;
  showInfo?: boolean;
  showRefresh?: boolean;
  toggleDisabled?: boolean;
  subtitle?: string;
  detailTitle?: string;
  detailDescription?: string;
}
