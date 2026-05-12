import { useBottomSheetModal } from '@gorhom/bottom-sheet';
import { usePlatformInfo } from '@vritti/quantum-ui-native/hooks';
import { createContext, type ReactNode, useContext, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
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
import { Button } from '../Button';
import { DynamicIcon } from '../DynamicIcon';

// Drag-down threshold to count as a dismissal swipe on the dim area.
const PAN_DISMISS_THRESHOLD = 50;

// ---------- Context ----------

type BottomSheetBackgroundScalerContextValue = {
  progress: SharedValue<number>;
  sheetTop: SharedValue<number>;
};

const BottomSheetBackgroundScalerContext = createContext<BottomSheetBackgroundScalerContextValue | null>(null);

export const useBottomSheetBackgroundScaler = (): BottomSheetBackgroundScalerContextValue | null =>
  useContext(BottomSheetBackgroundScalerContext);

// ---------- Provider ----------

export const BottomSheetBackgroundScalerProvider = ({ children }: { children: ReactNode }) => {
  const progress = useSharedValue(0);
  const sheetTop = useSharedValue(0);
  const value = useMemo<BottomSheetBackgroundScalerContextValue>(() => ({ progress, sheetTop }), [progress, sheetTop]);
  return (
    <BottomSheetBackgroundScalerContext.Provider value={value}>{children}</BottomSheetBackgroundScalerContext.Provider>
  );
};

// ---------- Scaled screen wrapper ----------

const CLOSE_ICON = { sfSymbol: 'xmark', materialIcon: 'close' } as const;
// Gap between the sheet's top edge and the bottom of the close button.
const CLOSE_BUTTON_OFFSET = 56;

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

  // Track whether any sheet is open in React land so we can toggle the
  // touch-capture layer on/off. When closed we set pointerEvents="none" so
  // taps fall through to AppRender as normal.
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

  // Tap on the dim area dismisses; vertical swipe past threshold dismisses too.
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
    // Scale first, then translate down by the safe-area top inset so the scaled
    // screen's top edge sits below the notch / Dynamic Island when fully open.
    // translateY isn't subject to the scale factor when it comes after scale in
    // the transform array.
    transform: [
      { scale: interpolate(ctx.progress.value, [0, 1], [1, scale]) },
      { translateY: ctx.progress.value * insets.top },
    ],
    borderRadius: interpolate(ctx.progress.value, [0, 1], [0, cornerRadius]),
  }));

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: ctx.progress.value * overlayOpacity,
  }));

  // Use paint-only transforms (translateY + scale) instead of layout-time `top`
  // and alpha-suppressing `opacity`. Animating opacity from 0 prevents iOS 26's
  // UIGlassEffect from initialising on a LiquidGlassView descendant; animating
  // `top` thrashes layout each frame and tears down the glass material before
  // it can render. Scale keeps layer alpha at 1.0; translateY is paint-only.
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
      {/* Touch-capture layer: blocks AppRender taps while a sheet is open, and
          dismisses on tap or swipe-down. Sits above the scaled view but below
          the close button. The sheet itself is rendered via the portal at a
          higher z-order, so taps inside the sheet still reach it. */}
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
          <DynamicIcon icon={CLOSE_ICON} size={18} className="text-foreground" />
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
