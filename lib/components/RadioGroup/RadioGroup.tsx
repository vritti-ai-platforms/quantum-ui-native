import * as React from 'react';
import { Pressable, View } from 'react-native';
import { FieldDescription, FieldError, FieldLabel, FieldLegend, FieldSet } from '../../reusables/field';
import { RadioGroup as RnrRadioGroup, RadioGroupItem as RnrRadioGroupItem } from '../../reusables/radio-group';
import { cn } from '../../utils/index';

export interface RadioOption {
  value: string;
  label: React.ReactNode;
  description?: React.ReactNode;
  disabled?: boolean;
}

export interface RadioGroupProps {
  options: RadioOption[];
  value?: string;
  onValueChange?: (value: string) => void;
  defaultValue?: string;
  label?: React.ReactNode;
  description?: React.ReactNode;
  error?: string;
  orientation?: 'vertical' | 'horizontal';
  variant?: 'classic' | 'card';
  disabled?: boolean;
  className?: string;
  name?: string;
}

// RN analog of the web RadioGroup — options-driven with `classic` + `card` variants and
// vertical/horizontal orientation, composed on the Field primitives + the radio-group reusable.
export function RadioGroup({
  options,
  value,
  onValueChange,
  defaultValue,
  label,
  description,
  error,
  orientation = 'vertical',
  variant = 'classic',
  disabled,
  className,
  name: _name,
}: RadioGroupProps) {
  // rnr radio-group is controlled-only — keep internal state so `defaultValue` (uncontrolled) works too.
  const [internalValue, setInternalValue] = React.useState(defaultValue);
  const isControlled = value !== undefined;
  const currentValue = isControlled ? value : internalValue;

  const handleValueChange = React.useCallback(
    (next: string) => {
      if (!isControlled) setInternalValue(next);
      onValueChange?.(next);
    },
    [isControlled, onValueChange],
  );

  // Classic: a radio + label/description row. The label has its own onPress (it's a pressable Label
  // that would otherwise swallow the tap); the radio itself selects via the group context.
  const renderClassic = (option: RadioOption) => {
    const itemDisabled = disabled || option.disabled;
    return (
      <View
        key={option.value}
        className={cn('gap-1', itemDisabled && 'opacity-50', orientation === 'horizontal' && 'w-auto')}
      >
        {/* Radio centered on the label line; description sits below, indented (size-4 + gap-2 = pl-6) to align under it. */}
        <Pressable
          className="flex-row items-center gap-2"
          onPress={() => !itemDisabled && handleValueChange(option.value)}
          disabled={itemDisabled}
        >
          <RnrRadioGroupItem value={option.value} disabled={itemDisabled} />
          <FieldLabel className="font-normal" onPress={() => !itemDisabled && handleValueChange(option.value)}>
            {option.label}
          </FieldLabel>
        </Pressable>
        {option.description ? <FieldDescription className="pl-6">{option.description}</FieldDescription> : null}
      </View>
    );
  };

  // Card: a bordered, fully-tappable surface that highlights when selected.
  const renderCard = (option: RadioOption) => {
    const itemDisabled = disabled || option.disabled;
    const selected = currentValue === option.value;
    return (
      <Pressable
        key={option.value}
        onPress={() => !itemDisabled && handleValueChange(option.value)}
        disabled={itemDisabled}
        className={cn(
          'border-border flex-row items-center gap-3 rounded-lg border p-4',
          selected && 'border-primary bg-primary/5',
          itemDisabled && 'opacity-50',
        )}
      >
        <RnrRadioGroupItem value={option.value} disabled={itemDisabled} />
        <View className="flex-1 gap-1">
          <FieldLabel onPress={() => !itemDisabled && handleValueChange(option.value)}>{option.label}</FieldLabel>
          {option.description ? <FieldDescription>{option.description}</FieldDescription> : null}
        </View>
      </Pressable>
    );
  };

  const renderItem = variant === 'card' ? renderCard : renderClassic;
  const groupClassName = variant === 'classic' && orientation === 'horizontal' ? 'flex-row flex-wrap gap-4' : 'gap-3';

  return (
    <FieldSet className={className}>
      {label ? <FieldLegend variant="label">{label}</FieldLegend> : null}
      {description && !error ? <FieldDescription>{description}</FieldDescription> : null}
      <RnrRadioGroup
        value={currentValue}
        onValueChange={handleValueChange}
        disabled={disabled}
        className={groupClassName}
      >
        {options.map(renderItem)}
      </RnrRadioGroup>
      {error ? <FieldError>{error}</FieldError> : null}
    </FieldSet>
  );
}

RadioGroup.displayName = 'RadioGroup';

// Lets <Form> auto-wire by `name`: bind the RHF value to `value` and onChange to `onValueChange`.
RadioGroup.fieldBinding = { valueProp: 'value', changeProp: 'onValueChange' };
