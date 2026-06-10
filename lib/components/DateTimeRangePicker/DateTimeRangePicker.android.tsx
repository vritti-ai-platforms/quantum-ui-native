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
import { Text } from '../Text';
import type { DateTimeRange, DateTimeRangePickerProps } from './types';

// Android: two read-only fields (From / To), each chaining date → time (no native `datetime` mode),
// emitting combined UTC ISO instants. Bounds linked — From ≤ To. Selection runs in the resolved
// BU zone via `timeZoneName`.
export function DateTimeRangePicker({
  name,
  label,
  description,
  error,
  fromPlaceholder = 'Start date & time',
  toPlaceholder = 'End date & time',
  value,
  onChange,
  onChangeText,
  clearable,
  disabled,
  timeZone,
  minDate,
  maxDate,
  id,
}: DateTimeRangePickerProps) {
  const autoId = useId();
  const fieldId = id ?? name ?? autoId;
  const { accentColor } = usePickerTheme();
  const buTimeZone = useBUTimezone();
  const locale = useLocale();
  const tz = timeZone ?? buTimeZone ?? undefined;
  const [range, setRange] = useState<DateTimeRange>(() => ({
    from: value?.from && parseInstant(value.from) ? value.from : undefined,
    to: value?.to && parseInstant(value.to) ? value.to : undefined,
  }));

  const commit = (next: DateTimeRange) => {
    setRange(next);
    const resolved = next.from == null && next.to == null ? undefined : next;
    onChange?.(resolved);
    onChangeText?.(resolved);
  };

  const fromDate = parseInstant(range.from);
  const toDate = parseInstant(range.to);
  const buttons = accentColor
    ? { positiveButton: { textColor: accentColor }, negativeButton: { textColor: accentColor } }
    : {};

  // Chain date → time, then hand the combined instant to `apply`.
  const openDateTime = (seed: Date, minimumDate: Date | undefined, maximumDate: Date | undefined, apply: (iso: string) => void) =>
    DateTimePickerAndroid.open({
      value: seed,
      mode: 'date',
      display: 'calendar',
      timeZoneName: tz,
      minimumDate,
      maximumDate,
      ...buttons,
      onChange: (dateEvent, pickedDate) => {
        if (dateEvent.type !== 'set' || !pickedDate) return;
        DateTimePickerAndroid.open({
          value: pickedDate,
          mode: 'time',
          timeZoneName: tz,
          ...buttons,
          onChange: (timeEvent, full) => {
            if (timeEvent.type === 'set' && full) apply(toInstantIso(full));
          },
        });
      },
    });

  const openFrom = () =>
    openDateTime(fromDate ?? new Date(), minDate, toDate ?? maxDate, (iso) => commit({ from: iso, to: range.to }));

  const openTo = () =>
    openDateTime(toDate ?? fromDate ?? new Date(), fromDate ?? minDate, maxDate, (iso) => commit({ from: range.from, to: iso }));

  const calIcon = <DynamicIcon icon={COMMON_ICONS.calendar} size={18} className="text-muted-foreground" />;

  return (
    <Field disabled={disabled}>
      {label ? <FieldLabel nativeID={fieldId}>{label}</FieldLabel> : null}
      <View className="gap-2">
        <View className="gap-1">
          <Text variant="muted" className="text-xs">
            From
          </Text>
          <View className="relative">
            <DateFieldTrigger
              value={formatInstantDisplay(range.from, tz, locale ?? undefined)}
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
              value={formatInstantDisplay(range.to, tz, locale ?? undefined)}
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

DateTimeRangePicker.displayName = 'DateTimeRangePicker';
