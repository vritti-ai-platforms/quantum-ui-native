import type { ReactNode } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePlatformInfo } from '../../hooks/usePlatformInfo';
import { Button, type ButtonProps } from '../Button';

export interface FabProps {
  /** The icon to render inside the button (e.g. a <DynamicIcon … />). */
  children?: ReactNode;
  onPress?: () => void;
  accessibilityLabel?: string;
  /**
   * Trigger variant. Defaults to liquid `glass` on iOS 26+ and the solid `default` (primary) button on
   * Android and pre-iOS 26 (where glass isn't available). Pass an explicit variant to override.
   */
  variant?: ButtonProps['variant'];
  disabled?: boolean;
}

// Floating action button — a 56px glass icon Button pinned bottom-right, above the safe-area inset. Render
// it as a sibling of (and AFTER) the screen's scroll content so it overlays the bottom-right corner. It is a
// plain (non-animated) View on purpose: never wrap a glass Button in an animated opacity, or the iOS-26 glass
// effect is disabled (see the LiquidGlass alpha-ancestor gotcha). The static frame also lets the glass mount
// correctly on first render.
export function Fab({ children, onPress, accessibilityLabel, variant, disabled }: FabProps) {
  const insets = useSafeAreaInsets();
  const { os, version } = usePlatformInfo();
  // Glass only where it actually renders (iOS 26+ LiquidGlass); elsewhere use the solid primary button
  // rather than the Button's generic glass→ghost fallback, which would read as a faint, low-affordance FAB.
  const resolvedVariant = variant ?? (os === 'ios' && version >= 26 ? 'glass' : 'default');

  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', right: 16, bottom: insets.bottom + 16 }}>
      <Button
        variant={resolvedVariant}
        size="icon"
        className="h-14 w-14"
        onPress={onPress}
        accessibilityLabel={accessibilityLabel}
        disabled={disabled}
      >
        {children}
      </Button>
    </View>
  );
}
