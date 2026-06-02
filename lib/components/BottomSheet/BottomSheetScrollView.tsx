import { BottomSheetScrollView as GorhomBottomSheetScrollView } from '@gorhom/bottom-sheet';
import { memo, useMemo } from 'react';
import type { ScrollView, ScrollViewProps, StyleProp, ViewStyle } from 'react-native';
import { useAnimatedReaction, useAnimatedRef, useScrollViewOffset } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomSheetFullContext } from './BottomSheetFullContext';

export interface BottomSheetScrollViewProps extends Omit<ScrollViewProps, 'onScroll'> {
  children?: React.ReactNode;
  extraBottomPadding?: number;
}

function BottomSheetScrollViewImpl({
  children,
  contentContainerStyle,
  extraBottomPadding = 0,
  ...rest
}: BottomSheetScrollViewProps) {
  const ctx = useBottomSheetFullContext();
  const insets = useSafeAreaInsets();
  const scrollYShared = ctx?.scrollY;

  // Read offset via useScrollViewOffset — gorhom's onScroll wraps in runOnJS({ nativeEvent }) which throws under Worklets-3.
  const animatedScrollRef = useAnimatedRef<ScrollView>();
  const offset = useScrollViewOffset(animatedScrollRef);

  useAnimatedReaction(
    () => offset.value,
    (current) => {
      if (scrollYShared) scrollYShared.value = current;
    },
  );

  const mergedContentContainerStyle = useMemo<StyleProp<ViewStyle>>(
    () => [
      {
        // headerHeight already includes the header's own paddingTop (insets.top); fall back to
        // insets.top when there's no header. Adding both double-counted the inset → extra top gap.
        paddingTop: Math.max(ctx?.headerHeight ?? 0, insets.top),
        paddingBottom: insets.bottom + extraBottomPadding,
      },
      contentContainerStyle,
    ],
    [ctx?.headerHeight, insets.top, insets.bottom, extraBottomPadding, contentContainerStyle],
  );

  const { scrollEventThrottle: _set, decelerationRate: _dec, ...passThrough } = rest as ScrollViewProps;
  return (
    <GorhomBottomSheetScrollView
      {...passThrough}
      ref={animatedScrollRef as never}
      contentContainerStyle={mergedContentContainerStyle}
    >
      {children}
    </GorhomBottomSheetScrollView>
  );
}

BottomSheetScrollViewImpl.displayName = 'BottomSheetScrollView';

export const BottomSheetScrollView = memo(BottomSheetScrollViewImpl);
