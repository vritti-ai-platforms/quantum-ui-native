import { useId } from 'react';
import { View } from 'react-native';
import { DateFieldTrigger, formatDateDisplay, parseIsoDate, toIsoDate } from '../../reusables/date-picker';
import { Field, FieldDescription, FieldError, FieldLabel } from '../../reusables/field';
import { COMMON_ICONS, DynamicIcon } from '../DynamicIcon';
import { Text } from '../Text';
import type { DateRangePickerProps } from './types';

const DEFAULT_DISPLAY = 'P';

// Web / SSR fallback — read-only From/To fields (no native picker). Type source for tsc. Defaults
// From/To display to today to match the native variants (the component owns the selection).
export function DateRangePicker({
  name,
  label,
  description,
  error,
  fromPlaceholder = 'Start date',
  toPlaceholder = 'End date',
  value,
  disabled,
  displayFormat = DEFAULT_DISPLAY,
  id,
}: DateRangePickerProps) {
  const autoId = useId();
  const fieldId = id ?? name ?? autoId;
  const today = toIsoDate(new Date());
  const from = value?.from && parseIsoDate(value.from) ? value.from : today;
  const to = value?.to && parseIsoDate(value.to) ? value.to : today;
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
            value={formatDateDisplay(from, displayFormat)}
            placeholder={fromPlaceholder}
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
            value={formatDateDisplay(to, displayFormat)}
            placeholder={toPlaceholder}
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
