export const REPORT_MAP_LAYER_GROUP_NAME = 'BofReportLayers';

export const MY_REPORTS_MAP_LAYER_NAME = 'MyReportsMapLayer';

export const MY_LOCAL_DRAFTS_MAP_LAYER_NAME = 'MyLocalDraftsMapLayer';


export const REPORT_MAP_LAYER_Z_INDEX = 9000;
export const REPORT_MAP_CLUSTER_DISTANCE = 30;

export interface ReportMapLayerVisibility {
  myReports: boolean;
  groupReports: boolean;
}

export const DEFAULT_REPORT_MAP_LAYER_VISIBILITY: ReportMapLayerVisibility = {
  myReports: false,
  groupReports: false,
};
