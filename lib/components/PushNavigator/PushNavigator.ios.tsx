import { createNativeStackNavigator, type NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { useMemo } from 'react';
import { usePlatformInfo, useTheme } from '../../hooks';
import { getTheme } from '../../theme';
import type { PushNavigatorProps } from './types';

type PushNavigatorParamList = Record<string, object | undefined>;

const Stack = createNativeStackNavigator<PushNavigatorParamList>();

export const PushNavigator = <RouteName extends string = string>({
  initialRoute,
  renderHeader: _renderHeader,
  screens,
}: PushNavigatorProps<RouteName>) => {
  const { isDark } = useTheme();
  const { version } = usePlatformInfo();

  const screenOptions = useMemo<NativeStackNavigationOptions>(() => {
    const colors = getTheme(isDark ? 'dark' : 'light');
    const isLiquidGlass = version >= 26;

    return {
      animation: 'slide_from_right',
      gestureEnabled: true,
      headerBackButtonDisplayMode: 'minimal',
      headerBackIcon: { type: 'sfSymbol', name: 'chevron.left' },
      headerShadowVisible: false,
      headerTintColor: colors.foreground,
      headerTitleStyle: { color: colors.foreground },
      headerLargeTitle: true,
      headerLargeTitleStyle: { color: colors.foreground },
      headerStyle: { backgroundColor: isLiquidGlass ? 'transparent' : colors.background },
      headerLargeStyle: { backgroundColor: isLiquidGlass ? 'transparent' : colors.background },
      scrollEdgeEffects: { top: isLiquidGlass ? 'soft' : 'hard' },
      headerTransparent: isLiquidGlass,
      contentStyle: { backgroundColor: colors.background },
    };
  }, [isDark, version]);

  return (
    <Stack.Navigator initialRouteName={initialRoute} screenOptions={screenOptions}>
      {screens.map((screen) => {
        const options: NativeStackNavigationOptions = screen.title ? { title: screen.title } : { headerShown: false };

        return <Stack.Screen key={screen.name} name={screen.name} component={screen.component} options={options} />;
      })}
    </Stack.Navigator>
  );
};
