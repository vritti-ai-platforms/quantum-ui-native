import {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
  type BottomSheetBackgroundProps,
  BottomSheetModal,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import { VariableContextProvider } from 'nativewind';
import { forwardRef, useCallback, useContext, useImperativeHandle, useMemo, useRef } from 'react';
import { StyleSheet, useColorScheme, View } from 'react-native';
import { darkColors, getTheme, lightColors } from '../../theme/colors';
import { platformRadii } from '../../theme/radii';
import { darkShadows, lightShadows } from '../../theme/shadows';
import { ThemeContext } from '../../theme/ThemeProvider';
import { type BottomSheetProps, type BottomSheetRef, mapDetents } from './BottomSheetTypes';

export type { BottomSheetProps, BottomSheetRef };
export type { SheetDetent } from './BottomSheetTypes';

export const BottomSheet = forwardRef<BottomSheetRef, BottomSheetProps>(
  (
    {
      children,
      detents = ['auto'],
      // Material Design bottom sheet corner spec
      cornerRadius = 16,
      grabber = true,
      dismissible = true,
      draggable = true,
      dimmed = true,
      // glass prop accepted but unused on Android
      glass: _glass,
      onDismiss,
      onPresent,
      onChange,
    },
    ref,
  ) => {
    const modalRef = useRef<BottomSheetModal>(null);

    // Reactive to system color scheme changes while the sheet is open
    const colorScheme = useColorScheme();
    const isDarkSystem = colorScheme === 'dark';
    const theme = getTheme();

    const themeCtx = useContext(ThemeContext);
    const isDark = themeCtx?.isDark ?? isDarkSystem;
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

    const backdropBg = isDark ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.4)';

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
              backgroundColor: theme.secondary,
              borderTopLeftRadius: cornerRadius,
              borderTopRightRadius: cornerRadius,
            },
          ]}
        />
      ),
      [theme.secondary, cornerRadius],
    );

    const grabberColor = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.18)';

    const renderHandle = useCallback(
      () =>
        grabber ? (
          <View style={styles.handleContainer}>
            <View style={[styles.grabber, { backgroundColor: grabberColor }]} />
          </View>
        ) : null,
      [grabber, grabberColor],
    );

    const wrappedChildren = themeCtx ? (
      <ThemeContext.Provider value={themeCtx}>
        <VariableContextProvider value={themeValues}>
          {children}
        </VariableContextProvider>
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
        handleComponent={renderHandle}
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
});
