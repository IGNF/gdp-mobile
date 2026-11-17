import { createContext } from 'react';

import type {
  WebPdfCartAddManyResult,
  WebPdfCartAddResult,
  WebPdfCartEntry,
  WebPdfCartToggleResult,
} from './pdfCartTypes';
import type { MapGeodesyClickAction } from '@/features/map/hooks/useMapGeodesyClick';

export interface WebPdfCartContextValue {
  enabled: boolean;
  entries: readonly WebPdfCartEntry[];
  count: number;
  isInCart: (action: MapGeodesyClickAction) => boolean;
  isKeyInCart: (key: string) => boolean;
  add: (action: MapGeodesyClickAction) => WebPdfCartAddResult;
  addMany: (actions: readonly MapGeodesyClickAction[]) => WebPdfCartAddManyResult;
  remove: (key: string) => void;
  toggle: (action: MapGeodesyClickAction) => WebPdfCartToggleResult;
  clear: () => void;
}

export const WebPdfCartContext = createContext<WebPdfCartContextValue | null>(null);
