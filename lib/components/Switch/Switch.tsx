import type * as React from 'react';
import { Pressable, Switch as RNSwitch } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { Field, FieldDescription, FieldError, FieldLabel } from '../../reusables/field';
import { cn } from '../../utils/index';

export interface SwitchProps {
  /** Current on/off state. */
  checked: boolean;
  /** Called with the next boolean when toggled. */
  onCheckedChange?: (next: boolean) => void;
  /** Label rendered beside the switch */
  label?: React.ReactNode;
  /** Helper text rendered below the label */
  description?: React.ReactNode;
  /** Error message rendered below the label (injected by <Form>) */
  error?: string;
  disabled?: boolean;
  /** Present only so <Form> can auto-wire this field by `name` (unused internally). */
  name?: string;
  className?: string;
}

// Themed boolean toggle wrapping RN's built-in Switch (native iOS pill / Android Material), colored from the
// theme palette. Renders the bare switch when there's nothing to describe; otherwise a horizontal Field with
// the label/description/error on the left and the switch on the right (mirrors Checkbox). <Form>-wirable via
// the `fieldBinding` static below (checked ↔ RHF value, onCheckedChange ↔ RHF onChange).
export function Switch({
  checked,
  onCheckedChange,
  label,
  description,
  error,
  disabled,
  name: _name,
  className,
}: SwitchProps) {
  const { palette } = useTheme();

  const control = (
    <RNSwitch
      value={checked}
      onValueChange={onCheckedChange}
      disabled={disabled}
      trackColor={{ true: palette.primary, false: palette.border }}
      ios_backgroundColor={palette.border}
    />
  );

  if (!label && !description && !error) {
    return control;
  }

  // Tapping the label/description area toggles the switch (mirrors the web htmlFor association).
  const toggle = () => {
    if (!disabled) onCheckedChange?.(!checked);
  };

  return (
    <Field orientation="horizontal" disabled={disabled} className={cn('items-center justify-between', className)}>
      <Pressable accessibilityRole="button" onPress={toggle} disabled={disabled} className="min-w-0 flex-1 gap-1">
        {/* FieldLabel is a @rn-primitives/label Root (pressable) — it captures its own taps, so wire
            onPress to toggle directly; description/error (plain Text) bubble to the outer Pressable. */}
        {label ? (
          <FieldLabel className="font-normal" onPress={toggle}>
            {label}
          </FieldLabel>
        ) : null}
        {description ? <FieldDescription>{description}</FieldDescription> : null}
        {error ? <FieldError>{error}</FieldError> : null}
      </Pressable>
      {control}
    </Field>
  );
}

Switch.displayName = 'Switch';
// Lets <Form> auto-wire by `name`: bind the RHF value to `checked` and onChange to `onCheckedChange`.
Switch.fieldBinding = { valueProp: 'checked', changeProp: 'onCheckedChange' };
