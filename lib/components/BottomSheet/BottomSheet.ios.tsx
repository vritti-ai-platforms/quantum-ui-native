import {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
  type BottomSheetBackgroundProps,
  BottomSheetModal,
  BottomSheetView,
  useBottomSheet,
} from '@gorhom/bottom-sheet';
import { usePlatformInfo } from '@vritti/quantum-ui-native/hooks';
import { VariableContextProvider } from 'nativewind';
import { forwardRef, memo, useCallback, useContext, useImperativeHandle, useMemo, useRef } from 'react';
import {
  type ColorValue,
  DynamicColorIOS,
  Platform,
  type StyleProp,
  StyleSheet,
  useColorScheme,
  View,
  type ViewStyle,
} from 'react-native';
import { Extrapolation, interpolate, useAnimatedReaction } from 'react-native-reanimated';
import { THEME, THEME_TOKENS } from '../../theme/colors';
import { ThemeContext } from '../../theme/ThemeProvider';
import { useBottomSheetBackgroundScaler } from './BottomSheetBackgroundScaler';
import { BottomSheetFullProvider } from './BottomSheetFullContext';
import { BottomSheetHeader } from './BottomSheetHeader';
import { BottomSheetScrollView } from './BottomSheetScrollView';
import { type BottomSheetProps, type BottomSheetRef, mapDetents, type SheetDetent } from './BottomSheetTypes';

export type { BottomSheetProps, BottomSheetRef };
export type { SheetDetent } from './BottomSheetTypes';

// ---------- Module-level: computed once at load ----------

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

const withOpacity = (hsl: string, alpha: number): string => hsl.replace(')', ` / ${alpha})`);

const BACKDROP_LIGHT = withOpacity(THEME.light.foreground, 0.4);
const BACKDROP_DARK = withOpacity(THEME.dark.background, 0.6);
const GRABBER_LIGHT = withOpacity(THEME.light.foreground, 0.22);
const GRABBER_DARK = withOpacity(THEME.dark.foreground, 0.35);

// DynamicColorIOS is iOS-only; on Android we pick per scheme at render time.
const IOS_SHEET_BG =
  Platform.OS === 'ios' ? DynamicColorIOS({ light: THEME.light.secondary, dark: THEME.dark.secondary }) : null;
// Full-sheet body color — light wants the soft `secondary`, dark wants the
// deepest `background`. Matches BottomSheetHeader's per-scheme backdrop so
// the header and body are flush (no visible color step).
const IOS_FULL_SHEET_BG =
  Platform.OS === 'ios' ? DynamicColorIOS({ light: THEME.light.secondary, dark: THEME.dark.background }) : null;
const IOS_BACKDROP = Platform.OS === 'ios' ? DynamicColorIOS({ light: BACKDROP_LIGHT, dark: BACKDROP_DARK }) : null;
const IOS_GRABBER = Platform.OS === 'ios' ? DynamicColorIOS({ light: GRABBER_LIGHT, dark: GRABBER_DARK }) : null;
// Stable default so callers that don't pass `detents` don't bust mapDetents memo.
const DEFAULT_DETENTS: SheetDetent[] = ['auto'];

// ---------- Sub-component ----------

const Grabber = memo<{ color: ColorValue }>(({ color }) => (
  <View style={styles.handleContainer}>
    <View style={[styles.grabber, { backgroundColor: color }]} />
  </View>
));
Grabber.displayName = 'BottomSheet.Grabber';

// ---------- Progress bridge ----------
// Bridges the modal's internal `animatedIndex` (output from useBottomSheet)
// into the context-provided progress SharedValue read by the scaled screen.

const SheetProgressBridge = () => {
  const { animatedIndex, animatedPosition } = useBottomSheet();
  const scaler = useBottomSheetBackgroundScaler();
  useAnimatedReaction(
    () => ({ idx: animatedIndex.value, pos: animatedPosition.value }),
    (current, prev) => {
      if (!scaler) return;
      scaler.progress.value = interpolate(current.idx, [-1, 0], [0, 1], Extrapolation.CLAMP);
      // Capture sheet top only while opening (idx increasing). Freeze during
      // drag-down and close so the floating button stays put.
      if (!prev || current.idx >= prev.idx) {
        scaler.sheetTop.value = current.pos;
      }
    },
  );
  return null;
};

// ---------- Main ----------

export const BottomSheet = forwardRef<BottomSheetRef, BottomSheetProps>(
  (
    {
      children,
      detents = DEFAULT_DETENTS,
      cornerRadius = 28,
      grabber = true,
      dismissible = true,
      draggable = true,
      dimmed = true,
      variant = 'glass',
      onDismiss,
      onPresent,
      onChange,
      // Built-in header props
      title,
      subtitle,
      onClose,
      headerLeft,
      headerRight,
      // Body container
      scrollable,
    },
    ref,
  ) => {
    const hasHeader =
      title != null || subtitle != null || onClose != null || headerLeft != null || headerRight != null;
    const isScrollable = scrollable === true || detents.includes('full');
    const modalRef = useRef<BottomSheetModal>(null);
    const { version } = usePlatformInfo();
    const systemColorScheme = useColorScheme();
    const themeCtx = useContext(ThemeContext);

    // Plain locals — these are cheap and stable by construction.
    const scheme: 'light' | 'dark' = themeCtx?.colorScheme ?? (systemColorScheme === 'dark' ? 'dark' : 'light');
    const isDark = scheme === 'dark';
    const themeValues = THEME_TOKENS[scheme].variables; // already a stable ref
    const useGlass = variant === 'glass' && version >= 26 && LiquidGlass != null;

    // Stable by construction: iOS branch returns the same module-level object,
    // Android branch returns a string that's identical across renders for the same scheme.
    const sheetBg: ColorValue = IOS_SHEET_BG ?? THEME[scheme].secondary;
    const backdropColor: ColorValue = IOS_BACKDROP ?? (isDark ? BACKDROP_DARK : BACKDROP_LIGHT);
    const grabberColor: ColorValue = IOS_GRABBER ?? (isDark ? GRABBER_DARK : GRABBER_LIGHT);

    // The one memo worth keeping: snapPoints is consumed inside BottomSheetModal's
    // effects, where identity matters.
    const { snapPoints, dynamic } = useMemo(() => mapDetents(detents), [detents]);

    // When a background scaler is mounted above, suppress the internal backdrop —
    // the scaler renders its own dim overlay synchronized with the drag.
    const scaler = useBottomSheetBackgroundScaler();
    const effectiveDimmed = dimmed && !scaler;

    useImperativeHandle(
      ref,
      () => ({
        present: (index = 0) => {
          modalRef.current?.present();
          if (index > 0) modalRef.current?.snapToIndex(index);
        },
        dismiss: () => modalRef.current?.dismiss(),
      }),
      [],
    );

    // Render callbacks must be stable — BottomSheetModal uses them as component
    // props and remounts internal pieces on identity change.
    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) =>
        effectiveDimmed ? (
          <BottomSheetBackdrop
            {...props}
            disappearsOnIndex={-1}
            appearsOnIndex={0}
            style={[props.style, { backgroundColor: backdropColor }]}
          />
        ) : null,
      [effectiveDimmed, backdropColor],
    );

    // Full-sheet with a built-in header gets a SOLID body background — the
    // header overlay above it owns the glass material, so the body needs to
    // be opaque (matches iOS 26 native full-sheet visual). For non-full sheets
    // and the no-header path, keep the existing glass-or-solid behavior.
    const useSolidBodyForFullHeader = hasHeader && detents.includes('full');

    const renderBackground = useCallback(
      ({ style }: BottomSheetBackgroundProps) => {
        const radius: ViewStyle = {
          borderTopLeftRadius: cornerRadius,
          borderTopRightRadius: cornerRadius,
        };
        if (useGlass && LiquidGlass && !useSolidBodyForFullHeader) {
          return <LiquidGlass style={[style, radius]} effect="regular" />;
        }
        // Full+header: per-scheme (light = secondary, dark = background) so it
        // matches BottomSheetHeader's backdrop and they read as a single surface.
        // Non-full / no-header: keep the existing `sheetBg` (always secondary).
        const bg = useSolidBodyForFullHeader ? ((IOS_FULL_SHEET_BG as unknown as string) ?? sheetBg) : sheetBg;
        return <View style={[style, radius, { backgroundColor: bg }]} />;
      },
      [useGlass, cornerRadius, sheetBg, useSolidBodyForFullHeader],
    );

    // When the header is shown on a full-detent sheet, the header itself owns
    // the close/grabber affordance; suppress the modal's standard top grabber
    // so we don't double up.
    const renderHandle = useCallback(
      () => (grabber && !useSolidBodyForFullHeader ? <Grabber color={grabberColor} /> : null),
      [grabber, grabberColor, useSolidBodyForFullHeader],
    );

    const handleAnimate = useCallback(
      (fromIndex: number, toIndex: number) => {
        if (toIndex >= 0 && fromIndex < 0) onPresent?.();
      },
      [onPresent],
    );

    return (
      <BottomSheetModal
        ref={modalRef}
        snapPoints={snapPoints}
        enableDynamicSizing={dynamic}
        enablePanDownToClose={dismissible}
        enableHandlePanningGesture={draggable}
        handleComponent={renderHandle}
        backdropComponent={renderBackdrop}
        backgroundComponent={renderBackground}
        onDismiss={onDismiss}
        onAnimate={handleAnimate}
        onChange={onChange}
      >
        <BottomSheetFullProvider>
          {isScrollable ? (
            <BottomSheetScrollView>
              {/* Skip the bridge for full+header sheets: they own their own
                  close affordance, so the BackgroundScaler's floating close
                  button (driven by progress) is redundant. Leaving progress
                  at 0 also disables the unnecessary background-scale animation. */}
              {!useSolidBodyForFullHeader && <SheetProgressBridge />}
              {themeCtx ? (
                <ThemeContext.Provider value={themeCtx}>
                  <VariableContextProvider value={themeValues}>
                    <View key={scheme} className={isDark ? 'dark' : ''}>
                      {children}
                    </View>
                  </VariableContextProvider>
                </ThemeContext.Provider>
              ) : (
                children
              )}
            </BottomSheetScrollView>
          ) : (
            <BottomSheetView>
              {/* Skip the bridge for full+header sheets: they own their own
                  close affordance, so the BackgroundScaler's floating close
                  button (driven by progress) is redundant. Leaving progress
                  at 0 also disables the unnecessary background-scale animation. */}
              {!useSolidBodyForFullHeader && <SheetProgressBridge />}
              {themeCtx ? (
                <ThemeContext.Provider value={themeCtx}>
                  <VariableContextProvider value={themeValues}>
                    <View key={scheme} className={isDark ? 'dark' : ''}>
                      {children}
                    </View>
                  </VariableContextProvider>
                </ThemeContext.Provider>
              ) : (
                children
              )}
            </BottomSheetView>
          )}
          {hasHeader ? (
            <BottomSheetHeader
              title={title}
              subtitle={subtitle}
              onClose={onClose}
              leftAction={headerLeft}
              rightAction={headerRight}
            />
          ) : null}
        </BottomSheetFullProvider>
      </BottomSheetModal>
    );
  },
);

BottomSheet.displayName = 'BottomSheet';

const styles = StyleSheet.create({
  handleContainer: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 6,
  },
  grabber: {
    width: 36,
    height: 5,
    borderRadius: 3,
  },
});
