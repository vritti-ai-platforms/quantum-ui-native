import type { ReactNode } from 'react';
import { View } from 'react-native';
import Animated, { Extrapolation, interpolate, useAnimatedStyle } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRegisterScreenHeaderInset, useScreenScrollY } from '../ScreenContainer/screenScrollRegistry';
import { Text } from '../Typography';
import type { ScreenHeaderProps } from './types';

const HERO_HEIGHT = 84;
const NORMAL_HEIGHT = 80;
const PINNED_HEIGHT = 44;
const HERO_DROP = 60;
const NORMAL_DROP = 50;
const PINNED_AT = HERO_DROP + NORMAL_DROP;

interface ScreenHeaderBaseProps extends ScreenHeaderProps {
  backdrop?: ReactNode;
  overlay?: boolean;
}

export function ScreenHeaderBase({ title, subtitle, backdrop, overlay = false }: ScreenHeaderBaseProps) {
  const insets = useSafeAreaInsets();
  const scrollY = useScreenScrollY();
  useRegisterScreenHeaderInset(overlay ? HERO_HEIGHT : 0);

  const containerStyle = useAnimatedStyle(() => ({
    height:
      interpolate(
        scrollY.value,
        [0, HERO_DROP, PINNED_AT],
        [HERO_HEIGHT, NORMAL_HEIGHT, PINNED_HEIGHT],
        Extrapolation.CLAMP,
      ) + insets.top,
  }));

  const heroStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, HERO_DROP * 0.7], [1, 0], Extrapolation.CLAMP),
    transform: [{ translateY: interpolate(scrollY.value, [0, HERO_DROP], [0, -16], Extrapolation.CLAMP) }],
  }));

  const compactStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [HERO_DROP, PINNED_AT], [0, 1], Extrapolation.CLAMP),
  }));

  return (
    <Animated.View
      className="relative overflow-hidden"
      style={[{ paddingTop: insets.top }, containerStyle]}
    >
      {backdrop ? (
        <View className="absolute inset-0" pointerEvents="none">
          {backdrop}
        </View>
      ) : null}

      <Animated.View
        className="absolute inset-0 items-center justify-center"
        style={[{ paddingTop: insets.top }, compactStyle]}
        pointerEvents="none"
      >
        <View className="h-11 items-center justify-center">
          <Text className="text-base font-semibold text-foreground">{title}</Text>
        </View>
      </Animated.View>

      <Animated.View
        className="flex-1 justify-start gap-0.5 px-4 pt-2 pb-1"
        style={heroStyle}
        pointerEvents="none"
      >
        <Text className="text-[34px] font-bold text-foreground">{title}</Text>
        {subtitle ? <Text className="text-sm text-muted-foreground">{subtitle}</Text> : null}
      </Animated.View>
    </Animated.View>
  );
}
