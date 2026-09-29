import { useLayoutEffect, useRef, type RefObject } from 'react';

/**
 * Ref toujours à jour avec la dernière valeur reçue — pour lire une prop/un état changeant
 * depuis un callback stable (`useCallback`, écouteur DOM/carte…) sans le mettre dans ses
 * dépendances. Écrit dans un `useLayoutEffect` (après le commit, avant la peinture), jamais
 * pendant le rendu : { @link https://react.dev/reference/react/useRef } — les refs ne se
 * lisent/modifient pas pendant le rendu (règle ESLint `react-hooks/refs`).
 */
export function useLatestRef<T>(value: T): RefObject<T> {
  const ref = useRef(value);
  useLayoutEffect(() => {
    ref.current = value;
  });
  return ref;
}
