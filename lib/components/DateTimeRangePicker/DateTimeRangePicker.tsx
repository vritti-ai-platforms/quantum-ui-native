import { useId } from 'react';
import { View } from 'react-native';
import { DateFieldTrigger, formatInstantDisplay, parseInstant } from '../../reusables/date-picker';
import { Field, FieldDescription, FieldError, FieldLabel } from '../../reusables/field';
import { COMMON_ICONS, DynamicIcon } from '../DynamicIcon';
import { Text } from '../Text';
import type { DateTimeRangePickerProps } from './types';

// Web / SSR fallback — two read-only fields (From / To), no native picker. Native resolves the
// .ios/.android files; this is the type source for tsc.
export function DateTimeRangePicker({
  name,
  label,
  description,
  error,
  fromPlaceholder = 'Start date & time',
  toPlaceholder = 'End date & time',
  value,
  disabled,
  timeZone,
  id,
}: DateTimeRangePickerProps) {
  const autoId = useId();
  const fieldId = id ?? name ?? autoId;
  const from = value?.from && parseInstant(value.from) ? value.from : undefined;
  const to = value?.to && parseInstant(value.to) ? value.to : undefined;
  const calIcon = <DynamicIcon icon={COMMON_ICONS.calendar} size={18} className="text-muted-foreground" />;
  return (
    <Field disabled={disabled}>
      {label ? <FieldLabel nativeID={fieldId}>{label}</FieldLabel> : null}
      <View className="gap-2">
        <View className="gap-1">
          <Text variant="muted" className="text-xs">
            From
          </Text>
          <DateFieldTrigger value={formatInstantDisplay(from, timeZone)} placeholder={fromPlaceholder} disabled={disabled} error={!!error} icon={calIcon} />
        </View>
        <View className="gap-1">
          <Text variant="muted" className="text-xs">
            To
          </Text>
          <DateFieldTrigger value={formatInstantDisplay(to, timeZone)} placeholder={toPlaceholder} disabled={disabled} error={!!error} icon={calIcon} />
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
