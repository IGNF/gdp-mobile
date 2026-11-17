import { useContext } from 'react';

import { WebPdfCartContext, type WebPdfCartContextValue } from './webPdfCartContextState';

const noopCart: WebPdfCartContextValue = {
  enabled: false,
  entries: [],
  count: 0,
  isInCart: () => false,
  isKeyInCart: () => false,
  add: () => 'already',
  addMany: () => ({ added: 0, alreadyInCart: 0, limitReached: false }),
  remove: () => undefined,
  toggle: () => 'removed',
  clear: () => undefined,
};

export function useWebPdfCart(): WebPdfCartContextValue {
  return useContext(WebPdfCartContext) ?? noopCart;
}
