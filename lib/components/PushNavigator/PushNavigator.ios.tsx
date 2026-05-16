import { createNativeStackNavigator, type NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { useMemo } from 'react';
import { DynamicColorIOS } from 'react-native';
import { usePlatformInfo } from '../../hooks';
import { THEME } from '../../theme';
import type { PushNavigatorProps } from './types';

type PushNavigatorParamList = Record<string, object | undefined>;

const Stack = createNativeStackNavigator<PushNavigatorParamList>();

// UIKit resolves these against the current trait collection at draw time.
// Appearance.setColorScheme() mutates the window's overrideUserInterfaceStyle,
// which re-resolves every dynamic color in the view hierarchy — including the
// UINavigationBar's tint/title/background — without any React re-render.
const HEADER_FG = DynamicColorIOS({ light: THEME.light.foreground, dark: THEME.dark.foreground });
const HEADER_BG = DynamicColorIOS({ light: THEME.light.background, dark: THEME.dark.background });

export const PushNavigator = <RouteName extends string = string>({
  initialRoute,
  renderHeader: _renderHeader,
  screens,
}: PushNavigatorProps<RouteName>) => {
  const { version } = usePlatformInfo();

  const screenOptions = useMemo<NativeStackNavigationOptions>(() => {
    const isLiquidGlass = version >= 26;

    return {
      animation: 'slide_from_right',
      gestureEnabled: true,
      headerBackButtonDisplayMode: isLiquidGlass ? 'minimal' : 'generic',
      headerBackIcon: { type: 'sfSymbol', name: 'chevron.left' },
      headerBackTitle: 'back',
      headerShadowVisible: false,
      headerTintColor: HEADER_FG,
      headerTitleStyle: { color: HEADER_FG },
      headerLargeTitle: true,
      headerLargeTitleStyle: { color: HEADER_FG },
      headerStyle: { backgroundColor: isLiquidGlass ? 'transparent' : HEADER_BG },
      headerLargeStyle: { backgroundColor: isLiquidGlass ? 'transparent' : HEADER_BG },
      scrollEdgeEffects: { top: isLiquidGlass ? 'soft' : 'hard' },
      headerTransparent: isLiquidGlass,
      contentStyle: { backgroundColor: HEADER_BG },
    };
  }, [version]);

  return (
    <Stack.Navigator initialRouteName={initialRoute} screenOptions={screenOptions}>
      {screens.map((screen) => {
        const options: NativeStackNavigationOptions =
          screen.headerShown === false ? { headerShown: false } : { title: screen.title ?? '' };
        return (
          <Stack.Screen
            key={screen.name}
            name={screen.name}
            component={screen.component}
            initialParams={screen.initialParams}
            options={options}
          />
        );
      })}
    </Stack.Navigator>
  );
};
