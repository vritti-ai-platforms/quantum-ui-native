import { NavigationContext } from '@react-navigation/native';
import * as React from 'react';
import { type GestureResponderEvent, Pressable, type PressableProps } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { cn } from '../../utils/cn';
import { TextClassContext } from '../Text';

export interface CardPressableProps extends Omit<PressableProps, 'children'> {
  selected?: boolean;
  children?: React.ReactNode;
}

// Press feedback with THREE independent clear paths, so no single lost event can strand the card in
// its pressed style. History of this bug (iOS, cards whose onPress navigates): RN Pressability DELAYS
// onPressOut on quick taps (~130ms min press duration) — onPress fires first and starts the native-stack
// transition, and the delayed press-out can be lost in it. Both a plain useState+pressOut pattern and
// NativeWind's `active:` variant (which also clears ONLY on onPressOut) got stuck that way. Clears:
//  1. onPressOut — the normal path;
//  2. onPress — the moment the action fires (before navigation), the feedback has served its purpose;
//  3. the navigation 'focus' listener — heals any residue whenever the screen regains focus.
function CardPressable({
  className,
  selected,
  disabled,
  onPress,
  onPressIn,
  onPressOut,
  children,
  style,
  ...props
}: CardPressableProps) {
  const [pressed, setPressed] = React.useState(false);
  const { palette } = useTheme();
  // Plain useContext — undefined (no throw) when the card renders outside a navigator.
  const navigation = React.useContext(NavigationContext);

  React.useEffect(() => navigation?.addListener('focus', () => setPressed(false)), [navigation]);

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

  const handlePress = React.useCallback(
    (e: GestureResponderEvent) => {
      setPressed(false);
      onPress?.(e);
    },
    [onPress],
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

  // Pressed opacity as an INLINE style (not a className swap — the interop's class churn is unreliable
  // on Pressable subtrees, and a style-function `state.pressed` never fires under the className interop).
  const pressedStyle = pressed && !disabled ? { opacity: 0.7 } : null;

  return (
    <TextClassContext.Provider value="text-card-foreground">
      <Pressable
        disabled={disabled}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        className={cn(
          'shadow-sm bg-card border border-border rounded-xl',
          selected && 'bg-primary/5 bg-card',
          disabled && 'opacity-50',
          className,
        )}
        style={
          typeof style === 'function'
            ? (state) => [{ borderCurve: 'continuous' }, selectedShadow, pressedStyle, style(state)]
            : [{ borderCurve: 'continuous' }, selectedShadow, pressedStyle, style]
        }
        {...props}
      >
        {children}
      </Pressable>
    </TextClassContext.Provider>
  );
}

CardPressable.displayName = 'CardPressable';

export { CardPressable };
