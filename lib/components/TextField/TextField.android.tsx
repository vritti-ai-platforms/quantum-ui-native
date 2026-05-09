import * as React from 'react';
import { View } from 'react-native';
import { Input } from '../../reusables/input';
import { Label } from '../../reusables/label';
import { Text } from '../../reusables/text';

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

// Material-flavored TextField — more generous vertical spacing, bolder label above the
// outlined input, error thickens the border and tints it destructive.
function TextField({
  label,
  description,
  hint,
  error,
  startAdornment,
  endAdornment,
  className,
  style,
  ...props
}: TextFieldProps) {
  const id = React.useId();
  const resolvedDescription = description ?? hint;

  return (
    <View className="gap-2">
      {label && (
        <Label nativeID={id} className="text-sm font-medium text-foreground">
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
          className={className}
          style={[style, startAdornment ? { paddingLeft: 44 } : null, endAdornment ? { paddingRight: 44 } : null]}
          {...props}
        />
        {endAdornment && <View className="absolute right-3 top-0 bottom-0 z-10 justify-center">{endAdornment}</View>}
      </View>
      {error && <Text className="text-xs text-destructive">{error}</Text>}
      {!error &&
        resolvedDescription &&
        (typeof resolvedDescription === 'string' ? (
          <Text className="text-xs text-muted-foreground">{resolvedDescription}</Text>
        ) : (
          <>{resolvedDescription}</>
        ))}
    </View>
  );
}

TextField.displayName = 'TextField';

export { TextField };
