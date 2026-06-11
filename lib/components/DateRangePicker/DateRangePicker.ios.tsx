import DateTimePicker from '@react-native-community/datetimepicker';
import { useId, useState } from 'react';
import { View, type ViewStyle } from 'react-native';
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

// The native compact control is transparent (opacity 0.02 — just above UIKit's 0.01 hit-test cutoff)
// and centered in each field by the wrapper below, so its date pill sits at that field's horizontal
// center. Scaling from center keeps each popover anchored straight under its own field while the scaled
// hit area covers the field — a tap anywhere opens it. scaleY (1.5) covers the field height but stays
// well short of the inter-row gap, so the From/To overlays still can't trigger each other.
const NATIVE_OVERLAY: ViewStyle = {
  opacity: 0.02,
  transformOrigin: '50% 50%',
  transform: [{ scaleX: 11 }, { scaleY: 1.5 }],
};

// iOS: two stacked select-style fields (From / To). Each shows the SingleSelect look + calendar
// adornment via DateFieldTrigger, with a transparent native compact control behind it that raises
// Apple's native calendar popover on tap. The component owns the range (internal state, From/To default
// to today); `value` is just an optional initial. Bounds are linked — From can't exceed To, vice versa.
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
  const { themeVariant, accentColor } = usePickerTheme();
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
  const calIcon = <DynamicIcon icon={COMMON_ICONS.calendar} className="text-muted-foreground size-4 shrink-0 mr-1" />;

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
              value={formatDateDisplay(range.from, locale ?? undefined)}
              placeholder={fromPlaceholder}
              disabled={disabled}
              error={!!error}
              icon={clearable && range.from ? undefined : calIcon}
            />
            {!disabled ? (
              <View className="absolute inset-0 items-center justify-center" pointerEvents="box-none">
                <DateTimePicker
                  value={fromDate ?? new Date()}
                  mode="date"
                  display="compact"
                  themeVariant={themeVariant}
                  accentColor={accentColor}
                  locale={locale ?? undefined}
                  minimumDate={minDate}
                  maximumDate={toDate ?? maxDate}
                  onChange={(event, date) => {
                  if ((event.type === 'set' || event.type === 'dismissed') && date) commit({ from: toIsoDate(date), to: range.to });
                  }}
                  style={NATIVE_OVERLAY}
                />
              </View>
            ) : null}
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
              disabled={disabled}
              error={!!error}
              icon={clearable && range.to ? undefined : calIcon}
            />
            {!disabled ? (
              <View className="absolute inset-0 items-center justify-center" pointerEvents="box-none">
                <DateTimePicker
                  value={toDate ?? fromDate ?? new Date()}
                  mode="date"
                  display="compact"
                  themeVariant={themeVariant}
                  accentColor={accentColor}
                  locale={locale ?? undefined}
                  minimumDate={fromDate ?? minDate}
                  maximumDate={maxDate}
                  onChange={(event, date) => {
                    if ((event.type === 'set' || event.type === 'dismissed') && date) commit({ from: range.from, to: toIsoDate(date) });
                  }}
                  style={NATIVE_OVERLAY}
                />
              </View>
            ) : null}
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
