import type { Meta, StoryObj } from '@storybook/react-native';
import { View } from 'react-native';
import { Text } from '../Typography';
import { ListItemCard } from '../Card';
import { FlashList } from './FlashList';
import { StoryStack } from '../../storybook/StoryLayout';

type Item = { id: string; title: string; subtitle: string };

const SAMPLE_ITEMS: Item[] = [
  { id: '1', title: 'Workspace Alpha', subtitle: 'Last active 2 hours ago' },
  { id: '2', title: 'Project Beta', subtitle: 'Last active yesterday' },
  { id: '3', title: 'Team Gamma', subtitle: 'Last active 3 days ago' },
  { id: '4', title: 'Client Delta', subtitle: 'Last active last week' },
];

const meta = {
  title: 'Components/FlashList',
  component: FlashList,
  tags: ['autodocs'],
  args: {
    isLoading: false,
    skeletonCount: 3,
    emptyText: 'No items found',
  },
  argTypes: {
    isLoading: { control: 'boolean' },
    skeletonCount: { control: { type: 'number', min: 1, max: 8, step: 1 } },
    emptyText: { control: 'text' },
  },
} satisfies Meta<typeof FlashList>;

export default meta;

type Story = StoryObj<typeof meta>;

export const WithData: Story = {
  args: {},
  render: () => (
    <View style={{ height: 300 }}>
      <FlashList
        data={SAMPLE_ITEMS}
        estimatedItemSize={72}
        keyExtractor={(item) => (item as Item).id}
        renderItem={({ item }) => (
          <ListItemCard
            title={(item as Item).title}
            subtitle={(item as Item).subtitle}
            className="mb-2"
          />
        )}
      />
    </View>
  ),
};

export const Loading: Story = {
  args: {},
  render: () => (
    <StoryStack>
      <View style={{ height: 280 }}>
        <FlashList
          data={[]}
          isLoading
          skeletonCount={4}
          estimatedItemSize={72}
          keyExtractor={String}
          renderItem={() => null}
        />
      </View>
    </StoryStack>
  ),
};

export const Empty: Story = {
  args: {},
  render: () => (
    <View style={{ height: 200 }}>
      <FlashList
        data={[]}
        estimatedItemSize={72}
        emptyText="No workspaces found"
        keyExtractor={String}
        renderItem={() => null}
      />
    </View>
  ),
};

export const CustomEmpty: Story = {
  args: {},
  render: () => (
    <View style={{ height: 200 }}>
      <FlashList
        data={[]}
        estimatedItemSize={72}
        EmptyComponent={
          <View className="flex-1 items-center justify-center py-12 gap-2">
            <Text variant="h4">Nothing here yet</Text>
            <Text variant="muted">Create a workspace to get started.</Text>
          </View>
        }
        keyExtractor={String}
        renderItem={() => null}
      />
    </View>
  ),
};
