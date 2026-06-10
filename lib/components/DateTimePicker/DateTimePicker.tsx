import { useId } from 'react';
import { DateFieldTrigger, formatInstantDisplay, parseInstant } from '../../reusables/date-picker';
import { Field, FieldDescription, FieldError, FieldLabel } from '../../reusables/field';
import { COMMON_ICONS, DynamicIcon } from '../DynamicIcon';
import type { DateTimePickerProps } from './types';

// Web / SSR fallback — renders the read-only field only (no native picker). Native apps resolve
// DateTimePicker.ios.tsx / DateTimePicker.android.tsx; this file is the type source for tsc.
export function DateTimePicker({
  name,
  label,
  description,
  error,
  placeholder = 'Select date & time',
  value,
  disabled,
  timeZone,
  id,
}: DateTimePickerProps) {
  const autoId = useId();
  const fieldId = id ?? name ?? autoId;
  const selected = value && parseInstant(value) ? value : undefined;
  return (
    <Field disabled={disabled}>
      {label ? <FieldLabel nativeID={fieldId}>{label}</FieldLabel> : null}
      <DateFieldTrigger
        value={formatInstantDisplay(selected, timeZone)}
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

DateTimePicker.displayName = 'DateTimePicker';
