import { BottomSheetScrollView as GorhomBottomSheetScrollView } from '@gorhom/bottom-sheet';
import { memo, useMemo } from 'react';
import type { ScrollView, ScrollViewProps, StyleProp, ViewStyle } from 'react-native';
import { useAnimatedReaction, useAnimatedRef, useScrollViewOffset } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomSheetFullContext } from './BottomSheetFullContext';

// Internal — not exported from the package barrel. Driven by props on
// <BottomSheet>; consumers shouldn't import this directly.
export interface BottomSheetScrollViewProps extends Omit<ScrollViewProps, 'onScroll'> {
  children?: React.ReactNode;
  /** Extra padding below the safe-area inset this component auto-applies. */
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

  // Read the scroll offset via a native animated-ref instead of via onScroll.
  // gorhom's BottomSheetScrollView internally wraps any onScroll prop with
  //   runOnJS(onScroll)({ nativeEvent: event })
  // (see node_modules/@gorhom/bottom-sheet/src/hooks/useScrollHandler.ts:33-56)
  // and under Reanimated 4 / Worklets-3 the worklet-side `event` object
  // isn't pre-marked Serializable — that throws every scroll frame:
  //   "Attempted to extract from an Object that wasn't converted to a Serializable".
  // useScrollViewOffset attaches to the scroll view via the ref and exposes
  // the offset as a SharedValue updated by the native scroll driver — no
  // onScroll callback registered, gorhom's runOnJS branch never fires.
  const animatedScrollRef = useAnimatedRef<ScrollView>();
  const offset = useScrollViewOffset(animatedScrollRef);

  // Mirror useScrollViewOffset's SharedValue into the context's SharedValue
  // the header is already watching. Both are SharedValues and the reaction
  // body is a worklet — pure UI-thread work, no JS bridge.
  useAnimatedReaction(
    () => offset.value,
    (current) => {
      if (scrollYShared) scrollYShared.value = current;
    },
  );

  // Pad content so the first row isn't hidden under the sticky header and
  // the last row clears the bottom safe-area + caller-specified extra.
  const mergedContentContainerStyle = useMemo<StyleProp<ViewStyle>>(
    () => [
      {
        paddingTop: (ctx?.headerHeight ?? 0) + insets.top,
        paddingBottom: insets.bottom + extraBottomPadding,
      },
      contentContainerStyle,
    ],
    [ctx?.headerHeight, insets.top, insets.bottom, extraBottomPadding, contentContainerStyle],
  );

  // gorhom's BottomSheetScrollView omits scrollEventThrottle (it sets it
  // internally) and decelerationRate. Spreading the rest separately keeps
  // the type intersection working.
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
