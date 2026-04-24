import type * as React from 'react';
import { TextInput, type TextInputProps } from 'react-native';
import { cn } from '../../utils/index';

// iOS Settings-style filled text field — soft fill, no border, compact.
function Input({
  className,
  multiline = false,
  numberOfLines = multiline ? 5 : 1,
  ...props
}: TextInputProps & React.RefAttributes<TextInput>) {
  return (
    <TextInput
      className={cn(
        'border-input bg-muted text-foreground w-full rounded-[12px] border px-4 text-[17px] placeholder:text-muted-foreground/60',
        multiline ? 'min-h-28 py-3' : 'h-12 py-0',
        props.editable === false && 'opacity-50',
        className,
      )}
      multiline={multiline}
      numberOfLines={numberOfLines}
      textAlignVertical={multiline ? 'top' : props.textAlignVertical}
      {...props}
    />
  );
}

export { Input };
