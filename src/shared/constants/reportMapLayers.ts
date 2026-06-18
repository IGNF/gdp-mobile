export const REPORT_MAP_LAYER_GROUP_NAME = 'BofReportLayers';

export const MY_REPORTS_MAP_LAYER_NAME = 'MyReportsMapLayer';
export const GROUP_REPORTS_MAP_LAYER_NAME = 'GroupReportsMapLayer';

export const REPORT_MAP_LAYER_Z_INDEX = 9000;
export const REPORT_MAP_CLUSTER_DISTANCE = 30;

/** Au-delà de ce zoom (résolution cartographique), les clusters disparaissent. */
export const REPORT_MAP_CLUSTER_MAX_RESOLUTION = 80;

/** En dessous de cette résolution, les points individuels remplacent les clusters. */
export const REPORT_MAP_UNCLUSTERED_MAX_RESOLUTION = 10;

/** Résolution minimale d’affichage des clusters (masqués plus zoomés). */
export const REPORT_MAP_CLUSTER_MIN_RESOLUTION = 10;

export interface ReportMapLayerVisibility {
  myReports: boolean;
  groupReports: boolean;
}

export const DEFAULT_REPORT_MAP_LAYER_VISIBILITY: ReportMapLayerVisibility = {
  myReports: false,
  groupReports: false,
};
