/**
 * Fiche détail d'un signalement ouverte depuis la fiche info d'un repère : la flèche retour
 * rouvre cette fiche (état de navigation `openReportPoint` de MapPage) au lieu de la liste.
 */
export interface PointFicheReturnState {
  from: 'pointFiche';
  pointFiche: { longitude: number; latitude: number };
}

export function buildPointFicheReturnState(position: {
  longitude: number;
  latitude: number;
}): PointFicheReturnState {
  return { from: 'pointFiche', pointFiche: { longitude: position.longitude, latitude: position.latitude } };
}

export function readPointFicheReturn(state: unknown): { longitude: number; latitude: number } | null {
  if (!state || typeof state !== 'object') {
    return null;
  }

  const candidate = state as Partial<PointFicheReturnState>;
  const position = candidate.pointFiche;
  if (
    candidate.from !== 'pointFiche' ||
    !position ||
    typeof position.longitude !== 'number' ||
    typeof position.latitude !== 'number'
  ) {
    return null;
  }

  return position;
}
