import {
  buildGeodesyReportAttachmentsBody,
  GEODESY_POINT_REPORT_PHOTO_SLOTS,
  mapGeodesyPointReportToApiBody,
  type GeodesyPointReportContext,
  type GeodesyPointReportPhotoRole,
} from '@ign/gdp-tools';
import { useCallback, useState } from 'react';

import type { ReportPhoto } from '@/domain/report/models';
import {
  mapApiBoundaryReportResponse,
  type ApiBoundaryReportResponse,
} from '@/domain/report/mappers';
import { GDP_REPORT_COMMUNITY_ID } from '@/features/report/constants/reportApi';
import {
  buildGeodesyPointReportThemeAttributesForSubmit,
  buildGeodesyReportSubmissionComment,
  extractGeodesyReportThemeFromConfigs,
  resolveGeodesyReportThemeNameFromConfigs,
} from '@/features/report/utils/geodesyReportTheme';
import { collabApiClient, ensureCollabApiSession } from '@/infra/api';
import { fetchGdpCommunityThemeConfigs } from '@/infra/community/gdpCommunityThemes';
import {
  getReportSubmissionDeviceInfo,
} from '@/platform/device/reportDeviceMetadata';

export interface GeodesyPointReportSubmitResult {
  serverId: number;
}

export interface GeodesyPointReportSubmitError {
  message: string;
  code: 'authRequired' | 'reportCreationFailed' | 'attachmentUploadFailed';
}

interface SubmitGeodesyPointReportOptions {
  onError?: (error: GeodesyPointReportSubmitError) => void;
}

function toSubmitError(
  error: unknown,
  code: GeodesyPointReportSubmitError['code'],
  fallbackMessage: string,
): GeodesyPointReportSubmitError {
  if (error instanceof Error && error.message) {
    return { code, message: error.message };
  }

  return { code, message: fallbackMessage };
}

async function uploadGeodesyPointReportAttachments(
  serverId: number,
  photos: ReportPhoto[],
): Promise<void> {
  const attachmentPhotos = GEODESY_POINT_REPORT_PHOTO_SLOTS.flatMap((slot) => {
    const photo = photos.find((entry) => entry.role === slot.role);
    if (!photo) {
      return [];
    }

    return [{ role: slot.role as GeodesyPointReportPhotoRole, blob: photo.file }];
  });

  const body = buildGeodesyReportAttachmentsBody(attachmentPhotos);
  if (Object.keys(body).length === 0) {
    return;
  }

  await collabApiClient.report.addAttachments(serverId, body);
}

export function useSubmitGeodesyPointReport() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<GeodesyPointReportSubmitError | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const submitGeodesyPointReport = useCallback(
    async (
      reportContext: GeodesyPointReportContext,
      comment: string,
      photos: ReportPhoto[],
      formThemeAttributes: Record<string, string>,
      options: SubmitGeodesyPointReportOptions = {},
    ): Promise<GeodesyPointReportSubmitResult | null> => {
      setIsSubmitting(true);
      setError(null);

      try {
        const sessionReady = await ensureCollabApiSession();
        if (!sessionReady) {
          const authError: GeodesyPointReportSubmitError = {
            code: 'authRequired',
            message: 'Connectez-vous pour envoyer un signalement.',
          };
          setError(authError);
          options.onError?.(authError);
          return null;
        }

        const themeConfigs = await fetchGdpCommunityThemeConfigs();
        const theme = extractGeodesyReportThemeFromConfigs(themeConfigs);
        const themeName = resolveGeodesyReportThemeNameFromConfigs(themeConfigs);
        const deviceInfo = await getReportSubmissionDeviceInfo();
        const body = mapGeodesyPointReportToApiBody(reportContext, {
          communityId: GDP_REPORT_COMMUNITY_ID,
          theme: themeName,
          comment: buildGeodesyReportSubmissionComment(comment, themeName, deviceInfo),
          themeAttributes: buildGeodesyPointReportThemeAttributesForSubmit(
            reportContext,
            theme,
            formThemeAttributes,
            themeName,
          ),
        });

        const response = await collabApiClient.report.add(body);
        const createdReport = mapApiBoundaryReportResponse(response.data as ApiBoundaryReportResponse);
        const serverId = createdReport.id;

        if (photos.length > 0) {
          try {
            await uploadGeodesyPointReportAttachments(serverId, photos);
          } catch (attachmentError) {
            const uploadError = toSubmitError(
              attachmentError,
              'attachmentUploadFailed',
              'Signalement créé, mais l’envoi des photos a échoué.',
            );
            setError(uploadError);
            options.onError?.(uploadError);
            return { serverId };
          }
        }

        return { serverId };
      } catch (submitError) {
        const failure = toSubmitError(
          submitError,
          'reportCreationFailed',
          'Impossible d’envoyer le signalement pour le moment.',
        );
        setError(failure);
        options.onError?.(failure);
        return null;
      } finally {
        setIsSubmitting(false);
      }
    },
    [],
  );

  return {
    submitGeodesyPointReport,
    isSubmitting,
    error,
    clearError,
  };
}
