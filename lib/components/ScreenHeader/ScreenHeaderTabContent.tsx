import { type ReactNode, useEffect, useRef, useState } from 'react';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useScreenHeaderTabsEntry } from './screenHeaderTabsRegistry';

const FADE_DURATION = 200; // per phase → ~400ms total
const SLIDE_OFFSET = 24; // subtle horizontal travel during the fade

// Directional cross-fade between tab contents. Moving to a higher-index tab
// fades the current content out to the left, then fades the new content in from
// the right; moving to a lower-index tab mirrors it. Only one tab's content is
// mounted at a time (it swaps mid-transition), so APIs fire lazily per tab.
function ScreenHeaderTabContentView() {
  const { tabs, activeIndex } = useScreenHeaderTabsEntry();
  const [displayedIndex, setDisplayedIndex] = useState(activeIndex);
  const opacity = useSharedValue(1);
  const translateX = useSharedValue(0);
  const dirRef = useRef(0); // +1 = moved right, -1 = moved left

  // Single transition driver across two passes. When activeIndex moves ahead of
  // the displayed content, fade/slide the current content out then swap
  // (setDisplayedIndex); that swap re-runs this effect with
  // activeIndex === displayedIndex, which fades/slides the freshly-mounted
  // content in. dirRef carries the direction between the passes (0 = settled, so
  // no entry animation on first mount).
  useEffect(() => {
    if (activeIndex === displayedIndex) {
      const dir = dirRef.current;
      if (dir === 0) return;
      dirRef.current = 0;
      translateX.value = dir * SLIDE_OFFSET;
      opacity.value = 0;
      translateX.value = withTiming(0, { duration: FADE_DURATION });
      opacity.value = withTiming(1, { duration: FADE_DURATION });
      return;
    }
    const dir = activeIndex > displayedIndex ? 1 : -1;
    dirRef.current = dir;
    const target = activeIndex;
    opacity.value = withTiming(0, { duration: FADE_DURATION });
    translateX.value = withTiming(-dir * SLIDE_OFFSET, { duration: FADE_DURATION }, (finished) => {
      if (finished) runOnJS(setDisplayedIndex)(target);
    });
  }, [activeIndex, displayedIndex, opacity, translateX]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }],
  }));

  return <Animated.View style={[{ flex: 1 }, style]}>{tabs[displayedIndex]?.content ?? null}</Animated.View>;
}

// Public hook the screen body renders. Returns the fade-transition view so the
// consumer's `<ScreenContainer>{useScreenHeaderTabContent()}</ScreenContainer>`
// pattern keeps working unchanged.
export function useScreenHeaderTabContent(): ReactNode {
  return <ScreenHeaderTabContentView />;
}
