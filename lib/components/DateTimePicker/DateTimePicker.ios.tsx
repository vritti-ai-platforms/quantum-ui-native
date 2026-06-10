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
import type { DateTimePickerProps } from './types';

// iOS: a disclosure field (the Calendar-app pattern). The header is a read-only trigger showing the
// formatted date+time with a pull-down chevron; tapping it expands the editable DateTimeFieldRow
// (date zone + time zone, each with its own native popover) below. The component owns the selection;
// selection + display run in the resolved zone (`timeZone` → active BU zone via useBUTimezone →
// device); the emitted value is a UTC ISO instant.
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
  const buTimeZone = useBUTimezone();
  const locale = useLocale();
console.log('Resolved time zone:', timeZone, '→', buTimeZone, '→', locale);
  const tz = timeZone ?? buTimeZone ?? undefined;
  const [selected, setSelected] = useState<string | undefined>(() => (value && parseInstant(value) ? value : undefined));
  const [expanded, setExpanded] = useState(false);

  const commit = (next: string | undefined) => {
    setSelected(next);
    onChange?.(next);
    onChangeText?.(next);
  };

  const toggle = () => {
    setExpanded((prev) => {
      const next = !prev;
      onOpenChange?.(next);
      return next;
    });
  };

  return (
    <Field disabled={disabled}>
      {label ? <FieldLabel nativeID={fieldId}>{label}</FieldLabel> : null}
      {/* Header — formatted value + calendar icon / clear-X (DatePicker look); tap toggles the editor. */}
      <View className="relative">
        <DateFieldTrigger
          value={formatInstantDisplay(selected, tz, locale ?? undefined)}
          placeholder={placeholder}
          onPress={toggle}
          disabled={disabled}
          error={!!error}
          icon={
            clearable && selected ? undefined : (
              <DynamicIcon icon={COMMON_ICONS.calendar} className="text-muted-foreground size-4 shrink-0 mr-2" />
            )
          }
        />
        {clearable && selected && !disabled ? <DateFieldClearButton onClear={() => commit(undefined)} /> : null}
      </View>
      {/* Editor — always mounted so the slide can play both ways; `open` drives the open/close. */}
      <DateTimeFieldRow
        value={selected}
        onChange={(iso) => {
          commit(iso);
          onBlur?.();
        }}
        open={expanded && !disabled}
        timeZone={tz}
        locale={locale ?? undefined}
        minDate={minDate}
        maxDate={maxDate}
        error={!!error}
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
