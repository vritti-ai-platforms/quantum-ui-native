import { isLiquidGlassSupported, LiquidGlassView } from '@callstack/liquid-glass';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { type GestureResponderEvent, type LayoutChangeEvent, Pressable, StyleSheet, View } from 'react-native';
import { cn } from '../../utils/index';
import { TextClassContext } from '../text';

// Glass-mode CVA — border rim + layout only. No bg-*: LiquidGlassView is the
// sole color layer. Border color sourced from the variant's glass-bg token
// (same hue/lightness as the tint) with alpha controlling visual hierarchy.
const buttonVariants = cva(
  'group relative shrink-0 flex-row items-center justify-center gap-2 overflow-hidden rounded-[18px] shadow-sm shadow-black/10',
  {
    variants: {
      variant: {
        default: 'bg-glass-bg-default/22',
        destructive: 'bg-glass-bg-destructive/26',
        secondary: 'bg-glass-bg-secondary/14',
        outline: 'bg-glass-bg-neutral/6',
        ghost: 'bg-glass-bg-muted/4',
        link: 'bg-glass-bg-neutral/3 shadow-none',
      },
      size: {
        default: 'h-12 px-5 py-2',
        sm: 'h-10 rounded-[16px] px-4 py-2',
        lg: 'h-14 rounded-[20px] px-7 py-2',
        icon: 'h-12 w-12',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

// Used when LiquidGlass is not available — solid fills matching the Android button.
const solidButtonVariants = cva(
  'group shrink-0 flex-row items-center justify-center gap-2 rounded-[14px] shadow-sm shadow-black/5',
  {
    variants: {
      variant: {
        default: 'bg-primary',
        destructive: 'bg-destructive',
        outline: 'border-border bg-background border',
        secondary: 'bg-secondary',
        ghost: 'bg-transparent',
        link: 'bg-transparent shadow-none',
      },
      size: {
        default: 'h-12 px-5 py-2',
        sm: 'h-10 px-4 py-2',
        lg: 'h-14 px-7 py-2',
        icon: 'h-12 w-12',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

const buttonTextVariants = cva('text-foreground text-sm font-medium', {
  variants: {
    variant: {
      default: 'text-primary-foreground',
      destructive: 'text-destructive-foreground',
      outline: 'text-outline-foreground',
      secondary: 'text-secondary-foreground',
      ghost: 'text-ghost-foreground',
      link: 'text-primary underline',
    },
    size: {
      default: '',
      sm: '',
      lg: '',
      icon: '',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
  },
});

type ButtonProps = Omit<React.ComponentProps<typeof Pressable>, 'children'> &
  React.RefAttributes<typeof Pressable> &
  VariantProps<typeof buttonVariants> & {
    children?: React.ReactNode;
    liquid?: boolean;
  };

function Button({
  className,
  variant = 'default',
  size = 'default',
  liquid = true,
  children,
  onLayout,
  onPressIn,
  onPressOut,
  ...props
}: ButtonProps) {
  const resolvedVariant = variant ?? 'default';
  const radius = size === 'sm' ? 16 : size === 'lg' ? 20 : 18;
  const [hasLaidOut, setHasLaidOut] = React.useState(false);
  const [pressed, setPressed] = React.useState(false);
  const useLiquid = liquid && isLiquidGlassSupported;

  const handleLayout = React.useCallback(
    (event: LayoutChangeEvent) => {
      if (!hasLaidOut) {
        setHasLaidOut(true);
      }
      onLayout?.(event);
    },
    [hasLaidOut, onLayout],
  );

  const handlePressIn = React.useCallback(
    (e: GestureResponderEvent) => {
      setPressed(true);
      onPressIn?.(e);
    },
    [onPressIn],
  );
  const handlePressOut = React.useCallback(
    (e: GestureResponderEvent) => {
      setPressed(false);
      onPressOut?.(e);
    },
    [onPressOut],
  );

  if (!useLiquid) {
    return (
      <TextClassContext.Provider value={buttonTextVariants({ variant: resolvedVariant, size })}>
        <Pressable
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          className={cn(
            props.disabled && 'opacity-50',
            pressed && 'opacity-70',
            solidButtonVariants({ variant: resolvedVariant, size }),
            className,
          )}
          role="button"
          onLayout={onLayout}
          {...props}
        >
          {children}
        </Pressable>
      </TextClassContext.Provider>
    );
  }

  return (
    <TextClassContext.Provider value={buttonTextVariants({ variant: resolvedVariant, size })}>
      <Pressable
        className={cn(props.disabled && 'opacity-50', buttonVariants({ variant: resolvedVariant, size }), className)}
        role="button"
        onLayout={handleLayout}
        {...props}
      >
        {hasLaidOut && (
          <LiquidGlassView
            style={[StyleSheet.absoluteFillObject, { borderRadius: radius }]}
            effect={resolvedVariant === 'ghost' || resolvedVariant === 'link' ? 'clear' : 'regular'}
            interactive={false}
          />
        )}
        <View className="z-10 flex-row items-center justify-center gap-2">{children}</View>
      </Pressable>
    </TextClassContext.Provider>
  );
}

export { Button, buttonTextVariants, buttonVariants };
export type { ButtonProps };
