import { useCallback, useEffect, useRef, useState } from 'react';

// Seuils exprimés en fraction de la hauteur du viewport :
// - 18 % : hauteur d'ouverture initiale de la fiche (plancher du glissé libre).
// - 40 % : plafond du glissé libre — un relâché à l'intérieur de [18 %, 40 %] laisse la
//   fiche exactement où l'utilisateur l'a lâchée.
// - 55 % : au-delà, un relâché ouvre la fiche en grand plutôt que de revenir à 40 % — utilisé
//   quand le glissé démarre en dessous du plein écran ("ouverture").
// - 75 % : seuil équivalent mais plus haut quand le glissé démarre DEPUIS le plein écran
//   ("fermeture") — hystérésis volontaire pour qu'un petit geste de fermeture ne referme pas
//   la fiche en grand par erreur, sans pour autant gêner une fermeture franche.
const MIN_HEIGHT_FRACTION = 0.18;
const FREE_MAX_HEIGHT_FRACTION = 0.4;
const OPEN_SNAP_TO_FULLSCREEN_FRACTION = 0.55;
const CLOSE_FROM_FULLSCREEN_SNAP_BACK_FRACTION = 0.75;

// Garantit que l'en-tête et le pied de page (toujours visibles) ne sont jamais rognés
// sur les très petits écrans, même quand 18 % du viewport ne suffit pas à les contenir.
const MIN_CONTENT_HEIGHT_PX = 220;

// Traction supplémentaire, sous le plancher, à partir de laquelle un relâché est interprété
// comme une demande de fermeture plutôt qu'un simple retour au plancher.
const DISMISS_DRAG_THRESHOLD_PX = 64;

// Un pointerdown/pointerup est considéré comme un tap (et non un glissé, même lent et court)
// seulement s'il reste sous ces bornes de traction ET de durée — sert à détecter le double tap
// sur la poignée sans jamais interpréter à tort un petit glissé volontaire comme un tap.
const TAP_MAX_MOVEMENT_PX = 8;
const TAP_MAX_DURATION_MS = 250;
// Délai maximum entre deux taps pour qu'ils soient reconnus comme un double tap.
const DOUBLE_TAP_MAX_DELAY_MS = 300;

export interface PointFicheSheetGeometry {
  minHeight: number;
  freeMaxHeight: number;
  fullscreenHeight: number;
}

export function getPointFicheSheetGeometry(
  viewportHeight: number,
  safeAreaTop: number,
): PointFicheSheetGeometry {
  const topInset = Math.max(12, safeAreaTop);
  const minHeight = Math.max(Math.round(viewportHeight * MIN_HEIGHT_FRACTION), MIN_CONTENT_HEIGHT_PX);
  const freeMaxHeight = Math.max(Math.round(viewportHeight * FREE_MAX_HEIGHT_FRACTION), minHeight);
  const fullscreenHeight = Math.max(viewportHeight - topInset, freeMaxHeight);

  return { minHeight, freeMaxHeight, fullscreenHeight };
}

interface UsePointFicheSheetDragOptions {
  geometry: PointFicheSheetGeometry;
  viewportHeight: number;
  enabled?: boolean;
  /** Appelé quand l'utilisateur abaisse la poignée sous le plancher pour fermer la fiche. */
  onDismiss?: () => void;
}

export function usePointFicheSheetDrag({
  geometry,
  viewportHeight,
  enabled = true,
  onDismiss,
}: UsePointFicheSheetDragOptions) {
  const { minHeight, freeMaxHeight, fullscreenHeight } = geometry;

  const [baseHeight, setBaseHeight] = useState(minHeight);
  const [dragOffset, setDragOffset] = useState(0);
  const dragStartYRef = useRef(0);
  const dragStartAtRef = useRef(0);
  const dragStartHeightRef = useRef(minHeight);
  const dragOffsetRef = useRef(0);
  const isDraggingRef = useRef(false);
  const wasEnabledRef = useRef(enabled);
  const captureTargetRef = useRef<HTMLElement | null>(null);
  const capturedPointerIdRef = useRef<number | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const lastTapAtRef = useRef(0);

  const cancelPendingFrame = useCallback(() => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
  }, []);

  // Réinitialise au plancher à l'ouverture d'une nouvelle fiche — mais pas quand l'utilisateur
  // clique un autre repère pendant que la fiche est déjà ouverte : sa position est conservée.
  useEffect(() => {
    if (enabled && !wasEnabledRef.current) {
      dragOffsetRef.current = 0;
      setBaseHeight(minHeight);
      setDragOffset(0);
    }
    wasEnabledRef.current = enabled;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  useEffect(() => cancelPendingFrame, [cancelPendingFrame]);

  // Recale la position courante si elle sort des bornes après un changement de géométrie
  // (rotation d'écran, clavier virtuel…).
  useEffect(() => {
    setBaseHeight((current) => Math.max(minHeight, Math.min(fullscreenHeight, current)));
  }, [minHeight, fullscreenHeight]);

  const currentHeight = Math.max(minHeight, Math.min(fullscreenHeight, baseHeight - dragOffset));

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

  const endDrag = useCallback((isTapEligible: boolean) => {
    releasePointerCaptureSafe();
    cancelPendingFrame();

    if (!isDraggingRef.current) {
      return;
    }

    isDraggingRef.current = false;
    const targetHeight = dragStartHeightRef.current - dragOffsetRef.current;

    // Double tap sur la poignée : raccourci pour ouvrir directement en grand, sans attendre
    // un glissé jusqu'au seuil des 55 %. Un tap n'est reconnu que s'il est à la fois bref et
    // quasi immobile, pour ne jamais interférer avec un petit glissé volontaire.
    const now = Date.now();
    const isTap =
      isTapEligible &&
      Math.abs(dragOffsetRef.current) < TAP_MAX_MOVEMENT_PX &&
      now - dragStartAtRef.current < TAP_MAX_DURATION_MS;

    if (isTap) {
      const isDoubleTap = now - lastTapAtRef.current <= DOUBLE_TAP_MAX_DELAY_MS;
      lastTapAtRef.current = isDoubleTap ? 0 : now;

      if (isDoubleTap) {
        dragOffsetRef.current = 0;
        setBaseHeight(fullscreenHeight);
        setDragOffset(0);
        return;
      }
    }

    if (onDismiss && targetHeight < minHeight - DISMISS_DRAG_THRESHOLD_PX) {
      dragOffsetRef.current = 0;
      setBaseHeight(minHeight);
      setDragOffset(0);
      onDismiss();
      return;
    }

    // Un glissé qui démarre depuis le plein écran ("fermeture") tolère un relâché plus haut
    // avant de revenir à 100 % qu'un glissé qui démarre plus bas ("ouverture") — hystérésis
    // volontaire, voir les constantes en tête de fichier.
    const startedFromFullscreen = dragStartHeightRef.current >= fullscreenHeight - 1;
    const snapToFullscreenThreshold =
      viewportHeight *
      (startedFromFullscreen ? CLOSE_FROM_FULLSCREEN_SNAP_BACK_FRACTION : OPEN_SNAP_TO_FULLSCREEN_FRACTION);

    let destination: number;
    if (targetHeight <= freeMaxHeight) {
      destination = Math.max(minHeight, targetHeight);
    } else if (targetHeight <= snapToFullscreenThreshold) {
      destination = freeMaxHeight;
    } else {
      destination = fullscreenHeight;
    }

    dragOffsetRef.current = 0;
    setBaseHeight(destination);
    setDragOffset(0);
  }, [
    cancelPendingFrame,
    freeMaxHeight,
    fullscreenHeight,
    minHeight,
    onDismiss,
    releasePointerCaptureSafe,
    viewportHeight,
  ]);

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      if (!enabled) {
        return;
      }

      cancelPendingFrame();
      isDraggingRef.current = true;
      dragStartYRef.current = event.clientY;
      dragStartAtRef.current = Date.now();
      dragStartHeightRef.current = baseHeight;
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
    [baseHeight, cancelPendingFrame, enabled],
  );

  const handlePointerMove = useCallback((event: React.PointerEvent<HTMLElement>) => {
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
  }, []);

  const handlePointerUp = useCallback(() => {
    endDrag(true);
  }, [endDrag]);

  const handlePointerCancel = useCallback(() => {
    // Un cancel (ex. le navigateur reprend le geste) n'est jamais un tap volontaire.
    endDrag(false);
  }, [endDrag]);

  const dragHandleProps = {
    onPointerDown: handlePointerDown,
    onPointerMove: handlePointerMove,
    onPointerUp: handlePointerUp,
    onPointerCancel: handlePointerCancel,
  };

  return {
    currentHeight,
    dragOffset,
    dragHandleProps,
    isDragging: isDraggingRef.current,
  };
}
