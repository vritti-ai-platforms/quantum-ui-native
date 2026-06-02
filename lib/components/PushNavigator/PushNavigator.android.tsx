import { createNativeStackNavigator, type NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { useUnstableNativeVariable } from 'nativewind';
import type { PushNavigatorProps } from './types';

type PushNavigatorParamList = Record<string, object | undefined>;

const Stack = createNativeStackNavigator<PushNavigatorParamList>();

// Resolve header colors from the shared NativeWind variable context (the nativewind singleton is
// shared across the MF boundary and always reflects the active app theme). useTheme()/ThemeContext
// is NOT connected for a micro-app-bundled navigator — it falls back to the system Appearance, so a
// dark app over a light system rendered a WHITE header. The variable context is the reliable source.
const useVar = useUnstableNativeVariable as unknown as (name: string) => string | undefined;
const toHsl = (v: string | undefined): string | undefined => (v ? `hsl(${v.split(' ').join(', ')})` : undefined);

export const PushNavigator = <RouteName extends string = string>({
  initialRoute,
  renderHeader: _renderHeader,
  screens,
}: PushNavigatorProps<RouteName>) => {
  const background = toHsl(useVar('--background'));
  const foreground = toHsl(useVar('--foreground'));

  // No isDark/theme key — remounting Stack.Navigator tears down react-native-screens Fragments
  // mid-commit and crashes on Android. screenOptions just re-derives on the variable change.
  const screenOptions: NativeStackNavigationOptions = {
    animation: 'fade_from_bottom',
    contentStyle: { backgroundColor: background },
    headerBackIcon: { type: 'materialSymbol', name: 'arrow_back' },
    headerShadowVisible: false,
    headerStyle: { backgroundColor: background },
    headerTintColor: foreground,
    headerTitleStyle: { color: foreground },
  };

  return (
    <Stack.Navigator initialRouteName={initialRoute} screenOptions={screenOptions}>
      {screens.map((screen) => {
        const options: NativeStackNavigationOptions = screen.header
          ? { header: screen.header, headerTransparent: true }
          : screen.headerShown === false
            ? { headerShown: false }
            : { title: screen.title ?? '' };

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
