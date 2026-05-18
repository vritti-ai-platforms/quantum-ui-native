import * as React from 'react';
import { type GestureResponderEvent, Pressable, type PressableProps } from 'react-native';
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
  onPressIn,
  onPressOut,
  children,
  style,
  ...props
}: CardPressableProps) {
  const [pressed, setPressed] = React.useState(false);
  const { palette } = useTheme();

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

  // Inline borderColor — NativeWind v5-preview's `border-primary` resolver is unreliable on Pressable subtrees.
  const selectedShadow = selected
    ? {
        borderWidth: 1,
        borderColor: palette.primary,
        shadowColor: palette.primary,
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
