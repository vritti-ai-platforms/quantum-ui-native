// Android press feedback: native ripple via Pressable's android_ripple prop.
// We deliberately skip the JS opacity dim — Material's tactile language is the
// ripple, not the dim — so the press feels native instead of cross-platform.
//
// Ripple color is theme-aware: in light mode the card bg is light so we use a
// dark ripple (~12% black, Material 3 state-layer opacity for light themes);
// in dark mode the card bg is dark so we flip to a light ripple
// (~16% white, Material 3 state-layer opacity for dark themes). Without this
// flip the dark-mode ripple is black-on-dark — invisible.
//
// `overflow-hidden` is required because the ripple uses `foreground: true`
// (drawn on top of content, M3-style). Android's foreground RippleDrawable
// is NOT clipped by `borderRadius` unless `clipToOutline=true` — which is
// what `overflow: 'hidden'` sets. Without it, the ripple paints a square
// halo at the rounded corners.
import type * as React from 'react';
import { Pressable, type PressableProps, useColorScheme } from 'react-native';
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
  android_ripple,
  children,
  style,
  ...props
}: CardPressableProps) {
  const colorScheme = useColorScheme();
  // Subscribe so a theme preference flip re-renders the shadow color below.
  useTheme();
  const defaultRipple =
    colorScheme === 'dark'
      ? { color: 'rgba(255,255,255,0.16)', foreground: true }
      : { color: 'rgba(0,0,0,0.12)', foreground: true };

  // When selected: 2 px primary border + primary-colored elevation shadow.
  // borderWidth/borderColor are set inline (not via className) because the
  // NativeWind v5-preview resolver is unreliable for `border-primary` on
  // Pressable subtrees — same family of bug we work around in DynamicIcon
  // (inside LiquidGlass) and the BottomSheet close icon. Inline color goes
  // straight to React Native's borderColor without NativeWind's variable
  // resolver, so the stroke renders deterministically.
  // elevation draws outside the View's own layer, so the foreground ripple's
  // `overflow: 'hidden'` clip doesn't affect it. shadowColor tints the
  // elevation shadow on Android API 28+; older Android falls back to the
  // system grey tint — still visibly elevated.
  const selectedShadow = selected
    ? {
        borderWidth: 1,
        borderColor: getTheme().primary,
        shadowColor: getTheme().primary,
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
