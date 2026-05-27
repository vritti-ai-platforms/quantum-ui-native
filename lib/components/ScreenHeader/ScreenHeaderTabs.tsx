import { type ReactNode, useEffect, useRef } from 'react';
import { type LayoutChangeEvent, Pressable, ScrollView, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { cn } from '../../utils/cn';
import { DynamicIcon } from '../DynamicIcon';
import { Text } from '../Typography';
import {
  setScreenHeaderActiveTabId,
  useScreenHeaderActiveTabId,
  useScreenHeaderRouteKey,
} from './screenHeaderTabsRegistry';
import type { ScreenHeaderTabConfig } from './types';

export const TABS_HEIGHT = 56;

const UNDERLINE_HEIGHT = 4;
const UNDERLINE_WIDTH = 32;
const UNDERLINE_DURATION = 220;

interface ScreenHeaderTabsProps {
  tabs: ScreenHeaderTabConfig[];
  background?: ReactNode;
}

export function ScreenHeaderTabs({ tabs, background }: ScreenHeaderTabsProps) {
  const activeTabId = useScreenHeaderActiveTabId();
  const routeKey = useScreenHeaderRouteKey();
  const activeIndex = Math.max(
    0,
    tabs.findIndex((t) => t.id === activeTabId),
  );

  const positionsRef = useRef<Array<{ x: number; w: number }>>([]);
  const translateX = useSharedValue(0);
  const hasMeasured = useSharedValue(false);

  const setTarget = (animated: boolean) => {
    const pos = positionsRef.current[activeIndex];
    if (!pos) return;
    const center = pos.x + pos.w / 2 - UNDERLINE_WIDTH / 2;
    translateX.value = animated ? withTiming(center, { duration: UNDERLINE_DURATION }) : center;
    hasMeasured.value = true;
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: <>
  useEffect(() => {
    setTarget(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex]);

  const handleTabLayout = (index: number, e: LayoutChangeEvent) => {
    positionsRef.current[index] = { x: e.nativeEvent.layout.x, w: e.nativeEvent.layout.width };
    if (index === activeIndex) setTarget(false);
  };

  const underlineStyle = useAnimatedStyle(() => ({
    opacity: hasMeasured.value ? 1 : 0,
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
            active={tab.id === activeTabId}
            onPress={() => setScreenHeaderActiveTabId(routeKey, tab.id)}
            onLayout={(e) => handleTabLayout(index, e)}
          />
        ))}
        <Animated.View
          pointerEvents="none"
          className="absolute bg-primary rounded-full"
          style={[{ left: 0, bottom: 0, width: UNDERLINE_WIDTH, height: UNDERLINE_HEIGHT }, underlineStyle]}
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
}

function TabItem({ tab, active, onPress, onLayout }: TabItemProps) {
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
        className={cn('text-[11px]', active ? 'text-foreground font-semibold' : 'text-muted-foreground')}
        numberOfLines={1}
      >
        {tab.label}
      </Text>
    </Pressable>
  );
}
