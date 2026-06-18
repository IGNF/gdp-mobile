import {
  GEODESY_POINT_REPORT_PHOTO_SLOTS,
  isGeodesyPointReportPositionEditable,
  type GeodesyPointReportContext,
} from '@ign/gdp-tools';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { ReportPhoto } from '@/domain/report/models';
import { useGeodesyReportTheme } from '@/features/report/hooks/useGeodesyReportTheme';
import {
  buildInitialGeodesyThemeAttributeValues,
  getGeodesyThemeFormAttributes,
} from '@/features/report/utils/geodesyReportTheme';
import { validateThemeAttributeValue } from '@/features/report/utils/communityReportTheme';

function revokePhotoPreview(photo: ReportPhoto | undefined): void {
  if (photo?.previewUrl) {
    URL.revokeObjectURL(photo.previewUrl);
  }
}

function arePositionsEqual(
  a: { longitude: number; latitude: number },
  b: { longitude: number; latitude: number },
): boolean {
  return (
    Math.abs(a.longitude - b.longitude) < 1e-6 &&
    Math.abs(a.latitude - b.latitude) < 1e-6
  );
}

export interface GeodesyPointReportFormErrors {
  comment?: string;
  photo1?: string;
  themeAttributes?: Record<string, string | undefined>;
}

export interface UseGeodesyPointReportFormOptions {
  reportContext: GeodesyPointReportContext;
  initialComment?: string;
}

export function useGeodesyPointReportForm(options: UseGeodesyPointReportFormOptions) {
  const { reportContext, initialComment = '' } = options;
  const canEditPosition = useMemo(
    () => isGeodesyPointReportPositionEditable(reportContext),
    [reportContext],
  );
  const { theme, isThemeLoaded } = useGeodesyReportTheme();
  const themeFieldDefinitions = useMemo(
    () => getGeodesyThemeFormAttributes(theme, reportContext),
    [theme, reportContext],
  );

  const prefilledThemeAttributes = useMemo(
    () => buildInitialGeodesyThemeAttributeValues(reportContext, theme),
    [reportContext, theme],
  );

  const [comment, setComment] = useState(initialComment);
  const [longitude, setLongitude] = useState(reportContext.longitude);
  const [latitude, setLatitude] = useState(reportContext.latitude);
  const [initialPosition] = useState({
    longitude: reportContext.longitude,
    latitude: reportContext.latitude,
  });
  const [themeAttributes, setThemeAttributesState] = useState(prefilledThemeAttributes);
  const [photo1, setPhoto1] = useState<ReportPhoto | null>(null);
  const [photo2, setPhoto2] = useState<ReportPhoto | null>(null);
  const [errors, setErrors] = useState<GeodesyPointReportFormErrors>({});

  const photo1Ref = useRef(photo1);
  const photo2Ref = useRef(photo2);
  photo1Ref.current = photo1;
  photo2Ref.current = photo2;

  useEffect(() => {
    setThemeAttributesState(prefilledThemeAttributes);
  }, [prefilledThemeAttributes]);

  useEffect(() => {
    setLongitude(reportContext.longitude);
    setLatitude(reportContext.latitude);
  }, [reportContext.latitude, reportContext.longitude]);

  const setPosition = useCallback((position: { longitude: number; latitude: number }) => {
    setLongitude(position.longitude);
    setLatitude(position.latitude);
  }, []);

  const canResetPosition = useMemo(() => {
    if (!canEditPosition) {
      return false;
    }

    return !arePositionsEqual(initialPosition, { longitude, latitude });
  }, [canEditPosition, initialPosition, latitude, longitude]);

  const resetPositionToInitial = useCallback(() => {
    setLongitude(initialPosition.longitude);
    setLatitude(initialPosition.latitude);
  }, [initialPosition.latitude, initialPosition.longitude]);

  const mandatoryPhotoSlot = GEODESY_POINT_REPORT_PHOTO_SLOTS.find((slot) => slot.mandatory);

  const setThemeAttribute = useCallback((name: string, value: string) => {
    setThemeAttributesState((current) => ({ ...current, [name]: value }));
  }, []);

  const setPhotoForRole = useCallback((role: 'photo1' | 'photo2', file: File | null) => {
    const setter = role === 'photo1' ? setPhoto1 : setPhoto2;
    const current = role === 'photo1' ? photo1Ref.current : photo2Ref.current;

    if (!file) {
      revokePhotoPreview(current ?? undefined);
      setter(null);
      return;
    }

    revokePhotoPreview(current ?? undefined);
    setter({
      role,
      file,
      previewUrl: URL.createObjectURL(file),
    });
  }, []);

  const validate = useCallback((): boolean => {
    const nextErrors: GeodesyPointReportFormErrors = {};
    const themeAttributeErrors: Record<string, string | undefined> = {};

    for (const attribute of themeFieldDefinitions) {
      const value = themeAttributes[attribute.name] ?? '';
      const attributeError = validateThemeAttributeValue(attribute, value);
      if (attributeError) {
        themeAttributeErrors[attribute.name] = attributeError;
      }
    }

    if (Object.values(themeAttributeErrors).some(Boolean)) {
      nextErrors.themeAttributes = themeAttributeErrors;
    }

    if (mandatoryPhotoSlot?.role === 'photo1' && !photo1) {
      nextErrors.photo1 = `${mandatoryPhotoSlot.label} est obligatoire.`;
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }, [mandatoryPhotoSlot, photo1, themeAttributes, themeFieldDefinitions]);

  const photos = useMemo(
    () => [photo1, photo2].filter((photo): photo is ReportPhoto => photo !== null),
    [photo1, photo2],
  );

  const normalizedThemeAttributes = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(themeAttributes).map(([name, value]) => [name, value.trim()]),
      ),
    [themeAttributes],
  );

  return {
    canEditPosition,
    longitude,
    latitude,
    initialPosition,
    setPosition,
    canResetPosition,
    resetPositionToInitial,
    comment,
    setComment,
    themeAttributes,
    setThemeAttribute,
    themeFieldDefinitions,
    photo1,
    photo2,
    setPhotoForRole,
    photos,
    normalizedThemeAttributes,
    errors,
    validate,
    isThemeConfigured: isThemeLoaded,
    theme,
  };
}

export type UseGeodesyPointReportFormReturn = ReturnType<typeof useGeodesyPointReportForm>;
