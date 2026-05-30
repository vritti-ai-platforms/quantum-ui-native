import { useUnstableNativeVariable } from 'nativewind';
import { type ReactNode, useEffect, useRef } from 'react';
import { type LayoutChangeEvent, Platform, Pressable, ScrollView, useColorScheme, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { cn } from '../../utils/cn';
import { DynamicIcon } from '../DynamicIcon';
import { Text } from '../Typography';
import {
  setScreenHeaderActiveTabId,
  useScreenHeaderActiveIndex,
  useScreenHeaderRouteKey,
} from './screenHeaderTabsRegistry';
import type { ScreenHeaderTabConfig } from './types';

export const TABS_HEIGHT = 56;

const UNDERLINE_HEIGHT = 4;
const UNDERLINE_MIN_WIDTH = 32;
const UNDERLINE_DURATION = 300;
// At or below this many tabs they share the width equally; above it the row
// scrolls and the selected tab auto-centers.
const EVEN_FIT_MAX_TABS = 5;

interface ScreenHeaderTabsProps {
  tabs: ScreenHeaderTabConfig[];
  background?: ReactNode;
}

interface TabPosition {
  x: number;
  w: number;
  labelW: number;
}

export function ScreenHeaderTabs({ tabs, background }: ScreenHeaderTabsProps) {
  const primaryVar = (useUnstableNativeVariable as unknown as (name: string) => string | undefined)('--primary');
  const primaryColor = typeof primaryVar === 'string' ? `hsl(${primaryVar})` : undefined;
  const activeIndex = useScreenHeaderActiveIndex();
  const routeKey = useScreenHeaderRouteKey();

  const scrollable = tabs.length > EVEN_FIT_MAX_TABS;

  const positionsRef = useRef<Array<TabPosition>>([]);
  const scrollRef = useRef<ScrollView>(null);
  const viewportWRef = useRef(0);
  const contentWRef = useRef(0);
  const translateX = useSharedValue(0);
  const underlineWidth = useSharedValue(UNDERLINE_MIN_WIDTH);
  const hasMeasured = useSharedValue(false);

  const setTarget = (animated: boolean) => {
    const pos = positionsRef.current[activeIndex];
    if (!pos) return;
    const w = Math.max(UNDERLINE_MIN_WIDTH, pos.labelW);
    const center = pos.x + pos.w / 2 - w / 2;
    if (animated) {
      translateX.value = withTiming(center, { duration: UNDERLINE_DURATION });
      underlineWidth.value = withTiming(w, { duration: UNDERLINE_DURATION });
    } else {
      translateX.value = center;
      underlineWidth.value = w;
    }
    hasMeasured.value = true;
  };

  // Scroll the strip so the active tab sits near the viewport center, clamped to
  // the scroll bounds (start/end tabs can't truly center). No-op for <=5 tabs.
  const centerActiveTab = (animated: boolean) => {
    if (!scrollable) return;
    const pos = positionsRef.current[activeIndex];
    const viewportW = viewportWRef.current;
    if (!pos || viewportW === 0) return;
    const tabCenter = pos.x + pos.w / 2;
    const maxX = Math.max(0, contentWRef.current - viewportW);
    const x = Math.min(Math.max(0, tabCenter - viewportW / 2), maxX);
    scrollRef.current?.scrollTo({ x, animated });
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: <>
  useEffect(() => {
    setTarget(true);
    centerActiveTab(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex]);

  const handleTabLayout = (index: number, e: LayoutChangeEvent) => {
    const prev = positionsRef.current[index];
    const isFirstMeasure = !prev;
    positionsRef.current[index] = {
      x: e.nativeEvent.layout.x,
      w: e.nativeEvent.layout.width,
      labelW: prev?.labelW ?? 0,
    };
    // Snap-without-animation only on the first layout for a tab; later relayouts
    // (e.g. the font-weight change when active flips) must NOT cancel the
    // withTiming animation started by the useEffect.
    if (index === activeIndex && isFirstMeasure) setTarget(false);
  };

  const handleLabelLayout = (index: number, e: LayoutChangeEvent) => {
    const labelW = e.nativeEvent.layout.width;
    const prev = positionsRef.current[index];
    if (prev && prev.labelW === labelW) return;
    positionsRef.current[index] = prev ? { ...prev, labelW } : { x: 0, w: 0, labelW };
    // Re-target so the new label width takes effect. Animate only if the
    // underline has already been placed once — first-paint should snap.
    if (index === activeIndex) setTarget(hasMeasured.value);
  };

  const underlineStyle = useAnimatedStyle(() => ({
    opacity: hasMeasured.value ? 1 : 0,
    width: underlineWidth.value,
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View className="relative h-14 overflow-hidden border-b border-border">
      {background ? (
        <View className="absolute inset-0" pointerEvents="none">
          {background}
        </View>
      ) : null}
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        onLayout={(e) => {
          viewportWRef.current = e.nativeEvent.layout.width;
        }}
        onContentSizeChange={(w) => {
          contentWRef.current = w;
        }}
        contentContainerClassName="flex-row items-end gap-2 min-w-full px-4 pb-2"
      >
        {tabs.map((tab, index) => (
          <TabItem
            key={tab.id}
            tab={tab}
            active={index === activeIndex}
            scrollable={scrollable}
            onPress={() => setScreenHeaderActiveTabId(routeKey, tab.id)}
            onLayout={(e) => handleTabLayout(index, e)}
            onLabelLayout={(e) => handleLabelLayout(index, e)}
          />
        ))}
        <Animated.View
          pointerEvents="none"
          className="absolute rounded-full"
          style={[{ left: 0, bottom: 0, height: UNDERLINE_HEIGHT, backgroundColor: primaryColor }, underlineStyle]}
        />
      </ScrollView>
    </View>
  );
}

interface TabItemProps {
  tab: ScreenHeaderTabConfig;
  active: boolean;
  scrollable: boolean;
  onPress: () => void;
  onLayout: (e: LayoutChangeEvent) => void;
  onLabelLayout: (e: LayoutChangeEvent) => void;
}

function TabItem({ tab, active, scrollable, onPress, onLayout, onLabelLayout }: TabItemProps) {
  const colorScheme = useColorScheme();
  // Active accent: primary in light mode, foreground in dark mode. Picked in JS
  // (not a dark: variant) because DynamicIcon resolves its tint from a single
  // base text-* class and doesn't parse the dark: prefix.
  const activeColor = colorScheme === 'dark' ? 'text-foreground' : 'text-primary';
  return (
    <Pressable
      onPress={onPress}
      onLayout={onLayout}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      hitSlop={{ top: 12, bottom: 16, left: 6, right: 6 }}
      className={cn('items-center', scrollable ? 'px-3' : 'flex-1')}
      style={{ gap: Platform.OS === 'android' ? 4 : 12 }}
    >
      <DynamicIcon
        icon={active ? (tab.activeIcon ?? tab.icon) : tab.icon}
        size={18}
        className={active ? activeColor : 'text-muted-foreground'}
      />
      <Text
        onLayout={onLabelLayout}
        className={cn('text-[11px]', active ? `${activeColor} font-semibold` : 'text-muted-foreground')}
        style={{ includeFontPadding: false }}
        numberOfLines={1}
      >
        {tab.label}
      </Text>
    </Pressable>
  );
}
