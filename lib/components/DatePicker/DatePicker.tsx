import { useId } from 'react';
import { useLocale } from '../../hooks/useLocale';
import { DateFieldTrigger, formatDateDisplay, parseIsoDate, toIsoDate } from '../../reusables/date-picker';
import { Field, FieldDescription, FieldError, FieldLabel } from '../../reusables/field';
import { COMMON_ICONS, DynamicIcon } from '../DynamicIcon';
import type { DatePickerProps } from './types';

// Web / SSR fallback — renders the read-only field only (no native picker). Native apps resolve
// DatePicker.ios.tsx / DatePicker.android.tsx; this file is the type source for tsc. Defaults the
// displayed value to today to match the native variants (the component owns the selection).
export function DatePicker({
  name,
  label,
  description,
  error,
  placeholder = 'Select date',
  value,
  disabled,
  id,
}: DatePickerProps) {
  const autoId = useId();
  const fieldId = id ?? name ?? autoId;
  const locale = useLocale();
  const selected = value && parseIsoDate(value) ? value : toIsoDate(new Date());
  return (
    <Field>
      {label ? <FieldLabel nativeID={fieldId}>{label}</FieldLabel> : null}
      <DateFieldTrigger
        value={formatDateDisplay(selected, locale ?? undefined)}
        placeholder={placeholder}
        disabled={disabled}
        error={!!error}
        icon={<DynamicIcon icon={COMMON_ICONS.calendar} size={18} className="text-muted-foreground" />}
      />
      {error ? (
        <FieldError>{error}</FieldError>
      ) : description ? (
        typeof description === 'string' ? (
          <FieldDescription>{description}</FieldDescription>
        ) : (
          description
        )
      ) : null}
    </Field>
  );
}

DatePicker.displayName = 'DatePicker';
