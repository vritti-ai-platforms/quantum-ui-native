import RNDateTimePicker from '@react-native-community/datetimepicker';
import { useUnstableNativeVariable } from 'nativewind';
import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Text } from '../../components/Text';
import { cn } from '../../utils/index';
import { parseInstant, toInstantIso } from './dateUtils';
import { usePickerTheme } from './usePickerTheme';

const useVar = useUnstableNativeVariable as unknown as (name: string) => string | undefined;

const ROW_HEIGHT = 48; // h-12
const DURATION = 340; // smooth + slightly slow (tune here)

export interface DateTimeFieldRowProps {
  /** UTC ISO instant string. */
  value?: string;
  /** Receives a fully-combined UTC ISO instant (date keeps time / time keeps date — see below). */
  onChange: (iso: string) => void;
  /** When set + `clearable` + value present, renders the clear-X. */
  onClear?: () => void;
  timeZone?: string;
  locale?: string;
  minDate?: Date;
  maxDate?: Date;
  disabled?: boolean;
  /** Accepted for API parity; error is surfaced by the field's FieldError text, not a border. */
  error?: boolean;
  clearable?: boolean;
  /** Trailing adornment (calendar icon); hidden while the clear-X shows. */
  icon?: ReactNode;
  /** Drives the slide open/close. Defaults to true (always shown — e.g. the range From/To fields). */
  open?: boolean;
}

// iOS-native datetime field: Apple's two compact controls — a `mode="date"` pill and a `mode="time"`
// pill — rendered visibly **beside each other** (the iOS Calendar layout), each opening its own native
// popover on tap. Both controls share the same `value`, so `mode="date"` returns the picked day with
// the existing time preserved and `mode="time"` returns the existing date with the picked time — each
// onChange already yields a combined instant, no manual merge.
//
// Animation: a smooth SLIDE (no fade), like the iOS WhatsApp search reveal. The outer clip container's
// height grows 0→ROW_HEIGHT while the content slides down from above (translateY -ROW_HEIGHT→0), so the
// row slides into view AND pushes the content below it smoothly. Reverse on close. Driven by `open`, so
// the row stays mounted (a preset entering/exiting can't push siblings smoothly).
export function DateTimeFieldRow({
  value,
  onChange,
  timeZone,
  locale,
  minDate,
  maxDate,
  disabled,
  open = true,
}: DateTimeFieldRowProps) {
  const { themeVariant, accentColor } = usePickerTheme();
  const foregroundVar = useVar('--foreground');
  const textColor = foregroundVar ? `hsl(${foregroundVar})` : undefined;

  const date = parseInstant(value);

  const handle = (event: { type: string }, picked?: Date) => {
    if ((event.type === 'set' || event.type === 'dismissed') && picked) onChange(toInstantIso(picked));
  };

  const progress = useSharedValue(open ? 1 : 0);
  useEffect(() => {
    progress.value = withTiming(open ? 1 : 0, { duration: DURATION, easing: Easing.inOut(Easing.cubic) });
  }, [open, progress]);

  const containerStyle = useAnimatedStyle(() => ({ height: progress.value * ROW_HEIGHT }));
  const contentStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (progress.value - 1) * ROW_HEIGHT }],
  }));

  return (
    <Animated.View style={containerStyle} className="w-full overflow-hidden">
      <Animated.View
        style={contentStyle}
        className={cn('relative h-12 w-full flex-row items-center justify-between rounded-full pl-4', disabled && 'opacity-50')}
      >
        {/* Apple's native date + time compact controls, side by side (iOS Calendar layout) */}
        <View className="w-full flex-row items-center justify-between gap-1">
          <Text>Select</Text>
          <View className="flex-row items-center ">
            <RNDateTimePicker
              value={date ?? new Date()}
              mode="date"
              style={{ borderRadius: 9999 }}
              display="compact"
              themeVariant={themeVariant}
              accentColor={accentColor}
              textColor={textColor}
              timeZoneName={timeZone}
              locale={locale}
              minimumDate={minDate}
              maximumDate={maxDate}
              disabled={disabled}
              onChange={handle}
            />
            <RNDateTimePicker
              value={date ?? new Date()}
              mode="time"
              style={{ borderRadius: 9999 }}
              display="compact"
              themeVariant={themeVariant}
              accentColor={accentColor}
              textColor={textColor}
              timeZoneName={timeZone}
              locale={locale}
              disabled={disabled}
              onChange={handle}
            />
          </View>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

DateTimeFieldRow.displayName = 'DateTimeFieldRow';
