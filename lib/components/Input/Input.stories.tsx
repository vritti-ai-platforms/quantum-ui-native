import type { Meta, StoryObj } from '@storybook/react-native';
import { useState } from 'react';
import { Input } from './Input';
import { StorySection, StoryStack } from '../../storybook/StoryLayout';

const meta = {
  title: 'Components/Input',
  component: Input,
  tags: ['autodocs'],
  args: {
    placeholder: 'Enter text...',
  },
  argTypes: {
    placeholder: { control: 'text' },
    editable: { control: 'boolean' },
    secureTextEntry: { control: 'boolean' },
  },
  render: (args) => {
    const [value, setValue] = useState('');
    return <Input {...args} value={value} onChangeText={setValue} />;
  },
} satisfies Meta<typeof Input>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: {},
};

export const States: Story = {
  args: {},
  render: () => (
    <StoryStack>
      <StorySection title="Default">
        <Input placeholder="Enter text..." />
      </StorySection>

      <StorySection title="With Value">
        <Input value="hello@example.com" placeholder="Email" onChangeText={() => {}} />
      </StorySection>

      <StorySection title="Password">
        <Input placeholder="Enter password" secureTextEntry />
      </StorySection>

      <StorySection title="Disabled">
        <Input placeholder="Not editable" editable={false} value="read only value" />
      </StorySection>
    </StoryStack>
  ),
};
