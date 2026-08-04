import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/shared/ui/Button';
import IconHelp from '@/shared/assets/icons/icon-help.svg?react';

import styles from './MapPointSheet.module.css';

export interface MapPointSheetFooterProps {
  canReport: boolean;
  reportAuthRequired?: boolean;
  onNavigate: () => void;
  onReport: () => void;
}

export function MapPointSheetFooter({
  canReport,
  reportAuthRequired = false,
  onNavigate,
  onReport,
}: MapPointSheetFooterProps) {
  const navigate = useNavigate();
  const [isAuthInfoOpen, setIsAuthInfoOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const stopDrag = (event: PointerEvent<HTMLElement>) => {
    event.stopPropagation();
  };

  useEffect(() => {
    if (!isAuthInfoOpen) {
      return;
    }

    const handlePointerDown = (event: globalThis.PointerEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) {
        setIsAuthInfoOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [isAuthInfoOpen]);

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

      <div className={styles.reportCell} ref={wrapRef}>
        <Button type="button" fullWidth onClick={onReport} onPointerDown={stopDrag} disabled={!canReport}>
          Signaler
        </Button>

        {reportAuthRequired ? (
          <>
            <button
              type="button"
              className={styles.authInfoTrigger}
              onClick={() => setIsAuthInfoOpen((current) => !current)}
              onPointerDown={stopDrag}
              aria-label="Pourquoi le signalement est désactivé ?"
              aria-expanded={isAuthInfoOpen}
            >
              <IconHelp className={styles.authInfoIcon} aria-hidden />
            </button>

            {isAuthInfoOpen ? (
              <div className={styles.authInfoBubble} role="dialog" onPointerDown={stopDrag}>
                <p className={styles.authInfoText}>
                  Vous devez être connecté pour effectuer des signalements
                </p>
                <button
                  type="button"
                  className={styles.authInfoLink}
                  onClick={() => {
                    setIsAuthInfoOpen(false);
                    navigate('/login');
                  }}
                >
                  Se connecter
                </button>
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </footer>
  );
}
