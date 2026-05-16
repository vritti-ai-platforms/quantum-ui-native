import {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
  type BottomSheetBackgroundProps,
  BottomSheetModal,
  BottomSheetView,
  useBottomSheet,
} from '@gorhom/bottom-sheet';
import { VariableContextProvider } from 'nativewind';
import { forwardRef, memo, useCallback, useContext, useImperativeHandle, useMemo, useRef } from 'react';
import { type ColorValue, StyleSheet, useColorScheme, View } from 'react-native';
import { Extrapolation, interpolate, useAnimatedReaction } from 'react-native-reanimated';
import { THEME, THEME_TOKENS } from '../../theme/colors';
import { ThemeContext } from '../../theme/ThemeProvider';
import { useBottomSheetBackgroundScaler } from './BottomSheetBackgroundScaler';
import { type BottomSheetProps, type BottomSheetRef, mapDetents, type SheetDetent } from './BottomSheetTypes';

export type { BottomSheetProps, BottomSheetRef };
export type { SheetDetent } from './BottomSheetTypes';

// ---------- Module-level constants ----------

const withOpacity = (hsl: string, alpha: number): string => hsl.replace(')', ` / ${alpha})`);

const BACKDROP_LIGHT = withOpacity(THEME.light.foreground, 0.4);
const BACKDROP_DARK = withOpacity(THEME.dark.background, 0.6);
const GRABBER_LIGHT = withOpacity(THEME.light.foreground, 0.22);
const GRABBER_DARK = withOpacity(THEME.dark.foreground, 0.35);

// Stable default — prevents busting the mapDetents memo when caller omits `detents`.
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
      variant: _variant, // Android: flat minimal, variant ignored
      onDismiss,
      onPresent,
      onChange,
    },
    ref,
  ) => {
    const modalRef = useRef<BottomSheetModal>(null);
    const systemColorScheme = useColorScheme();
    const themeCtx = useContext(ThemeContext);

    // Plain locals — trivial computations, no memo needed.
    const scheme = themeCtx?.colorScheme ?? (systemColorScheme === 'dark' ? 'dark' : 'light');
    const isDark = scheme === 'dark';
    const sheetBg = THEME_TOKENS[scheme].palette.secondary;
    const themeValues = THEME_TOKENS[scheme].variables; // already a stable ref
    const backdropBg = isDark ? BACKDROP_DARK : BACKDROP_LIGHT;
    const grabberColor = isDark ? GRABBER_DARK : GRABBER_LIGHT;

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

    // Render callbacks must be stable — BottomSheetModal passes these as
    // *Component props and reconciles internal pieces on identity change.
    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) =>
        effectiveDimmed ? (
          <BottomSheetBackdrop
            {...props}
            disappearsOnIndex={-1}
            appearsOnIndex={0}
            style={[props.style, { backgroundColor: backdropBg }]}
          />
        ) : null,
      [effectiveDimmed, backdropBg],
    );

    const renderBackground = useCallback(
      ({ style }: BottomSheetBackgroundProps) => (
        <View
          style={[
            style,
            {
              backgroundColor: sheetBg,
              borderTopLeftRadius: cornerRadius,
              borderTopRightRadius: cornerRadius,
            },
          ]}
        />
      ),
      [sheetBg, cornerRadius],
    );

    const renderHandle = useCallback(
      () => (grabber ? <Grabber color={grabberColor} /> : null),
      [grabber, grabberColor],
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
        <BottomSheetView>
          <SheetProgressBridge />
          {themeCtx ? (
            <ThemeContext.Provider value={themeCtx}>
              <VariableContextProvider value={themeValues}>
                <View key={scheme} style={styles.fill} className={isDark ? 'dark' : ''}>
                  {children}
                </View>
              </VariableContextProvider>
            </ThemeContext.Provider>
          ) : (
            children
          )}
        </BottomSheetView>
      </BottomSheetModal>
    );
  },
);

BottomSheet.displayName = 'BottomSheet';

const styles = StyleSheet.create({
  handleContainer: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  grabber: {
    width: 32,
    height: 4,
    borderRadius: 2,
  },
  fill: {
    flex: 1,
  },
});
