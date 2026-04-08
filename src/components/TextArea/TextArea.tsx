import * as React from 'react';
import { View } from 'react-native';
import { Label } from '../../reusables/label';
import { Text } from '../../reusables/text';
import { Textarea as RnrTextarea } from '../../reusables/textarea';
import { cn } from '../../utils/cn';

export interface TextAreaProps extends React.ComponentProps<typeof RnrTextarea> {
  label?: string;
  error?: string;
  hint?: string;
}

// Labeled multi-line input with error and hint support — composes reusable Textarea + Label
function TextArea({ label, error, hint, className, ...props }: TextAreaProps) {
  const id = React.useId();

  return (
    <View className="gap-1.5">
      {label && <Label nativeID={id}>{label}</Label>}
      <RnrTextarea
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

TextArea.displayName = 'TextArea';

export { TextArea };
