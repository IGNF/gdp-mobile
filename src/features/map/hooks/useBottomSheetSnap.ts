import { useCallback, useEffect, useRef, useState } from 'react';

interface UseBottomSheetSnapOptions {
  snapHeights: readonly number[];
  initialIndex?: number;
  enabled?: boolean;
}

export function useBottomSheetSnap({
  snapHeights,
  initialIndex = 0,
  enabled = true,
}: UseBottomSheetSnapOptions) {
  const [snapIndex, setSnapIndex] = useState(initialIndex);
  const [dragOffset, setDragOffset] = useState(0);
  const dragStartYRef = useRef(0);
  const dragStartHeightRef = useRef(0);
  const dragOffsetRef = useRef(0);
  const isDraggingRef = useRef(false);
  const captureTargetRef = useRef<HTMLElement | null>(null);
  const capturedPointerIdRef = useRef<number | null>(null);

  const snapHeightsKey = snapHeights.join(',');

  useEffect(() => {
    setSnapIndex(initialIndex);
    setDragOffset(0);
    dragOffsetRef.current = 0;
  }, [initialIndex, snapHeightsKey]);

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

    if (!isDraggingRef.current) {
      return;
    }

    isDraggingRef.current = false;
    const targetHeight = dragStartHeightRef.current - dragOffsetRef.current;
    snapToNearest(targetHeight);
  }, [releasePointerCaptureSafe, snapToNearest]);

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      if (!enabled) {
        return;
      }

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
    [enabled, snapHeights, snapIndex],
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      if (!isDraggingRef.current) {
        return;
      }

      const deltaY = event.clientY - dragStartYRef.current;
      dragOffsetRef.current = deltaY;
      setDragOffset(deltaY);
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
