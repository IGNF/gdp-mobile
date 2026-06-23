import { useRef } from 'react';
import {
  getGeodesyWfsMultiChoiceSelectedValues,
  type GeodesyWfsAttributeFilterDefinition,
  type GeodesyWfsAttributeFilterValues,
} from '@ign/gdp-tools';

import IconCalendar from '@/shared/assets/icons/icon-calendar.svg?react';
import IconClose from '@/shared/assets/icons/icon-close.svg?react';

import styles from './MapGeodesyFiltersPanel.module.css';

function formatIsoDateForDisplay(isoDate: string): string {
  const [year, month, day] = isoDate.split('-');
  if (!year || !month || !day) {
    return isoDate;
  }

  return `${day}/${month}/${year}`;
}

function openDatePicker(input: HTMLInputElement | null) {
  if (!input) {
    return;
  }

  if (typeof input.showPicker === 'function') {
    try {
      input.showPicker();
      return;
    } catch {
      // showPicker peut échouer hors interaction utilisateur directe.
    }
  }

  input.focus();
  input.click();
}

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
    <div className={styles.segmentRowGrid} role="group" aria-label={definition.title}>
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

function DateFilterField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string | null;
  onChange: (value: string | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const hasValue = value !== null && value.length > 0;
  const labelId = `filter-date-${label.toLowerCase()}-label`;

  return (
    <div className={styles.dateField}>
      <span className={styles.dateFieldLabel} id={labelId}>
        {label}
      </span>
      <div className={styles.dateInputWrap}>
        <button
          type="button"
          className={styles.datePickerTrigger}
          onClick={() => openDatePicker(inputRef.current)}
          aria-labelledby={labelId}
        >
          <IconCalendar className={styles.dateIcon} aria-hidden />
          <span className={hasValue ? styles.dateDisplayValue : styles.datePlaceholder}>
            {hasValue ? formatIsoDateForDisplay(value) : 'jj/mm/aaaa'}
          </span>
        </button>
        <input
          ref={inputRef}
          type="date"
          className={styles.dateInputNative}
          value={hasValue ? value : ''}
          tabIndex={-1}
          aria-hidden
          onChange={(event) => {
            onChange(event.target.value || null);
          }}
        />
        {hasValue ? (
          <button
            type="button"
            className={styles.dateClearButton}
            aria-label={`Effacer la date ${label.toLowerCase()}`}
            onClick={() => onChange(null)}
          >
            <IconClose className={styles.dateClearIcon} aria-hidden />
          </button>
        ) : null}
      </div>
    </div>
  );
}

function ObservationDateRow({
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
  const fromValue = typeof values[fromId] === 'string' && values[fromId] ? values[fromId] : null;
  const toValue = typeof values[toId] === 'string' && values[toId] ? values[toId] : null;

  return (
    <div className={styles.dateRangeRow}>
      <DateFilterField
        label="Du"
        value={fromValue}
        onChange={(next) => onChange(updateValue(values, fromId, next))}
      />
      <DateFilterField
        label="Au"
        value={toValue}
        onChange={(next) => onChange(updateValue(values, toId, next))}
      />
    </div>
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
          <h3 className={styles.sectionTitle}>Date d&apos;observation</h3>
          <ObservationDateRow
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
