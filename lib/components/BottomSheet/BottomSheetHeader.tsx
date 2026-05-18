import { useBottomSheet } from '@gorhom/bottom-sheet';
import { memo, useCallback } from 'react';
import {
  DynamicColorIOS,
  type LayoutChangeEvent,
  Platform,
  type StyleProp,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import Animated, { interpolate, useAnimatedStyle } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePlatformInfo } from '../../hooks/usePlatformInfo';
import { useTheme } from '../../hooks/useTheme';
import { THEME } from '../../theme/colors';
import { Button } from '../Button';
import { DynamicIcon } from '../DynamicIcon';
import { Text } from '../Typography';
import { useBottomSheetFullContext } from './BottomSheetFullContext';

const HEADER_CONTENT_HEIGHT = 56;
const MORPH_DISTANCE = 50;

const CLOSE_ICON = { sfSymbol: 'chevron.down', materialIcon: 'keyboard-arrow-down' } as const;
const GRABBER_ICON = { sfSymbol: 'chevron.compact.down', materialIcon: 'remove' } as const;

const IOS_HEADER_BG =
  Platform.OS === 'ios' ? DynamicColorIOS({ light: THEME.light.background, dark: THEME.dark.background }) : null;

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

export interface BottomSheetHeaderProps {
  title?: string;
  subtitle?: string;
  onClose?: () => void;
  leftAction?: React.ReactNode;
  rightAction?: React.ReactNode;
  children?: React.ReactNode;
}

function BottomSheetHeaderImpl({
  title,
  subtitle,
  onClose,
  leftAction,
  rightAction,
  children,
}: BottomSheetHeaderProps) {
  const insets = useSafeAreaInsets();
  const { version } = usePlatformInfo();
  const { palette: headerColors } = useTheme();
  const useGlass = Platform.OS === 'ios' && version >= 26 && LiquidGlass != null;
  const ctx = useBottomSheetFullContext();

  // Destructured immediately — Worklets-3 can't serialize the wider useBottomSheet return.
  const { animatedPosition } = useBottomSheet();

  const handleLayout = useCallback(
    (e: LayoutChangeEvent) => {
      ctx?.setHeaderHeight(e.nativeEvent.layout.height);
    },
    [ctx],
  );

  const closeIconStyle = useAnimatedStyle(() => ({
    opacity: interpolate(animatedPosition.value, [0, MORPH_DISTANCE], [1, 0], 'clamp'),
  }));
  const grabberStyle = useAnimatedStyle(() => ({
    opacity: interpolate(animatedPosition.value, [0, MORPH_DISTANCE], [0, 1], 'clamp'),
  }));

  const androidHeaderBg = headerColors.background;

  const leftSlot =
    leftAction ??
    (onClose ? (
      <View style={styles.morphStack}>
        <Animated.View style={[StyleSheet.absoluteFillObject, styles.morphCenter, closeIconStyle]}>
          <CloseButton onPress={onClose} />
        </Animated.View>
        <Animated.View style={[StyleSheet.absoluteFillObject, styles.morphCenter, grabberStyle]} pointerEvents="none">
          <DynamicIcon icon={GRABBER_ICON} size={20} className="text-foreground" />
        </Animated.View>
      </View>
    ) : null);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]} onLayout={handleLayout} pointerEvents="box-none">
      {useGlass && LiquidGlass ? (
        <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
          <LiquidGlass style={StyleSheet.absoluteFillObject} effect="regular" />
        </View>
      ) : Platform.OS === 'ios' ? (
        <View
          style={[StyleSheet.absoluteFillObject, { backgroundColor: IOS_HEADER_BG as unknown as string }]}
          pointerEvents="none"
        />
      ) : (
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: androidHeaderBg }]} pointerEvents="none" />
      )}

      <View style={[styles.row, { height: HEADER_CONTENT_HEIGHT }]}>
        <View style={styles.slot}>{leftSlot}</View>
        <View style={styles.titleWrap}>
          {children ?? (
            <>
              <Text className="text-base font-semibold text-foreground" numberOfLines={1}>
                {title ?? ''}
              </Text>
              {subtitle ? (
                <Text className="text-xs text-muted-foreground" numberOfLines={1}>
                  {subtitle}
                </Text>
              ) : null}
            </>
          )}
        </View>
        <View style={styles.slot}>{rightAction ?? null}</View>
      </View>
    </View>
  );
}

BottomSheetHeaderImpl.displayName = 'BottomSheetHeader';

export const BottomSheetHeader = memo(BottomSheetHeaderImpl);

const CloseButton = memo(function CloseButton({ onPress }: { onPress: () => void }) {
  return (
    <Button variant="ghost" size="icon" onPress={onPress} accessibilityLabel="Close" hitSlop={8}>
      <DynamicIcon icon={CLOSE_ICON} size={20} className="text-foreground" />
    </Button>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    // Android composes by elevation first — without this the header sits behind the BottomSheetScrollView.
    elevation: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  slot: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  morphStack: {
    width: 44,
    height: 44,
    position: 'relative',
  },
  morphCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
