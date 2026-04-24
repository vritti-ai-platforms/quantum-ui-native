import type * as React from 'react';
import { TextInput, type TextInputProps } from 'react-native';
import { cn } from '../../utils/index';

// Material 3 outlined text field — visible border, smaller radius, 56dp tall.
// Explicit paddingHorizontal via style because NativeWind px-* on TextInput is
// unreliable on Android (the native view can ignore className-derived padding).
function Input({
  className,
  multiline = false,
  numberOfLines = multiline ? 5 : 1,
  style,
  ...props
}: TextInputProps & React.RefAttributes<TextInput>) {
  return (
    <TextInput
      className={cn(
        'border-input bg-background text-foreground w-full rounded-[6px] border text-[15px] placeholder:text-muted-foreground/60',
        multiline ? 'min-h-28' : 'h-14',
        props.editable === false && 'opacity-50',
        className,
      )}
      multiline={multiline}
      numberOfLines={numberOfLines}
      textAlignVertical={multiline ? 'top' : props.textAlignVertical}
      style={[{ paddingHorizontal: 16, paddingVertical: multiline ? 12 : 0 }, style]}
      {...props}
    />
  );
}

export { Input };
