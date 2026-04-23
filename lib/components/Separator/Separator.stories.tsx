import type { Meta, StoryObj } from '@storybook/react-native';
import { View } from 'react-native';
import { Text } from '../Typography';
import { Separator } from './Separator';
import { StorySection, StoryStack } from '../../storybook/StoryLayout';

const meta = {
  title: 'Components/Separator',
  component: Separator,
  tags: ['autodocs'],
  args: {
    orientation: 'horizontal',
  },
  argTypes: {
    orientation: {
      control: 'select',
      options: ['horizontal', 'vertical'],
    },
  },
} satisfies Meta<typeof Separator>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: {},
};

export const Orientations: Story = {
  args: {},
  render: () => (
    <StoryStack>
      <StorySection title="Horizontal">
        <Text variant="small">Above the separator</Text>
        <Separator />
        <Text variant="small">Below the separator</Text>
      </StorySection>
      <StorySection title="Vertical">
        <View className="flex-row items-center gap-3 h-8">
          <Text variant="small">Left</Text>
          <Separator orientation="vertical" />
          <Text variant="small">Center</Text>
          <Separator orientation="vertical" />
          <Text variant="small">Right</Text>
        </View>
      </StorySection>
      <StorySection title="In a List">
        <Text>First item</Text>
        <Separator />
        <Text>Second item</Text>
        <Separator />
        <Text>Third item</Text>
      </StorySection>
    </StoryStack>
  ),
};
