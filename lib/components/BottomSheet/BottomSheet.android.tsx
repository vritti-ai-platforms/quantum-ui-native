import {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
  type BottomSheetBackgroundProps,
  BottomSheetModal,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import { VariableContextProvider } from 'nativewind';
import { forwardRef, memo, useCallback, useContext, useImperativeHandle, useMemo, useRef } from 'react';
import { type ColorValue, StyleSheet, useColorScheme, View } from 'react-native';
import { THEME_TOKENS } from '../../theme/colors';
import { ThemeContext } from '../../theme/ThemeProvider';
import { type BottomSheetProps, type BottomSheetRef, mapDetents, type SheetDetent } from './BottomSheetTypes';

export type { BottomSheetProps, BottomSheetRef };
export type { SheetDetent } from './BottomSheetTypes';

// ---------- Module-level constants ----------

const BACKDROP_LIGHT = 'rgba(0,0,0,0.4)';
const BACKDROP_DARK = 'rgba(0,0,0,0.6)';
const GRABBER_LIGHT = 'rgba(0,0,0,0.18)';
const GRABBER_DARK = 'rgba(255,255,255,0.2)';

// Stable default — prevents busting the mapDetents memo when caller omits `detents`.
const DEFAULT_DETENTS: SheetDetent[] = ['auto'];

// ---------- Sub-component ----------

const Grabber = memo<{ color: ColorValue }>(({ color }) => (
  <View style={styles.handleContainer}>
    <View style={[styles.grabber, { backgroundColor: color }]} />
  </View>
));
Grabber.displayName = 'BottomSheet.Grabber';

// ---------- Main ----------

export const BottomSheet = forwardRef<BottomSheetRef, BottomSheetProps>(
  (
    {
      children,
      detents = DEFAULT_DETENTS,
      cornerRadius = 16,
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

    // The one memo worth keeping: BottomSheetModal uses snapPoints inside effects.
    const { snapPoints, dynamic } = useMemo(() => mapDetents(detents), [detents]);

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
        dimmed ? (
          <BottomSheetBackdrop
            {...props}
            disappearsOnIndex={-1}
            appearsOnIndex={0}
            style={[props.style, { backgroundColor: backdropBg }]}
          />
        ) : null,
      [dimmed, backdropBg],
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
