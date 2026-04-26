// Default fallback for non-iOS / non-Android platforms.
// Platform-specific press feedback lives in CardPressable.ios.tsx and
// CardPressable.android.tsx.
import * as React from 'react';
import { type GestureResponderEvent, Pressable, type PressableProps } from 'react-native';
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
  ...props
}: CardPressableProps) {
  const [pressed, setPressed] = React.useState(false);

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
    <TextClassContext.Provider value="text-card-foreground">
      <Pressable
        disabled={disabled}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        className={cn(
          selected && 'bg-primary/5 border-primary border-[1.5px]',
          disabled && 'opacity-50',
          pressed && 'opacity-70',
          className,
        )}
        {...props}
      >
        {children}
      </Pressable>
    </TextClassContext.Provider>
  );
}

CardPressable.displayName = 'CardPressable';

export { CardPressable };
