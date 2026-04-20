import { LiquidGlassView, isLiquidGlassSupported } from '@callstack/liquid-glass';
import { useTheme } from '../../hooks';
import { darkColors, lightColors } from '../../theme';
import { TextClassContext } from '../text';
import { cn } from '../../utils/index';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { Pressable, StyleSheet, View, type ColorValue, type LayoutChangeEvent, type ViewStyle } from 'react-native';

const buttonVariants = cva(
  'group relative shrink-0 flex-row items-center justify-center gap-2 overflow-hidden rounded-[18px] border shadow-sm shadow-black/10',
  {
    variants: {
      variant: {
        default: 'border-primary/20 ',
        destructive: 'border-destructive/25',
        outline: 'border-white/25',
        secondary: 'border-secondary/10',
        ghost: 'border-white/12',
        link: 'border-white/6 shadow-none',
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
  }
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
  };

function getGlassTint(
  variant: NonNullable<VariantProps<typeof buttonVariants>['variant']>,
  isDark: boolean
): ColorValue {
  const palette = isDark ? darkColors : lightColors;

  switch (variant) {
    case 'destructive':
      return withAlpha(palette['--destructive'], isDark ? 0.18 : 0.1);
    case 'secondary':
      return withAlpha(palette['--secondary'], isDark ? 0.18 : 0.1);
    case 'ghost':
      return withAlpha(palette['--muted'], isDark ? 0.12 : 0.06);
    case 'link':
      return withAlpha(palette['--background'], isDark ? 0.08 : 0.04);
    case 'outline':
      return withAlpha(palette['--background'], isDark ? 0.14 : 0.08);
    case 'default':
    default:
      return withAlpha(palette['--primary'], isDark ? 0.18 : 0.1);
  }
}

function getFallbackBackground(
  variant: NonNullable<VariantProps<typeof buttonVariants>['variant']>,
  isDark: boolean
): ViewStyle {
  const palette = isDark ? darkColors : lightColors;

  switch (variant) {
    case 'destructive':
      return { backgroundColor: withAlpha(palette['--destructive'], isDark ? 0.28 : 0.16) };
    case 'secondary':
      return { backgroundColor: withAlpha(palette['--secondary'], isDark ? 0.24 : 0.16) };
    case 'ghost':
      return { backgroundColor: withAlpha(palette['--muted'], isDark ? 0.18 : 0.12) };
    case 'link':
      return { backgroundColor: withAlpha(palette['--background'], isDark ? 0.12 : 0.08) };
    case 'outline':
      return { backgroundColor: withAlpha(palette['--background'], isDark ? 0.2 : 0.12) };
    case 'default':
    default:
      return { backgroundColor: withAlpha(palette['--primary'], isDark ? 0.24 : 0.14) };
  }
}

function withAlpha(hslToken: string, alpha: number): ColorValue {
  const [h, s, l] = hslToken.split(' ');
  return `hsla(${h}, ${s}, ${l}, ${alpha})`;
}

function getBackdropBackground(
  variant: NonNullable<VariantProps<typeof buttonVariants>['variant']>,
  isDark: boolean
): ViewStyle {
  const palette = isDark ? darkColors : lightColors;

  switch (variant) {
    case 'destructive':
      return { backgroundColor: withAlpha(palette['--destructive'], isDark ? 0.32 : 0.16) };
    case 'secondary':
      return { backgroundColor: withAlpha(palette['--secondary'], isDark ? 0.28 : 0.22) };
    case 'ghost':
      return { backgroundColor: withAlpha(palette['--muted'], isDark ? 0.22 : 0.18) };
    case 'link':
      return { backgroundColor: withAlpha(palette['--background'], isDark ? 0.12 : 0.08) };
    case 'outline':
      return { backgroundColor: withAlpha(palette['--background'], isDark ? 0.24 : 0.14) };
    case 'default':
    default:
      return { backgroundColor: withAlpha(palette['--primary'], isDark ? 0.28 : 0.16) };
  }
}

function Button({ className, variant = 'default', size = 'default', children, ...props }: ButtonProps) {
  const resolvedVariant = variant ?? 'default';
  const radius = size === 'sm' ? 16 : size === 'lg' ? 20 : 18;
  const [hasLaidOut, setHasLaidOut] = React.useState(false);
  const { isDark } = useTheme();

  const handleLayout = React.useCallback(
    (event: LayoutChangeEvent) => {
      if (!hasLaidOut) {
        setHasLaidOut(true);
      }
      props.onLayout?.(event);
    },
    [hasLaidOut, props]
  );

  return (
    <TextClassContext.Provider value={buttonTextVariants({ variant: resolvedVariant, size })}>
      <Pressable
        className={cn(
          props.disabled && 'opacity-50',
          buttonVariants({ variant: resolvedVariant, size }),
          className
        )}
        role="button"
        onLayout={handleLayout}
        {...props}>
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFillObject,
            { borderRadius: radius },
            getBackdropBackground(resolvedVariant, isDark),
          ]}
        />
        {hasLaidOut && (
          <LiquidGlassView
            style={[
            StyleSheet.absoluteFillObject,
            { borderRadius: radius },
            !isLiquidGlassSupported && getFallbackBackground(resolvedVariant, isDark),
          ]}
          effect={resolvedVariant === 'ghost' || resolvedVariant === 'link' ? 'clear' : 'regular'}
          interactive={false}
          tintColor={getGlassTint(resolvedVariant, isDark)}
        />
        )}
        <View className="z-10 flex-row items-center justify-center gap-2">{children}</View>
      </Pressable>
    </TextClassContext.Provider>
  );
}

export { Button, buttonTextVariants, buttonVariants };
export type { ButtonProps };
