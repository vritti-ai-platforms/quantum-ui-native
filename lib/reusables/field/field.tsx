import * as React from 'react';
import { View, type ViewProps } from 'react-native';
import { cn } from '../../utils/index';
import { Label } from '../label';
import { Text } from '../text';

// RN port of the web shadcnField — a simplified View/Text + flex version (NativeWind has no
// has-[]/group-data/container-query CSS). Standardizes the label/description/error layout that
// form fields share: orientation via flex direction, `disabled` via opacity, error via render.

type FieldOrientation = 'vertical' | 'horizontal';

interface FieldProps extends ViewProps {
  orientation?: FieldOrientation;
  disabled?: boolean;
}

const Field = React.forwardRef<View, FieldProps>(({ orientation = 'vertical', disabled, className, ...props }, ref) => {
  return (
    <View
      ref={ref}
      className={cn(
        orientation === 'horizontal' ? 'flex-row items-start gap-2' : 'gap-1.5',
        disabled && 'opacity-50',
        className
      )}
      {...props}
    />
  );
});
Field.displayName = 'Field';

// Holds the label + description + error beside a control in horizontal layouts.
function FieldContent({ className, ...props }: ViewProps) {
  return <View className={cn('flex-1 gap-1', className)} {...props} />;
}

function FieldLabel({ className, ...props }: React.ComponentProps<typeof Label>) {
  return <Label className={className} {...props} />;
}

// Non-Label title (e.g. for grouped fields).
function FieldTitle({ className, ...props }: React.ComponentProps<typeof Text>) {
  return <Text className={cn('text-foreground text-sm font-medium', className)} {...props} />;
}

function FieldDescription({ className, ...props }: React.ComponentProps<typeof Text>) {
  return <Text variant="muted" className={className} {...props} />;
}

function FieldError({ className, children, ...props }: React.ComponentProps<typeof Text>) {
  if (!children) return null;
  return (
    <Text className={cn('text-destructive text-sm', className)} {...props}>
      {children}
    </Text>
  );
}

// Groups several related fields (e.g. a RadioGroup with its legend + items).
function FieldSet({ className, ...props }: ViewProps) {
  return <View className={cn('gap-3', className)} {...props} />;
}

function FieldGroup({ className, ...props }: ViewProps) {
  return <View className={cn('gap-2', className)} {...props} />;
}

interface FieldLegendProps extends Omit<React.ComponentProps<typeof Text>, 'variant'> {
  variant?: 'legend' | 'label';
}

function FieldLegend({ variant = 'label', className, ...props }: FieldLegendProps) {
  return (
    <Text className={cn('text-foreground font-medium', variant === 'legend' ? 'text-base' : 'text-sm', className)} {...props} />
  );
}

export { Field, FieldContent, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSet, FieldTitle };
