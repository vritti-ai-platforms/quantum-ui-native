import '../global.css';
import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { BottomNavigation, type RouteConfig } from '@vritti/quantum-ui-native/BottomNavigation';
import { useTheme } from '@vritti/quantum-ui-native/hooks';
import { THEME_TOKENS, ThemeProvider } from '@vritti/quantum-ui-native/theme';
import { useMemo } from 'react';
import CardsScreen from './screens/CardsScreen';
import ComponentsScreen from './screens/ComponentsScreen';
import FeedbackScreen from './screens/FeedbackScreen';
import FormsScreen from './screens/FormsScreen';

const routes: RouteConfig[] = [
  {
    name: 'Elements',
    component: ComponentsScreen,
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
        ...THEME_TOKENS[isDark ? 'dark' : 'light'].palette,
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
    <ThemeProvider>
      <ExampleNavigation />
    </ThemeProvider>
  );
}
