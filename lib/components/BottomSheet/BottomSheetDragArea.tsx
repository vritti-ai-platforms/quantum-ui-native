import { useBottomSheetGestureHandlers, useBottomSheetInternal } from '@gorhom/bottom-sheet';
import { type ReactNode, useMemo } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';

// gorhom routes ALL sheet-drag through `enableContentPanningGesture` — even its own BottomSheetDraggableView
// is `.enabled(enableContentPanningGesture)`. The Select sheet turns that flag OFF so the options FlashList
// scroll can't be hijacked into a dismiss. This is a clone of BottomSheetDraggableView WITHOUT the `.enabled`
// gate (always on), so a discrete region — the header bar + search — can still swipe the sheet closed while
// the list stays pure-scroll. gorhom's default `activeOffsetY` keeps taps (focus the search / hit the X)
// distinct from a vertical drag.
export function BottomSheetDragArea({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const { simultaneousHandlers, waitFor, activeOffsetX, activeOffsetY, failOffsetX, failOffsetY } =
    useBottomSheetInternal();
  const { contentPanGestureHandler: h } = useBottomSheetGestureHandlers();

  const gesture = useMemo(() => {
    let g = Gesture.Pan()
      .enabled(true)
      .shouldCancelWhenOutside(false)
      .runOnJS(false)
      .onStart(h.handleOnStart)
      .onChange(h.handleOnChange)
      .onEnd(h.handleOnEnd)
      .onFinalize(h.handleOnFinalize);
    if (waitFor) g = g.requireExternalGestureToFail(waitFor as never);
    if (simultaneousHandlers) g = g.simultaneousWithExternalGesture(simultaneousHandlers as never);
    if (activeOffsetX) g = g.activeOffsetX(activeOffsetX);
    if (activeOffsetY) g = g.activeOffsetY(activeOffsetY);
    if (failOffsetX) g = g.failOffsetX(failOffsetX);
    if (failOffsetY) g = g.failOffsetY(failOffsetY);
    return g;
  }, [h, simultaneousHandlers, waitFor, activeOffsetX, activeOffsetY, failOffsetX, failOffsetY]);

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={style}>{children}</Animated.View>
    </GestureDetector>
  );
}
