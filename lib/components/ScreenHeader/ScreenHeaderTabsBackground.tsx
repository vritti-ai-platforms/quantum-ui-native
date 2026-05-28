import { useEffect, useState } from 'react';
import { Image, type ImageSourcePropType } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useScreenHeaderTabsEntry } from './screenHeaderTabsRegistry';

const CROSSFADE_DURATION = 250;

interface ScreenHeaderTabsBackgroundProps {
  // Used for tabs that don't define their own image (the header-level prop).
  fallback?: ImageSourcePropType;
}

// Remote uri of a source, or undefined for bundled require()/array sources
// (which load synchronously and don't need prefetching).
function uriOf(source: ImageSourcePropType | undefined): string | undefined {
  if (source && typeof source === 'object' && !Array.isArray(source) && typeof source.uri === 'string') {
    return source.uri;
  }
  return undefined;
}

// Crossfades the active tab's hero image on tab change. The previous image is
// held fully visible until the incoming one has actually loaded (gated on
// onLoad) — without that gate the opacity tween runs over an undecoded remote
// image and the bitmap "blinks" in late. All tab images are prefetched on mount
// so the held previous is cached and the dissolve starts immediately. Two layers
// stay mounted (the at-rest "previous" sits at opacity 0).
export function ScreenHeaderTabsBackground({ fallback }: ScreenHeaderTabsBackgroundProps) {
  const { tabs, activeIndex } = useScreenHeaderTabsEntry();
  const source = tabs[activeIndex]?.backgroundImage ?? fallback;

  useEffect(() => {
    for (const tab of tabs) {
      const uri = uriOf(tab.backgroundImage);
      if (uri) Image.prefetch(uri).catch(() => {});
    }
    const fb = uriOf(fallback);
    if (fb) Image.prefetch(fb).catch(() => {});
  }, [tabs, fallback]);

  const [current, setCurrent] = useState<ImageSourcePropType | undefined>(source);
  const [previous, setPrevious] = useState<ImageSourcePropType | undefined>(undefined);
  const progress = useSharedValue(0); // 0 = current hidden, 1 = current fully shown

  useEffect(() => {
    if (source === current) return;
    setPrevious(current);
    setCurrent(source);
    progress.value = 0;
    // With an incoming image, wait for its onLoad to start the dissolve; with
    // none, fade the previous out to the backdrop right away.
    if (!source) progress.value = withTiming(1, { duration: CROSSFADE_DURATION });
  }, [source, current, progress]);

  const revealCurrent = () => {
    progress.value = withTiming(1, { duration: CROSSFADE_DURATION });
  };

  const previousStyle = useAnimatedStyle(() => ({ opacity: 1 - progress.value }));
  const currentStyle = useAnimatedStyle(() => ({ opacity: progress.value }));

  return (
    <>
      {previous ? (
        <Animated.View className="absolute inset-0" style={previousStyle} pointerEvents="none">
          <Image source={previous} resizeMode="cover" className="h-full w-full" />
        </Animated.View>
      ) : null}
      {current ? (
        <Animated.View className="absolute inset-0" style={currentStyle} pointerEvents="none">
          <Image source={current} resizeMode="cover" className="h-full w-full" onLoad={revealCurrent} />
        </Animated.View>
      ) : null}
    </>
  );
}
