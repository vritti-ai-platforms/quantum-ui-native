import {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
  type BottomSheetBackgroundProps,
  BottomSheetModal,
  BottomSheetView,
  useBottomSheet,
} from '@gorhom/bottom-sheet';
import { VariableContextProvider } from 'nativewind';
import { forwardRef, memo, useCallback, useContext, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import { type ColorValue, StyleSheet, useColorScheme, useWindowDimensions, View } from 'react-native';
import { Extrapolation, interpolate, useAnimatedReaction, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { THEME, THEME_TOKENS } from '../../theme/colors';
import { ThemeContext } from '../../theme/ThemeProvider';
import { useBottomSheetBackgroundScaler } from './BottomSheetBackgroundScaler';
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

const withOpacity = (hsl: string, alpha: number): string => hsl.replace(')', ` / ${alpha})`);

const BACKDROP_LIGHT = withOpacity(THEME.light.foreground, 0.4);
const BACKDROP_DARK = withOpacity(THEME.dark.background, 0.6);
const GRABBER_LIGHT = withOpacity(THEME.light.foreground, 0.22);
const GRABBER_DARK = withOpacity(THEME.dark.foreground, 0.35);

const DEFAULT_DETENTS: SheetDetent[] = ['auto'];

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
  useEffect(() => {
    if (!scaler) return;
    const { progress, sheetTop, showCloseButton: scb } = scaler;
    return () => {
      progress.value = withTiming(0, { duration: 200 });
      sheetTop.value = 0;
      scb.value = true;
    };
  }, [scaler]);

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
      variant,
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
    const hasHeader =
      title != null || subtitle != null || onClose != null || headerLeft != null || headerRight != null;
    const isScrollable = scrollable === true || detents.includes('full');
    const modalRef = useRef<BottomSheetModal>(null);
    const systemColorScheme = useColorScheme();
    const themeCtx = useContext(ThemeContext);
    const insets = useSafeAreaInsets();
    const { height: winH } = useWindowDimensions();

    const scheme = themeCtx?.colorScheme ?? (systemColorScheme === 'dark' ? 'dark' : 'light');
    const isDark = scheme === 'dark';
    const sheetBg = THEME_TOKENS[scheme].palette.background;
    const fullSheetBg = isDark ? THEME_TOKENS.dark.palette.background : THEME_TOKENS.light.palette.background;
    const themeValues = THEME_TOKENS[scheme].variables;
    const backdropBg = isDark ? BACKDROP_DARK : BACKDROP_LIGHT;
    const grabberColor = isDark ? GRABBER_DARK : GRABBER_LIGHT;

    const { snapPoints, dynamic } = useMemo(() => mapDetents(detents), [detents]);

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
            style={[props.style, { backgroundColor: backdropBg }]}
          />
        ) : null,
      [effectiveDimmed, backdropBg],
    );

    const fullWithHeader = hasHeader && detents.includes('full');
    const isFull = detents.includes('full');

    const renderBackground = useCallback(
      ({ style }: BottomSheetBackgroundProps) => (
        <View
          style={[
            style,
            {
              backgroundColor: backgroundColor ?? (fullWithHeader ? fullSheetBg : sheetBg),
              borderTopLeftRadius: cornerRadius,
              borderTopRightRadius: cornerRadius,
            },
            // Dark mode (non-full): a thin border delineates the near-black sheet from the near-black screen.
            isDark && !isFull && { borderWidth: 1, borderColor: THEME.dark.border },
          ]}
        />
      ),
      [backgroundColor, isDark, isFull, sheetBg, fullSheetBg, fullWithHeader, cornerRadius],
    );
    const renderHandle = useCallback(
      () => (grabber && !fullWithHeader ? <Grabber color={grabberColor} /> : null),
      [grabber, grabberColor, fullWithHeader],
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
        <BottomSheetHeaderBar title={title} onClose={inlineClose} />
        <View style={styles.fill}>{children}</View>
      </View>
    ) : (
      children
    );

    return (
      <BottomSheetModal
        ref={modalRef}
        topInset={insets.top}
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
              {!fullWithHeader && <SheetProgressBridge showCloseButton={resolvedShowCloseButton} />}
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
              {!fullWithHeader && <SheetProgressBridge showCloseButton={resolvedShowCloseButton} />}
              {themeCtx ? (
                <ThemeContext.Provider value={themeCtx}>
                  <VariableContextProvider value={themeValues}>
                    <View key={scheme} style={styles.fill} className={isDark ? 'dark' : ''}>
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
              // The header renders in the portal (no theme context) — pass the wrapper's app-theme
              // background so it matches the sheet instead of following the system Appearance.
              backgroundColor={THEME[scheme].background}
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
    width: 32,
    height: 4,
    borderRadius: 2,
  },
  fill: {
    flex: 1,
  },
});
