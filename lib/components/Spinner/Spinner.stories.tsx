import type { Meta, StoryObj } from '@storybook/react-native';
import { View } from 'react-native';
import { Text } from '../Typography';
import { Spinner } from './Spinner';
import { StoryRow, StorySection, StoryStack } from '../../storybook/StoryLayout';

const meta = {
  title: 'Components/Spinner',
  component: Spinner,
  tags: ['autodocs'],
  args: {
    size: 'small',
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['small', 'large'],
    },
  },
} satisfies Meta<typeof Spinner>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: {},
};

export const Sizes: Story = {
  args: {},
  render: () => (
    <StoryStack>
      <StorySection title="Sizes">
        <StoryRow>
          <View className="items-center gap-2">
            <Spinner size="small" />
            <Text variant="small">Small</Text>
          </View>
          <View className="items-center gap-2">
            <Spinner size="large" />
            <Text variant="small">Large</Text>
          </View>
        </StoryRow>
      </StorySection>
      <StorySection title="Loading States">
        <StoryRow>
          <Spinner size="small" color="#6366f1" />
          <Text variant="muted">Processing request...</Text>
        </StoryRow>
        <StoryRow>
          <Spinner size="large" color="#22c55e" />
          <Text variant="muted">Uploading file...</Text>
        </StoryRow>
      </StorySection>
    </StoryStack>
  ),
};
