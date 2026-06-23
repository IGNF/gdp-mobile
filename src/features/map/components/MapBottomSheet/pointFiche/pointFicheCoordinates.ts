import { toStringHDMS } from 'ol/coordinate';

import type { MapGeodesyClickAction } from '@/features/map/hooks/useMapGeodesyClick';

import { readProperty, stripAltitudeSystemLabel, parseGeographicEllipsoid, parseGeographicReferenceSystem, parseProjectedProjection } from './pointFicheUtils';

export type CoordinateTabId = 'geographic' | 'projection';

export interface CoordinateField {
  label: string;
  value: string;
  wide?: boolean;
}

export interface PointCoordinatesView {
  geographic: CoordinateField[];
  projection: CoordinateField[];
  defaultTab: CoordinateTabId;
}

function appendMeterSuffix(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  return /\bm\s*$/i.test(trimmed) ? trimmed : `${trimmed} m`;
}

function formatDecimalCoordinate(value: number, fractionDigits = 6): string {
  return value.toFixed(fractionDigits);
}

function formatHdmsLongitude(longitude: number, latitude: number): string {
  const [lonPart] = toStringHDMS([longitude, latitude], 5).split(/\s{2,}/);
  return lonPart?.trim() ?? formatDecimalCoordinate(longitude);
}

function formatHdmsLatitude(longitude: number, latitude: number): string {
  const parts = toStringHDMS([longitude, latitude], 5).split(/\s{2,}/);
  return parts[1]?.trim() ?? formatDecimalCoordinate(latitude);
}

function buildFields(entries: Array<CoordinateField | null>): CoordinateField[] {
  return entries.filter((entry): entry is CoordinateField => entry !== null && entry.value.trim() !== '');
}

function field(
  label: string,
  rawValue: string | null,
  options?: { wide?: boolean; format?: (value: string) => string | null },
): CoordinateField | null {
  if (!rawValue?.trim()) {
    return null;
  }

  const formatted = options?.format ? options.format(rawValue.trim()) : rawValue.trim();
  if (!formatted) {
    return null;
  }

  return { label, value: formatted, wide: options?.wide };
}

function readGeographicSystem(action: MapGeodesyClickAction): string | null {
  const cg1Srt = readProperty(action, 'cg1_srt');
  if (!cg1Srt) {
    return null;
  }

  const parsed = parseGeographicReferenceSystem(cg1Srt);
  return parsed || null;
}

function readGeographicEllipsoid(action: MapGeodesyClickAction): string | null {
  const dedicated = readProperty(action, 'cg1_ell') ?? readProperty(action, 'ellipsoide');
  if (dedicated) {
    return dedicated;
  }

  const cg1Srt = readProperty(action, 'cg1_srt');
  if (!cg1Srt) {
    return null;
  }

  const parsed = parseGeographicEllipsoid(cg1Srt);
  return parsed || null;
}

function readProjectedProjection(action: MapGeodesyClickAction): string | null {
  const cp1Srt = readProperty(action, 'cp1_srt');
  if (!cp1Srt) {
    return null;
  }

  const parsed = parseProjectedProjection(cp1Srt);
  return parsed || null;
}

export function buildPointCoordinatesView(action: MapGeodesyClickAction): PointCoordinatesView {
  const { longitude, latitude } = action.point;

  /* Les champs géographiques sont l'ensemble des champs cg1_*** */
  const geographic = buildFields([
    field(
      'Latitude',
      readProperty(action, 'cg1_coord2_dms') ??
        readProperty(action, 'cg1_coord2') ??
        formatHdmsLatitude(longitude, latitude),
    ),
    field(
      'Longitude',
      readProperty(action, 'cg1_coord1_dms') ??
        readProperty(action, 'cg1_coord1') ??
        formatHdmsLongitude(longitude, latitude),
    ),
    field('Hauteur', readProperty(action, 'cg1_coord3'), { wide: true, format: appendMeterSuffix }),
    field('Système', readGeographicSystem(action)),
    field('Ellipsoïde', readGeographicEllipsoid(action)),
  ]);


  
   /* Les champs en projection sont l'ensemble des champs cp1_*** */
  const projection = buildFields([
    field('Système', readGeographicSystem(action)),
    field('Ellipsoïde', readGeographicEllipsoid(action)),
    field('Easting', readProperty(action, 'cp1_coord1'), { format: appendMeterSuffix }),
    field('Northing', readProperty(action, 'cp1_coord2'), { format: appendMeterSuffix }),
    field('Précision planimétrique', readProperty(action, 'cp1_prec')),
    field('Projection', readProjectedProjection(action)),
    field('Système altimétrique', readProperty(action, 'cp1_srv'), {
      wide: true,
      format: (value) => stripAltitudeSystemLabel(value) || null,
    }),
    field('Altitude', readProperty(action, 'cp1_coord3'), { format: appendMeterSuffix }),
    field('Précision altimétrique', readProperty(action, 'cp1_precv')),
  ]);

  const defaultTab: CoordinateTabId =
    geographic.length === 0 && projection.length > 0 ? 'projection' : 'geographic';

  return { geographic, projection, defaultTab };
}
