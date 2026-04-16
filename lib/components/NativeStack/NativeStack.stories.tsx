import type { Meta, StoryObj } from '@storybook/react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, View } from 'react-native';
import { ArrowRight, ChevronLeft, FileText, List } from 'lucide-react-native';
import { Text } from '../Typography';
import { Button } from '../Button';
import { createNativeStackNavigator } from './index';

type RootStackParamList = {
  List: undefined;
  Detail: { item: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// Placeholder screens — defined outside the story for referential stability
function ListScreen({ navigation }: NativeStackScreenProps<RootStackParamList, 'List'>) {
  const items = ['Invoice #001', 'Invoice #002', 'Invoice #003'];

  return (
    <View className="flex-1 p-4 gap-3">
      <Text className="text-lg font-semibold text-foreground">Documents</Text>
      {items.map((item) => (
        <Pressable
          key={item}
          onPress={() => navigation.navigate('Detail', { item })}
          className="flex-row items-center justify-between rounded-xl border border-border bg-card p-4"
        >
          <View className="flex-row items-center gap-3">
            <FileText size={18} color="#888" />
            <Text className="text-base text-foreground">{item}</Text>
          </View>
          <ArrowRight size={16} color="#888" />
        </Pressable>
      ))}
    </View>
  );
}

function DetailScreen({ route, navigation }: NativeStackScreenProps<RootStackParamList, 'Detail'>) {
  return (
    <View className="flex-1 items-center justify-center gap-4 p-6">
      <FileText size={40} color="#888" />
      <Text className="text-xl font-bold text-foreground">{route.params.item}</Text>
      <Text className="text-sm text-muted-foreground text-center">
        Tap the back button or the button below to return to the list.
      </Text>
      <Button variant="outline" onPress={() => navigation.goBack()}>
        <ChevronLeft size={16} />
        <Text>Back to List</Text>
      </Button>
    </View>
  );
}

const meta = {
  title: 'Components/NativeStack',
  component: List,
  tags: ['autodocs'],
} satisfies Meta<typeof List>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Demo: Story = {
  render: () => (
    <View style={{ height: 500, width: '100%' }}>
      <Stack.Navigator
        screenOptions={{
          headerShown: true,
        }}
      >
        <Stack.Screen name="List" component={ListScreen} options={{ title: 'Documents' }} />
        <Stack.Screen name="Detail" component={DetailScreen} options={{ title: 'Detail' }} />
      </Stack.Navigator>
    </View>
  ),
};
