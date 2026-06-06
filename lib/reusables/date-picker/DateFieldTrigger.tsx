import { useUnstableNativeVariable } from 'nativewind';
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { Text } from '../../components/Text';
import { cn } from '../../utils/index';

const useVar = useUnstableNativeVariable as unknown as (name: string) => string | undefined;

export interface DateFieldTriggerProps {
  // Pre-formatted display text; when absent the placeholder shows in muted color.
  value?: string;
  placeholder?: string;
  onPress?: () => void;
  disabled?: boolean;
  error?: boolean;
  // Trailing adornment (e.g. a calendar DynamicIcon), rendered non-interactively.
  icon?: ReactNode;
}

// A read-only, pressable field that mirrors the Input box (—input/30 fill, themed border, 48pt tall)
// but opens a picker on press instead of focusing a TextInput. Colors resolve from the MF-shared
// NativeWind variables (className colors don't apply to the bordered box reliably across the boundary).
export function DateFieldTrigger({ value, placeholder, onPress, disabled, error, icon }: DateFieldTriggerProps) {
  const inputVar = useVar('--input');
  const borderVar = useVar('--border');
  const destructiveVar = useVar('--destructive');
  const foregroundVar = useVar('--foreground');
  const mutedFgVar = useVar('--muted-foreground');

  const backgroundColor = inputVar ? `hsla(${inputVar.split(' ').join(', ')}, 0.3)` : undefined;
  const borderToken = error ? destructiveVar : borderVar;
  const borderColor = borderToken ? `hsl(${borderToken})` : undefined;
  const textColor = value
    ? foregroundVar
      ? `hsl(${foregroundVar})`
      : undefined
    : mutedFgVar
      ? `hsla(${mutedFgVar.split(' ').join(', ')}, 0.9)`
      : undefined;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={disabled ? undefined : onPress}
      className={cn('h-12 w-full flex-row items-center justify-between rounded-md px-3', disabled && 'opacity-50')}
      style={{ backgroundColor, borderColor, borderWidth: error ? 2 : 1 }}
    >
      <Text numberOfLines={1} className="flex-1 text-[16px]" style={{ color: textColor }}>
        {value ?? placeholder}
      </Text>
      {icon ? <View className="pl-2">{icon}</View> : null}
    </Pressable>
  );
}
