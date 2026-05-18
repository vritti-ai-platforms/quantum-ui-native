import { createNativeStackNavigator, type NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { useTheme } from '../../hooks/useTheme';
import type { PushNavigatorProps } from './types';

type PushNavigatorParamList = Record<string, object | undefined>;

const Stack = createNativeStackNavigator<PushNavigatorParamList>();

export const PushNavigator = <RouteName extends string = string>({
  initialRoute,
  renderHeader: _renderHeader,
  screens,
}: PushNavigatorProps<RouteName>) => {
  // No isDark key — remounting Stack.Navigator tears down react-native-screens Fragments mid-commit and crashes on Android.
  const { palette: colors } = useTheme();
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
