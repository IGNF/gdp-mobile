import type { Coordinate } from 'ol/coordinate';
import type Feature from 'ol/Feature';
import type Point from 'ol/geom/Point';

/**
 * En dessous de ce seuil (mètres, projection carte), des entités regroupées sont considérées
 * comme faites sur le même point : zoomer ne peut jamais les séparer (leur distance à l'écran
 * reste nulle quel que soit le niveau de zoom), il faut les « éclater » (spiderfy) autour du
 * point plutôt que zoomer dessus.
 */
const SAME_POINT_TOLERANCE_METERS = 3;

/** Entités regroupées par le `Cluster` source, ou la seule entité si elle n'est pas groupée. */
export function getClusteredSubFeatures(feature: Feature): Feature[] {
  const clustered = feature.get('features') as Feature[] | undefined;
  return Array.isArray(clustered) && clustered.length > 0 ? clustered : [feature];
}

function featurePointCoordinate(feature: Feature): Coordinate | null {
  const geometry = feature.getGeometry();
  if (!geometry || typeof (geometry as Point).getCoordinates !== 'function') {
    return null;
  }
  return (geometry as Point).getCoordinates();
}

/** True si toutes les entités regroupées sont à la même position (repositionnement GPS mis à part). */
export function areClusteredFeaturesAtSamePoint(features: readonly Feature[]): boolean {
  const coordinates = features
    .map(featurePointCoordinate)
    .filter((coordinate): coordinate is Coordinate => coordinate !== null);

  if (coordinates.length < 2) {
    return true;
  }

  const [first, ...rest] = coordinates;
  return rest.every(([x, y]) => Math.hypot(x - first[0], y - first[1]) <= SAME_POINT_TOLERANCE_METERS);
}

/** Position de l'entité groupée (centroïde du cluster), utilisée pour centrer l'éclatement. */
export function clusterCenterCoordinate(clusterFeature: Feature): Coordinate | null {
  return featurePointCoordinate(clusterFeature);
}

/** Clé stable identifiant un cluster « même point » — sert à savoir lequel est actuellement éclaté. */
export function clusterSamePointKey(prefix: string, clusterFeature: Feature): string | null {
  const coordinate = featurePointCoordinate(clusterFeature);
  if (!coordinate) {
    return null;
  }
  return `${prefix}:${Math.round(coordinate[0])}:${Math.round(coordinate[1])}`;
}

export interface SpiderfyLayoutEntry {
  /** Angle en radians. */
  angle: number;
  /** Distance au centre, en pixels écran. */
  radius: number;
}

/**
 * Répartit `count` entités en éventail autour d'un point (anneaux concentriques au-delà de 8
 * entités, pour ne pas les faire se chevaucher). Angle et rayon sont en pixels écran, à
 * convertir en coordonnées carte via `map.getCoordinateFromPixel`.
 */
export function computeSpiderfyLayout(count: number): SpiderfyLayoutEntry[] {
  const MAX_PER_RING = 8;
  const RING_BASE_RADIUS = 46;
  const RING_STEP = 34;

  const layout: SpiderfyLayoutEntry[] = [];
  let remaining = count;
  let ring = 0;

  while (remaining > 0) {
    const inRing = Math.min(remaining, MAX_PER_RING);
    const radius = RING_BASE_RADIUS + ring * RING_STEP;
    // Décale un anneau sur deux d'un demi-pas pour ne pas aligner ses pointes sur l'anneau précédent.
    const angleOffset = ring % 2 === 0 ? 0 : Math.PI / inRing;
    for (let i = 0; i < inRing; i += 1) {
      layout.push({ angle: (i / inRing) * 2 * Math.PI + angleOffset, radius });
    }
    remaining -= inRing;
    ring += 1;
  }

  return layout;
}
