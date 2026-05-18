import type * as React from 'react';
import { Pressable, type PressableProps, useColorScheme } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { TextClassContext } from '../../reusables/text';
import { cn } from '../../utils/cn';

export interface CardPressableProps extends Omit<PressableProps, 'children'> {
  selected?: boolean;
  children?: React.ReactNode;
}

function CardPressable({
  className,
  selected,
  disabled,
  android_ripple,
  children,
  style,
  ...props
}: CardPressableProps) {
  const colorScheme = useColorScheme();
  const { palette } = useTheme();
  // Flip ripple by scheme — dark-on-dark would be invisible.
  const defaultRipple =
    colorScheme === 'dark'
      ? { color: 'rgba(255,255,255,0.16)', foreground: true }
      : { color: 'rgba(0,0,0,0.12)', foreground: true };

  // Inline borderColor — NativeWind v5-preview's `border-primary` resolver is unreliable on Pressable subtrees.
  const selectedShadow = selected
    ? {
        borderWidth: 1,
        borderColor: palette.primary,
        shadowColor: palette.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
      }
    : null;

  return (
    <TextClassContext.Provider value="text-card-foreground">
      <Pressable
        disabled={disabled}
        android_ripple={android_ripple ?? defaultRipple}
        // overflow-hidden sets clipToOutline so the foreground ripple is clipped by borderRadius.
        className={cn(
          'shadow-sm bg-card border border-border rounded-xl overflow-hidden',
          selected && 'bg-secondary/40',
          disabled && 'opacity-50',
          className,
        )}
        style={typeof style === 'function' ? (state) => [selectedShadow, style(state)] : [selectedShadow, style]}
        {...props}
      >
        {children}
      </Pressable>
    </TextClassContext.Provider>
  );
}

CardPressable.displayName = 'CardPressable';

export { CardPressable };
