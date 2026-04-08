import * as React from 'react';
import { TextInput, View } from 'react-native';
import { Input } from '../../reusables/input';
import { Label } from '../../reusables/label';
import { Text } from '../../reusables/text';
import { cn } from '../../utils/cn';

export interface TextFieldProps extends React.ComponentProps<typeof Input> {
  label?: string;
  error?: string;
  hint?: string;
}

// Labeled text input with error and hint support — composes reusable Input + Label
function TextField({ label, error, hint, className, ...props }: TextFieldProps) {
  const id = React.useId();

  return (
    <View className="gap-1.5">
      {label && <Label nativeID={id}>{label}</Label>}
      <Input
        aria-labelledby={label ? id : undefined}
        aria-invalid={!!error}
        className={cn(error && 'border-destructive', className)}
        {...props}
      />
      {error && <Text className="text-sm text-destructive">{error}</Text>}
      {!error && hint && <Text className="text-sm text-muted-foreground">{hint}</Text>}
    </View>
  );
}

TextField.displayName = 'TextField';

export { TextField };
