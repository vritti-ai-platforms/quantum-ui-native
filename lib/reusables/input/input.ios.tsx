import type * as React from 'react';
import { useState } from 'react';
import { TextInput, type TextInputProps, useColorScheme } from 'react-native';
import { getTheme } from '../../theme/colors';
import { cn } from '../../utils/index';

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
  const colorScheme = useColorScheme();
  const theme = getTheme(colorScheme === 'dark' ? 'dark' : 'light');

  const isError = ariaInvalid === true || ariaInvalid === 'true';

  const borderColor = isError ? theme.destructive : focused ? theme.primary : theme.border;
  const borderWidth = isError ? 2 : focused ? 1.5 : 1;

  return (
    <TextInput
      className={cn(
        'text-foreground w-full rounded-[12px] border text-[17px] placeholder:text-muted-foreground/60',
        multiline ? 'min-h-28' : 'h-12',
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
