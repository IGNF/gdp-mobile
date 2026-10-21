import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';

import { ALERT_OUTSIDE_CLICK_IGNORE_ATTRIBUTE } from '@/shared/ui/Alert';
import { joinCSSClassNames } from '@/shared/utils/join';
import styles from './FlashMessage.module.css';

const DEFAULT_DURATION = 10000; // ms
const ANIMATION_DURATION = 300; // ms
/** Au-delà de ce déplacement, le geste est un glissement et non un appui. */
const TAP_TOLERANCE_PX = 8;
const SWIPE_DISMISS_THRESHOLD_PX = 80;
/** Le message est petit : un court glissement vers le haut suffit à le chasser. */
const SWIPE_UP_DISMISS_THRESHOLD_PX = 24;

type LeaveDirection = 'up' | 'left' | 'right';
/** Axe verrouillé dès que le geste dépasse la tolérance d'appui. */
type DragAxis = 'x' | 'y';

export interface FlashMessageProps {
  onClose: () => void;
  onClick?: () => void;
  icon?: ReactNode;
  children: ReactNode;
  duration?: number;
}

/**
 * Message flash en haut de l'écran : se ferme seul après `duration`, en le faisant glisser
 * vers la gauche, la droite ou le haut, ou dès que l'utilisateur interagit ailleurs dans l'appli.
 * À monter conditionnellement — il s'anime à l'apparition.
 */
export function FlashMessage({
  onClose,
  onClick,
  icon,
  children,
  duration = DEFAULT_DURATION,
}: FlashMessageProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [leaveDirection, setLeaveDirection] = useState<LeaveDirection | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [dragAxis, setDragAxis] = useState<DragAxis | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 20);
    return () => clearTimeout(timer);
  }, []);

  // Le délai repart à zéro après chaque glissement relâché : le message ne disparaît pas sous le doigt.
  useEffect(() => {
    if (isDragging || leaveDirection) {
      return;
    }
    const timer = setTimeout(() => setLeaveDirection('up'), duration);
    return () => clearTimeout(timer);
  }, [isDragging, leaveDirection, duration]);

  // Toute interaction hors du message (appui sur la carte, un bouton…) le congédie.
  useEffect(() => {
    if (leaveDirection) {
      return;
    }
    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setLeaveDirection('up');
      }
    };
    document.addEventListener('pointerdown', handlePointerDown, true);
    return () => document.removeEventListener('pointerdown', handlePointerDown, true);
  }, [leaveDirection]);

  useEffect(() => {
    if (!leaveDirection) {
      return;
    }
    const timer = setTimeout(onClose, ANIMATION_DURATION);
    return () => clearTimeout(timer);
  }, [leaveDirection, onClose]);

  const handlePointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    if (leaveDirection) {
      return;
    }
    event.currentTarget.setPointerCapture(event.pointerId);
    startRef.current = { x: event.clientX, y: event.clientY };
    setDragAxis(null);
    setIsDragging(true);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    if (!isDragging) {
      return;
    }
    const x = event.clientX - startRef.current.x;
    const y = event.clientY - startRef.current.y;
    let axis = dragAxis;
    if (!axis) {
      if (Math.max(Math.abs(x), Math.abs(y)) <= TAP_TOLERANCE_PX) {
        return;
      }
      axis = Math.abs(x) >= Math.abs(y) ? 'x' : 'y';
      setDragAxis(axis);
    }
    // Vers le bas, le message résiste : il n'y a rien à découvrir au-dessus de lui.
    setDragOffset(axis === 'x' ? { x, y: 0 } : { x: 0, y: Math.min(0, y) });
  };

  const endDrag = () => {
    if (!isDragging) {
      return;
    }
    setIsDragging(false);
    if (Math.abs(dragOffset.x) > SWIPE_DISMISS_THRESHOLD_PX) {
      setLeaveDirection(dragOffset.x > 0 ? 'right' : 'left');
    } else if (dragOffset.y < -SWIPE_UP_DISMISS_THRESHOLD_PX) {
      setLeaveDirection('up');
    }
    setDragOffset({ x: 0, y: 0 });
  };

  const handleClick = () => {
    // Un glissement relâché déclenche aussi un clic : on l'ignore.
    if (dragAxis || leaveDirection) {
      return;
    }
    onClick?.();
  };

  const content = (
    <div
      ref={containerRef}
      className={styles.container}
      role="status"
      aria-live="polite"
      {...{ [ALERT_OUTSIDE_CLICK_IGNORE_ATTRIBUTE]: '' }}
    >
      <button
        type="button"
        className={joinCSSClassNames(
          styles.flash,
          isVisible && styles.flashVisible,
          leaveDirection === 'up' && styles.flashLeaveUp,
          leaveDirection === 'left' && styles.flashLeaveLeft,
          leaveDirection === 'right' && styles.flashLeaveRight,
        )}
        style={
          isDragging
            ? {
                transform: `translate(${dragOffset.x}px, ${dragOffset.y}px)`,
                opacity: 1 - Math.min((Math.abs(dragOffset.x) + Math.abs(dragOffset.y) * 3) / 240, 0.6),
                transition: 'none',
              }
            : undefined
        }
        onClick={handleClick}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        {icon ? <span className={styles.icon} aria-hidden>{icon}</span> : null}
        <span className={styles.text}>{children}</span>
      </button>
    </div>
  );

  return createPortal(content, document.body);
}
