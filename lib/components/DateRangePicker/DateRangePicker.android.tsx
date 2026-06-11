import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useId, useState } from 'react';
import { View } from 'react-native';
import { useLocale } from '../../hooks/useLocale';
import {
  DateFieldClearButton,
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
  onChangeText,
  clearable,
  disabled,
  minDate,
  maxDate,
  id,
}: DateRangePickerProps) {
  const autoId = useId();
  const fieldId = id ?? name ?? autoId;
  const { accentColor } = usePickerTheme();
  const locale = useLocale();
  const [range, setRange] = useState<DateRange>(() => {
    const today = toIsoDate(new Date());
    const fromFallback = clearable ? undefined : today;
    const toFallback = clearable ? undefined : today;
    return {
      from: value?.from && parseIsoDate(value.from) ? value.from : fromFallback,
      to: value?.to && parseIsoDate(value.to) ? value.to : toFallback,
    };
  });

  const commit = (next: DateRange) => {
    setRange(next);
    const resolved = next.from == null && next.to == null ? undefined : next;
    onChange?.(resolved);
    onChangeText?.(resolved);
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
          <View className="relative">
            <DateFieldTrigger
              value={formatDateDisplay(range.from, locale ?? undefined)}
              placeholder={fromPlaceholder}
              onPress={openFrom}
              disabled={disabled}
              error={!!error}
              icon={clearable && range.from ? undefined : calIcon}
            />
            {clearable && range.from && !disabled ? (
              <DateFieldClearButton onClear={() => commit({ from: undefined, to: range.to })} />
            ) : null}
          </View>
        </View>
        <View className="gap-1">
          <Text variant="muted" className="text-xs">
            To
          </Text>
          <View className="relative">
            <DateFieldTrigger
              value={formatDateDisplay(range.to, locale ?? undefined)}
              placeholder={toPlaceholder}
              onPress={openTo}
              disabled={disabled}
              error={!!error}
              icon={clearable && range.to ? undefined : calIcon}
            />
            {clearable && range.to && !disabled ? (
              <DateFieldClearButton onClear={() => commit({ from: range.from, to: undefined })} />
            ) : null}
          </View>
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
