import React from 'react';
import { createNativeStackNavigator } from '@vritti/quantum-ui-native/NativeStack';
import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@vritti/quantum-ui-native/NativeStack';
import ComponentsScreen from '../screens/ComponentsScreen';
import StorybookScreen from '../screens/StorybookScreen';

export type ElementsStackParamList = {
  Components: undefined;
  Storybook: undefined;
};

export type ElementsStackNavigationProp =
  NativeStackNavigationProp<ElementsStackParamList>;

export type ElementsStackScreenProps<
  RouteName extends keyof ElementsStackParamList,
> = NativeStackScreenProps<ElementsStackParamList, RouteName>;

const Stack = createNativeStackNavigator<ElementsStackParamList>() as any;

export default function ElementsStackScreen() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Components"
        component={ComponentsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Storybook"
        component={StorybookScreen}
        options={{ title: 'Storybook' }}
      />
    </Stack.Navigator>
  );
}
