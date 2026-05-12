import {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
  type BottomSheetBackgroundProps,
  BottomSheetModal,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import { usePlatformInfo } from '@vritti/quantum-ui-native/hooks';
import { VariableContextProvider } from 'nativewind';
import { forwardRef, useCallback, useContext, useImperativeHandle, useMemo, useRef } from 'react';
import { Platform, type StyleProp, View, type ViewStyle } from 'react-native';
import { darkColors, lightColors, THEME } from '../../theme/colors';
import { platformRadii } from '../../theme/radii';
import { darkShadows, lightShadows } from '../../theme/shadows';
import { ThemeContext } from '../../theme/ThemeProvider';
import { type BottomSheetProps, type BottomSheetRef, mapDetents } from './BottomSheetTypes';

export type { BottomSheetProps, BottomSheetRef };
export type { SheetDetent } from './BottomSheetTypes';

// Optional — graceful no-op if @callstack/liquid-glass is not installed in the app.
let LiquidGlass: React.ComponentType<{ style?: StyleProp<ViewStyle>; children?: React.ReactNode }> | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  LiquidGlass = require('@callstack/liquid-glass').default;
} catch {}

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
      onDismiss,
      onPresent,
      onChange,
    },
    ref,
  ) => {
    const modalRef = useRef<BottomSheetModal>(null);

    const { version } = usePlatformInfo();
    const isIOS26 = Platform.OS === 'ios' && version >= 26;
    const useGlass = isIOS26 && LiquidGlass != null;

    const themeCtx = useContext(ThemeContext);
    const isDark = themeCtx?.isDark ?? false;
    const bg = isDark ? THEME.dark.secondary : THEME.light.secondary;
    const themeValues = useMemo(
      () => ({
        ...(isDark ? darkColors : lightColors),
        ...platformRadii,
        ...(isDark ? darkShadows : lightShadows),
      }),
      [isDark],
    );

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
        dimmed ? <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} /> : null,
      [dimmed],
    );

    const renderBackground = useCallback(
      ({ style }: BottomSheetBackgroundProps) => {
        if (useGlass && LiquidGlass) {
          return (
            <LiquidGlass style={[style, { borderTopLeftRadius: cornerRadius, borderTopRightRadius: cornerRadius }]} />
          );
        }
        return (
          <View
            style={[
              style,
              { backgroundColor: bg, borderTopLeftRadius: cornerRadius, borderTopRightRadius: cornerRadius },
            ]}
          />
        );
      },
      [useGlass, bg, cornerRadius],
    );

    const wrappedChildren = themeCtx ? (
      <ThemeContext.Provider value={themeCtx}>
        <VariableContextProvider value={themeValues}>{children}</VariableContextProvider>
      </ThemeContext.Provider>
    ) : (
      children
    );

    return (
      <BottomSheetModal
        ref={modalRef}
        snapPoints={snapPoints}
        enableDynamicSizing={dynamic}
        enablePanDownToClose={dismissible}
        enableHandlePanningGesture={draggable}
        handleComponent={grabber ? undefined : () => null}
        backdropComponent={renderBackdrop}
        backgroundComponent={renderBackground}
        onDismiss={onDismiss}
        onAnimate={(fromIndex: number, toIndex: number) => {
          if (toIndex >= 0 && fromIndex < 0) onPresent?.();
        }}
        onChange={onChange}
      >
        <BottomSheetView>{wrappedChildren}</BottomSheetView>
      </BottomSheetModal>
    );
  },
);

BottomSheet.displayName = 'BottomSheet';
