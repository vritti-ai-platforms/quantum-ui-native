import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useId, useState } from 'react';
import { View } from 'react-native';
import {
  DateFieldTrigger,
  formatDateDisplay,
  parseIsoDate,
  toIsoDate,
  usePickerTheme,
} from '../../reusables/date-picker';
import { Field, FieldDescription, FieldError, FieldLabel } from '../../reusables/field';
import { COMMON_ICONS, DynamicIcon } from '../DynamicIcon';
import { Text } from '../Text';
import type { DateRange, DateRangePickerProps } from './types';

const DEFAULT_DISPLAY = 'P';

// Android: two read-only fields (From / To), each opening the native Material calendar dialog.
// The component owns the range (internal state, From/To default to today). Bounds linked — From ≤ To.
export function DateRangePicker({
  name,
  label,
  description,
  error,
  fromPlaceholder = 'Start date',
  toPlaceholder = 'End date',
  value,
  onChange,
  disabled,
  displayFormat = DEFAULT_DISPLAY,
  minDate,
  maxDate,
  id,
}: DateRangePickerProps) {
  const autoId = useId();
  const fieldId = id ?? name ?? autoId;
  const { accentColor } = usePickerTheme();
  const [range, setRange] = useState<DateRange>(() => {
    const today = toIsoDate(new Date());
    return {
      from: value?.from && parseIsoDate(value.from) ? value.from : today,
      to: value?.to && parseIsoDate(value.to) ? value.to : today,
    };
  });

  const commit = (next: DateRange) => {
    setRange(next);
    onChange?.(next.from == null && next.to == null ? undefined : next);
  };

  const fromDate = parseIsoDate(range.from);
  const toDate = parseIsoDate(range.to);
  const buttons = accentColor ? { positiveButton: { textColor: accentColor } } : {};

  const openFrom = () =>
    DateTimePickerAndroid.open({
      value: fromDate ?? new Date(),
      mode: 'date',
      display: 'calendar',
      minimumDate: minDate,
      maximumDate: toDate ?? maxDate,
      ...buttons,
      onChange: (event, date) => {
        if (event.type === 'set' && date) commit({ from: toIsoDate(date), to: range.to });
      },
    });

  const openTo = () =>
    DateTimePickerAndroid.open({
      value: toDate ?? fromDate ?? new Date(),
      mode: 'date',
      display: 'calendar',
      minimumDate: fromDate ?? minDate,
      maximumDate: maxDate,
      ...buttons,
      onChange: (event, date) => {
        if (event.type === 'set' && date) commit({ from: range.from, to: toIsoDate(date) });
      },
    });

  const calIcon = <DynamicIcon icon={COMMON_ICONS.calendar} size={18} className="text-muted-foreground" />;

  return (
    <Field>
      {label ? <FieldLabel nativeID={fieldId}>{label}</FieldLabel> : null}
      <View className="gap-2">
        <View className="gap-1">
          <Text variant="muted" className="text-xs">
            From
          </Text>
          <DateFieldTrigger
            value={formatDateDisplay(range.from, displayFormat)}
            placeholder={fromPlaceholder}
            onPress={openFrom}
            disabled={disabled}
            error={!!error}
            icon={calIcon}
          />
        </View>
        <View className="gap-1">
          <Text variant="muted" className="text-xs">
            To
          </Text>
          <DateFieldTrigger
            value={formatDateDisplay(range.to, displayFormat)}
            placeholder={toPlaceholder}
            onPress={openTo}
            disabled={disabled}
            error={!!error}
            icon={calIcon}
          />
        </View>
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

DateRangePicker.displayName = 'DateRangePicker';
