import { useEffect, useState } from 'react';
import {
  getGeodesyWfsMultiChoiceSelectedValues,
  type GeodesyWfsAttributeFilterDefinition,
  type GeodesyWfsAttributeFilterValues,
} from '@ign/gdp-tools';

import { GDP_GEODESY_MIN_DETERMINATION_YEAR } from '@/shared/constants/geodesy';
import { ActionSheet } from '@/shared/ui/ActionSheet';
import { YearWheelPicker } from '@/shared/ui/YearWheelPicker';
import { clampNumber } from '@/shared/utils/number';
import IconClose from '@/shared/assets/icons/icon-close.svg?react';

import styles from './MapGeodesyFiltersPanel.module.css';

function updateValue(
  values: GeodesyWfsAttributeFilterValues,
  id: string,
  value: boolean | string | null,
): GeodesyWfsAttributeFilterValues {
  return { ...values, [id]: value };
}

function SegmentButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={styles.segment}
      data-active={active ? 'true' : undefined}
      aria-pressed={active}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function MultiChoiceRow({
  definition,
  value,
  onChange,
}: {
  definition: Extract<GeodesyWfsAttributeFilterDefinition, { type: 'multiChoice' }>;
  value: boolean | string | null | undefined;
  onChange: (value: boolean | string | null) => void;
}) {
  const selected = getGeodesyWfsMultiChoiceSelectedValues(definition, value);

  const handleToggle = (optionValue: string) => {
    const next = new Set(selected);

    if (next.has(optionValue)) {
      next.delete(optionValue);
    } else {
      next.add(optionValue);
    }

    if (next.size === 0) {
      onChange('');
      return;
    }

    if (next.size === definition.options.length) {
      onChange(null);
      return;
    }

    onChange([...next].join(','));
  };

  return (
    <div className={styles.segmentRow} role="group" aria-label={definition.title}>
      <SegmentButton
        label="Tous"
        active={value === null || value === undefined}
        onClick={() => onChange(null)}
      />
      {definition.options.map((option) => (
        <SegmentButton
          key={option.value}
          label={option.label}
          active={selected.has(option.value)}
          onClick={() => handleToggle(option.value)}
        />
      ))}
    </div>
  );
}

function ChoiceRow({
  definition,
  value,
  onChange,
}: {
  definition: Extract<GeodesyWfsAttributeFilterDefinition, { type: 'choice' }>;
  value: boolean | string | null | undefined;
  onChange: (value: boolean | string | null) => void;
}) {
  const selected = typeof value === 'string' ? value : null;

  return (
    <div className={styles.segmentRow} role="group" aria-label={definition.title}>
      <SegmentButton label="Tous" active={selected === null} onClick={() => onChange(null)} />
      {definition.options.map((option) => (
        <SegmentButton
          key={option.value}
          label={option.label}
          active={selected === option.value}
          onClick={() => onChange(option.value)}
        />
      ))}
    </div>
  );
}

function BooleanRow({
  definition,
  value,
  onChange,
}: {
  definition: Extract<GeodesyWfsAttributeFilterDefinition, { type: 'boolean' }>;
  value: boolean | string | null | undefined;
  onChange: (value: boolean | string | null) => void;
}) {
  return (
    <div className={styles.segmentRow} role="group" aria-label={definition.title}>
      <SegmentButton
        label="Tous"
        active={value === null || value === undefined}
        onClick={() => onChange(null)}
      />
      <SegmentButton label={definition.trueLabel ?? 'Oui'} active={value === true} onClick={() => onChange(true)} />
      <SegmentButton
        label={definition.falseLabel ?? 'Non'}
        active={value === false}
        onClick={() => onChange(false)}
      />
    </div>
  );
}

function YearCellField({
  label,
  value,
  placeholder,
  onOpen,
  onClear,
  align = 'left',
}: {
  label: string;
  value: number | null;
  placeholder: string;
  onOpen: () => void;
  onClear: () => void;
  align?: 'left' | 'right';
}) {
  const hasValue = value !== null;
  const labelId = `filter-year-${label.toLowerCase()}-label`;

  return (
    <div className={styles.dateField}>
      <span className={styles.dateFieldLabel} id={labelId}>
        {label}
      </span>
      <div className={styles.dateInputWrap} data-align={align}>
        <button
          type="button"
          className={styles.datePickerTrigger}
          aria-labelledby={labelId}
          onClick={onOpen}
        >
          <span className={hasValue ? styles.dateDisplayValue : styles.datePlaceholder}>
            {hasValue ? value : placeholder}
          </span>
        </button>
        {hasValue ? (
          <button
            type="button"
            className={styles.dateClearButton}
            aria-label={`Effacer l'année ${label.toLowerCase()}`}
            onClick={onClear}
          >
            <IconClose className={styles.dateClearIcon} aria-hidden />
          </button>
        ) : null}
      </div>
    </div>
  );
}

function YearPickerSheet({
  isOpen,
  initialValue,
  min,
  max,
  onCancel,
  onValidate,
}: {
  isOpen: boolean;
  initialValue: number;
  min: number;
  max: number;
  onCancel: () => void;
  onValidate: (year: number) => void;
}) {
  const [pendingYear, setPendingYear] = useState(initialValue);

  useEffect(() => {
    if (isOpen) {
      setPendingYear(initialValue);
    }
  }, [isOpen, initialValue]);

  return (
    <ActionSheet
      isOpen={isOpen}
      onClose={onCancel}
      title="Année de détermination"
      buttons={[
        { label: 'Annuler', variant: 'outline', onClick: onCancel },
        { label: 'Valider', onClick: () => onValidate(pendingYear) },
      ]}
    >
      <YearWheelPicker
        min={min}
        max={max}
        value={pendingYear}
        onChange={setPendingYear}
        ariaLabel="Sélection de l'année"
      />
    </ActionSheet>
  );
}

function parseYearFromIsoDate(raw: boolean | string | null | undefined): number | null {
  if (typeof raw !== 'string' || raw.length < 4) {
    return null;
  }

  const year = Number(raw.slice(0, 4));
  return Number.isFinite(year) ? year : null;
}

function DeterminationYearRangeRow({
  values,
  fromId,
  toId,
  onChange,
}: {
  values: GeodesyWfsAttributeFilterValues;
  fromId: string;
  toId: string;
  onChange: (values: GeodesyWfsAttributeFilterValues) => void;
}) {
  const minYearBound = GDP_GEODESY_MIN_DETERMINATION_YEAR;
  const maxYearBound = new Date().getFullYear();

  // OBS_DATE_FROM/TO stockent des bornes décalées d'un jour pour contourner la comparaison
  // stricte (`>`/`<`) de gdp-tools et inclure l'année choisie : voir `commitRange`.
  const fromYear = parseYearFromIsoDate(values[fromId]);
  const toYear = parseYearFromIsoDate(values[toId]);
  const minYear = fromYear !== null ? fromYear + 1 : minYearBound;
  const maxYear = toYear !== null ? toYear - 1 : maxYearBound;

  const [openCell, setOpenCell] = useState<'from' | 'to' | null>(null);

  const commitRange = (nextMinYear: number, nextMaxYear: number) => {
    const clampedMin = clampNumber(nextMinYear, minYearBound, maxYearBound);
    const clampedMax = clampNumber(nextMaxYear, minYearBound, maxYearBound);
    const finalMin = Math.min(clampedMin, clampedMax);
    const finalMax = Math.max(clampedMin, clampedMax);
    const isFullRange = finalMin === minYearBound && finalMax === maxYearBound;

    onChange({
      ...values,
      [fromId]: isFullRange ? null : `${finalMin - 1}-12-31`,
      [toId]: isFullRange ? null : `${finalMax + 1}-01-01`,
    });
  };

  const handleValidate = (year: number) => {
    if (openCell === 'from') {
      commitRange(year, maxYear);
    } else if (openCell === 'to') {
      commitRange(minYear, year);
    }
    setOpenCell(null);
  };

  return (
    <>
      <div className={styles.dateRangeRow}>
        <YearCellField
          label="Du"
          value={fromYear !== null ? minYear : null}
          placeholder={String(minYearBound)}
          onOpen={() => setOpenCell('from')}
          onClear={() => commitRange(minYearBound, maxYear)}
        />
        <YearCellField
          label="Au"
          value={toYear !== null ? maxYear : null}
          placeholder={String(maxYearBound)}
          onOpen={() => setOpenCell('to')}
          onClear={() => commitRange(minYear, maxYearBound)}
          align="right"
        />
      </div>
      <YearPickerSheet
        isOpen={openCell !== null}
        initialValue={openCell === 'to' ? maxYear : minYear}
        min={minYearBound}
        max={maxYearBound}
        onCancel={() => setOpenCell(null)}
        onValidate={handleValidate}
      />
    </>
  );
}

export interface GdpGeodesyFiltersFormProps {
  filters: readonly GeodesyWfsAttributeFilterDefinition[];
  values: GeodesyWfsAttributeFilterValues;
  onChange: (values: GeodesyWfsAttributeFilterValues) => void;
}

export function GdpGeodesyFiltersForm({ filters, values, onChange }: GdpGeodesyFiltersFormProps) {
  const networkFilter = filters.find((filter) => filter.id === 'NETWORK_CATEGORY');
  const proprioFilter = filters.find((filter) => filter.id === 'PROPRIO');
  const photoFilter = filters.find((filter) => filter.id === 'HAS_PHOTO');
  const hasObservationDates = filters.some((filter) => filter.id === 'OBS_DATE_FROM');

  const setFilterValue = (id: string, value: boolean | string | null) => {
    onChange(updateValue(values, id, value));
  };

  return (
    <div className={styles.form}>
      {networkFilter?.type === 'multiChoice' ? (
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>{networkFilter.title}</h3>
          <MultiChoiceRow
            definition={networkFilter}
            value={values[networkFilter.id]}
            onChange={(next) => setFilterValue(networkFilter.id, next)}
          />
        </section>
      ) : null}

      {proprioFilter?.type === 'choice' ? (
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>{proprioFilter.title}</h3>
          <ChoiceRow
            definition={proprioFilter}
            value={values[proprioFilter.id]}
            onChange={(next) => setFilterValue(proprioFilter.id, next)}
          />
        </section>
      ) : null}

      {photoFilter?.type === 'boolean' ? (
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>{photoFilter.title}</h3>
          <BooleanRow
            definition={photoFilter}
            value={values[photoFilter.id]}
            onChange={(next) => setFilterValue(photoFilter.id, next)}
          />
        </section>
      ) : null}

      {hasObservationDates ? (
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Année de détermination</h3>
          <DeterminationYearRangeRow
            values={values}
            fromId="OBS_DATE_FROM"
            toId="OBS_DATE_TO"
            onChange={onChange}
          />
        </section>
      ) : null}
    </div>
  );
}
