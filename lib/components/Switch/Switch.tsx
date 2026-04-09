import * as React from 'react';
import { View } from 'react-native';
import { Label } from '../../reusables/label';
import { Switch as RnrSwitch } from '../../reusables/switch';
import { Text } from '../../reusables/text';

export interface SwitchProps extends React.ComponentProps<typeof RnrSwitch> {
  label?: string;
  error?: string;
}

// Switch with optional label and error support — wraps the reusable Switch
function Switch({ label, error, ...props }: SwitchProps) {
  const id = React.useId();

  if (!label && !error) {
    return <RnrSwitch {...props} />;
  }

  return (
    <View className="gap-1.5">
      <View className="flex-row items-center gap-3">
        <RnrSwitch nativeID={id} {...props} />
        {label && (
          <Label nativeID={id} onPress={() => props.onCheckedChange?.(!props.checked)}>
            {label}
          </Label>
        )}
      </View>
      {error && <Text className="text-sm text-destructive">{error}</Text>}
    </View>
  );
}

Switch.displayName = 'Switch';

export { Switch };
