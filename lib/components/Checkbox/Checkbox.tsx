import type * as React from 'react';
import { Pressable } from 'react-native';
import { Checkbox as BaseCheckbox } from '../../reusables/checkbox';
import { Field, FieldDescription, FieldError, FieldLabel } from '../../reusables/field';
import { cn } from '../../utils/index';

export interface CheckboxProps extends React.ComponentProps<typeof BaseCheckbox> {
  /** Label rendered beside the checkbox */
  label?: React.ReactNode;
  /** Helper text rendered below the label */
  description?: React.ReactNode;
  /** Error message rendered below the label */
  error?: string;
}

// Checkbox with optional label / description / error — RN analog of the web
// Field-integrated Checkbox. Renders the bare checkbox when there's nothing to describe.
export function Checkbox({
  label,
  description,
  error,
  className,
  disabled,
  checked,
  onCheckedChange,
  ...props
}: CheckboxProps) {
  if (!label && !description && !error) {
    return (
      <BaseCheckbox
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        className={className}
        {...props}
      />
    );
  }

  // Tapping the label/description area toggles the checkbox (mirrors the web htmlFor association)
  const toggle = () => {
    if (!disabled) onCheckedChange?.(!checked);
  };

  return (
    <Field orientation="horizontal" disabled={disabled} className={cn('items-center', className)}>
      <BaseCheckbox checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} {...props} />
      <Pressable accessibilityRole="button" onPress={toggle} disabled={disabled} className="flex-1 gap-1">
        {label ? <FieldLabel className="font-normal">{label}</FieldLabel> : null}
        {description ? <FieldDescription>{description}</FieldDescription> : null}
        {error ? <FieldError>{error}</FieldError> : null}
      </Pressable>
    </Field>
  );
}

Checkbox.displayName = 'Checkbox';
