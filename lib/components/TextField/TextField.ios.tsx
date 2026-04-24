import * as React from 'react';
import { View } from 'react-native';
import { Input } from '../../reusables/input';
import { Label } from '../../reusables/label';
import { Text } from '../../reusables/text';
import { cn } from '../../utils/cn';

export interface TextFieldProps extends React.ComponentProps<typeof Input> {
  /** Optional marker used by <Form> to auto-wire this field to react-hook-form. */
  name?: string;
  label?: string;
  description?: React.ReactNode;
  hint?: React.ReactNode;
  error?: string;
  startAdornment?: React.ReactNode;
  endAdornment?: React.ReactNode;
}

// iOS-flavored TextField — tight spacing, compact label, error adds a 1px destructive
// border (base iOS style has no border since Input uses a Settings-style fill).
function TextField({ label, description, hint, error, startAdornment, endAdornment, className, ...props }: TextFieldProps) {
  const id = React.useId();
  const resolvedDescription = description ?? hint;

  return (
    <View className="gap-1.5">
      {label && (
        <Label nativeID={id} className="text-[13px] font-medium text-muted-foreground ml-1">
          {label}
        </Label>
      )}
      <View className="relative">
        {startAdornment && (
          <View className="absolute left-3 top-0 bottom-0 z-10 justify-center" pointerEvents="none">
            {startAdornment}
          </View>
        )}
        <Input
          aria-labelledby={label ? id : undefined}
          aria-invalid={!!error}
          className={cn(
            error && 'border-destructive',
            startAdornment && 'pl-11',
            endAdornment && 'pr-11',
            className,
          )}
          {...props}
        />
        {endAdornment && (
          <View className="absolute right-3 top-0 bottom-0 z-10 justify-center">
            {endAdornment}
          </View>
        )}
      </View>
      {error && <Text className="text-[13px] text-destructive ml-1">{error}</Text>}
      {!error && resolvedDescription && (
        typeof resolvedDescription === 'string'
          ? <Text className="text-[13px] text-muted-foreground ml-1">{resolvedDescription}</Text>
          : <>{resolvedDescription}</>
      )}
    </View>
  );
}

TextField.displayName = 'TextField';

export { TextField };
