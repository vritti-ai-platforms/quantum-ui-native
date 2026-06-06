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
import { forwardRef, memo, useCallback, useContext, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import {
  type ColorValue,
  DynamicColorIOS,
  Platform,
  type StyleProp,
  StyleSheet,
  useColorScheme,
  useWindowDimensions,
  View,
  type ViewStyle,
} from 'react-native';
import { Extrapolation, interpolate, useAnimatedReaction, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { THEME, THEME_TOKENS } from '../../theme/colors';
import { ThemeContext } from '../../theme/ThemeProvider';
import { useBottomSheetBackgroundScaler } from './BottomSheetBackgroundScaler';
import { BottomSheetDragArea } from './BottomSheetDragArea';
import { BottomSheetFullProvider } from './BottomSheetFullContext';
import { BottomSheetHeader } from './BottomSheetHeader';
import { BottomSheetHeaderBar } from './BottomSheetHeaderBar';
import { BottomSheetScrollView } from './BottomSheetScrollView';
import {
  type BottomSheetProps,
  type BottomSheetRef,
  mapDetents,
  resolveDetentHeight,
  type SheetDetent,
} from './BottomSheetTypes';

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
  Platform.OS === 'ios' ? DynamicColorIOS({ light: THEME.light.background, dark: THEME.dark.background }) : null;
const IOS_FULL_SHEET_BG =
  Platform.OS === 'ios' ? DynamicColorIOS({ light: THEME.light.background, dark: THEME.dark.background }) : null;
const IOS_BACKDROP = Platform.OS === 'ios' ? DynamicColorIOS({ light: BACKDROP_LIGHT, dark: BACKDROP_DARK }) : null;
const IOS_GRABBER = Platform.OS === 'ios' ? DynamicColorIOS({ light: GRABBER_LIGHT, dark: GRABBER_DARK }) : null;
const DEFAULT_DETENTS: SheetDetent[] = ['auto'];
// Matches the iPhone display corner radius so the sheet's top corners read as continuous with the
// device. RN can't read UIScreen's exact displayCornerRadius without private native API, so this is a
// tunable constant set for current (Dynamic Island) iPhones — adjust if it looks off on your device.
const IOS_SCREEN_CORNER_RADIUS = 40;

const Grabber = memo<{ color: ColorValue }>(({ color }) => (
  <View style={styles.handleContainer}>
    <View style={[styles.grabber, { backgroundColor: color }]} />
  </View>
));
Grabber.displayName = 'BottomSheet.Grabber';

const SheetProgressBridge = ({ showCloseButton }: { showCloseButton: boolean }) => {
  const { animatedIndex, animatedPosition } = useBottomSheet();
  const scaler = useBottomSheetBackgroundScaler();

  // showCloseButton is a prop, not animated — set it once (keeps the per-frame reaction lean).
  useEffect(() => {
    if (scaler) scaler.showCloseButton.value = showCloseButton;
  }, [scaler, showCloseButton]);

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

  // Settle the scaler back to rest whenever this sheet's content unmounts. The shared values live in
  // the provider, so withTiming survives the unmount — this guarantees the background un-scales even on
  // interrupted dismiss / navigate-away / app-backgrounded-mid-animation, which would otherwise strand
  // progress > 0 (background stuck scaled + the full-screen gesture overlay freezing all touches).
  // scb (showCloseButton): hide first so the floating ✕ can't flash during the 200ms progress fade —
  // critical on iOS 26 where the LiquidGlass close button's first-frame init becomes visible. The next
  // presenting sheet's mount effect re-writes scb to its own intent (true for normal sheets, false for
  // inline sheets like Select that own their ✕); even if this cleanup races after that mount write, scb
  // stays false, which is the correct presenting state for inline and the next sheet's effect re-asserts.
  useEffect(() => {
    if (!scaler) return;
    const { progress, sheetTop, showCloseButton: scb } = scaler;
    return () => {
      scb.value = false;
      progress.value = withTiming(0, { duration: 200 });
      sheetTop.value = 0;
    };
  }, [scaler]);

  return null;
};

export const BottomSheet = forwardRef<BottomSheetRef, BottomSheetProps>(
  (
    {
      children,
      detents = DEFAULT_DETENTS,
      cornerRadius = IOS_SCREEN_CORNER_RADIUS,
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
      backgroundColor,
      showCloseButton = true,
    },
    ref,
  ) => {
    const inlineHeader = variant === 'inline';
    const hasHeader = title != null || subtitle != null || onClose != null || headerLeft != null || headerRight != null;
    const isScrollable = scrollable === true || detents.includes('full');
    // Inline (list) sheets render a FlashList inside a non-scroll BottomSheetView; gorhom's content-pan
    // gesture competes with the list scroll and can hijack a downward scroll into drag-to-dismiss. Disable
    // it for that case so scrolling never closes the sheet — the grabber, header X, and backdrop still do.
    // (isScrollable sheets use BottomSheetScrollView, which coordinates pan vs scroll itself.)
    const enableContentPan = !(inlineHeader && !isScrollable);
    const modalRef = useRef<BottomSheetModal>(null);
    const { version } = usePlatformInfo();
    const systemColorScheme = useColorScheme();
    const themeCtx = useContext(ThemeContext);
    const insets = useSafeAreaInsets();
    const { height: winH } = useWindowDimensions();

    const scheme: 'light' | 'dark' = themeCtx?.colorScheme ?? (systemColorScheme === 'dark' ? 'dark' : 'light');
    const isDark = scheme === 'dark';
    const themeValues = THEME_TOKENS[scheme].variables;
    const useGlass = variant === 'glass' && version >= 26 && LiquidGlass != null;

    const sheetBg: ColorValue = IOS_SHEET_BG ?? THEME[scheme].background;
    const backdropColor: ColorValue = IOS_BACKDROP ?? (isDark ? BACKDROP_DARK : BACKDROP_LIGHT);
    const grabberColor: ColorValue = IOS_GRABBER ?? (isDark ? GRABBER_DARK : GRABBER_LIGHT);

    const { snapPoints, dynamic } = useMemo(() => mapDetents(detents), [detents]);

    // Scaler renders its own dim overlay synchronized with the drag — suppress the internal backdrop.
    const scaler = useBottomSheetBackgroundScaler();
    const effectiveDimmed = dimmed && !scaler;

    // inlineHeader variant: hide the floating close (the header has its own) + size the content box to
    // the caller-passed detent so the children (e.g. a FlashList) are bounded inside BottomSheetView.
    const resolvedShowCloseButton = inlineHeader ? false : showCloseButton;
    // gorhom sizes a percentage detent against (container − topInset), and the grabber takes height
    // above the content — trim both so the content box doesn't overflow the sheet and clip the footer.
    const inlineBase = inlineHeader ? resolveDetentHeight(detents, winH - insets.top) : undefined;
    const inlineBoxHeight = inlineBase != null ? inlineBase - 16 : undefined;
    const inlineClose = useCallback(() => {
      if (onClose) onClose();
      else modalRef.current?.dismiss();
    }, [onClose]);

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
    const isFull = detents.includes('full');

    const renderBackground = useCallback(
      ({ style }: BottomSheetBackgroundProps) => {
        const radius: ViewStyle = {
          borderTopLeftRadius: cornerRadius,
          borderTopRightRadius: cornerRadius,
          // iOS squircle (superellipse) instead of RN's default circular arc — matches the system
          // corner curve (UIKit cornerCurve = .continuous), noticeably smoother at this radius.
          borderCurve: 'continuous',
        };
        // Glass only when there's no explicit color override, it's supported, and not a full+header sheet.
        if (backgroundColor == null && useGlass && LiquidGlass && !useSolidBodyForFullHeader) {
          return <LiquidGlass style={[style, radius]} effect="regular" />;
        }
        const bg =
          backgroundColor ??
          (useSolidBodyForFullHeader ? ((IOS_FULL_SHEET_BG as unknown as string) ?? sheetBg) : sheetBg);
        // Dark mode (non-full): a thin border delineates the near-black sheet from the near-black screen.
        return (
          <View
            style={[
              style,
              radius,
              { backgroundColor: bg },
              isDark && !isFull && { borderWidth: 1, borderColor: THEME.dark.border },
            ]}
          />
        );
      },
      [backgroundColor, isDark, isFull, useGlass, cornerRadius, sheetBg, useSolidBodyForFullHeader],
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

    // inlineHeader: built-in title+right-close header above the children, in a detent-sized box.
    const body = inlineHeader ? (
      <View className="px-4" style={{ height: inlineBoxHeight, paddingBottom: insets.bottom }}>
        <BottomSheetDragArea>
          <BottomSheetHeaderBar title={title} onClose={inlineClose} />
        </BottomSheetDragArea>
        <View style={{ flex: 1 }}>{children}</View>
      </View>
    ) : (
      children
    );

    return (
      <BottomSheetModal
        ref={modalRef}
        topInset={isFull ? 0 : insets.top}
        snapPoints={snapPoints}
        enableDynamicSizing={dynamic}
        enablePanDownToClose={dismissible}
        enableHandlePanningGesture={draggable}
        enableContentPanningGesture={enableContentPan}
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
              {!useSolidBodyForFullHeader && <SheetProgressBridge showCloseButton={resolvedShowCloseButton} />}
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
              {!useSolidBodyForFullHeader && <SheetProgressBridge showCloseButton={resolvedShowCloseButton} />}
              {themeCtx ? (
                <ThemeContext.Provider value={themeCtx}>
                  <VariableContextProvider value={themeValues}>
                    <View key={scheme} className={isDark ? 'dark' : ''}>
                      {body}
                    </View>
                  </VariableContextProvider>
                </ThemeContext.Provider>
              ) : (
                body
              )}
            </BottomSheetView>
          )}
          {hasHeader && !inlineHeader ? (
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
    paddingTop: 6,
    paddingBottom: 4,
  },
  grabber: {
    width: 36,
    height: 5,
    borderRadius: 3,
  },
});
