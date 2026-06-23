import { Button } from '@/shared/ui/Button';
import type { PointerEvent } from 'react';

import styles from './MapPointSheet.module.css';

export interface MapPointSheetFooterProps {
  canReport: boolean;
  onNavigate: () => void;
  onReport: () => void;
}

export function MapPointSheetFooter({ canReport, onNavigate, onReport }: MapPointSheetFooterProps) {
  const stopDrag = (event: PointerEvent<HTMLElement>) => {
    event.stopPropagation();
  };

  return (
    <footer className={styles.footer}>
      <Button
        type="button"
        variant="outline"
        fullWidth
        onClick={onNavigate}
        onPointerDown={stopDrag}
      >
        S&apos;y rendre
      </Button>
      <Button type="button" fullWidth onClick={onReport} onPointerDown={stopDrag} disabled={!canReport}>
        Signaler
      </Button>
    </footer>
  );
}
