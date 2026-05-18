import type * as React from 'react';
import { useState } from 'react';
import { TextInput, type TextInputProps } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { cn } from '../../utils/index';

// Material 3 outlined text field — visible border, smaller radius, 56dp tall.
// Explicit paddingHorizontal, backgroundColor, and borderColor via style because
// NativeWind className-derived values on TextInput are unreliable on Android.
// Error and focus states are also driven via inline style for the same reason.
function Input({
  className,
  multiline = false,
  numberOfLines = multiline ? 5 : 1,
  style,
  onFocus,
  onBlur,
  'aria-invalid': ariaInvalid,
  ...props
}: TextInputProps & { 'aria-invalid'?: boolean | 'true' | 'false' } & React.RefAttributes<TextInput>) {
  const [focused, setFocused] = useState(false);
  const { palette: theme } = useTheme();

  const isError = ariaInvalid === true || ariaInvalid === 'true';

  const borderColor = isError ? theme.destructive : focused ? theme.primary : theme.border;
  const borderWidth = isError ? 2 : focused ? 1.5 : 1;

  return (
    <TextInput
      className={cn(
        'text-foreground w-full rounded-[6px] border text-[15px] placeholder:text-muted-foreground/60',
        multiline ? 'min-h-28' : 'h-14',
        props.editable === false && 'opacity-50',
        className,
      )}
      multiline={multiline}
      numberOfLines={numberOfLines}
      textAlignVertical={multiline ? 'top' : props.textAlignVertical}
      style={[
        {
          paddingHorizontal: 16,
          paddingVertical: multiline ? 12 : 0,
          backgroundColor: theme.secondary,
          borderColor,
          borderWidth,
        },
        style,
      ]}
      onFocus={(e) => {
        setFocused(true);
        onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocused(false);
        onBlur?.(e);
      }}
      {...props}
    />
  );
}

export { Input };
