import { type ReactNode, useEffect, useRef } from 'react';
import { type LayoutChangeEvent, Pressable, ScrollView, View } from 'react-native';
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
  const activeIndex = useScreenHeaderActiveIndex();
  const routeKey = useScreenHeaderRouteKey();

  const positionsRef = useRef<Array<TabPosition>>([]);
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

  // biome-ignore lint/correctness/useExhaustiveDependencies: <>
  useEffect(() => {
    setTarget(true);
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
    positionsRef.current[index] = prev
      ? { ...prev, labelW }
      : { x: 0, w: 0, labelW };
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
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="flex-row items-end gap-2 min-w-full px-4 pb-2"
      >
        {tabs.map((tab, index) => (
          <TabItem
            key={tab.id}
            tab={tab}
            active={index === activeIndex}
            onPress={() => setScreenHeaderActiveTabId(routeKey, tab.id)}
            onLayout={(e) => handleTabLayout(index, e)}
            onLabelLayout={(e) => handleLabelLayout(index, e)}
          />
        ))}
        <Animated.View
          pointerEvents="none"
          className="absolute bg-primary rounded-full"
          style={[{ left: 0, bottom: 0, height: UNDERLINE_HEIGHT }, underlineStyle]}
        />
      </ScrollView>
    </View>
  );
}

interface TabItemProps {
  tab: ScreenHeaderTabConfig;
  active: boolean;
  onPress: () => void;
  onLayout: (e: LayoutChangeEvent) => void;
  onLabelLayout: (e: LayoutChangeEvent) => void;
}

function TabItem({ tab, active, onPress, onLayout, onLabelLayout }: TabItemProps) {
  return (
    <Pressable
      onPress={onPress}
      onLayout={onLayout}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      hitSlop={{ top: 12, bottom: 16, left: 6, right: 6 }}
      className="flex-1 items-center gap-3"
    >
      {tab.icon ? (
        <DynamicIcon icon={tab.icon} size={18} className={active ? 'text-foreground' : 'text-muted-foreground'} />
      ) : null}
      <Text
        onLayout={onLabelLayout}
        className={cn('text-[11px]', active ? 'text-foreground font-semibold' : 'text-muted-foreground')}
        numberOfLines={1}
      >
        {tab.label}
      </Text>
    </Pressable>
  );
}
