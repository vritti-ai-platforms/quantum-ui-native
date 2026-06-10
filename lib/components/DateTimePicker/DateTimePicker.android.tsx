import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useId, useState } from 'react';
import { View } from 'react-native';
import { useBUTimezone } from '../../hooks/useBUTimezone';
import { useLocale } from '../../hooks/useLocale';
import {
  DateFieldClearButton,
  DateFieldTrigger,
  formatInstantDisplay,
  parseInstant,
  toInstantIso,
  usePickerTheme,
} from '../../reusables/date-picker';
import { Field, FieldDescription, FieldError, FieldLabel } from '../../reusables/field';
import { COMMON_ICONS, DynamicIcon } from '../DynamicIcon';
import type { DateTimePickerProps } from './types';

// Android: a read-only field that opens the native Material pickers. Android has no `datetime`
// mode, so we chain date → time: pick the day, then (seeded with that day) pick the time, and
// emit the combined instant as a UTC ISO string. Selection runs in the resolved BU zone via
// `timeZoneName`.
export function DateTimePicker({
  name,
  label,
  description,
  error,
  placeholder = 'Select date & time',
  value,
  onChange,
  onChangeText,
  clearable,
  disabled,
  timeZone,
  minDate,
  maxDate,
  id,
  onBlur,
  onOpenChange,
}: DateTimePickerProps) {
  const autoId = useId();
  const fieldId = id ?? name ?? autoId;
  const { accentColor } = usePickerTheme();
  const buTimeZone = useBUTimezone();
  const locale = useLocale();
  const tz = timeZone ?? buTimeZone ?? undefined;
  const [selected, setSelected] = useState<string | undefined>(() => (value && parseInstant(value) ? value : undefined));

  const commit = (next: string | undefined) => {
    setSelected(next);
    onChange?.(next);
    onChangeText?.(next);
  };

  const buttons = accentColor
    ? { positiveButton: { textColor: accentColor }, negativeButton: { textColor: accentColor } }
    : {};

  const open = () => {
    onOpenChange?.(true);
    const current = parseInstant(selected) ?? new Date();
    DateTimePickerAndroid.open({
      value: current,
      mode: 'date',
      display: 'calendar',
      timeZoneName: tz,
      minimumDate: minDate,
      maximumDate: maxDate,
      ...buttons,
      onChange: (dateEvent, pickedDate) => {
        if (dateEvent.type !== 'set' || !pickedDate) {
          onOpenChange?.(false);
          onBlur?.();
          return;
        }
        // Step 2: time, seeded with the day chosen in step 1 (keeps the existing time-of-day).
        DateTimePickerAndroid.open({
          value: pickedDate,
          mode: 'time',
          timeZoneName: tz,
          ...buttons,
          onChange: (timeEvent, full) => {
            onOpenChange?.(false);
            onBlur?.();
            if (timeEvent.type === 'set' && full) commit(toInstantIso(full));
          },
        });
      },
    });
  };

  return (
    <Field disabled={disabled}>
      {label ? <FieldLabel nativeID={fieldId}>{label}</FieldLabel> : null}
      <View className="relative">
        <DateFieldTrigger
          value={formatInstantDisplay(selected, tz, locale ?? undefined)}
          placeholder={placeholder}
          onPress={open}
          disabled={disabled}
          error={!!error}
          icon={
            clearable && selected ? undefined : (
              <DynamicIcon icon={COMMON_ICONS.calendar} size={18} className="text-muted-foreground" />
            )
          }
        />
        {clearable && selected && !disabled ? <DateFieldClearButton onClear={() => commit(undefined)} /> : null}
      </View>
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
