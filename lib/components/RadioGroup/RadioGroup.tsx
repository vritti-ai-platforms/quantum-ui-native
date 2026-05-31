import * as React from 'react';
import { Pressable } from 'react-native';
import { Field, FieldError, FieldLabel, FieldLegend } from '../../reusables/field';
import {
  RadioGroup as RnrRadioGroup,
  RadioGroupItem as RnrRadioGroupItem,
} from '../../reusables/radio-group';

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
    <Field>
      {label ? <FieldLegend variant="label" nativeID={id}>{label}</FieldLegend> : null}
      <RnrRadioGroup className={className} {...props} />
      {error ? <FieldError>{error}</FieldError> : null}
    </Field>
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
      <FieldLabel nativeID={id} onPress={() => props.onPress?.({} as any)}>
        {label}
      </FieldLabel>
    </Pressable>
  );
}

RadioGroupItem.displayName = 'RadioGroupItem';

export { RadioGroup, RadioGroupItem };
