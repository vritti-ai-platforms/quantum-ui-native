import { useId, useState } from 'react';
import { View } from 'react-native';
import { useBUTimezone } from '../../hooks/useBUTimezone';
import { useLocale } from '../../hooks/useLocale';
import {
  DateFieldClearButton,
  DateFieldTrigger,
  DateTimeFieldRow,
  formatInstantDisplay,
  parseInstant,
} from '../../reusables/date-picker';
import { Field, FieldDescription, FieldError, FieldLabel } from '../../reusables/field';
import { COMMON_ICONS, DynamicIcon } from '../DynamicIcon';
import { Text } from '../Text';
import type { DateTimeRange, DateTimeRangePickerProps } from './types';

// iOS: two disclosure fields (From / To), each exactly like the single DateTimePicker — a
// DateFieldTrigger header (formatted value + calendar / clear-X) that pulls down its own
// DateTimeFieldRow (native date + time pickers) with the smooth slide. The component owns the range
// (UTC ISO instants); bounds linked — From ≤ To. Selection + display run in the resolved zone.
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
  const buTimeZone = useBUTimezone();
  const locale = useLocale();
  const tz = timeZone ?? buTimeZone ?? undefined;
  const [range, setRange] = useState<DateTimeRange>(() => ({
    from: value?.from && parseInstant(value.from) ? value.from : undefined,
    to: value?.to && parseInstant(value.to) ? value.to : undefined,
  }));
  const [openFrom, setOpenFrom] = useState(false);
  const [openTo, setOpenTo] = useState(false);

  const commit = (next: DateTimeRange) => {
    setRange(next);
    const resolved = next.from == null && next.to == null ? undefined : next;
    onChange?.(resolved);
    onChangeText?.(resolved);
  };

  const fromDate = parseInstant(range.from);
  const toDate = parseInstant(range.to);
  const calIcon = <DynamicIcon icon={COMMON_ICONS.calendar} className="text-muted-foreground size-4 shrink-0 mr-2" />;

  return (
    <Field disabled={disabled}>
      {label ? <FieldLabel nativeID={fieldId}>{label}</FieldLabel> : null}
      <View className="gap-2">
        {/* From */}
        <View className="gap-1">
          <Text variant="muted" className="text-xs">
            From
          </Text>
          <View className="relative">
            <DateFieldTrigger
              value={formatInstantDisplay(range.from, tz, locale ?? undefined)}
              placeholder={fromPlaceholder}
              onPress={() => setOpenFrom((o) => !o)}
              disabled={disabled}
              error={!!error}
              icon={clearable && range.from ? undefined : calIcon}
            />
            {clearable && range.from && !disabled ? (
              <DateFieldClearButton onClear={() => commit({ from: undefined, to: range.to })} />
            ) : null}
          </View>
          <DateTimeFieldRow
            value={range.from}
            onChange={(iso) => commit({ from: iso, to: range.to })}
            open={openFrom && !disabled}
            timeZone={tz}
            locale={locale ?? undefined}
            minDate={minDate}
            maxDate={toDate ?? maxDate}
            error={!!error}
          />
        </View>
        {/* To */}
        <View className="gap-1">
          <Text variant="muted" className="text-xs">
            To
          </Text>
          <View className="relative">
            <DateFieldTrigger
              value={formatInstantDisplay(range.to, tz, locale ?? undefined)}
              placeholder={toPlaceholder}
              onPress={() => setOpenTo((o) => !o)}
              disabled={disabled}
              error={!!error}
              icon={clearable && range.to ? undefined : calIcon}
            />
            {clearable && range.to && !disabled ? (
              <DateFieldClearButton onClear={() => commit({ from: range.from, to: undefined })} />
            ) : null}
          </View>
          <DateTimeFieldRow
            value={range.to}
            onChange={(iso) => commit({ from: range.from, to: iso })}
            open={openTo && !disabled}
            timeZone={tz}
            locale={locale ?? undefined}
            minDate={fromDate ?? minDate}
            maxDate={maxDate}
            error={!!error}
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

DateTimeRangePicker.displayName = 'DateTimeRangePicker';
