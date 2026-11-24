import { useEffect, useMemo } from 'react';
import { GDP_RGP2_AVAILABILITY_LABELS } from '@ign/gdp-tools';

import type { MapGeodesyClickAction } from '@/features/map/hooks/useMapGeodesyClick';
import { RgpDispoIndicators } from '@/features/map/components/rgp/RgpDispoIndicators';

import { buildRgpStationView } from './rgpStationFromAction';
import { useMeasuredHeight } from './useMeasuredHeight';

import bodyStyles from './MapPointRgpFicheBody.module.css';

const COORD_LABELS = {
  longitude: 'Longitude',
  latitude: 'Latitude',
  hauteur: 'Hauteur',
} as const;

export interface MapPointRgpFicheBodyProps {
  action: MapGeodesyClickAction;
  snapIndex: number;
  onPhotoBlockHeightChange?: (heightPx: number | null) => void;
}

function CoordCell({ label, value }: { label: string; value: string }) {
  return (
    <div className={bodyStyles.coordCell}>
      <span className={bodyStyles.fieldLabel}>{label}</span>
      <span className={bodyStyles.fieldValue}>{value}</span>
    </div>
  );
}

export function MapPointRgpFicheBody({
  action,
  snapIndex,
  onPhotoBlockHeightChange,
}: MapPointRgpFicheBodyProps) {
  const station = useMemo(() => buildRgpStationView(action), [action]);
  const [contentRef, contentHeight] = useMeasuredHeight<HTMLDivElement>();

  useEffect(() => {
    onPhotoBlockHeightChange?.(contentHeight);
  }, [contentHeight, onPhotoBlockHeightChange]);

  useEffect(() => {
    return () => {
      onPhotoBlockHeightChange?.(null);
    };
  }, [onPhotoBlockHeightChange]);

  if (snapIndex < 1) {
    return null;
  }

  return (
    <div ref={contentRef} className={bodyStyles.identityCard}>
      <div className={bodyStyles.availabilityRow}>
        <RgpDispoIndicators level={station.availabilityLevel} states={station.dispoStates} />
        <p className={bodyStyles.availabilityLabel}>
          {GDP_RGP2_AVAILABILITY_LABELS[station.availabilityLevel]}
        </p>
      </div>

      {station.lines.length > 0 ? (
        <ul className={bodyStyles.fieldList}>
          {station.lines.map((line) => {
            if (line.type === 'coordinates') {
              const { longitude, latitude, hauteur } = line.coordinates;
              return (
                <li key="coordinates" className={bodyStyles.coordRow}>
                  {longitude ? <CoordCell label={COORD_LABELS.longitude} value={longitude} /> : null}
                  {latitude ? <CoordCell label={COORD_LABELS.latitude} value={latitude} /> : null}
                  {hauteur ? <CoordCell label={COORD_LABELS.hauteur} value={hauteur} /> : null}
                </li>
              );
            }

            const { field } = line;
            return (
              <li key={field.key} className={bodyStyles.fieldRow}>
                <span className={bodyStyles.fieldLabel}>{field.label}</span>
                <span className={bodyStyles.fieldValue}>{field.value}</span>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}