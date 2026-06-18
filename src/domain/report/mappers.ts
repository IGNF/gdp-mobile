export interface ApiBoundaryReportResponse {
  id: number;
  community: number;
  geometry: string;
  comment: string;
  status: string;
  opening_date?: string;
}

export function mapApiBoundaryReportResponse(
  response: ApiBoundaryReportResponse,
): { id: number; communityId: number } {
  return {
    id: response.id,
    communityId: response.community,
  };
}
