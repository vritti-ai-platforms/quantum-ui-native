import * as React from 'react';
import { View } from 'react-native';
import { Checkbox as RnrCheckbox } from '../../reusables/checkbox';
import { Label } from '../../reusables/label';
import { Text } from '../../reusables/text';

export interface CheckboxProps extends React.ComponentProps<typeof RnrCheckbox> {
  /** Optional marker used by <Form> to auto-wire this field to react-hook-form. */
  name?: string;
  label?: string;
  description?: string;
  error?: string;
}

// Checkbox with label, description, and error support — wraps the reusable Checkbox
function Checkbox({ label, description, error, ...props }: CheckboxProps) {
  const id = React.useId();

  if (!label && !description && !error) {
    return <RnrCheckbox {...props} />;
  }

  return (
    <View className="flex-row gap-3" style={{ opacity: props.disabled ? 0.5 : 1 }}>
      <RnrCheckbox nativeID={id} {...props} />
      <View className="flex-1 gap-1">
        {label && (
          <Label
            nativeID={id}
            className="font-normal"
            onPress={() => props.onCheckedChange?.(!props.checked)}
          >
            {label}
          </Label>
        )}
        {description && <Text className="text-sm text-muted-foreground">{description}</Text>}
        {error && <Text className="text-sm text-destructive">{error}</Text>}
      </View>
    </View>
  );
}

Checkbox.displayName = 'Checkbox';

export { Checkbox };
