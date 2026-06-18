import type { CommunityThemeAttribute } from '@/domain/community/models';
import { getThemeAttributeListOptions } from '@/features/report/utils/communityReportTheme';
import { Checkbox } from '@/shared/ui/Checkbox';

import inputs from '@/shared/styles/inputs.module.css';
import styles from './BoundaryReportThemeField.module.css';

interface BoundaryReportThemeFieldProps {
  attribute: CommunityThemeAttribute;
  value: string;
  error?: string;
  onChange: (value: string) => void;
}

export function BoundaryReportThemeField({
  attribute,
  value,
  error,
  onChange,
}: BoundaryReportThemeFieldProps) {
  const fieldId = `theme-attr-${attribute.name.replace(/\s+/g, '-').toLowerCase()}`;

  const renderLabel = (required?: boolean) => (
    <label className={inputs.label} htmlFor={fieldId}>
      {attribute.name}
      {required && <span className={inputs.required}> *</span>}
    </label>
  );

  const renderError = () => (error ? <span className={inputs.error}>{error}</span> : null);

  switch (attribute.type) {
    case 'list':
      return (
        <div className={inputs.field}>
          {renderLabel(attribute.mandatory)}
          <select
            id={fieldId}
            className={`${inputs.select} ${error ? inputs.inputError : ''}`}
            value={value}
            onChange={(event) => onChange(event.target.value)}
          >
            {getThemeAttributeListOptions(attribute).map((option) => (
              <option key={option.value || 'empty'} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {renderError()}
        </div>
      );

    case 'checkbox':
      return (
        <div className={styles.checkboxField}>
          <Checkbox
            label={attribute.name}
            checked={value === '1'}
            onChange={(checked) => onChange(checked ? '1' : '0')}
          />
          {renderError()}
        </div>
      );

    case 'date':
      return (
        <div className={inputs.field}>
          {renderLabel(attribute.mandatory)}
          <input
            id={fieldId}
            type="date"
            className={`${inputs.input} ${error ? inputs.inputError : ''}`}
            value={value}
            onChange={(event) => onChange(event.target.value)}
          />
          {renderError()}
        </div>
      );

    case 'integer':
      return (
        <div className={inputs.field}>
          {renderLabel(attribute.mandatory)}
          <input
            id={fieldId}
            type="number"
            step="1"
            className={`${inputs.input} ${error ? inputs.inputError : ''}`}
            value={value}
            onChange={(event) => onChange(event.target.value)}
          />
          {renderError()}
        </div>
      );

    case 'double':
      return (
        <div className={inputs.field}>
          {renderLabel(attribute.mandatory)}
          <input
            id={fieldId}
            type="number"
            step="0.01"
            className={`${inputs.input} ${error ? inputs.inputError : ''}`}
            value={value}
            onChange={(event) => onChange(event.target.value)}
          />
          {renderError()}
        </div>
      );

    case 'text':
    default:
      return (
        <div className={inputs.field}>
          {renderLabel(attribute.mandatory)}
          <input
            id={fieldId}
            type="text"
            className={`${inputs.input} ${error ? inputs.inputError : ''}`}
            value={value}
            onChange={(event) => onChange(event.target.value)}
          />
          {renderError()}
        </div>
      );
  }
}
