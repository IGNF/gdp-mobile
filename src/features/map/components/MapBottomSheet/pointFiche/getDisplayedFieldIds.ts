import type { PointFicheVariant } from './resolvePointFicheVariant';
import {
  GEODESY_FICHE_SNAP1_FIELD_KEYS,
  GEODESY_FICHE_SNAP2_FIELD_KEYS,
  NIVELLEMENT_FICHE_SNAP1_FIELD_KEYS,
  NIVELLEMENT_FICHE_SNAP2_FIELD_KEYS,
  POINT_FICHE_HEADER_FIELD_KEYS,
} from './displayedFieldKeys';
import { mergeDisplayedFieldIds } from './pointFicheUtils';

export function getDisplayedFieldIds(variant: PointFicheVariant, snapIndex: number): Set<string> {
  const groups: string[][] = [Array.from(POINT_FICHE_HEADER_FIELD_KEYS)];

  if (snapIndex >= 1) {
    groups.push(
      variant === 'geodesy'
        ? Array.from(GEODESY_FICHE_SNAP1_FIELD_KEYS)
        : Array.from(NIVELLEMENT_FICHE_SNAP1_FIELD_KEYS),
    );
  }

  if (snapIndex >= 2) {
    groups.push(
      variant === 'geodesy'
        ? Array.from(GEODESY_FICHE_SNAP2_FIELD_KEYS)
        : Array.from(NIVELLEMENT_FICHE_SNAP2_FIELD_KEYS),
    );
  }

  if (snapIndex >= 3) {
    groups.push(['full']);
  }

  return mergeDisplayedFieldIds(...groups);
}
