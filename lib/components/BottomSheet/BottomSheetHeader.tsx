import { useBottomSheet } from '@gorhom/bottom-sheet';
import { memo, useCallback } from 'react';
import {
  DynamicColorIOS,
  type LayoutChangeEvent,
  Platform,
  type StyleProp,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import Animated, { interpolate, useAnimatedStyle } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePlatformInfo } from '../../hooks/usePlatformInfo';
import { useTheme } from '../../hooks/useTheme';
import { getTheme, THEME } from '../../theme/colors';
import { Button } from '../Button';
import { DynamicIcon } from '../DynamicIcon';
import { Text } from '../Typography';
import { useBottomSheetFullContext } from './BottomSheetFullContext';

// Header content height (above the safe-area inset). 56 matches the standard
// Material 3 top-app-bar / iOS navigation bar height.
const HEADER_CONTENT_HEIGHT = 56;
// Drag distance over which the left-slot close icon morphs into the grabber.
// `animatedPosition` is 0 when the sheet's top edge is at the screen top —
// any positive value means the user is dragging the sheet down.
const MORPH_DISTANCE = 50;

// iOS 26 native full-sheet uses chevron-down (the "close" affordance) rather
// than xmark. Material's equivalent is keyboard-arrow-down.
const CLOSE_ICON = { sfSymbol: 'chevron.down', materialIcon: 'keyboard-arrow-down' } as const;
// Drag-state indicator that appears in place of the close icon while the
// sheet is being dragged down. iOS uses chevron.compact.down — the native
// sheet-grabber glyph (thin wide downward arc). Material's "drag-handle" is
// the standard drag-affordance icon (two short horizontal lines), which is
// visually distinct from the chevron-down close icon so the cross-fade morph
// reads correctly on Android too.
const GRABBER_ICON = { sfSymbol: 'chevron.compact.down', materialIcon: 'remove' } as const;

// iOS pre-26 header backdrop. Uses `theme.background` on both schemes — gives
// the pre-iOS header a clean, primary surface (whiter than the soft `secondary`
// body in light mode; matches the body in dark mode). iOS 26+ uses LiquidGlass
// for the header (the `useGlass` branch below) — this constant is only the
// fallback for pre-26. Android has its own per-scheme backdrop further down.
const IOS_HEADER_BG =
  Platform.OS === 'ios' ? DynamicColorIOS({ light: THEME.light.background, dark: THEME.dark.background }) : null;

// Optional LiquidGlass — only used on iOS 26+. Same try/require pattern as
// BottomSheet so the package degrades gracefully if the host app doesn't have
// @callstack/liquid-glass installed.
type LiquidGlassComponent = React.ComponentType<{
  style?: StyleProp<ViewStyle>;
  effect?: 'clear' | 'regular' | 'none';
  children?: React.ReactNode;
}>;

const LiquidGlass: LiquidGlassComponent | null =
  Platform.OS === 'ios'
    ? (() => {
        try {
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          return require('@callstack/liquid-glass').LiquidGlassView ?? null;
        } catch {
          return null;
        }
      })()
    : null;

// Internal — not exported from the package barrel. Driven by props on
// <BottomSheet>; consumers shouldn't import this directly.
export interface BottomSheetHeaderProps {
  /** Centered title. Single line, ellipsised. */
  title?: string;
  /** Optional second line under the title. */
  subtitle?: string;
  /** Renders the chevron-down close button in the left slot. The same slot
   *  morphs into a drag indicator as the sheet is dragged down. */
  onClose?: () => void;
  /** Override the left slot completely (renders as-is). */
  leftAction?: React.ReactNode;
  /** Override the right slot completely (renders as-is). */
  rightAction?: React.ReactNode;
  /** Render a fully custom header body in place of the title row. */
  children?: React.ReactNode;
}

function BottomSheetHeaderImpl({
  title,
  subtitle,
  onClose,
  leftAction,
  rightAction,
  children,
}: BottomSheetHeaderProps) {
  const insets = useSafeAreaInsets();
  const { version } = usePlatformInfo();
  // Subscribe to ThemeContext so the Android backdrop and grabber tint recolor
  // on preference flips. iOS DynamicColorIOS handles its own updates at UIKit.
  useTheme();
  const useGlass = Platform.OS === 'ios' && version >= 26 && LiquidGlass != null;
  const ctx = useBottomSheetFullContext();

  // gorhom's animatedPosition: SharedValue<number>, the sheet's top-edge px
  // from the screen top. 0 when fully open, larger when partially closed.
  // Destructured immediately so the worklets below close over only the
  // SharedValue (Worklets-3 cannot serialize the wider useBottomSheet return).
  const { animatedPosition } = useBottomSheet();

  const handleLayout = useCallback(
    (e: LayoutChangeEvent) => {
      ctx?.setHeaderHeight(e.nativeEvent.layout.height);
    },
    [ctx],
  );

  // Cross-fade: close icon visible at animatedPosition === 0, grabber at +50.
  // The interpolation tracks the drag naturally (UI thread, no JS roundtrip).
  const closeIconStyle = useAnimatedStyle(() => ({
    opacity: interpolate(animatedPosition.value, [0, MORPH_DISTANCE], [1, 0], 'clamp'),
  }));
  const grabberStyle = useAnimatedStyle(() => ({
    opacity: interpolate(animatedPosition.value, [0, MORPH_DISTANCE], [0, 1], 'clamp'),
  }));

  // Re-derived on every render — cheap palette lookup; useTheme above triggers
  // re-render on preference flips so this reflects the current scheme.
  const headerColors = getTheme();
  // Android header bg: always `theme.background` — mirrors the iOS pre-26
  // header behavior. In light mode this is whiter than the soft `secondary`
  // body underneath (clean two-tone); in dark mode header and body are both
  // background and read as one surface.
  const androidHeaderBg = headerColors.background;

  // Left slot: explicit leftAction wins; otherwise the close↔grabber morph
  // if onClose is set; otherwise empty.
  const leftSlot =
    leftAction ??
    (onClose ? (
      <View style={styles.morphStack}>
        <Animated.View style={[StyleSheet.absoluteFillObject, styles.morphCenter, closeIconStyle]}>
          <CloseButton onPress={onClose} />
        </Animated.View>
        <Animated.View style={[StyleSheet.absoluteFillObject, styles.morphCenter, grabberStyle]} pointerEvents="none">
          {/* Drag-state indicator: chevron.compact.down on iOS (native sheet
              grabber glyph), drag-handle on Android (Material drag-affordance).
              Single DynamicIcon — platform dispatch handled internally. */}
          <DynamicIcon icon={GRABBER_ICON} size={20} className="text-foreground" />
        </Animated.View>
      </View>
    ) : null);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]} onLayout={handleLayout} pointerEvents="box-none">
      {/* Always-visible backdrop layer. */}
      {useGlass && LiquidGlass ? (
        <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
          <LiquidGlass style={StyleSheet.absoluteFillObject} effect="regular" />
        </View>
      ) : Platform.OS === 'ios' ? (
        <View
          style={[StyleSheet.absoluteFillObject, { backgroundColor: IOS_HEADER_BG as unknown as string }]}
          pointerEvents="none"
        />
      ) : (
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: androidHeaderBg }]} pointerEvents="none" />
      )}

      {/* Content row (always at opacity 1). */}
      <View style={[styles.row, { height: HEADER_CONTENT_HEIGHT }]}>
        <View style={styles.slot}>{leftSlot}</View>
        <View style={styles.titleWrap}>
          {children ?? (
            <>
              <Text className="text-base font-semibold text-foreground" numberOfLines={1}>
                {title ?? ''}
              </Text>
              {subtitle ? (
                <Text className="text-xs text-muted-foreground" numberOfLines={1}>
                  {subtitle}
                </Text>
              ) : null}
            </>
          )}
        </View>
        <View style={styles.slot}>{rightAction ?? null}</View>
      </View>
    </View>
  );
}

BottomSheetHeaderImpl.displayName = 'BottomSheetHeader';

// Memo so theme-flip re-renders of the parent <BottomSheet> don't cascade —
// the header is owned by its own `useTheme()` subscription inside the impl.
export const BottomSheetHeader = memo(BottomSheetHeaderImpl);

// `variant="ghost"` keeps the press-feedback + 44px hit target but renders no
// background fill — just the chevron-down on the bare header surface, matching
// the design ask of "no circle behind the close icon".
const CloseButton = memo(function CloseButton({ onPress }: { onPress: () => void }) {
  return (
    <Button variant="ghost" size="icon" onPress={onPress} accessibilityLabel="Close" hitSlop={8}>
      <DynamicIcon icon={CLOSE_ICON} size={20} className="text-foreground" />
    </Button>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    // sit above the BottomSheetScrollView's padded content
    zIndex: 10,
    // Android: gorhom's BottomSheetScrollView internally uses elevation, and
    // Android composes layers by elevation first — a sibling with any
    // elevation outranks one with zero elevation regardless of zIndex or tree
    // order. Without elevation here the header container ends up behind the
    // scrollview and isn't visible. iOS ignores `elevation` entirely.
    elevation: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  slot: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  morphStack: {
    width: 44,
    height: 44,
    position: 'relative',
  },
  morphCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
