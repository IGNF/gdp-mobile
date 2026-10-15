import { useEffect, useMemo, useState } from 'react';

import type { MapGeodesyClickAction } from '@/features/map/hooks/useMapGeodesyClick';
import {
  getPointFicheSheetGeometry,
  usePointFicheSheetDrag,
} from '@/features/map/hooks/usePointFicheSheetDrag';
import { useUserLocation } from '@/features/map/hooks/useUserLocation';
import type { UserFollowingMode } from '@/features/map/hooks/useMap';
import { trackNavigateToPoint } from '@/infra/analytics/matomo';
import {
  getExternalNavigationAppLabel,
  openExternalNavigation,
} from '@/shared/utils/externalNavigation';

import sheetChrome from '@/features/map/styles/mapSheet.module.css';

import { MapPointSheet } from './pointFiche/MapPointSheet';
import styles from './MapBottomSheet.module.css';

function getSafeAreaTopPx(): number {
  if (typeof window === 'undefined') {
    return 0;
  }

  const parsed = parseFloat(
    getComputedStyle(document.documentElement).getPropertyValue('--safe-top'),
  );
  return Number.isFinite(parsed) ? parsed : 0;
}

export interface MapBottomSheetProps {
  selectedPoint: MapGeodesyClickAction | null;
  canReportPoint: boolean;
  userFollowingMode: UserFollowingMode;
  reportDisabledReason?: 'auth' | 'canevas' | null;
  onClosePoint: () => void;
  onReportPoint: () => void;
  onTabbarVisibleChange?: (visible: boolean) => void;
}

export function MapBottomSheet({
  selectedPoint,
  canReportPoint,
  userFollowingMode,
  reportDisabledReason = null,
  onClosePoint,
  onReportPoint,
  onTabbarVisibleChange,
}: MapBottomSheetProps) {
  const isPointMode = selectedPoint !== null;
  const [viewportHeight, setViewportHeight] = useState(() => window.innerHeight);
  const [safeAreaTop, setSafeAreaTop] = useState(() => getSafeAreaTopPx());
  // Hauteur de fiche nécessaire pour voir la photo/croquis en entier, mesurée dans le DOM par
  // MapPointSheet — sert de seuil d'ouverture dynamique (voir usePointFicheSheetDrag).
  const [measuredOpenThreshold, setMeasuredOpenThreshold] = useState<number | null>(null);
  // Hauteur de fiche nécessaire pour l'en-tête + le pied de page seuls (plancher d'ouverture) —
  // mesurée pour que --safe-bottom soit toujours pris en compte (pied de page jamais rogné).
  const [measuredFloorHeight, setMeasuredFloorHeight] = useState<number | null>(null);

  useEffect(() => {
    const handleResize = () => {
      setViewportHeight(window.innerHeight);
      setSafeAreaTop(getSafeAreaTopPx());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const pointGeometry = useMemo(
    () => getPointFicheSheetGeometry(viewportHeight, safeAreaTop, measuredOpenThreshold, measuredFloorHeight),
    [viewportHeight, safeAreaTop, measuredOpenThreshold, measuredFloorHeight],
  );

  const pointSheet = usePointFicheSheetDrag({
    geometry: pointGeometry,
    viewportHeight,
    enabled: isPointMode,
    onDismiss: onClosePoint,
  });

  const { currentHeight, dragHandleProps, dragOffset } = pointSheet;
  // Contenu de la fiche point : niveau 1 (compact, glissé libre entre le plancher et le seuil
  // d'ouverture) ou niveau 2 (fiche étendue au seuil ou en grand) — voir usePointFicheSheetDrag
  // pour le calcul des seuils. Basé sur restingHeight (pas la hauteur en plein glissé) pour ne
  // jamais monter/démonter de contenu pendant un glissé actif (peut interrompre le geste).
  const pointContentLevel = pointSheet.restingHeight >= pointGeometry.freeMaxHeight - 1 ? 2 : 1;
  // Ouverture maximale : la fiche perd ses marges latérales et occupe toute la largeur.
  const isPointFullscreen = isPointMode && currentHeight >= pointGeometry.fullscreenHeight - 1;

  useEffect(() => {
    onTabbarVisibleChange?.(!isPointMode);
    return () => {
      onTabbarVisibleChange?.(true);
    };
  }, [isPointMode, onTabbarVisibleChange]);

  const referencePosition = useUserLocation({ enabled: userFollowingMode !== 'none' });

  const handleNavigateToPoint = () => {
    if (!selectedPoint) {
      return;
    }

    trackNavigateToPoint(getExternalNavigationAppLabel());
    void openExternalNavigation({
      longitude: selectedPoint.point.longitude,
      latitude: selectedPoint.point.latitude,
      label: selectedPoint.point.title,
    });
  };

  // La section reste montée (hauteur 0) hors fiche, pour animer l'ouverture de la fiche.
  return (
    <section
      className={[
        sheetChrome.surface,
        styles.sheet,
        dragOffset !== 0 ? styles.sheetDragging : '',
        isPointMode ? styles.sheetPointFiche : styles.sheetCollapsed,
        isPointFullscreen ? styles.sheetFullscreen : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{ height: isPointMode ? `${currentHeight}px` : 0 }}
      aria-label="Fiche repère"
      aria-hidden={!isPointMode}
    >
      {isPointMode && selectedPoint ? (
        <div className={`${sheetChrome.body} ${styles.contentPointSheet}`}>
          <MapPointSheet
            action={selectedPoint}
            snapIndex={pointContentLevel}
            referencePosition={referencePosition}
            canReport={canReportPoint}
            reportDisabledReason={reportDisabledReason}
            dragHandleProps={dragHandleProps}
            onReport={onReportPoint}
            onNavigate={handleNavigateToPoint}
            onOpenThresholdChange={setMeasuredOpenThreshold}
            onFloorHeightChange={setMeasuredFloorHeight}
          />
        </div>
      ) : null}
    </section>
  );
}
