import { useCallback, useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const DOUBLE_TAP_DELAY_MS = 300;
const DOUBLE_TAP_ZOOM = 2.5;

interface Point {
  x: number;
  y: number;
}

interface ImageTransform {
  scale: number;
  x: number;
  y: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function getDistance(first: Point, second: Point): number {
  return Math.hypot(second.x - first.x, second.y - first.y);
}

function clampPan(
  x: number,
  y: number,
  scale: number,
  viewportWidth: number,
  viewportHeight: number,
): Pick<ImageTransform, 'x' | 'y'> {
  if (scale <= 1) {
    return { x: 0, y: 0 };
  }

  const maxX = (viewportWidth * (scale - 1)) / 2;
  const maxY = (viewportHeight * (scale - 1)) / 2;

  return {
    x: clamp(x, -maxX, maxX),
    y: clamp(y, -maxY, maxY),
  };
}

export function useLightboxImageZoom(activeIndex: number) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const pointersRef = useRef(new Map<number, Point>());
  const pinchStartRef = useRef<{ distance: number; scale: number } | null>(null);
  const panStartRef = useRef<{ x: number; y: number; transformX: number; transformY: number } | null>(
    null,
  );
  const lastTapTimeRef = useRef(0);
  const transformRef = useRef<ImageTransform>({ scale: 1, x: 0, y: 0 });

  const [transform, setTransform] = useState<ImageTransform>({ scale: 1, x: 0, y: 0 });

  const applyTransform = useCallback((next: ImageTransform) => {
    const viewport = viewportRef.current;
    const clamped = viewport
      ? {
          scale: clamp(next.scale, MIN_SCALE, MAX_SCALE),
          ...clampPan(next.x, next.y, next.scale, viewport.clientWidth, viewport.clientHeight),
        }
      : { scale: clamp(next.scale, MIN_SCALE, MAX_SCALE), x: next.x, y: next.y };

    transformRef.current = clamped;
    setTransform(clamped);
  }, []);

  const resetTransform = useCallback(() => {
    applyTransform({ scale: 1, x: 0, y: 0 });
  }, [applyTransform]);

  useEffect(() => {
    resetTransform();
  }, [activeIndex, resetTransform]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) {
      return;
    }

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();

      const current = transformRef.current;
      const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;
      const nextScale = clamp(current.scale * zoomFactor, MIN_SCALE, MAX_SCALE);

      applyTransform({
        scale: nextScale,
        x: nextScale === 1 ? 0 : current.x,
        y: nextScale === 1 ? 0 : current.y,
      });
    };

    viewport.addEventListener('wheel', handleWheel, { passive: false });
    return () => viewport.removeEventListener('wheel', handleWheel);
  }, [activeIndex, applyTransform]);

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (event.button !== 0) {
        return;
      }

      const point = { x: event.clientX, y: event.clientY };
      pointersRef.current.set(event.pointerId, point);
      event.currentTarget.setPointerCapture(event.pointerId);

      const pointers = Array.from(pointersRef.current.values());

      if (pointers.length === 2) {
        panStartRef.current = null;
        pinchStartRef.current = {
          distance: getDistance(pointers[0], pointers[1]),
          scale: transformRef.current.scale,
        };
        return;
      }

      if (pointers.length === 1 && transformRef.current.scale > 1) {
        panStartRef.current = {
          x: point.x,
          y: point.y,
          transformX: transformRef.current.x,
          transformY: transformRef.current.y,
        };
      }
    },
    [],
  );

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!pointersRef.current.has(event.pointerId)) {
        return;
      }

      pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
      const pointers = Array.from(pointersRef.current.values());

      if (pointers.length === 2 && pinchStartRef.current) {
        const distance = getDistance(pointers[0], pointers[1]);
        if (distance <= 0) {
          return;
        }

        const nextScale = clamp(
          pinchStartRef.current.scale * (distance / pinchStartRef.current.distance),
          MIN_SCALE,
          MAX_SCALE,
        );

        applyTransform({
          scale: nextScale,
          x: nextScale === 1 ? 0 : transformRef.current.x,
          y: nextScale === 1 ? 0 : transformRef.current.y,
        });
        return;
      }

      if (pointers.length === 1 && panStartRef.current) {
        const deltaX = event.clientX - panStartRef.current.x;
        const deltaY = event.clientY - panStartRef.current.y;

        applyTransform({
          scale: transformRef.current.scale,
          x: panStartRef.current.transformX + deltaX,
          y: panStartRef.current.transformY + deltaY,
        });
      }
    },
    [applyTransform],
  );

  const finishPointer = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const wasPanning = panStartRef.current !== null;
      const moved =
        panStartRef.current !== null &&
        (Math.abs(event.clientX - panStartRef.current.x) > 8 ||
          Math.abs(event.clientY - panStartRef.current.y) > 8);

      pointersRef.current.delete(event.pointerId);

      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }

      if (pointersRef.current.size < 2) {
        pinchStartRef.current = null;
      }

      if (pointersRef.current.size === 0) {
        panStartRef.current = null;
      }

      if (pointersRef.current.size === 1 && transformRef.current.scale > 1) {
        const remaining = Array.from(pointersRef.current.entries())[0];
        if (remaining) {
          panStartRef.current = {
            x: remaining[1].x,
            y: remaining[1].y,
            transformX: transformRef.current.x,
            transformY: transformRef.current.y,
          };
        }
      }

      if (!wasPanning && !moved && pointersRef.current.size === 0) {
        const now = event.timeStamp;
        if (now - lastTapTimeRef.current <= DOUBLE_TAP_DELAY_MS) {
          if (transformRef.current.scale > 1) {
            resetTransform();
          } else {
            applyTransform({ scale: DOUBLE_TAP_ZOOM, x: 0, y: 0 });
          }
          lastTapTimeRef.current = 0;
          return;
        }

        lastTapTimeRef.current = now;
      }
    },
    [applyTransform, resetTransform],
  );

  const handlePointerUp = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      finishPointer(event);
    },
    [finishPointer],
  );

  const handlePointerCancel = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      finishPointer(event);
    },
    [finishPointer],
  );

  return {
    viewportRef,
    transform,
    viewportHandlers: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      onPointerCancel: handlePointerCancel,
    },
  };
}
