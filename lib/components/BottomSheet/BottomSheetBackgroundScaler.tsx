import { useBottomSheetModal } from '@gorhom/bottom-sheet';
import { usePlatformInfo } from '@vritti/quantum-ui-native/hooks';
import { createContext, type ReactNode, useContext, useMemo, useState } from 'react';
import { DynamicColorIOS, Platform, StyleSheet, useColorScheme, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import {
  interpolate,
  runOnJS,
  type SharedValue,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeOnlyAnimatedView } from '../../reusables/native-only-animated-view';
import { THEME } from '../../theme';
import { Button } from '../Button';
import { DynamicIcon } from '../DynamicIcon';

const PAN_DISMISS_THRESHOLD = 50;

type BottomSheetBackgroundScalerContextValue = {
  progress: SharedValue<number>;
  sheetTop: SharedValue<number>;
};

const BottomSheetBackgroundScalerContext = createContext<BottomSheetBackgroundScalerContextValue | null>(null);

export const useBottomSheetBackgroundScaler = (): BottomSheetBackgroundScalerContextValue | null =>
  useContext(BottomSheetBackgroundScalerContext);

export const BottomSheetBackgroundScalerProvider = ({ children }: { children: ReactNode }) => {
  const progress = useSharedValue(0);
  const sheetTop = useSharedValue(0);
  const value = useMemo<BottomSheetBackgroundScalerContextValue>(() => ({ progress, sheetTop }), [progress, sheetTop]);
  return (
    <BottomSheetBackgroundScalerContext.Provider value={value}>{children}</BottomSheetBackgroundScalerContext.Provider>
  );
};

const CLOSE_ICON = { sfSymbol: 'xmark', materialIcon: 'close' } as const;
const CLOSE_BUTTON_OFFSET = 56;

// NativeWind className→variable lookup is unreliable inside LiquidGlassView on iOS 26+ — pass DynamicColorIOS so UIKit re-resolves at draw time.
const IOS_CLOSE_ICON_COLOR =
  Platform.OS === 'ios'
    ? DynamicColorIOS({ light: THEME.light.foreground, dark: THEME.dark.foreground })
    : null;

export interface BottomSheetScaledScreenProps {
  children: ReactNode;
  scale?: number;
  cornerRadius?: number;
  overlayOpacity?: number;
}

export const BottomSheetScaledScreen = ({
  children,
  scale = 0.94,
  cornerRadius = 24,
  overlayOpacity = 0.5,
}: BottomSheetScaledScreenProps) => {
  const ctx = useBottomSheetBackgroundScaler();

  if (!ctx) {
    return <>{children}</>;
  }

  return (
    <ScaledContent ctx={ctx} scale={scale} cornerRadius={cornerRadius} overlayOpacity={overlayOpacity}>
      {children}
    </ScaledContent>
  );
};

const ScaledContent = ({
  ctx,
  scale,
  cornerRadius,
  overlayOpacity,
  children,
}: {
  ctx: BottomSheetBackgroundScalerContextValue;
  scale: number;
  cornerRadius: number;
  overlayOpacity: number;
  children: ReactNode;
}) => {
  const { dismissAll } = useBottomSheetModal();
  const platform = usePlatformInfo();
  const useGlass = platform.os === 'ios' && platform.version >= 26;
  const insets = useSafeAreaInsets();
  const systemColorScheme = useColorScheme();
  const palette = THEME[systemColorScheme === 'dark' ? 'dark' : 'light'];
  const closeIconColor = (IOS_CLOSE_ICON_COLOR ?? palette.foreground) as unknown as string;

  const [isOpen, setIsOpen] = useState(false);
  useAnimatedReaction(
    () => ctx.progress.value,
    (current, prev) => {
      const open = current > 0.05;
      if (prev === null || (prev > 0.05) !== open) {
        runOnJS(setIsOpen)(open);
      }
    },
    [],
  );

  const dismissGesture = useMemo(
    () =>
      Gesture.Race(
        Gesture.Tap().onEnd((_, success) => {
          if (success) runOnJS(dismissAll)();
        }),
        Gesture.Pan().onEnd((e) => {
          if (e.translationY > PAN_DISMISS_THRESHOLD) runOnJS(dismissAll)();
        }),
      ),
    [dismissAll],
  );

  const containerStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: interpolate(ctx.progress.value, [0, 1], [1, scale]) },
      { translateY: ctx.progress.value * insets.top },
    ],
    borderRadius: interpolate(ctx.progress.value, [0, 1], [0, cornerRadius]),
  }));

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: ctx.progress.value * overlayOpacity,
  }));

  // Paint-only transforms — opacity from 0 prevents iOS 26 UIGlassEffect init; layout-time `top` thrashes and tears down the glass.
  const closeButtonStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: ctx.sheetTop.value - CLOSE_BUTTON_OFFSET },
      { scale: ctx.progress.value },
    ],
  }));

  return (
    <View style={styles.systemBg}>
      <NativeOnlyAnimatedView style={[styles.container, containerStyle]}>
        {children}
        <NativeOnlyAnimatedView
          pointerEvents="none"
          style={[StyleSheet.absoluteFillObject, styles.overlay, overlayStyle]}
        />
      </NativeOnlyAnimatedView>
      <GestureDetector gesture={dismissGesture}>
        <View
          pointerEvents={isOpen ? 'auto' : 'none'}
          style={StyleSheet.absoluteFillObject}
          collapsable={false}
        />
      </GestureDetector>
      <NativeOnlyAnimatedView pointerEvents="box-none" style={[styles.closeButtonContainer, closeButtonStyle]}>
        <Button
          variant={useGlass ? 'glass' : 'secondary'}
          size="icon"
          onPress={dismissAll}
          accessibilityLabel="Close"
          hitSlop={8}
        >
          <DynamicIcon icon={CLOSE_ICON} size={18} color={closeIconColor} />
        </Button>
      </NativeOnlyAnimatedView>
    </View>
  );
};

const styles = StyleSheet.create({
  systemBg: {
    flex: 1,
    backgroundColor: '#000',
  },
  container: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  overlay: {
    backgroundColor: '#000',
  },
  closeButtonContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
});
