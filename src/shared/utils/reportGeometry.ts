import Point from 'ol/geom/Point';
import WKT from 'ol/format/WKT';
import { toLonLat } from 'ol/proj';

export interface ReportPointCoordinates {
  longitude: number;
  latitude: number;
}

/**
 * Extrait lon/lat d’un WKT `POINT(lon lat)` renvoyé par l’API (EPSG:4326).
 * Même convention qu’espaceco-mobile-refonte et @ign/mobile-core ReportSource.
 */
export function parseReportPointGeometry(geometry?: string): ReportPointCoordinates | null {
  if (!geometry?.trim()) {
    return null;
  }

  const match = geometry.match(/POINT\s*(?:Z|M)?\s*\(\s*([-\d.]+)\s+([-\d.]+)/i);
  if (match) {
    const longitude = Number.parseFloat(match[1]);
    const latitude = Number.parseFloat(match[2]);
    if (Number.isFinite(longitude) && Number.isFinite(latitude)) {
      return { longitude, latitude };
    }
  }

  try {
    const feature = new WKT().readFeature(geometry, {
      dataProjection: 'EPSG:4326',
      featureProjection: 'EPSG:3857',
    });
    const geom = feature.getGeometry();
    if (!(geom instanceof Point)) {
      return null;
    }

    const [longitude, latitude] = toLonLat(geom.getCoordinates());
    if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) {
      return null;
    }

    return { longitude, latitude };
  } catch {
    return null;
  }
}
