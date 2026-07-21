import type { ReactNode } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePermission } from '../../context/PermissionGateContext';
import { usePlatformInfo } from '../../hooks/usePlatformInfo';
import { Button, type ButtonProps } from '../Button';
import { DynamicIcon, type PlatformIconDescriptor } from '../DynamicIcon';
import { lockVariant, presentLockedAction } from '../Upsell';

const PLUS_ICON: PlatformIconDescriptor = { sfSymbol: 'plus', materialSymbol: 'add' };
// Outlined on both platforms (SF `lock` is the outline symbol; the bundled Material font is outline-style).
const LOCK_ICON: PlatformIconDescriptor = { sfSymbol: 'lock', materialSymbol: 'lock' };

export interface FabProps {
  /** Trigger content. Defaults to the plus icon — pass a custom node only for non-create FABs. */
  anchor?: ReactNode;
  onPress?: () => void;
  accessibilityLabel?: string;
  /**
   * Trigger variant. Defaults to liquid `glass` on iOS 26+ and the solid `default` (primary) button on
   * Android and pre-iOS 26 (where glass isn't available). Pass an explicit variant to override.
   */
  variant?: ButtonProps['variant'];
  disabled?: boolean;
  /**
   * Permission code gating the FAB's action. Role-denied (!granted) → the FAB isn't rendered. Plan-locked →
   * an amber lock icon replaces the anchor and pressing presents the upsell sheet. Omitted → ungated (fail open).
   */
  permission?: string;
}

// Floating action button — a 56px glass icon Button pinned bottom-right, above the safe-area inset. Render
// it as a sibling of (and AFTER) the screen's scroll content so it overlays the bottom-right corner. It is a
// plain (non-animated) View on purpose: never wrap a glass Button in an animated opacity, or the iOS-26 glass
// effect is disabled (see the LiquidGlass alpha-ancestor gotcha). The static frame also lets the glass mount
// correctly on first render.
export function Fab({ anchor, onPress, accessibilityLabel, variant, disabled, permission }: FabProps) {
  const insets = useSafeAreaInsets();
  const { os, version } = usePlatformInfo();
  const gate = usePermission(permission);
  // Role axis: no permission → no FAB at all (fail-open when there's no gate/code).
  if (!gate.granted) return null;
  const locked = gate.granted && gate.locked;
  const siteLocked = locked && lockVariant(gate.reason) === 'site';
  // Glass only where it actually renders (iOS 26+ LiquidGlass); elsewhere use the solid primary button
  // rather than the Button's generic glass→ghost fallback, which would read as a faint, low-affordance FAB.
  const resolvedVariant = variant ?? (os === 'ios' && version >= 26 ? 'glass' : 'default');

  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', right: 16, bottom: 16 }}>
      <Button
        variant={resolvedVariant}
        size="icon"
        className="h-16 w-16 "
        onPress={() => {
          if (locked) {
            presentLockedAction(gate, 'sheet', accessibilityLabel);
            return;
          }
          onPress?.();
        }}
        accessibilityLabel={accessibilityLabel}
        accessibilityState={locked ? { disabled: true } : undefined}
        disabled={disabled}
      >
        {locked ? (
          <DynamicIcon icon={LOCK_ICON} size={24} className={siteLocked ? 'text-destructive' : 'text-warning'} />
        ) : (
          (anchor ?? <DynamicIcon icon={PLUS_ICON} size={24} />)
        )}
      </Button>
    </View>
  );
}
