import type { Meta, StoryObj } from '@storybook/react-native';
import { Home, Search, Settings, User } from 'lucide-react-native';
import { View } from 'react-native';
import { Text } from '../Typography';
import { BottomNavigation } from './BottomNavigation';

// Placeholder screen components — defined outside story for referential stability
function HomeScreen() {
  return (
    <View className="flex-1 items-center justify-center gap-2">
      <Home size={32} color="#888" />
      <Text className="text-lg font-semibold">Home</Text>
    </View>
  );
}

function SearchScreen() {
  return (
    <View className="flex-1 items-center justify-center gap-2">
      <Search size={32} color="#888" />
      <Text className="text-lg font-semibold">Search</Text>
    </View>
  );
}

function ProfileScreen() {
  return (
    <View className="flex-1 items-center justify-center gap-2">
      <User size={32} color="#888" />
      <Text className="text-lg font-semibold">Profile</Text>
    </View>
  );
}

function SettingsScreen() {
  return (
    <View className="flex-1 items-center justify-center gap-2">
      <Settings size={32} color="#888" />
      <Text className="text-lg font-semibold">Settings</Text>
    </View>
  );
}

const demoRoutes = [
  {
    name: 'Home',
    component: HomeScreen,
    icon: {
      sfSymbol: 'house.fill',
      materialSymbol: 'home',
      component: ({ color, size }: { color: string; size: number }) => <Home color={color} size={size} />,
    },
  },
  {
    name: 'Search',
    component: SearchScreen,
    icon: {
      sfSymbol: 'magnifyingglass',
      materialSymbol: 'search',
      component: ({ color, size }: { color: string; size: number }) => <Search color={color} size={size} />,
    },
    badge: 3,
  },
  {
    name: 'Profile',
    component: ProfileScreen,
    icon: {
      sfSymbol: 'person.fill',
      materialSymbol: 'person',
      component: ({ color, size }: { color: string; size: number }) => <User color={color} size={size} />,
    },
  },
  {
    name: 'Settings',
    component: SettingsScreen,
    icon: {
      sfSymbol: 'gearshape.fill',
      materialSymbol: 'settings',
      component: ({ color, size }: { color: string; size: number }) => <Settings color={color} size={size} />,
    },
  },
];

const meta = {
  title: 'Components/BottomNavigation',
  component: BottomNavigation,
  tags: ['autodocs'],
} satisfies Meta<typeof BottomNavigation>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Demo: Story = {
  render: () => (
    <View style={{ height: 500, width: '100%' }}>
      <BottomNavigation routes={demoRoutes} initialRoute="Home" />
    </View>
  ),
};

export const ThreeTabs: Story = {
  render: () => (
    <View style={{ height: 500, width: '100%' }}>
      <BottomNavigation routes={demoRoutes.slice(0, 3)} initialRoute="Search" />
    </View>
  ),
};
