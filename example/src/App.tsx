import '../global.css';
import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ThemeProvider, NAV_THEME, useTheme } from '@vritti/quantum-ui-native';
import { Layers, LayoutGrid, FileText, Activity } from 'lucide-react-native';

import ComponentsScreen from './screens/ComponentsScreen';
import CardsScreen from './screens/CardsScreen';
import FormsScreen from './screens/FormsScreen';
import FeedbackScreen from './screens/FeedbackScreen';

const Tab = createBottomTabNavigator();

function TabNavigator() {
  const { isDark } = useTheme();
  const colors = NAV_THEME[isDark ? 'dark' : 'light'];

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          const icons = {
            Elements: Layers,
            Cards: LayoutGrid,
            Forms: FileText,
            Feedback: Activity,
          } as const;
          const IconComponent = icons[route.name as keyof typeof icons];
          return <IconComponent color={color} size={size} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.border,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
      })}
    >
      <Tab.Screen name="Elements" component={ComponentsScreen} />
      <Tab.Screen name="Cards" component={CardsScreen} />
      <Tab.Screen name="Forms" component={FormsScreen} />
      <Tab.Screen name="Feedback" component={FeedbackScreen} />
    </Tab.Navigator>
  );
}

function Root() {
  const { isDark } = useTheme();
  const navTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme : DefaultTheme).colors,
      ...NAV_THEME[isDark ? 'dark' : 'light'],
    },
  };

  return (
    <NavigationContainer theme={navTheme}>
      <TabNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <ThemeProvider defaultScheme="dark">
      <Root />
    </ThemeProvider>
  );
}
