import {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
  type BottomSheetBackgroundProps,
  BottomSheetModal,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import { usePlatformInfo } from '@vritti/quantum-ui-native/hooks';
import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';
import { DynamicColorIOS, StyleSheet, type StyleProp, type ViewStyle, View } from 'react-native';
import { THEME } from '../../theme/colors';
import { mapDetents, type BottomSheetProps, type BottomSheetRef } from './BottomSheetTypes';

export type { BottomSheetProps, BottomSheetRef };
export type { SheetDetent } from './BottomSheetTypes';

// Optional — graceful no-op if @callstack/liquid-glass is not installed.
let LiquidGlass: React.ComponentType<{ style?: StyleProp<ViewStyle>; children?: React.ReactNode }> | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  LiquidGlass = require('@callstack/liquid-glass').default;
} catch {}

// Adds CSS Level 4 alpha to an hsl(...) string → hsl(h s% l% / alpha)
function withOpacity(hsl: string, alpha: number): string {
  return hsl.replace(')', ` / ${alpha})`);
}

// All module-level DynamicColorIOS values track UIKit appearance natively —
// no JS re-render needed, so the sheet never re-renders on theme change.
const sheetBg = DynamicColorIOS({ light: THEME.light.secondary, dark: THEME.dark.secondary });
const backdropColor = DynamicColorIOS({
  light: withOpacity(THEME.light.foreground, 0.4),
  dark: withOpacity(THEME.dark.background, 0.6),
});
const grabberColor = DynamicColorIOS({
  light: withOpacity(THEME.light.foreground, 0.22),
  dark: withOpacity(THEME.dark.foreground, 0.35),
});

export const BottomSheet = forwardRef<BottomSheetRef, BottomSheetProps>(
  (
    {
      children,
      detents = ['auto'],
      cornerRadius = 24,
      grabber = true,
      dismissible = true,
      draggable = true,
      dimmed = true,
      glass,
      onDismiss,
      onPresent,
      onChange,
    },
    ref,
  ) => {
    const modalRef = useRef<BottomSheetModal>(null);
    const { version } = usePlatformInfo();
    const isIOS26 = version >= 26;
    const useGlass = glass ?? (isIOS26 && LiquidGlass != null);

    useImperativeHandle(ref, () => ({
      present: (index = 0) => {
        modalRef.current?.present();
        if (index > 0) modalRef.current?.snapToIndex(index);
      },
      dismiss: () => modalRef.current?.dismiss(),
    }));

    const { snapPoints, dynamic } = mapDetents(detents);

    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) =>
        dimmed ? (
          <BottomSheetBackdrop
            {...props}
            disappearsOnIndex={-1}
            appearsOnIndex={0}
            style={[props.style, { backgroundColor: backdropColor }]}
          />
        ) : null,
      [dimmed],
    );

    const renderBackground = useCallback(
      ({ style }: BottomSheetBackgroundProps) => {
        const radius = { borderTopLeftRadius: cornerRadius, borderTopRightRadius: cornerRadius };
        if (useGlass && LiquidGlass) {
          return <LiquidGlass style={[style, radius]} />;
        }
        return <View style={[style, radius, { backgroundColor: sheetBg }]} />;
      },
      [useGlass, cornerRadius],
    );

    const renderHandle = useCallback(
      () =>
        grabber ? (
          <View style={styles.handleContainer}>
            <View style={[styles.grabber, { backgroundColor: grabberColor }]} />
          </View>
        ) : null,
      [grabber],
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
        onAnimate={(fromIndex: number, toIndex: number) => {
          if (toIndex >= 0 && fromIndex < 0) onPresent?.();
        }}
        onChange={onChange}
      >
        <BottomSheetView>{children}</BottomSheetView>
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
