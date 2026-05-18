import * as React from 'react';
import { Pressable, View } from 'react-native';
import { Label } from '../../reusables/label';
import {
  RadioGroup as RnrRadioGroup,
  RadioGroupItem as RnrRadioGroupItem,
} from '../../reusables/radio-group';
import { Text } from '../../reusables/text';

export interface RadioGroupProps extends React.ComponentProps<typeof RnrRadioGroup> {
  name?: string;
  label?: string;
  error?: string;
}

function RadioGroup({ label, error, className, ...props }: RadioGroupProps) {
  const id = React.useId();

  if (!label && !error) {
    return <RnrRadioGroup className={className} {...props} />;
  }

  return (
    <View className="gap-1.5">
      {label && <Label nativeID={id}>{label}</Label>}
      <RnrRadioGroup className={className} {...props} />
      {error && <Text className="text-sm text-destructive">{error}</Text>}
    </View>
  );
}

RadioGroup.displayName = 'RadioGroup';

export interface RadioGroupItemProps extends React.ComponentProps<typeof RnrRadioGroupItem> {
  label?: string;
}

function RadioGroupItem({ label, ...props }: RadioGroupItemProps) {
  const id = React.useId();

  if (!label) {
    return <RnrRadioGroupItem {...props} />;
  }

  return (
    <Pressable
      className="flex-row items-center gap-3"
      onPress={() => props.onPress?.({} as any)}
      accessibilityRole="radio"
    >
      <RnrRadioGroupItem nativeID={id} {...props} />
      <Label nativeID={id} onPress={() => props.onPress?.({} as any)}>
        {label}
      </Label>
    </Pressable>
  );
}

RadioGroupItem.displayName = 'RadioGroupItem';

export { RadioGroup, RadioGroupItem };
