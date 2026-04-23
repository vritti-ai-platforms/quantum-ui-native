import type { Meta, StoryObj } from '@storybook/react-native';
import { View } from 'react-native';
import { Progress } from './Progress';
import { Text } from '../Typography';
import { StoryStack } from '../../storybook/StoryLayout';

const meta = {
  title: 'Components/Progress',
  component: Progress,
  tags: ['autodocs'],
  args: {
    value: 64,
  },
  argTypes: {
    value: {
      control: { type: 'number', min: 0, max: 100, step: 1 },
    },
  },
  render: (args) => (
    <StoryStack>
      <Text className="text-sm text-muted-foreground">Upload progress</Text>
      <Progress {...args} />
    </StoryStack>
  ),
} satisfies Meta<typeof Progress>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const Milestones: Story = {
  args: {},
  render: () => (
    <StoryStack>
      {[18, 42, 76, 100].map((value) => (
        <View key={value} className="gap-2">
          <Text className="text-sm text-muted-foreground">{value}% complete</Text>
          <Progress value={value} />
        </View>
      ))}
    </StoryStack>
  ),
};
