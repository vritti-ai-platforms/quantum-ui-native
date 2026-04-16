import type { Meta, StoryObj } from '@storybook/react-native';
import { View } from 'react-native';
import { Skeleton } from './Skeleton';
import { StorySection, StoryStack } from '../../storybook/StoryLayout';

const meta = {
  title: 'Components/Skeleton',
  component: Skeleton,
  tags: ['autodocs'],
  args: {
    className: 'h-4 w-48',
  },
  argTypes: {
    className: { control: 'text' },
  },
} satisfies Meta<typeof Skeleton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: {},
};

export const Patterns: Story = {
  args: {},
  render: () => (
    <StoryStack>
      <StorySection title="Text Lines">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-4 w-3/5" />
      </StorySection>
      <StorySection title="Card Placeholder">
        <View className="gap-3">
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </View>
      </StorySection>
      <StorySection title="List Item">
        <View className="flex-row items-center gap-3">
          <Skeleton className="size-12 rounded-full" />
          <View className="flex-1 gap-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/2" />
          </View>
        </View>
      </StorySection>
    </StoryStack>
  ),
};
