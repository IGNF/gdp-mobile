import { useEffect, useRef, useState } from 'react';

/**
 * Mesure en continu la hauteur (`offsetHeight`) d'un élément via `ResizeObserver`.
 * Retourne `null` tant que le ref n'est pas encore attaché à un nœud DOM.
 */
export function useMeasuredHeight<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [height, setHeight] = useState<number | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }

    const resizeObserver = new ResizeObserver(() => {
      setHeight(element.offsetHeight);
    });

    // border-box (et non le content-box par défaut) : un changement de padding seul (ex.
    // --safe-bottom qui grandit) ne modifie pas le content-box et ne déclencherait sinon jamais
    // le callback, alors que offsetHeight (mesuré ci-dessus) en dépend bien.
    resizeObserver.observe(element, { box: 'border-box' });
    return () => resizeObserver.disconnect();
  }, []);

  return [ref, height] as const;
}
