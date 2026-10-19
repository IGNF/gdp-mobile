const EARTH_RADIUS_KM = 6371;

/** Distance en km entre deux points WGS84 (formule haversine). */
export function distanceKm(
  from: { longitude: number; latitude: number },
  to: { longitude: number; latitude: number },
): number {
  const toRad = (degrees: number) => (degrees * Math.PI) / 180;
  const dLat = toRad(to.latitude - from.latitude);
  const dLon = toRad(to.longitude - from.longitude);
  const lat1 = toRad(from.latitude);
  const lat2 = toRad(to.latitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_KM * c;
}

export function formatDistanceKm(distanceKmValue: number): string {
  if (distanceKmValue < 1) {
    return `${Math.round(distanceKmValue * 1000)} m`;
  }

  return `${distanceKmValue.toFixed(1).replace('.', ',')} km`;
}

/** Libellé de distance au point : depuis l'utilisateur (GPS actif) ou depuis le centre de la carte. */
export function formatDistanceFromReference(
  distanceKmValue: number,
  reference: 'user' | 'mapCenter',
): string {
  const from = reference === 'user' ? 'de vous' : 'du centre de la carte';
  return `À ${formatDistanceKm(distanceKmValue)} ${from}`;
}
