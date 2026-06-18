export type ReportPhotoRole = 'photo1' | 'photo2';

export interface ReportPhoto {
  role: ReportPhotoRole;
  file: File;
  previewUrl: string;
}
