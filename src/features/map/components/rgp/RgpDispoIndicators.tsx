import type { GdpRgp2AvailabilityLevel, GdpRgp2DispoState } from '@ign/gdp-tools';
import IconCheck from '@/shared/assets/icons/icon-check.svg?react';
import IconClose from '@/shared/assets/icons/icon-close.svg?react';

import ui from './rgpStationUi.module.css';

export interface RgpDispoIndicatorsProps {
  level: GdpRgp2AvailabilityLevel;
  states: readonly GdpRgp2DispoState[];
}

export function RgpDispoIndicators({ level, states }: RgpDispoIndicatorsProps) {
  if (level === 'down') {
    return (
      <div className={ui.dispoGroup} aria-hidden>
        <span className={ui.dispoDown}>En panne</span>
      </div>
    );
  }

  const indicators = states.length > 0 ? states : (['unavailable'] as const);

  return (
    <div className={ui.dispoGroup} aria-hidden>
      {indicators.map((state, index) => (
        <span
          key={`${state}-${index}`}
          className={state === 'available' ? ui.dispoOk : ui.dispoBad}
        >
          {state === 'available' ? (
            <IconCheck className={ui.dispoGlyph} />
          ) : (
            <IconClose className={ui.dispoGlyph} />
          )}
        </span>
      ))}
    </div>
  );
}