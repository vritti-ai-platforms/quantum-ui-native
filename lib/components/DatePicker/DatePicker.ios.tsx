import DateTimePicker from '@react-native-community/datetimepicker';
import { useId, useState } from 'react';
import { View, type ViewStyle } from 'react-native';
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
import type { DatePickerProps } from './types';

const DEFAULT_DISPLAY = 'P';

// The native compact control is transparent (opacity 0.02 — just above UIKit's 0.01 hit-test cutoff)
// and centered in the field by the wrapper below, so its date pill sits at the field's horizontal
// center. Scaling from that center keeps the popover anchored straight under the field while the scaled
// hit area still covers the whole field — a tap anywhere opens the picker. scaleY covers the field height.
const NATIVE_OVERLAY: ViewStyle = {
  opacity: 0.02,
  transformOrigin: '50% 50%',
  transform: [{ scaleX: 11 }, { scaleY: 1.5 }],
};

// iOS: a select-style field (matches SingleSelect) layered over the native compact date control.
// The visible DateFieldTrigger renders the select look + calendar adornment; tapping it raises Apple's
// native calendar popover from the transparent control behind it. The component owns the selection
// (internal state, defaults to today); `value` is just an optional initial value, `onChange` notifies.
export function DatePicker({
  name,
  label,
  description,
  error,
  placeholder = 'Select date',
  value,
  onChange,
  onChangeText,
  clearable,
  disabled,
  displayFormat = DEFAULT_DISPLAY,
  minDate,
  maxDate,
  id,
  onBlur,
}: DatePickerProps) {
  const autoId = useId();
  const fieldId = id ?? name ?? autoId;
  const { themeVariant, accentColor } = usePickerTheme();
  const [selected, setSelected] = useState<string | undefined>(
    value && parseIsoDate(value) ? value : undefined,
  );

  const commit = (next: string | undefined) => {
    setSelected(next);
    onChange?.(next);
    onChangeText?.(next);
  };

  const selectedDate = parseIsoDate(selected);

  return (
    <Field disabled={disabled}>
      {label ? <FieldLabel nativeID={fieldId}>{label}</FieldLabel> : null}
      <View className="relative">
        <DateFieldTrigger
          value={formatDateDisplay(selected, displayFormat)}
          placeholder={placeholder}
          disabled={disabled}
          error={!!error}
          icon={
            clearable && selected ? undefined : (
              <DynamicIcon icon={COMMON_ICONS.calendar} className="text-muted-foreground size-4 shrink-0 mr-2" />
            )
          }
        />
        {!disabled ? (
          <View className="absolute inset-0 items-center justify-center" pointerEvents="box-none">
            <DateTimePicker
              value={selectedDate ?? new Date()}
              mode="date"
              display="compact"
              themeVariant={themeVariant}
              accentColor={accentColor}
              minimumDate={minDate}
              maximumDate={maxDate}
              onChange={(event, date) => {
                if ((event.type === 'set' || event.type === 'dismissed') && date) commit(toIsoDate(date));
                onBlur?.();
              }}
              style={NATIVE_OVERLAY}
            />
          </View>
        ) : null}
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

DatePicker.displayName = 'DatePicker';
