import type { Meta, StoryObj } from '@storybook/react-native';
import { MaterialIcons } from '@react-native-vector-icons/material-icons';
import { View } from 'react-native';
import { Text } from '../Typography';
import { BottomNavigation } from './BottomNavigation';
import type { RouteConfig } from './types';

// Placeholder screen components — defined outside story for referential stability
function HomeScreen() {
  return (
    <View className="flex-1 items-center justify-center gap-2">
      <MaterialIcons name="home" size={32} color="#888" />
      <Text className="text-lg font-semibold">Home</Text>
    </View>
  );
}

function SearchScreen() {
  return (
    <View className="flex-1 items-center justify-center gap-2">
      <MaterialIcons name="search" size={32} color="#888" />
      <Text className="text-lg font-semibold">Search</Text>
    </View>
  );
}

function ProfileScreen() {
  return (
    <View className="flex-1 items-center justify-center gap-2">
      <MaterialIcons name="person" size={32} color="#888" />
      <Text className="text-lg font-semibold">Profile</Text>
    </View>
  );
}

function SettingsScreen() {
  return (
    <View className="flex-1 items-center justify-center gap-2">
      <MaterialIcons name="settings" size={32} color="#888" />
      <Text className="text-lg font-semibold">Settings</Text>
    </View>
  );
}

const demoRoutes: RouteConfig[] = [
  {
    name: 'Home',
    component: HomeScreen,
    icon: {
      sfSymbol: 'house.fill',
      materialSymbol: 'home',
    },
  },
  {
    name: 'Search',
    component: SearchScreen,
    icon: {
      sfSymbol: 'magnifyingglass',
      materialSymbol: 'search',
    },
    badge: 3,
  },
  {
    name: 'Profile',
    component: ProfileScreen,
    icon: {
      sfSymbol: 'person.fill',
      materialSymbol: 'person',
    },
  },
  {
    name: 'Settings',
    component: SettingsScreen,
    icon: {
      sfSymbol: 'gearshape.fill',
      materialSymbol: 'settings',
    },
  },
];

const meta = {
  title: 'Components/BottomNavigation',
  component: BottomNavigation,
  tags: ['autodocs'],
  args: {
    routes: demoRoutes,
    initialRoute: 'Home',
  },
} satisfies Meta<typeof BottomNavigation>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Demo: Story = {
  render: (args) => (
    <View style={{ height: 500, width: '100%' }}>
      <BottomNavigation {...args} />
    </View>
  ),
};

export const ThreeTabs: Story = {
  args: {
    routes: demoRoutes.slice(0, 3),
    initialRoute: 'Search',
  },
  render: (args) => (
    <View style={{ height: 500, width: '100%' }}>
      <BottomNavigation {...args} />
    </View>
  ),
};
