import { useCallback, useEffect, useRef, useState } from 'react';

// Traction supplémentaire, sous la hauteur du snap le plus bas, à partir de laquelle
// un relâché est interprété comme une demande de fermeture plutôt qu'un simple snap.
const DISMISS_DRAG_THRESHOLD_PX = 64;

interface UseBottomSheetSnapOptions {
  snapHeights: readonly number[];
  initialIndex?: number;
  enabled?: boolean;
  /** Appelé quand l'utilisateur abaisse la poignée sous le snap le plus bas pour fermer la fiche. */
  onDismiss?: () => void;
}

export function useBottomSheetSnap({
  snapHeights,
  initialIndex = 0,
  enabled = true,
  onDismiss,
}: UseBottomSheetSnapOptions) {
  const [snapIndex, setSnapIndex] = useState(initialIndex);
  const [dragOffset, setDragOffset] = useState(0);
  const dragStartYRef = useRef(0);
  const dragStartHeightRef = useRef(0);
  const dragOffsetRef = useRef(0);
  const isDraggingRef = useRef(false);
  const captureTargetRef = useRef<HTMLElement | null>(null);
  const capturedPointerIdRef = useRef<number | null>(null);
  const rafIdRef = useRef<number | null>(null);

  const cancelPendingFrame = useCallback(() => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
  }, []);

  const snapHeightsKey = snapHeights.join(',');

  useEffect(() => {
    setSnapIndex(initialIndex);
    setDragOffset(0);
    dragOffsetRef.current = 0;
  }, [initialIndex, snapHeightsKey]);

  useEffect(() => cancelPendingFrame, [cancelPendingFrame]);

  const currentHeight = Math.max(
    snapHeights[0] ?? 0,
    Math.min(
      snapHeights[snapHeights.length - 1] ?? 0,
      (snapHeights[snapIndex] ?? 0) - dragOffset,
    ),
  );

  const releasePointerCaptureSafe = useCallback(() => {
    const target = captureTargetRef.current;
    const pointerId = capturedPointerIdRef.current;
    captureTargetRef.current = null;
    capturedPointerIdRef.current = null;

    if (!target || pointerId === null) {
      return;
    }

    try {
      if (target.hasPointerCapture(pointerId)) {
        target.releasePointerCapture(pointerId);
      }
    } catch {
      // Capture déjà libéré (cancel navigateur, re-render, etc.)
    }
  }, []);

  const snapToNearest = useCallback(
    (height: number) => {
      let nearestIndex = 0;
      let nearestDistance = Number.POSITIVE_INFINITY;

      snapHeights.forEach((snapHeight, index) => {
        const distance = Math.abs(snapHeight - height);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = index;
        }
      });

      dragOffsetRef.current = 0;
      setSnapIndex(nearestIndex);
      setDragOffset(0);
    },
    [snapHeights],
  );

  const endDrag = useCallback(() => {
    releasePointerCaptureSafe();
    cancelPendingFrame();

    if (!isDraggingRef.current) {
      return;
    }

    isDraggingRef.current = false;
    const targetHeight = dragStartHeightRef.current - dragOffsetRef.current;

    if (onDismiss && targetHeight < (snapHeights[0] ?? 0) - DISMISS_DRAG_THRESHOLD_PX) {
      dragOffsetRef.current = 0;
      setDragOffset(0);
      onDismiss();
      return;
    }

    snapToNearest(targetHeight);
  }, [onDismiss, snapHeights, cancelPendingFrame, releasePointerCaptureSafe, snapToNearest]);

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      if (!enabled) {
        return;
      }

      cancelPendingFrame();
      isDraggingRef.current = true;
      dragStartYRef.current = event.clientY;
      dragStartHeightRef.current = snapHeights[snapIndex] ?? 0;
      dragOffsetRef.current = 0;
      captureTargetRef.current = event.currentTarget;
      capturedPointerIdRef.current = event.pointerId;

      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        isDraggingRef.current = false;
        captureTargetRef.current = null;
        capturedPointerIdRef.current = null;
      }
    },
    [cancelPendingFrame, enabled, snapHeights, snapIndex],
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      if (!isDraggingRef.current) {
        return;
      }

      // preventDefault (touch-action: none already suppresses native scroll/rubber-band on
      // the drag zone) so a stray browser gesture never fights the JS-driven height.
      event.preventDefault();

      const deltaY = event.clientY - dragStartYRef.current;
      dragOffsetRef.current = deltaY;

      // Coalesce bursts of pointermove events (can fire well above 60Hz) into at most one
      // state update per animation frame — otherwise React re-renders faster than the
      // browser can paint, and the sheet visibly lags/judders behind the pointer.
      if (rafIdRef.current === null) {
        rafIdRef.current = requestAnimationFrame(() => {
          rafIdRef.current = null;
          setDragOffset(dragOffsetRef.current);
        });
      }
    },
    [],
  );

  const handlePointerUp = useCallback(() => {
    endDrag();
  }, [endDrag]);

  const handlePointerCancel = useCallback(() => {
    endDrag();
  }, [endDrag]);

  const dragHandleProps = {
    onPointerDown: handlePointerDown,
    onPointerMove: handlePointerMove,
    onPointerUp: handlePointerUp,
    onPointerCancel: handlePointerCancel,
  };

  return {
    snapIndex,
    setSnapIndex,
    currentHeight,
    dragOffset,
    dragHandleProps,
    isDragging: isDraggingRef.current,
  };
}
