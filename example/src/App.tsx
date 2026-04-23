import '../global.css';
import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { BottomNavigation, type RouteConfig } from '@vritti/quantum-ui-native/BottomNavigation';
import { BottomSheetHost } from '@vritti/quantum-ui-native/BottomSheet';
import { useTheme } from '@vritti/quantum-ui-native/hooks';
import { getTheme, ThemeProvider } from '@vritti/quantum-ui-native/theme';
import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import ElementsStackScreen from './navigation/ElementsStack';
import CardsScreen from './screens/CardsScreen';
import FeedbackScreen from './screens/FeedbackScreen';
import FormsScreen from './screens/FormsScreen';

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});

const routes: RouteConfig[] = [
  {
    name: 'Elements',
    component: ElementsStackScreen,
    icon: { sfSymbol: 'square.stack.3d.up', materialSymbol: 'layers' },
  },
  {
    name: 'Cards',
    component: CardsScreen,
    icon: { sfSymbol: 'rectangle.grid.2x2', materialSymbol: 'grid_view' },
  },
  {
    name: 'Forms',
    component: FormsScreen,
    icon: { sfSymbol: 'doc.text', materialSymbol: 'description' },
  },
  {
    name: 'Feedback',
    component: FeedbackScreen,
    icon: { sfSymbol: 'waveform.path.ecg', materialSymbol: 'monitor_heart' },
  },
];

function ExampleNavigation() {
  const { isDark } = useTheme();

  const navTheme = useMemo(
    () => ({
      ...(isDark ? DarkTheme : DefaultTheme),
      colors: {
        ...(isDark ? DarkTheme : DefaultTheme).colors,
        ...getTheme(isDark ? 'dark' : 'light'),
      },
    }),
    [isDark],
  );

  return (
    <NavigationContainer theme={navTheme}>
      <BottomNavigation routes={routes} />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <ThemeProvider defaultScheme="dark">
          <ExampleNavigation />
          <BottomSheetHost />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
