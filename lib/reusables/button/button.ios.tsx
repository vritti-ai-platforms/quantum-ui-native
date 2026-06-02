import { LiquidGlassView } from '@callstack/liquid-glass';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { type GestureResponderEvent, type LayoutChangeEvent, Pressable, StyleSheet, View } from 'react-native';
import { usePlatformInfo } from '../../hooks/usePlatformInfo';
import { cn } from '../../utils/index';
import { TextClassContext } from '../../components/Text';

const buttonVariants = cva(
  'group relative shrink-0 flex-row items-center justify-center gap-2 overflow-hidden rounded-[18px] shadow-sm shadow-black/10',
  {
    variants: {
      variant: {
        default: 'bg-primary',
        destructive: 'bg-destructive',
        secondary: 'bg-secondary',
        warning: 'bg-warning',
        success: 'bg-success',
        outline: 'bg-transparent border border-primary',
        ghost: 'bg-transparent',
        glass: 'bg-transparent',
        link: 'bg-transparent shadow-none',
      },
      size: {
        default: 'h-12 px-5 py-2',
        sm: 'h-10 rounded-[16px] px-4 py-2',
        lg: 'h-14 rounded-[20px] px-7 py-2',
        icon: 'h-12 w-12 rounded-full',
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
      secondary: 'text-secondary-foreground',
      warning: 'text-warning-foreground',
      success: 'text-success-foreground',
      outline: 'text-primary',
      ghost: 'text-foreground',
      glass: 'text-primary',
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
  };

function Button({
  className,
  variant = 'default',
  size = 'default',
  children,
  onLayout,
  onPressIn,
  onPressOut,
  ...props
}: ButtonProps) {
  const { version } = usePlatformInfo();
  // glass variant requires iOS 26 LiquidGlass — fall back to default on older devices
  const resolvedVariant = variant === 'glass' && version < 26 ? 'default' : (variant ?? 'default');
  // icon is rounded-full — the glass borderRadius must match (clamps to a circle) so the
  // specular rim follows the circular edge instead of being clipped to a rounded-square.
  const radius = size === 'icon' ? 9999 : size === 'sm' ? 16 : size === 'lg' ? 20 : 18;
  const [hasLaidOut, setHasLaidOut] = React.useState(false);
  const [pressed, setPressed] = React.useState(false);

  const handleLayout = React.useCallback(
    (event: LayoutChangeEvent) => {
      if (!hasLaidOut) setHasLaidOut(true);
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

  return (
    <TextClassContext.Provider value={buttonTextVariants({ variant: resolvedVariant, size })}>
      <Pressable
        className={cn(
          props.disabled && 'opacity-50',
          pressed && 'opacity-70',
          buttonVariants({ variant: resolvedVariant, size }),
          className,
        )}
        role="button"
        onLayout={handleLayout}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        {...props}
      >
        {hasLaidOut && (
          <LiquidGlassView
            style={[StyleSheet.absoluteFillObject, { borderRadius: radius }]}
            effect={resolvedVariant === 'glass' ? 'regular' : 'none'}
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
