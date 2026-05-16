import { createNativeStackNavigator, type NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { useTheme } from '../../hooks/useTheme';
import { getTheme } from '../../theme';
import type { PushNavigatorProps } from './types';

type PushNavigatorParamList = Record<string, object | undefined>;

const Stack = createNativeStackNavigator<PushNavigatorParamList>();

export const PushNavigator = <RouteName extends string = string>({
  initialRoute,
  renderHeader: _renderHeader,
  screens,
}: PushNavigatorProps<RouteName>) => {
  // Subscribes to ThemeContext so the navigator re-renders on preference flips —
  // any *future* screen mounted after a theme change picks up the new palette
  // in its screenOptions. We DO NOT key the Stack.Navigator on `isDark` here:
  // that key-remount tore down every Fragment hosted by react-native-screens
  // in the same render commit as the theme flip and was crashing the app
  // silently on Android. Trade-off: native NativeStackView does not re-apply
  // screenOptions.headerStyle mid-life, so the header chrome on a currently
  // visible NativeStack screen will keep the previous theme's colors until
  // that screen is popped and pushed again. Acceptable because the Account
  // tab (where the picker lives) has no header, and pushed detail screens
  // (Profile/Password/Sessions) only mount on demand.
  const { isDark: _isDark } = useTheme();
  const colors = getTheme();
  const screenOptions: NativeStackNavigationOptions = {
    animation: 'fade_from_bottom',
    contentStyle: { backgroundColor: colors.background },
    headerBackIcon: { type: 'materialSymbol', name: 'arrow_back' },
    headerShadowVisible: false,
    headerStyle: { backgroundColor: colors.background },
    headerTintColor: colors.foreground,
    headerTitleStyle: { color: colors.foreground },
  };

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
