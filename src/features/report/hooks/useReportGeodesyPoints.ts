import { fetchGeodesyWfsPointsByRef, geodesyPointRefKey, type GeodesyPointRef } from '@ign/gdp-tools';
import { useEffect, useState } from 'react';

import { GDP_GEODESY_EXPERT_CATALOG } from '@/shared/constants/geodesy';

/**
 * Propriétés WFS utiles à la liste (titre `nom`, `picto`, commune, voie). Noms exacts de la
 * couche `GEODESIE:data_geod` : un seul nom inconnu fait échouer toute la requête GeoServer.
 */
const REPORT_LIST_POINT_PROPERTIES = [
  'id',
  'domaine',
  'nom',
  'picto',
  'commune',
  'voie_suivie',
  'voie_de',
  'voie_vers',
];

/**
 * Relit dans le WFS géodésie les repères des signalements serveur, pour afficher les infos
 * que l'Espace collaboratif ne stocke pas (nom, picto, voie suivie…). Indexé par
 * `geodesyPointRefKey`. En cas d'échec (hors ligne…), la liste reste en version réduite.
 */
export function useReportGeodesyPoints(refs: readonly GeodesyPointRef[]) {
  const [points, setPoints] = useState<Map<string, Record<string, unknown>>>(() => new Map());
  const refsKey = refs.map(geodesyPointRefKey).sort().join('|');

  useEffect(() => {
    if (!refsKey) {
      return;
    }

    let cancelled = false;
    const pendingRefs = refsKey.split('|').map((key) => {
      const separator = key.indexOf(':');
      return { domaine: key.slice(0, separator), id: key.slice(separator + 1) };
    });

    void fetchGeodesyWfsPointsByRef({
      catalog: GDP_GEODESY_EXPERT_CATALOG,
      refs: pendingRefs,
      propertyNames: REPORT_LIST_POINT_PROPERTIES,
    })
      .then((result) => {
        if (!cancelled) {
          setPoints(result);
        }
      })
      .catch(() => {
        // WFS indisponible : on garde l'affichage réduit.
      });

    return () => {
      cancelled = true;
    };
  }, [refsKey]);

  return points;
}
