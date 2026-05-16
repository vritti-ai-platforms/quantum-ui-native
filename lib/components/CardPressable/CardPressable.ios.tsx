// iOS press feedback: tracked-state opacity dim (mirrors button.ios.tsx). HIG
// uses opacity changes rather than ripples or background flashes.
import * as React from 'react';
import { type GestureResponderEvent, Pressable, type PressableProps } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { TextClassContext } from '../../reusables/text';
import { getTheme } from '../../theme/colors';
import { cn } from '../../utils/cn';

export interface CardPressableProps extends Omit<PressableProps, 'children'> {
  selected?: boolean;
  children?: React.ReactNode;
}

function CardPressable({
  className,
  selected,
  disabled,
  onPressIn,
  onPressOut,
  children,
  style,
  ...props
}: CardPressableProps) {
  const [pressed, setPressed] = React.useState(false);
  // Subscribe so a theme preference flip re-renders the shadow color below.
  useTheme();

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

  // When selected: 2 px primary border + primary-colored drop shadow / glow.
  // borderWidth/borderColor are set inline (not via className) because the
  // NativeWind v5-preview resolver is unreliable for `border-primary` on
  // Pressable subtrees — same family of bug we work around in DynamicIcon
  // (inside LiquidGlass) and the BottomSheet close icon. Inline color goes
  // straight to React Native's borderColor without NativeWind's variable
  // resolver, so the stroke renders deterministically.
  const selectedShadow = selected
    ? {
        borderWidth: 1,
        borderColor: getTheme().primary,
        shadowColor: getTheme().primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      }
    : null;

  return (
    <TextClassContext.Provider value="text-card-foreground">
      <Pressable
        disabled={disabled}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        className={cn(
          'shadow-sm bg-card border border-border rounded-xl',
          selected && 'bg-primary/5',
          disabled && 'opacity-50',
          pressed && 'opacity-70',
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
