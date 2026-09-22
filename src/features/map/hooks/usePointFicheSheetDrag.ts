import { useCallback, useEffect, useRef, useState } from 'react';

// Seuils exprimés en fraction de la hauteur du viewport :
// - 20 % : hauteur d'ouverture initiale de la fiche (plancher du glissé libre). Ce n'est qu'un
//   minimum théorique : le plancher réel est la plus grande valeur entre 20 % et la hauteur
//   mesurée de l'en-tête + pied de page (measuredFloorHeight), pour ne jamais rogner le pied de
//   page (boutons), --safe-bottom inclus, quel que soit l'appareil.
// - Le seuil d'ouverture ("premier seuil") n'est plus un pourcentage fixe : c'est la hauteur
//   nécessaire pour voir la photo/croquis entièrement (sans révéler la section suivante),
//   mesurée dans le DOM par MapPointSheet et transmise via `measuredOpenThresholdHeight`.
//   FALLBACK_OPEN_THRESHOLD_FRACTION n'est utilisé que tant que cette mesure n'est pas encore
//   disponible (tout premier rendu).
// - Autour de ce seuil, une zone tampon absorbe l'imprécision du geste : un relâché entre
//   (seuil - 5 %) et (seuil + 10 %) s'ouvre exactement au seuil plutôt que de rester libre ou
//   de s'ouvrir en grand. En dessous de (seuil - 5 %), la fiche reste où elle est relâchée ;
//   au-dessus de (seuil + 10 %), elle s'ouvre en grand — utilisé quand le glissé démarre en
//   dessous du plein écran ("ouverture").
// - 75 % (fixe, indépendant du seuil dynamique) : seuil équivalent mais plus haut quand le
//   glissé démarre DEPUIS le plein écran ("fermeture") — hystérésis volontaire pour qu'un petit
//   geste de fermeture ne referme pas la fiche en grand par erreur, sans pour autant gêner une
//   fermeture franche.
const MIN_HEIGHT_FRACTION = 0.2;
const FALLBACK_OPEN_THRESHOLD_FRACTION = 0.4;
const OPEN_THRESHOLD_LOWER_BUFFER_FRACTION = 0.05;
const OPEN_THRESHOLD_UPPER_BUFFER_FRACTION = 0.1;
const CLOSE_FROM_FULLSCREEN_SNAP_BACK_FRACTION = 0.75;

// N'est utilisé que tant que measuredFloorHeight n'est pas encore disponible (tout premier rendu).
const FALLBACK_MIN_CONTENT_HEIGHT_PX = 220;

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
  /** Seuil d'ouverture ("photo entièrement visible") — dynamique, cf. mesure DOM. */
  freeMaxHeight: number;
  /** Plafond du glissé libre = freeMaxHeight - 5 %vh : en dessous, la fiche reste où elle est relâchée. */
  freeZoneUpperBound: number;
  /** freeMaxHeight + 10 %vh : au-delà (glissé qui ne démarre pas du plein écran), la fiche s'ouvre en grand. */
  openBufferUpperBound: number;
  fullscreenHeight: number;
}

export function getPointFicheSheetGeometry(
  viewportHeight: number,
  safeAreaTop: number,
  measuredOpenThresholdHeight?: number | null,
  measuredFloorHeight?: number | null,
): PointFicheSheetGeometry {
  const topInset = Math.max(12, safeAreaTop);
  const minHeight = Math.max(
    Math.round(viewportHeight * MIN_HEIGHT_FRACTION),
    measuredFloorHeight ?? FALLBACK_MIN_CONTENT_HEIGHT_PX,
  );
  const fullscreenHeight = Math.max(viewportHeight - topInset, minHeight);

  const fallbackOpenThreshold = Math.round(viewportHeight * FALLBACK_OPEN_THRESHOLD_FRACTION);
  const rawOpenThreshold = measuredOpenThresholdHeight ?? fallbackOpenThreshold;

  // Le seuil mesuré doit rester exploitable : jamais sous le plancher, et laisser au moins la
  // place pour la zone tampon du dessus avant d'atteindre le plein écran (photo très haute sur
  // un petit écran, par exemple).
  const freeMaxHeight = Math.min(
    Math.max(rawOpenThreshold, minHeight),
    fullscreenHeight - viewportHeight * OPEN_THRESHOLD_UPPER_BUFFER_FRACTION,
  );

  const freeZoneUpperBound = Math.max(
    minHeight,
    freeMaxHeight - viewportHeight * OPEN_THRESHOLD_LOWER_BUFFER_FRACTION,
  );
  const openBufferUpperBound = freeMaxHeight + viewportHeight * OPEN_THRESHOLD_UPPER_BUFFER_FRACTION;

  return { minHeight, freeMaxHeight, freeZoneUpperBound, openBufferUpperBound, fullscreenHeight };
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
  const { minHeight, freeMaxHeight, freeZoneUpperBound, openBufferUpperBound, fullscreenHeight } = geometry;

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
  // Tant que l'utilisateur n'a pas encore interagi avec la fiche, la fiche reste "au plancher" —
  // on la garde alignée sur le plancher mesuré au fil de l'eau (la mesure DOM s'affine après le
  // tout premier rendu, voir MapPointSheet) plutôt que de rester bloquée sur l'estimation de
  // repli. Une fois une interaction effectuée, on se contente de recadrer dans les nouvelles
  // bornes sans forcer de retour au plancher.
  const hasInteractedRef = useRef(false);

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
      hasInteractedRef.current = false;
    }
    wasEnabledRef.current = enabled;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  useEffect(() => cancelPendingFrame, [cancelPendingFrame]);

  useEffect(() => {
    if (!hasInteractedRef.current) {
      setBaseHeight(minHeight);
      return;
    }

    // Recale la position courante si elle sort des bornes après un changement de géométrie
    // (rotation d'écran, clavier virtuel…).
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
    // un glissé jusqu'au seuil d'ouverture en grand. Un tap n'est reconnu que s'il est à la
    // fois bref et quasi immobile, pour ne jamais interférer avec un petit glissé volontaire.
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
    const snapToFullscreenThreshold = startedFromFullscreen
      ? viewportHeight * CLOSE_FROM_FULLSCREEN_SNAP_BACK_FRACTION
      : openBufferUpperBound;

    let destination: number;
    if (targetHeight <= freeZoneUpperBound) {
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
    freeZoneUpperBound,
    openBufferUpperBound,
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
      hasInteractedRef.current = true;
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
    /** Hauteur "de repos" (avant/après glissé) — ignore le déplacement en cours pendant un
     *  glissé actif. À utiliser pour tout ce qui ne doit pas changer en plein glissé (ex. quels
     *  contenus sont montés) : un changement de mise en page pendant un glissé actif peut
     *  interrompre le geste sur certains navigateurs. */
    restingHeight: baseHeight,
    dragOffset,
    dragHandleProps,
    isDragging: isDraggingRef.current,
  };
}
