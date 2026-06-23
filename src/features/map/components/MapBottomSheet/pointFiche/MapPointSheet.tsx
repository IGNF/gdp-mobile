import type { MapGeodesyClickAction } from '@/features/map/hooks/useMapGeodesyClick';
import type { useBottomSheetSnap } from '@/features/map/hooks/useBottomSheetSnap';

import { MapPointGeodesyFicheBody } from './MapPointGeodesyFicheBody';
import { MapPointNivellementFicheBody } from './MapPointNivellementFicheBody';
import { MapPointSheetFooter } from './MapPointSheetFooter';
import { MapPointSheetHeader } from './MapPointSheetHeader';
import { resolvePointFicheVariant } from './resolvePointFicheVariant';

import styles from './MapPointSheet.module.css';

export interface MapPointSheetProps {
  action: MapGeodesyClickAction;
  snapIndex: number;
  referencePosition: { longitude: number; latitude: number } | null;
  canReport: boolean;
  dragHandleProps: ReturnType<typeof useBottomSheetSnap>['dragHandleProps'];
  onClose: () => void;
  onReport: () => void;
  onNavigate: () => void;
}

export function MapPointSheet({
  action,
  snapIndex,
  referencePosition,
  canReport,
  dragHandleProps,
  onClose,
  onReport,
  onNavigate,
}: MapPointSheetProps) {
  const variant = resolvePointFicheVariant(action);
  const isMiniSnap = snapIndex === 0;

  const handleArea = (
    <div className={styles.handleArea} aria-hidden>
      <span className={styles.handle} />
    </div>
  );

  const header = (
    <MapPointSheetHeader action={action} referencePosition={referencePosition} onClose={onClose} />
  );

  const footer = (
    <MapPointSheetFooter canReport={canReport} onNavigate={onNavigate} onReport={onReport} />
  );

  return (
    <div className={styles.sheetLayout}>
      {isMiniSnap ? (
        <div className={styles.dragZoneFull} {...dragHandleProps}>
          {handleArea}
          {header}
          {footer}
        </div>
      ) : (
        <>
          <div className={styles.dragZone} {...dragHandleProps}>
            {handleArea}
            {header}
          </div>

          <div className={styles.body} data-scroll-root="true">
            {variant === 'nivellement' ? (
              <MapPointNivellementFicheBody action={action} snapIndex={snapIndex} />
            ) : (
              <MapPointGeodesyFicheBody action={action} snapIndex={snapIndex} />
            )}
          </div>

          {footer}
        </>
      )}
    </div>
  );
}
