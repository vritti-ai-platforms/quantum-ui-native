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

const IOS_SHEET_BG =
  Platform.OS === 'ios' ? DynamicColorIOS({ light: THEME.light.secondary, dark: THEME.dark.secondary }) : null;
const IOS_FULL_SHEET_BG =
  Platform.OS === 'ios' ? DynamicColorIOS({ light: THEME.light.secondary, dark: THEME.dark.background }) : null;
const IOS_BACKDROP = Platform.OS === 'ios' ? DynamicColorIOS({ light: BACKDROP_LIGHT, dark: BACKDROP_DARK }) : null;
const IOS_GRABBER = Platform.OS === 'ios' ? DynamicColorIOS({ light: GRABBER_LIGHT, dark: GRABBER_DARK }) : null;
const DEFAULT_DETENTS: SheetDetent[] = ['auto'];

const Grabber = memo<{ color: ColorValue }>(({ color }) => (
  <View style={styles.handleContainer}>
    <View style={[styles.grabber, { backgroundColor: color }]} />
  </View>
));
Grabber.displayName = 'BottomSheet.Grabber';

const SheetProgressBridge = () => {
  const { animatedIndex, animatedPosition } = useBottomSheet();
  const scaler = useBottomSheetBackgroundScaler();
  useAnimatedReaction(
    () => ({ idx: animatedIndex.value, pos: animatedPosition.value }),
    (current, prev) => {
      if (!scaler) return;
      scaler.progress.value = interpolate(current.idx, [-1, 0], [0, 1], Extrapolation.CLAMP);
      // Freeze sheet top during drag-down so the floating close button stays put.
      if (!prev || current.idx >= prev.idx) {
        scaler.sheetTop.value = current.pos;
      }
    },
  );
  return null;
};

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
      title,
      subtitle,
      onClose,
      headerLeft,
      headerRight,
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

    const scheme: 'light' | 'dark' = themeCtx?.colorScheme ?? (systemColorScheme === 'dark' ? 'dark' : 'light');
    const isDark = scheme === 'dark';
    const themeValues = THEME_TOKENS[scheme].variables;
    const useGlass = variant === 'glass' && version >= 26 && LiquidGlass != null;

    const sheetBg: ColorValue = IOS_SHEET_BG ?? THEME[scheme].secondary;
    const backdropColor: ColorValue = IOS_BACKDROP ?? (isDark ? BACKDROP_DARK : BACKDROP_LIGHT);
    const grabberColor: ColorValue = IOS_GRABBER ?? (isDark ? GRABBER_DARK : GRABBER_LIGHT);

    const { snapPoints, dynamic } = useMemo(() => mapDetents(detents), [detents]);

    // Scaler renders its own dim overlay synchronized with the drag — suppress the internal backdrop.
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
        const bg = useSolidBodyForFullHeader ? ((IOS_FULL_SHEET_BG as unknown as string) ?? sheetBg) : sheetBg;
        return <View style={[style, radius, { backgroundColor: bg }]} />;
      },
      [useGlass, cornerRadius, sheetBg, useSolidBodyForFullHeader],
    );

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
