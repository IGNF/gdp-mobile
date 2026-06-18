import { useMemo } from 'react';

import type { CommunityThemeAttribute, CommunityThemeConfig } from '@/domain/community/models';
import { useGdpCommunityThemes } from '@/features/report/hooks/useGdpCommunityThemes';
import {
  extractGeodesyReportThemeFromConfigs,
  getGeodesyThemeFormAttributes,
} from '@/features/report/utils/geodesyReportTheme';

export interface UseGeodesyReportThemeReturn {
  theme: CommunityThemeConfig | null;
  themeAttributes: CommunityThemeAttribute[];
  isThemeLoaded: boolean;
  hasThemeFormFields: boolean;
  isThemesLoading: boolean;
  /** @deprecated Préférer {@link isThemeLoaded}. */
  isThemeConfigured: boolean;
}

export function useGeodesyReportTheme(): UseGeodesyReportThemeReturn {
  const { themes, isLoading } = useGdpCommunityThemes();

  const theme = useMemo(() => extractGeodesyReportThemeFromConfigs(themes), [themes]);
  const themeAttributes = useMemo(() => getGeodesyThemeFormAttributes(theme), [theme]);
  const isThemeLoaded = theme !== null;
  const hasThemeFormFields = themeAttributes.length > 0;

  return {
    theme,
    themeAttributes,
    isThemeLoaded,
    hasThemeFormFields,
    isThemesLoading: isLoading,
    isThemeConfigured: isThemeLoaded,
  };
}
