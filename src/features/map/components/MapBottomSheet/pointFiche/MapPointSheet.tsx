import { useEffect, useState } from 'react';
import type { MapGeodesyClickAction } from '@/features/map/hooks/useMapGeodesyClick';
import type { useBottomSheetSnap } from '@/features/map/hooks/useBottomSheetSnap';

import { useTrackSheetView } from '@/features/map/hooks/useTrackSheetView';
import { MapPointGeodesyFicheBody } from './MapPointGeodesyFicheBody';
import { MapPointNivellementFicheBody } from './MapPointNivellementFicheBody';
import { MapPointSheetFooter } from './MapPointSheetFooter';
import { MapPointSheetHeader } from './MapPointSheetHeader';
import { resolvePointFicheVariant } from './resolvePointFicheVariant';
import { useMeasuredHeight } from './useMeasuredHeight';

import styles from './MapPointSheet.module.css';

// Padding haut de `.body` (cf. MapPointSheet.module.css) — s'ajoute à la hauteur de l'en-tête
// et du bloc photo pour obtenir la hauteur de fiche nécessaire pour voir la photo en entier.
const BODY_TOP_PADDING_PX = 12;

export interface MapPointSheetProps {
  action: MapGeodesyClickAction;
  snapIndex: number;
  referencePosition: { longitude: number; latitude: number } | null;
  canReport: boolean;
  reportDisabledReason?: 'auth' | 'canevas' | null;
  dragHandleProps: ReturnType<typeof useBottomSheetSnap>['dragHandleProps'];
  onReport: () => void;
  onNavigate: () => void;
  /** Hauteur de fiche (px) nécessaire pour voir la photo/croquis en entier — seuil d'ouverture
   *  dynamique, voir usePointFicheSheetDrag. `null` tant qu'elle n'est pas encore mesurée. */
  onOpenThresholdChange?: (heightPx: number | null) => void;
  /** Hauteur de fiche (px) nécessaire pour afficher l'en-tête et le pied de page seuls (plancher
   *  d'ouverture), en-tête/pied de page mesurés donc `--safe-bottom` inclus. `null` tant qu'elle
   *  n'est pas encore mesurée. */
  onFloorHeightChange?: (heightPx: number | null) => void;
}

export function MapPointSheet({
  action,
  snapIndex,
  referencePosition,
  canReport,
  reportDisabledReason = null,
  dragHandleProps,
  onReport,
  onNavigate,
  onOpenThresholdChange,
  onFloorHeightChange,
}: MapPointSheetProps) {
  const variant = resolvePointFicheVariant(action);
  const isExpanded = snapIndex >= 2;
  const { trackSheetView } = useTrackSheetView();
  const sheetId =
    action.reportContext.geodesyId ??
    action.point.title ??
    `${action.point.longitude},${action.point.latitude}`;

  useEffect(() => {
    if (isExpanded && sheetId) {
      trackSheetView(sheetId);
    }
  }, [isExpanded, sheetId, trackSheetView]);

  const [dragZoneRef, dragZoneHeight] = useMeasuredHeight<HTMLDivElement>();
  const [footerRef, footerHeight] = useMeasuredHeight<HTMLElement>();
  const [photoBlockHeight, setPhotoBlockHeight] = useState<number | null>(null);

  useEffect(() => {
    if (dragZoneHeight === null || footerHeight === null || photoBlockHeight === null) {
      return;
    }

    onOpenThresholdChange?.(dragZoneHeight + BODY_TOP_PADDING_PX + photoBlockHeight + footerHeight);
  }, [dragZoneHeight, footerHeight, photoBlockHeight, onOpenThresholdChange]);

  // Plancher d'ouverture : hauteur nécessaire pour l'en-tête + le pied de page seuls (le corps
  // n'affiche rien à cette hauteur). Le pied de page mesuré inclut déjà `--safe-bottom`.
  useEffect(() => {
    if (dragZoneHeight === null || footerHeight === null) {
      return;
    }

    onFloorHeightChange?.(dragZoneHeight + footerHeight);
  }, [dragZoneHeight, footerHeight, onFloorHeightChange]);

  // Réinitialise au démontage (fermeture de la fiche / changement de variante) pour ne pas
  // laisser une valeur périmée influencer la géométrie de la prochaine fiche ouverte.
  useEffect(() => {
    return () => {
      onOpenThresholdChange?.(null);
      onFloorHeightChange?.(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleArea = (
    <div className={styles.handleArea}>
      <span className={styles.handle} aria-hidden />
    </div>
  );

  const header = <MapPointSheetHeader action={action} referencePosition={referencePosition} />;

  const footer = (
    <MapPointSheetFooter
      ref={footerRef}
      canReport={canReport}
      reportDisabledReason={reportDisabledReason}
      onNavigate={onNavigate}
      onReport={onReport}
    />
  );

  return (
    <div className={styles.sheetLayout}>
      <div ref={dragZoneRef} className={styles.dragZone} {...dragHandleProps}>
        {handleArea}
        {header}
      </div>

      <div className={styles.body} data-scroll-root="true">
        {variant === 'nivellement' ? (
          <MapPointNivellementFicheBody
            action={action}
            snapIndex={snapIndex}
            onPhotoBlockHeightChange={setPhotoBlockHeight}
          />
        ) : (
          <MapPointGeodesyFicheBody
            action={action}
            snapIndex={snapIndex}
            onPhotoBlockHeightChange={setPhotoBlockHeight}
          />
        )}
      </div>

      {footer}
    </div>
  );
}
