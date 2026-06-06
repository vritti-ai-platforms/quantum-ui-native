import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useId, useState } from 'react';
import {
  DateFieldTrigger,
  formatDateDisplay,
  parseIsoDate,
  toIsoDate,
  usePickerTheme,
} from '../../reusables/date-picker';
import { Field, FieldDescription, FieldError, FieldLabel } from '../../reusables/field';
import { COMMON_ICONS, DynamicIcon } from '../DynamicIcon';
import type { DatePickerProps } from './types';

const DEFAULT_DISPLAY = 'P';

// Android: a read-only field that opens the native Material calendar dialog (imperative API).
// The component owns the selection (internal state, defaults to today); `value` is an optional initial.
export function DatePicker({
  name,
  label,
  description,
  error,
  placeholder = 'Select date',
  value,
  onChange,
  disabled,
  displayFormat = DEFAULT_DISPLAY,
  minDate,
  maxDate,
  id,
  onBlur,
  onOpenChange,
}: DatePickerProps) {
  const autoId = useId();
  const fieldId = id ?? name ?? autoId;
  const { accentColor } = usePickerTheme();
  const [selected, setSelected] = useState<string | undefined>(
    value && parseIsoDate(value) ? value : toIsoDate(new Date()),
  );

  const commit = (next: string | undefined) => {
    setSelected(next);
    onChange?.(next);
  };

  const open = () => {
    onOpenChange?.(true);
    DateTimePickerAndroid.open({
      value: parseIsoDate(selected) ?? new Date(),
      mode: 'date',
      display: 'calendar',
      minimumDate: minDate,
      maximumDate: maxDate,
      ...(accentColor
        ? { positiveButton: { textColor: accentColor }, negativeButton: { textColor: accentColor } }
        : {}),
      onChange: (event, date) => {
        onOpenChange?.(false);
        onBlur?.();
        if (event.type === 'set' && date) commit(toIsoDate(date));
      },
    });
  };

  return (
    <Field>
      {label ? <FieldLabel nativeID={fieldId}>{label}</FieldLabel> : null}
      <DateFieldTrigger
        value={formatDateDisplay(selected, displayFormat)}
        placeholder={placeholder}
        onPress={open}
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
